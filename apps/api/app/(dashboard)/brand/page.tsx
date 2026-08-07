import Link from 'next/link';
import { logoutAction } from '@/app/(auth)/actions';
import { LinkSupplierForm } from '@/app/(dashboard)/brand/link-supplier-form';
import { HubBanner } from '@/components/layout/hub-banner';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { canActAsBrand } from '@/lib/auth/capabilities';
import { requireSessionContext } from '@/lib/auth/session';
import { loadBrandDashboardData } from '@/lib/dashboard/loaders';
import { createClient } from '@/lib/supabase/server';
import {
  Building2,
  FileBadge2,
  Ship,
  ShoppingCart,
  ShieldCheck,
} from 'lucide-react';

export default async function BrandDashboardPage() {
  const ctx = await requireSessionContext();
  const brandLike = canActAsBrand(ctx.orgType);
  const supabase = createClient();

  if (!brandLike) {
    return (
      <PageWrapper
        title="Brand Hub"
        description={`${ctx.orgName} · brand workspace requires a brand or Super Admin account`}
      >
        <div className="rounded-xl border border-stt-line bg-white p-4 text-[13px] text-stt-muted shadow-[var(--stt-shadow)]">
          Open{' '}
          <Link href="/orders" className="font-semibold text-stt-blue hover:underline">
            Orders
          </Link>{' '}
          or{' '}
          <Link href="/supplier" className="font-semibold text-stt-blue hover:underline">
            Supplier Hub
          </Link>{' '}
          for your role.
        </div>
      </PageWrapper>
    );
  }

  const data = await loadBrandDashboardData(ctx);

  const [{ data: orders }, { data: shipments }, { data: vrs }, { data: auditRows }] =
    await Promise.all([
      supabase
        .from('orders')
        .select(
          'id, order_number, po_number, status, total_quantity, quantity_unit, season, supplier_org_id'
        )
        .eq('buyer_org_id', ctx.organizationId)
        .order('created_at', { ascending: false })
        .limit(12),
      supabase
        .from('shipments')
        .select('id, shipment_number, status, origin_port, destination_port')
        .or(
          `organization_id.eq.${ctx.organizationId},consignee_org_id.eq.${ctx.organizationId}`
        )
        .order('created_at', { ascending: false })
        .limit(8),
      supabase
        .from('verification_requests')
        .select('id, request_number, status, verification_type, supplier_org_id')
        .eq('buyer_org_id', ctx.organizationId)
        .order('created_at', { ascending: false })
        .limit(8),
      supabase
        .from('audit_reports')
        .select('id, request_id, overall_rating, is_published')
        .eq('is_published', true)
        .limit(80),
    ]);

  const completedVrIds = (auditRows ?? [])
    .filter(
      (r) =>
        r.overall_rating === 'pass' || r.overall_rating === 'pass_with_conditions'
    )
    .map((r) => r.request_id);

  const { data: verifiedReqs } =
    completedVrIds.length > 0
      ? await supabase
          .from('verification_requests')
          .select('id, supplier_org_id')
          .in('id', completedVrIds)
          .eq('buyer_org_id', ctx.organizationId)
      : { data: [] as { id: string; supplier_org_id: string }[] };

  const verifiedSupplierIds = new Set(
    (verifiedReqs ?? []).map((r) => r.supplier_org_id)
  );

  const orderRows = orders ?? [];
  const auditedCount = data.suppliers.filter((s) =>
    verifiedSupplierIds.has(s.supplier_org_id)
  ).length;

  return (
    <PageWrapper
      title="Brand Hub"
      description="Supplier network · buying · inbound trust — not the home map"
      actions={
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="outline"
            className="h-8 rounded-[9px] text-xs font-semibold"
          >
            Sign out
          </Button>
        </form>
      }
    >
      <HubBanner
        tone="brand"
        title="Supplier network"
        subtitle="Link partners, track purchase orders and inbound TCs. Live map stays on Dashboard — this hub is for buying relationships."
        links={[
          { href: '/orders', label: 'Orders' },
          { href: '/tc', label: 'TC inbox' },
          { href: '/verification', label: 'Request audit' },
          { href: '/supply-chain', label: 'Tier map' },
        ]}
        stats={[
          { label: 'Suppliers', value: data.summary.totalSuppliers },
          { label: 'Audited', value: auditedCount },
          { label: 'Open POs', value: data.summary.activeOrders },
          { label: 'Pending TC', value: data.summary.pendingTCs },
        ]}
      />

      {/* Network cards — not another donut strip */}
      <div className="mb-3.5">
        <div className="mb-2 flex items-center gap-2">
          <Building2 className="size-4 text-stt-green-dark" />
          <h3 className="text-[14px] font-bold text-stt-navy">Your suppliers</h3>
          <span className="text-[11px] text-stt-muted">
            card grid · click opens supplier floor
          </span>
        </div>
        {data.suppliers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stt-green/40 bg-stt-green-soft/40 px-4 py-8 text-center text-[13px] text-stt-muted">
            No suppliers yet — use the link form on the right.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.suppliers.map((s) => {
              const org = s.organizations;
              const name = Array.isArray(org) ? org[0]?.name : org?.name;
              const audited = verifiedSupplierIds.has(s.supplier_org_id);
              return (
                <Link
                  key={s.id}
                  href="/supplier"
                  className="group rounded-2xl border border-stt-line bg-white p-4 shadow-[var(--stt-shadow)] transition hover:border-stt-green/50 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="grid size-10 place-items-center rounded-xl bg-stt-green-soft text-stt-green-dark">
                      <Building2 className="size-5" strokeWidth={1.75} />
                    </div>
                    <Badge
                      className={
                        audited
                          ? 'rounded-full bg-stt-green-soft text-stt-green-dark'
                          : 'rounded-full bg-[#EDF1F6] text-stt-muted'
                      }
                    >
                      {audited ? 'Audit verified' : 'Audit pending'}
                    </Badge>
                  </div>
                  <div className="mt-3 text-[14px] font-bold text-stt-ink group-hover:text-stt-green-dark">
                    {name ?? s.supplier_org_id.slice(0, 8)}
                  </div>
                  <div className="mt-1 font-mono-stt text-[11px] text-stt-faint">
                    {s.tier_level} · {s.status}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-3.5 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-3.5">
          {/* PO rail */}
          <div className="rounded-2xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
            <div className="flex items-center gap-2 border-b border-stt-line px-4 py-3">
              <ShoppingCart className="size-4 text-stt-blue" />
              <h3 className="text-[13.5px] font-bold">Purchase order rail</h3>
              <Link
                href="/orders"
                className="ml-auto text-[11px] font-semibold text-stt-blue hover:underline"
              >
                All →
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto px-4 py-4">
              {orderRows.length === 0 ? (
                <p className="text-[12px] text-stt-muted">No purchase orders yet.</p>
              ) : (
                orderRows.map((o) => (
                  <Link
                    key={o.id}
                    href={`/orders/${o.id}`}
                    className="w-[160px] shrink-0 rounded-xl border border-stt-line bg-[#F7FBFA] p-3 transition hover:border-stt-green/40"
                  >
                    <div className="font-mono-stt text-[11px] font-semibold text-stt-blue">
                      {o.po_number ?? o.order_number}
                    </div>
                    <div className="mt-2 font-display text-[16px] font-bold">
                      {Number(o.total_quantity ?? 0).toLocaleString()}
                      <span className="ml-1 text-[10px] font-normal text-stt-muted">
                        {o.quantity_unit}
                      </span>
                    </div>
                    <Badge className="mt-2 rounded-full bg-stt-blue-soft text-[10px] text-stt-blue">
                      {o.status}
                    </Badge>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
              <div className="flex items-center gap-2 border-b border-stt-line px-4 py-3">
                <FileBadge2 className="size-4 text-stt-green-dark" />
                <h3 className="text-[13px] font-bold">Inbound TCs</h3>
              </div>
              <ul className="divide-y divide-stt-line">
                {data.recentTcs.length === 0 ? (
                  <li className="px-4 py-5 text-[12px] text-stt-muted">None yet.</li>
                ) : (
                  data.recentTcs.slice(0, 6).map((tc) => (
                    <li key={tc.id} className="flex justify-between gap-2 px-4 py-2.5">
                      <Link
                        href={`/tc/${tc.id}`}
                        className="font-mono-stt text-[11px] text-stt-blue hover:underline"
                      >
                        {tc.tc_number}
                      </Link>
                      <Badge className="rounded-full bg-stt-green-soft text-[10px] text-stt-green-dark">
                        {tc.tc_status}
                      </Badge>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div className="rounded-2xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
              <div className="flex items-center gap-2 border-b border-stt-line px-4 py-3">
                <Ship className="size-4 text-stt-navy" />
                <h3 className="text-[13px] font-bold">Shipments in</h3>
              </div>
              <ul className="divide-y divide-stt-line">
                {(shipments ?? []).length === 0 ? (
                  <li className="px-4 py-5 text-[12px] text-stt-muted">None yet.</li>
                ) : (
                  (shipments ?? []).map((s) => (
                    <li key={s.id} className="px-4 py-2.5">
                      <Link
                        href={`/shipments/${s.id}`}
                        className="font-mono-stt text-[11px] text-stt-blue hover:underline"
                      >
                        {s.shipment_number}
                      </Link>
                      <div className="text-[10px] text-stt-muted">
                        {[s.origin_port, s.destination_port].filter(Boolean).join(' → ') ||
                          s.status}
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-3.5">
          <div className="rounded-2xl border-2 border-stt-green/30 bg-white p-4 shadow-[var(--stt-shadow)]">
            <h3 className="mb-1 text-[13.5px] font-bold text-stt-green-dark">
              Link a supplier
            </h3>
            <p className="mb-3 text-[11px] text-stt-muted">
              Primary Brand Hub action — grows your network cards above.
            </p>
            <LinkSupplierForm />
          </div>

          <div className="rounded-2xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
            <div className="flex items-center gap-2 border-b border-stt-line px-4 py-3">
              <ShieldCheck className="size-4 text-stt-purple" />
              <h3 className="text-[13px] font-bold">Your audit requests</h3>
            </div>
            <ul className="divide-y divide-stt-line">
              {(vrs ?? []).length === 0 ? (
                <li className="px-4 py-5 text-[12px] text-stt-muted">
                  No verification requests.
                </li>
              ) : (
                (vrs ?? []).map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between gap-2 px-4 py-2.5"
                  >
                    <div>
                      <div className="font-mono-stt text-[11px]">{v.request_number}</div>
                      <div className="text-[10px] text-stt-muted">{v.verification_type}</div>
                    </div>
                    <Badge className="rounded-full bg-stt-purple-soft text-stt-purple">
                      {v.status}
                    </Badge>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
