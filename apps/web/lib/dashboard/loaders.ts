import type { BrandDashboardSummary, SupplierDashboardSummary } from '@stt/types';
import { createClient } from '@/lib/supabase/server';
import type { SessionContext } from '@/lib/auth/session';

export async function loadBrandDashboardData(ctx: SessionContext) {
  const supabase = createClient();

  const { data: relationships } = await supabase
    .from('supplier_relationships')
    .select('id, supplier_org_id, tier_level, status')
    .eq('brand_org_id', ctx.organizationId)
    .order('created_at', { ascending: false });

  const supplierIds = (relationships ?? []).map((r) => r.supplier_org_id);
  const { data: supplierOrgs } =
    supplierIds.length > 0
      ? await supabase
          .from('organizations')
          .select('id, name, slug')
          .in('id', supplierIds)
      : { data: [] };

  const orgById = new Map((supplierOrgs ?? []).map((o) => [o.id, o]));

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

  const { data: recentTcs } = await supabase
    .from('transaction_certificates')
    .select(
      'id, tc_number, tc_status, total_quantity, quantity_unit, issue_date, issuer_org_id'
    )
    .eq('receiver_org_id', ctx.organizationId)
    .order('created_at', { ascending: false })
    .limit(10);

  const { count: pendingTCs } = await supabase
    .from('transaction_certificates')
    .select('id', { count: 'exact', head: true })
    .eq('receiver_org_id', ctx.organizationId)
    .in('tc_status', ['issued', 'transferred']);

  const summary: BrandDashboardSummary = {
    totalSuppliers: suppliers.length,
    activeOrders: 0,
    pendingTCs: pendingTCs ?? 0,
    complianceScore: 0,
    riskScore: 0,
    openAlerts: 0,
    sustainabilityScore: 0,
  };

  return { summary, suppliers, recentTcs: recentTcs ?? [] };
}

export async function loadSupplierDashboardData(ctx: SessionContext) {
  const supabase = createClient();

  const { data: wallet } = await supabase
    .from('material_wallets')
    .select('id')
    .eq('organization_id', ctx.organizationId)
    .is('facility_id', null)
    .maybeSingle();

  const { data: balances } = wallet
    ? await supabase
        .from('wallet_balances')
        .select('available_qty, unit, materials(name)')
        .eq('wallet_id', wallet.id)
    : { data: [] };

  const { data: facilities } = await supabase
    .from('facilities')
    .select('id, name, facility_type, tier_level, city, is_verified')
    .eq('organization_id', ctx.organizationId)
    .order('created_at', { ascending: false });

  const { data: recentTcs } = await supabase
    .from('transaction_certificates')
    .select('id, tc_number, tc_status, total_quantity, quantity_unit, issue_date')
    .eq('issuer_org_id', ctx.organizationId)
    .order('created_at', { ascending: false })
    .limit(10);

  const { count: issuedTCs } = await supabase
    .from('transaction_certificates')
    .select('id', { count: 'exact', head: true })
    .eq('issuer_org_id', ctx.organizationId);

  const walletBalance = (balances ?? []).map((b) => {
    const mat = b.materials as { name: string } | { name: string }[] | null;
    const name = Array.isArray(mat) ? mat[0]?.name : mat?.name;
    return {
      material: name ?? 'Material',
      available_qty: Number(b.available_qty ?? 0),
      unit: b.unit ?? 'KG',
    };
  });

  const summary: SupplierDashboardSummary = {
    walletBalance,
    pendingOrders: 0,
    issuedTCs: issuedTCs ?? 0,
    complianceTasks: 0,
    overdueTasksCount: 0,
  };

  return { summary, facilities: facilities ?? [], recentTcs: recentTcs ?? [] };
}
