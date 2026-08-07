import { cache } from 'react';
import type { OrgType } from '@stt/types';
import { createClient } from '@/lib/supabase/server';

export type RiskSeverity = 'critical' | 'high' | 'medium' | 'low';

export type RiskFlagKind =
  | 'unverified_tc'
  | 'expired_tc'
  | 'open_verification'
  | 'low_wallet'
  | 'expired_cert'
  | 'expiring_cert'
  | 'unverified_facility';

export type RiskFlag = {
  id: string;
  kind: RiskFlagKind;
  severity: RiskSeverity;
  title: string;
  description: string;
  href: string;
  /** compliance-facing vs operational risk */
  category: 'risk' | 'compliance';
};

export type OrgRiskSnapshot = {
  flags: RiskFlag[];
  riskScore: number;
  complianceScore: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  openFlagCount: number;
};

const WEIGHT: Record<RiskSeverity, number> = {
  critical: 25,
  high: 15,
  medium: 8,
  low: 3,
};

const SEVERITY_RANK: Record<RiskSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / (1000 * 60 * 60 * 24));
}

function scoreFromFlags(flags: RiskFlag[]) {
  const riskWeight = flags.reduce((sum, f) => sum + WEIGHT[f.severity], 0);
  const complianceWeight = flags
    .filter((f) => f.category === 'compliance')
    .reduce((sum, f) => sum + WEIGHT[f.severity], 0);

  const riskScore = clamp(riskWeight, 0, 100);
  const complianceScore = clamp(100 - complianceWeight, 0, 100);

  const highCount = flags.filter(
    (f) => f.severity === 'critical' || f.severity === 'high'
  ).length;
  const mediumCount = flags.filter((f) => f.severity === 'medium').length;
  const lowCount = flags.filter((f) => f.severity === 'low').length;

  return {
    riskScore,
    complianceScore,
    highCount,
    mediumCount,
    lowCount,
    openFlagCount: flags.length,
  };
}

/** Derived exception queue from live ops data (no risk_* tables). */
export const loadOrgRiskSnapshot = cache(
  async (organizationId: string, orgType: OrgType): Promise<OrgRiskSnapshot> => {
    const supabase = createClient();
    const flags: RiskFlag[] = [];
    const today = new Date().toISOString().slice(0, 10);

    const tcPendingQuery =
      orgType === 'brand'
        ? supabase
            .from('transaction_certificates')
            .select('id, tc_number, tc_status, expiry_date')
            .eq('receiver_org_id', organizationId)
            .in('tc_status', ['issued', 'transferred'])
            .limit(40)
        : supabase
            .from('transaction_certificates')
            .select('id, tc_number, tc_status, expiry_date')
            .eq('issuer_org_id', organizationId)
            .in('tc_status', ['issued', 'transferred'])
            .limit(40);

    const vrQuery =
      orgType === 'brand'
        ? supabase
            .from('verification_requests')
            .select('id, request_number, status, verification_type')
            .eq('buyer_org_id', organizationId)
            .in('status', ['open', 'in_progress'])
            .limit(30)
        : orgType === 'supplier'
          ? supabase
              .from('verification_requests')
              .select('id, request_number, status, verification_type')
              .eq('supplier_org_id', organizationId)
              .in('status', ['open', 'in_progress'])
              .limit(30)
          : Promise.resolve({ data: [] as never[] });

    const [
      pendingTcs,
      openVrs,
      facilities,
      wallet,
    ] = await Promise.all([
      tcPendingQuery,
      vrQuery,
      supabase
        .from('facilities')
        .select('id, name, is_verified')
        .eq('organization_id', organizationId)
        .limit(50),
      orgType === 'supplier' || orgType === 'brand'
        ? supabase
            .from('material_wallets')
            .select('id')
            .eq('organization_id', organizationId)
            .is('facility_id', null)
            .maybeSingle()
        : Promise.resolve({ data: null as { id: string } | null }),
    ]);

    const facilityIds = (facilities.data ?? []).map((f) => f.id);

    const [certsResult, balancesResult] = await Promise.all([
      facilityIds.length > 0
        ? supabase
            .from('facility_certifications')
            .select('id, facility_id, cert_name, expiry_date')
            .in('facility_id', facilityIds)
            .limit(80)
        : Promise.resolve({ data: [] as never[] }),
      wallet.data?.id
        ? supabase
            .from('wallet_balances')
            .select('available_qty, unit, materials(name)')
            .eq('wallet_id', wallet.data.id)
            .limit(40)
        : Promise.resolve({ data: [] as never[] }),
    ]);

    const facilityName = new Map(
      (facilities.data ?? []).map((f) => [f.id, f.name])
    );

    for (const tc of pendingTcs.data ?? []) {
      const expiryDays = daysUntil(tc.expiry_date);
      if (expiryDays != null && expiryDays < 0) {
        flags.push({
          id: `tc-exp-${tc.id}`,
          kind: 'expired_tc',
          severity: 'critical',
          title: `Expired TC · ${tc.tc_number}`,
          description: `Expiry ${tc.expiry_date} · status ${tc.tc_status}`,
          href: `/tc/${tc.id}`,
          category: 'compliance',
        });
      } else {
        flags.push({
          id: `tc-pend-${tc.id}`,
          kind: 'unverified_tc',
          severity: 'high',
          title: `Unverified TC · ${tc.tc_number}`,
          description:
            orgType === 'brand'
              ? 'Inbound certificate awaiting receiver verify'
              : 'Issued certificate still pending receiver verify',
          href: `/tc/${tc.id}`,
          category: 'compliance',
        });
      }
    }

    for (const vr of openVrs.data ?? []) {
      flags.push({
        id: `vr-${vr.id}`,
        kind: 'open_verification',
        severity: vr.status === 'open' ? 'high' : 'medium',
        title: `Open verification · ${vr.request_number}`,
        description: `${vr.verification_type} · ${vr.status}`,
        href: '/verification',
        category: 'compliance',
      });
    }

    for (const f of facilities.data ?? []) {
      if (!f.is_verified) {
        flags.push({
          id: `fac-${f.id}`,
          kind: 'unverified_facility',
          severity: 'low',
          title: `Unverified facility · ${f.name}`,
          description: 'Facility not marked verified on platform',
          href: '/facilities',
          category: 'risk',
        });
      }
    }

    for (const cert of certsResult.data ?? []) {
      const days = daysUntil(cert.expiry_date);
      if (days == null) continue;
      const fname = facilityName.get(cert.facility_id) ?? 'Facility';
      if (days < 0) {
        flags.push({
          id: `cert-exp-${cert.id}`,
          kind: 'expired_cert',
          severity: 'critical',
          title: `Expired cert · ${cert.cert_name}`,
          description: `${fname} · expired ${cert.expiry_date}`,
          href: '/facilities',
          category: 'compliance',
        });
      } else if (days <= 60) {
        flags.push({
          id: `cert-soon-${cert.id}`,
          kind: 'expiring_cert',
          severity: days <= 30 ? 'high' : 'medium',
          title: `Expiring cert · ${cert.cert_name}`,
          description: `${fname} · ${days}d left (as of ${today})`,
          href: '/facilities',
          category: 'compliance',
        });
      }
    }

    if (orgType === 'supplier') {
      for (const b of balancesResult.data ?? []) {
        const qty = Number(b.available_qty ?? 0);
        if (qty >= 100) continue;
        const mat = b.materials as
          | { name: string }
          | { name: string }[]
          | null;
        const name = Array.isArray(mat) ? mat[0]?.name : mat?.name;
        flags.push({
          id: `wallet-${name ?? qty}`,
          kind: 'low_wallet',
          severity: qty <= 0 ? 'high' : 'medium',
          title: `Low wallet · ${name ?? 'Material'}`,
          description: `${qty.toLocaleString()} ${b.unit ?? 'KG'} available`,
          href: '/wallet',
          category: 'risk',
        });
      }
    }

    flags.sort(
      (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
    );

    return {
      flags,
      ...scoreFromFlags(flags),
    };
  }
);

export const STANDARDS_READINESS = [
  {
    code: 'GOTS',
    name: 'Global Organic Textile Standard',
    focus: 'Organic fiber + social criteria',
  },
  {
    code: 'GRS',
    name: 'Global Recycled Standard',
    focus: 'Recycled content chain of custody',
  },
  {
    code: 'OEKO-TEX',
    name: 'OEKO-TEX Standard 100',
    focus: 'Harmful substances testing',
  },
  {
    code: 'REACH',
    name: 'EU REACH',
    focus: 'Chemical compliance for EU market',
  },
] as const;
