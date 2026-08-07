import type { SessionContext } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export type ChainNode = {
  tier: string;
  title: string;
  subtitle: string;
  orgId: string | null;
  facilityCount: number;
  latestTc: string | null;
  isBrand?: boolean;
};

export async function loadSupplyChainMap(ctx: SessionContext): Promise<ChainNode[]> {
  const supabase = createClient();

  if (ctx.orgType === 'brand') {
    const { data: rels } = await supabase
      .from('supplier_relationships')
      .select('supplier_org_id, tier_level, status')
      .eq('brand_org_id', ctx.organizationId)
      .eq('status', 'active')
      .order('tier_level', { ascending: true });

    const supplierIds = (rels ?? []).map((r) => r.supplier_org_id);
    const [{ data: orgs }, { data: facilities }, { data: tcs }] = await Promise.all([
      supplierIds.length
        ? supabase.from('organizations').select('id, name, country').in('id', supplierIds)
        : Promise.resolve({ data: [] as { id: string; name: string; country: string | null }[] }),
      supplierIds.length
        ? supabase
            .from('facilities')
            .select('id, organization_id')
            .in('organization_id', supplierIds)
            .eq('is_active', true)
        : Promise.resolve({ data: [] as { id: string; organization_id: string }[] }),
      supabase
        .from('transaction_certificates')
        .select('tc_number, issuer_org_id, issue_date')
        .eq('receiver_org_id', ctx.organizationId)
        .order('issue_date', { ascending: false })
        .limit(40),
    ]);

    const orgById = new Map((orgs ?? []).map((o) => [o.id, o]));
    const facilityCount = new Map<string, number>();
    for (const f of facilities ?? []) {
      facilityCount.set(
        f.organization_id,
        (facilityCount.get(f.organization_id) ?? 0) + 1
      );
    }
    const tcByIssuer = new Map<string, string>();
    for (const tc of tcs ?? []) {
      if (!tcByIssuer.has(tc.issuer_org_id)) {
        tcByIssuer.set(tc.issuer_org_id, tc.tc_number);
      }
    }

    const nodes: ChainNode[] = (rels ?? []).map((r) => {
      const org = orgById.get(r.supplier_org_id);
      return {
        tier: r.tier_level ?? 'tier_1',
        title: org?.name ?? 'Supplier',
        subtitle: org?.country ? `${org.country}` : 'Linked supplier',
        orgId: r.supplier_org_id,
        facilityCount: facilityCount.get(r.supplier_org_id) ?? 0,
        latestTc: tcByIssuer.get(r.supplier_org_id) ?? null,
      };
    });

    nodes.push({
      tier: 'brand',
      title: ctx.orgName,
      subtitle: 'Brand / Retailer',
      orgId: ctx.organizationId,
      facilityCount: 0,
      latestTc: null,
      isBrand: true,
    });

    const tierOrder = [
      'tier_6',
      'tier_5',
      'tier_4',
      'tier_3',
      'tier_2',
      'tier_1',
      'brand',
    ];
    return nodes.sort(
      (a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier)
    );
  }

  // Supplier / other: own facilities as chain steps
  const { data: facilities } = await supabase
    .from('facilities')
    .select('id, name, facility_type, tier_level, city, country')
    .eq('organization_id', ctx.organizationId)
    .eq('is_active', true)
    .order('tier_level', { ascending: true });

  if (!facilities?.length) {
    return [
      {
        tier: 'org',
        title: ctx.orgName,
        subtitle: 'Declare facilities to build the map',
        orgId: ctx.organizationId,
        facilityCount: 0,
        latestTc: null,
      },
    ];
  }

  return facilities.map((f) => ({
    tier: f.tier_level ?? 'tier_1',
    title: f.name,
    subtitle: [f.facility_type, f.city, f.country].filter(Boolean).join(' · '),
    orgId: ctx.organizationId,
    facilityCount: 1,
    latestTc: null,
  }));
}
