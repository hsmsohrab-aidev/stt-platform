import { cache } from 'react';
import type { OrgType } from '@stt/types';
import { createClient } from '@/lib/supabase/server';
import { loadOrgRiskSnapshot } from '@/lib/risk/derive';

export type SustainabilityPriority = {
  id: string;
  title: string;
  target: string;
  progress: number;
  status: 'on_track' | 'at_risk' | 'in_progress' | 'done';
  href: string;
};

export type SustainabilityMetricRow = {
  id: string;
  metric: string;
  value: number;
  unit: string;
  source: string;
  href: string;
};

export type OrgSustainabilitySnapshot = {
  score: number;
  publishedPassports: number;
  draftPassports: number;
  totalCarbonKg: number;
  totalWaterL: number;
  metricsWithData: number;
  verifiedFacilityPct: number;
  priorities: SustainabilityPriority[];
  metrics: SustainabilityMetricRow[];
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export const FRAMEWORK_REPORTS = [
  {
    code: 'GRI',
    name: 'GRI Universal 2021',
    note: 'Impact reporting baseline',
  },
  {
    code: 'CSRD',
    name: 'CSRD / ESRS E1–E5',
    note: 'EU corporate sustainability',
  },
  {
    code: 'CDP',
    name: 'CDP Climate',
    note: 'Climate disclosure questionnaire',
  },
  {
    code: 'TCFD',
    name: 'TCFD Disclosure',
    note: 'Climate risk governance',
  },
  {
    code: 'SASB',
    name: 'SASB Apparel',
    note: 'Sector material topics',
  },
] as const;

/** Derived sustainability intelligence from DPP + facilities + compliance. */
export const loadOrgSustainabilitySnapshot = cache(
  async (
    organizationId: string,
    orgType: OrgType
  ): Promise<OrgSustainabilitySnapshot> => {
    const supabase = createClient();

    const [passportsResult, facilitiesResult, riskSnap, verifiedTcResult, totalTcResult] =
      await Promise.all([
        supabase
          .from('product_passports')
          .select(
            'id, product_name, status, carbon_footprint_kg, water_usage_liters'
          )
          .eq('organization_id', organizationId)
          .limit(80),
        supabase
          .from('facilities')
          .select('id, is_verified')
          .eq('organization_id', organizationId)
          .limit(50),
        loadOrgRiskSnapshot(organizationId, orgType),
        orgType === 'brand'
          ? supabase
              .from('transaction_certificates')
              .select('id', { count: 'exact', head: true })
              .eq('receiver_org_id', organizationId)
              .eq('tc_status', 'verified')
          : supabase
              .from('transaction_certificates')
              .select('id', { count: 'exact', head: true })
              .eq('issuer_org_id', organizationId)
              .eq('tc_status', 'verified'),
        orgType === 'brand'
          ? supabase
              .from('transaction_certificates')
              .select('id', { count: 'exact', head: true })
              .eq('receiver_org_id', organizationId)
          : supabase
              .from('transaction_certificates')
              .select('id', { count: 'exact', head: true })
              .eq('issuer_org_id', organizationId),
      ]);

    const passports = passportsResult.data ?? [];
    const published = passports.filter((p) => p.status === 'published');
    const drafts = passports.filter((p) => p.status !== 'published');
    const passportIds = passports.map((p) => p.id);

    const { data: sustRows } =
      passportIds.length > 0
        ? await supabase
            .from('passport_sustainability')
            .select('id, passport_id, metric_name, metric_value, metric_unit')
            .in('passport_id', passportIds)
            .limit(120)
        : { data: [] as never[] };

    const totalCarbonKg = passports.reduce(
      (sum, p) => sum + Number(p.carbon_footprint_kg ?? 0),
      0
    );
    const totalWaterL = passports.reduce(
      (sum, p) => sum + Number(p.water_usage_liters ?? 0),
      0
    );

    const facilities = facilitiesResult.data ?? [];
    const verifiedFacilities = facilities.filter((f) => f.is_verified).length;
    const verifiedFacilityPct =
      facilities.length === 0
        ? 0
        : Math.round((verifiedFacilities / facilities.length) * 100);

    const totalTc = totalTcResult.count ?? 0;
    const verifiedTc = verifiedTcResult.count ?? 0;
    const verifiedTcPct =
      totalTc === 0 ? 0 : Math.round((verifiedTc / totalTc) * 100);

    const hasCarbon = passports.some(
      (p) => p.carbon_footprint_kg != null && Number(p.carbon_footprint_kg) > 0
    );
    const hasWater = passports.some(
      (p) => p.water_usage_liters != null && Number(p.water_usage_liters) > 0
    );
    const publishedPct =
      passports.length === 0
        ? 0
        : Math.round((published.length / passports.length) * 100);

    const score = clamp(
      Math.round(
        riskSnap.complianceScore * 0.35 +
          publishedPct * 0.25 +
          verifiedFacilityPct * 0.15 +
          verifiedTcPct * 0.15 +
          (hasCarbon ? 5 : 0) +
          (hasWater ? 5 : 0)
      ),
      0,
      100
    );

    const priorities: SustainabilityPriority[] = [];

    if (drafts.length > 0) {
      priorities.push({
        id: 'publish-dpp',
        title: 'Publish product passports',
        target: `${drafts.length} draft${drafts.length === 1 ? '' : 's'} remaining`,
        progress: publishedPct,
        status: publishedPct >= 50 ? 'in_progress' : 'at_risk',
        href: '/dpp',
      });
    } else if (passports.length === 0) {
      priorities.push({
        id: 'create-dpp',
        title: 'Create first Digital Product Passport',
        target: 'EU ESPR-ready consumer transparency',
        progress: 0,
        status: 'at_risk',
        href: '/dpp',
      });
    } else {
      priorities.push({
        id: 'dpp-ok',
        title: 'Passport coverage',
        target: `${published.length} published`,
        progress: 100,
        status: 'done',
        href: '/dpp',
      });
    }

    if (!hasCarbon || !hasWater) {
      priorities.push({
        id: 'footprint-data',
        title: 'Complete footprint metrics',
        target: 'Carbon + water on passports',
        progress: (hasCarbon ? 50 : 0) + (hasWater ? 50 : 0),
        status: hasCarbon || hasWater ? 'in_progress' : 'at_risk',
        href: '/dpp',
      });
    }

    if (facilities.length > 0 && verifiedFacilityPct < 100) {
      priorities.push({
        id: 'verify-facilities',
        title: 'Verify facilities',
        target: `${verifiedFacilities}/${facilities.length} verified`,
        progress: verifiedFacilityPct,
        status: verifiedFacilityPct >= 50 ? 'on_track' : 'in_progress',
        href: '/facilities',
      });
    }

    if (riskSnap.flags.filter((f) => f.category === 'compliance').length > 0) {
      priorities.push({
        id: 'clear-compliance',
        title: 'Clear compliance exceptions',
        target: `${riskSnap.complianceScore}/100 compliance score`,
        progress: riskSnap.complianceScore,
        status: riskSnap.complianceScore >= 70 ? 'on_track' : 'at_risk',
        href: '/compliance',
      });
    }

    if (totalTc > 0 && verifiedTcPct < 100) {
      priorities.push({
        id: 'verify-tcs',
        title: 'Raise verified TC share',
        target: `${verifiedTcPct}% of TCs verified`,
        progress: verifiedTcPct,
        status: verifiedTcPct >= 60 ? 'on_track' : 'in_progress',
        href: '/tc',
      });
    }

    const metrics: SustainabilityMetricRow[] = [];

    if (totalCarbonKg > 0) {
      metrics.push({
        id: 'carbon-sum',
        metric: 'Passport CO₂e (sum)',
        value: Number(totalCarbonKg.toFixed(2)),
        unit: 'kg',
        source: `${passports.filter((p) => p.carbon_footprint_kg != null).length} passports`,
        href: '/dpp',
      });
    }
    if (totalWaterL > 0) {
      metrics.push({
        id: 'water-sum',
        metric: 'Passport water (sum)',
        value: Number(totalWaterL.toFixed(1)),
        unit: 'L',
        source: `${passports.filter((p) => p.water_usage_liters != null).length} passports`,
        href: '/dpp',
      });
    }

    for (const row of sustRows ?? []) {
      if (row.metric_value == null) continue;
      metrics.push({
        id: row.id,
        metric: row.metric_name.replace(/_/g, ' '),
        value: Number(row.metric_value),
        unit: row.metric_unit ?? '',
        source: 'passport_sustainability',
        href: `/dpp/${row.passport_id}`,
      });
    }

    metrics.push({
      id: 'fac-verified',
      metric: 'Facilities verified',
      value: verifiedFacilityPct,
      unit: '%',
      source: `${verifiedFacilities}/${facilities.length || 0}`,
      href: '/facilities',
    });

    metrics.push({
      id: 'tc-verified',
      metric: 'TCs verified',
      value: verifiedTcPct,
      unit: '%',
      source: `${verifiedTc}/${totalTc}`,
      href: '/tc',
    });

    return {
      score,
      publishedPassports: published.length,
      draftPassports: drafts.length,
      totalCarbonKg,
      totalWaterL,
      metricsWithData: metrics.length,
      verifiedFacilityPct,
      priorities: priorities.slice(0, 6),
      metrics: metrics.slice(0, 12),
    };
  }
);
