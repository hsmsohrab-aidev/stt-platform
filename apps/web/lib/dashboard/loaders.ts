import type { BrandDashboardSummary, SupplierDashboardSummary } from '@stt/types';
import { createClient } from '@/lib/supabase/server';
import type { SessionContext } from '@/lib/auth/session';
import { loadOrgRiskSnapshot } from '@/lib/risk/derive';
import { loadOrgSustainabilitySnapshot } from '@/lib/sustainability/derive';

export async function loadBrandDashboardData(ctx: SessionContext) {
  const supabase = createClient();

  const { data: relationships } = await supabase
    .from('supplier_relationships')
    .select('id, supplier_org_id, tier_level, status')
    .eq('brand_org_id', ctx.organizationId)
    .order('created_at', { ascending: false });

  const supplierIds = (relationships ?? []).map((r) => r.supplier_org_id);

  const [
    supplierOrgsResult,
    recentTcsResult,
    pendingTCsResult,
    activeOrdersResult,
    openAlertsResult,
    riskSnap,
    sustSnap,
  ] = await Promise.all([
    supplierIds.length > 0
      ? supabase
          .from('organizations')
          .select('id, name, slug')
          .in('id', supplierIds)
      : Promise.resolve({ data: [] as { id: string; name: string; slug: string }[] }),
    supabase
      .from('transaction_certificates')
      .select(
        'id, tc_number, tc_status, total_quantity, quantity_unit, issue_date, issuer_org_id'
      )
      .eq('receiver_org_id', ctx.organizationId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('transaction_certificates')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_org_id', ctx.organizationId)
      .in('tc_status', ['issued', 'transferred']),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('buyer_org_id', ctx.organizationId)
      .neq('status', 'cancelled'),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', ctx.organizationId)
      .eq('is_read', false),
    loadOrgRiskSnapshot(ctx.organizationId, ctx.orgType),
    loadOrgSustainabilitySnapshot(ctx.organizationId, ctx.orgType),
  ]);

  const orgById = new Map(
    (supplierOrgsResult.data ?? []).map((o) => [o.id, o])
  );

  const suppliers = (relationships ?? []).map((r) => ({
    id: r.id,
    supplier_org_id: r.supplier_org_id,
    tier_level: r.tier_level,
    status: r.status,
    organizations: orgById.get(r.supplier_org_id)
      ? {
          name: orgById.get(r.supplier_org_id)!.name,
          slug: orgById.get(r.supplier_org_id)!.slug,
        }
      : null,
  }));

  const summary: BrandDashboardSummary = {
    totalSuppliers: suppliers.length,
    activeOrders: activeOrdersResult.count ?? 0,
    pendingTCs: pendingTCsResult.count ?? 0,
    complianceScore: riskSnap.complianceScore,
    riskScore: riskSnap.riskScore,
    openAlerts: openAlertsResult.count ?? 0,
    sustainabilityScore: sustSnap.score,
  };

  return { summary, suppliers, recentTcs: recentTcsResult.data ?? [] };
}

export async function loadSupplierDashboardData(ctx: SessionContext) {
  const supabase = createClient();

  const [
    walletResult,
    facilitiesResult,
    recentTcsResult,
    issuedTCsResult,
    riskSnap,
  ] = await Promise.all([
      supabase
        .from('material_wallets')
        .select('id')
        .eq('organization_id', ctx.organizationId)
        .is('facility_id', null)
        .maybeSingle(),
      supabase
        .from('facilities')
        .select('id, name, facility_type, tier_level, city, is_verified')
        .eq('organization_id', ctx.organizationId)
        .order('created_at', { ascending: false }),
      supabase
        .from('transaction_certificates')
        .select('id, tc_number, tc_status, total_quantity, quantity_unit, issue_date')
        .eq('issuer_org_id', ctx.organizationId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('transaction_certificates')
        .select('id', { count: 'exact', head: true })
        .eq('issuer_org_id', ctx.organizationId),
      loadOrgRiskSnapshot(ctx.organizationId, ctx.orgType),
    ]);

  const wallet = walletResult.data;
  const { data: balances } = wallet
    ? await supabase
        .from('wallet_balances')
        .select('available_qty, unit, materials(name)')
        .eq('wallet_id', wallet.id)
    : { data: [] };

  const walletBalance = (balances ?? []).map((b) => {
    const mat = b.materials as { name: string } | { name: string }[] | null;
    const name = Array.isArray(mat) ? mat[0]?.name : mat?.name;
    return {
      material: name ?? 'Material',
      available_qty: Number(b.available_qty ?? 0),
      unit: b.unit ?? 'KG',
    };
  });

  const complianceTasks = riskSnap.flags.filter(
    (f) => f.category === 'compliance'
  ).length;
  const overdueTasksCount = riskSnap.flags.filter(
    (f) => f.severity === 'critical' || f.severity === 'high'
  ).length;

  const summary: SupplierDashboardSummary = {
    walletBalance,
    pendingOrders: 0,
    issuedTCs: issuedTCsResult.count ?? 0,
    complianceTasks,
    overdueTasksCount,
  };

  return {
    summary,
    facilities: facilitiesResult.data ?? [],
    recentTcs: recentTcsResult.data ?? [],
  };
}
