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
    pendingOrdersResult,
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
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('supplier_org_id', ctx.organizationId)
        .in('status', ['pending', 'confirmed', 'in_production', 'shipped']),
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
    pendingOrders: pendingOrdersResult.count ?? 0,
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

/** Supplier (or any non-brand) view of buyer brands linked to this org. */
export async function loadBuyerNetworkData(ctx: SessionContext) {
  const supabase = createClient();

  const { data: relationships } = await supabase
    .from('supplier_relationships')
    .select('id, brand_org_id, tier_level, status')
    .eq('supplier_org_id', ctx.organizationId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  const brandIds = (relationships ?? []).map((r) => r.brand_org_id);
  const [{ data: brands }, { data: orders }, { data: recentTcs }, ordersCount, pendingTCs] =
    await Promise.all([
      brandIds.length
        ? supabase.from('organizations').select('id, name, slug, country').in('id', brandIds)
        : Promise.resolve({ data: [] as { id: string; name: string; slug: string; country: string | null }[] }),
      supabase
        .from('orders')
        .select(
          'id, order_number, po_number, status, total_quantity, quantity_unit, order_date, buyer_org_id, season'
        )
        .eq('supplier_org_id', ctx.organizationId)
        .order('created_at', { ascending: false })
        .limit(12),
      supabase
        .from('transaction_certificates')
        .select(
          'id, tc_number, tc_status, total_quantity, quantity_unit, issue_date, receiver_org_id'
        )
        .eq('issuer_org_id', ctx.organizationId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('supplier_org_id', ctx.organizationId)
        .neq('status', 'cancelled'),
      supabase
        .from('transaction_certificates')
        .select('id', { count: 'exact', head: true })
        .eq('issuer_org_id', ctx.organizationId)
        .in('tc_status', ['issued', 'transferred', 'verified']),
    ]);

  const brandById = new Map((brands ?? []).map((b) => [b.id, b]));
  const buyers = (relationships ?? []).map((r) => ({
    id: r.id,
    brand_org_id: r.brand_org_id,
    tier_level: r.tier_level,
    status: r.status,
    name: brandById.get(r.brand_org_id)?.name ?? 'Buyer',
    country: brandById.get(r.brand_org_id)?.country ?? null,
  }));

  return {
    buyers,
    orders: orders ?? [],
    recentTcs: recentTcs ?? [],
    summary: {
      linkedBuyers: buyers.length,
      activeOrders: ordersCount.count ?? 0,
      issuedTCs: pendingTCs.count ?? 0,
    },
  };
}

/** Verification KPIs + rows visible to the current org (any role). */
export async function loadVerificationHubData(ctx: SessionContext) {
  const supabase = createClient();
  const orgId = ctx.organizationId;

  let requestQuery = supabase
    .from('verification_requests')
    .select(
      'id, request_number, verification_type, scope, status, standards, deadline_date, budget_max_usd, buyer_org_id, supplier_org_id, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(50);

  if (ctx.orgType === 'auditor' || ctx.orgType === 'platform_admin') {
    // Super Admin / auditor: marketplace + own buyer/supplier jobs
    requestQuery = requestQuery.or(
      `buyer_org_id.eq.${orgId},supplier_org_id.eq.${orgId},status.in.(open,assigned,in_progress,completed)`
    );
  } else {
    requestQuery = requestQuery.or(
      `buyer_org_id.eq.${orgId},supplier_org_id.eq.${orgId}`
    );
  }

  const { data: requests } = await requestQuery;

  const openCount = (requests ?? []).filter((r) => r.status === 'open').length;
  const activeCount = (requests ?? []).filter((r) =>
    ['assigned', 'in_progress'].includes(r.status)
  ).length;
  const doneCount = (requests ?? []).filter((r) => r.status === 'completed').length;

  let myAssignments: { id: string; request_id: string; status: string }[] = [];
  if (ctx.orgType === 'auditor' || ctx.orgType === 'platform_admin') {
    const { data } = await supabase
      .from('verification_assignments')
      .select('id, request_id, status')
      .eq('auditor_org_id', orgId)
      .order('assigned_at', { ascending: false })
      .limit(20);
    myAssignments = data ?? [];
  }

  return {
    requests: requests ?? [],
    myAssignments,
    kpis: {
      open: openCount,
      active: activeCount,
      completed: doneCount,
      total: requests?.length ?? 0,
    },
  };
}
