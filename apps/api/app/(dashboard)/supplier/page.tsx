import Link from 'next/link';
import { logoutAction } from '@/app/(auth)/actions';
import { HubBanner } from '@/components/layout/hub-banner';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { canActAsBrand, canActAsSupplier } from '@/lib/auth/capabilities';
import { requireSessionContext } from '@/lib/auth/session';
import {
  loadBrandDashboardData,
  loadSupplierDashboardData,
} from '@/lib/dashboard/loaders';
import { createClient } from '@/lib/supabase/server';
import {
  Factory,
  FileBadge2,
  MapPin,
  Package,
  Wallet,
  Warehouse,
} from 'lucide-react';

export default async function SupplierDashboardPage() {
  const ctx = await requireSessionContext();
  const supplierLike = canActAsSupplier(ctx.orgType);
  const brandLike = canActAsBrand(ctx.orgType);

  async function renderFloor(opts: {
    own: Awaited<ReturnType<typeof loadSupplierDashboardData>>;
    partnerFacilities?: Array<{
      id: string;
      name: string;
      facility_type: string;
      tier_level: string | null;
      city: string | null;
      country: string | null;
      organization_id: string;
      is_verified: boolean;
    }>;
    nameBySupplier?: Map<string, string>;
    showNetworkNote?: boolean;
  }) {
    const { own, partnerFacilities = [], nameBySupplier, showNetworkNote } = opts;
    const walletLines = own.summary.walletBalance;
    const availableKg = walletLines.reduce((s, w) => s + w.available_qty, 0);

    return (
      <PageWrapper
        title="Supplier Hub"
        description="Factory floor · wallet · issued TCs — not the home map"
        actions={
          <div className="flex items-center gap-2">
            {ctx.orgType === 'platform_admin' ? (
              <Badge className="rounded-full bg-stt-amber-soft text-stt-amber">
                Super Admin view
              </Badge>
            ) : null}
            <form action={logoutAction}>
              <Button
                type="submit"
                variant="outline"
                className="h-8 rounded-[9px] text-xs font-semibold"
              >
                Sign out
              </Button>
            </form>
          </div>
        }
      >
        <HubBanner
          tone="supplier"
          title="Factory floor"
          subtitle="Facilities, material wallet and certificates you issue. Different from Brand Hub (buying network) and Dashboard (map)."
          links={[
            { href: '/facilities', label: 'Facilities' },
            { href: '/wallet', label: 'Wallet' },
            { href: '/tc', label: 'Issue TC' },
            { href: '/orders', label: 'Inbound PO' },
          ]}
          stats={[
            { label: 'Units', value: own.facilities.length },
            { label: 'Wallet KG', value: Math.round(availableKg).toLocaleString() },
            { label: 'Issued TC', value: own.summary.issuedTCs },
            { label: 'Pending PO', value: own.summary.pendingOrders },
          ]}
        />

        {showNetworkNote ? (
          <p className="mb-3.5 rounded-xl border border-[#F0D9A8] bg-[#FFF8EC] px-3 py-2 text-[11.5px] text-stt-amber">
            Super Admin / Brand: this floor shows <b>your org units + wallet</b>. Partner
            plants appear below as a separate strip — buying relationships stay in{' '}
            <Link href="/brand" className="font-semibold underline">
              Brand hub
            </Link>
            .
          </p>
        ) : null}

        {/* Wallet strip — unique to supplier */}
        <div className="mb-3.5 overflow-hidden rounded-2xl border border-[#E8C98A] bg-[linear-gradient(90deg,#FFF9F0,#FFFFFF)] shadow-[var(--stt-shadow)]">
          <div className="flex items-center gap-2 border-b border-[#F0D9A8] px-4 py-3">
            <Wallet className="size-4 text-stt-amber" />
            <h3 className="text-[13.5px] font-bold text-stt-ink">Material wallet strip</h3>
            <Link
              href="/wallet"
              className="ml-auto text-[11px] font-semibold text-stt-amber hover:underline"
            >
              Open wallet →
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 py-4">
            {walletLines.length === 0 ? (
              <p className="text-[12px] text-stt-muted">
                No balances — credit opening stock in Wallet.
              </p>
            ) : (
              walletLines.map((w, i) => (
                <div
                  key={`${w.material}-${i}`}
                  className="w-[140px] shrink-0 rounded-xl border border-[#F0D9A8] bg-white px-3 py-3"
                >
                  <div className="truncate text-[11px] font-semibold text-stt-muted">
                    {w.material}
                  </div>
                  <div className="mt-1 font-display text-[20px] font-bold text-stt-ink">
                    {w.available_qty.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-stt-faint">{w.unit} available</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Facility tiles */}
        <div className="mb-2 flex items-center gap-2">
          <Warehouse className="size-4 text-stt-amber" />
          <h3 className="text-[14px] font-bold text-stt-navy">Your facilities</h3>
        </div>
        {own.facilities.length === 0 ? (
          <div className="mb-3.5 rounded-2xl border border-dashed border-[#E8C98A] bg-[#FFF8EC] px-4 py-8 text-center text-[13px] text-stt-muted">
            Declare a unit in{' '}
            <Link href="/facilities" className="font-semibold text-stt-blue underline">
              Facilities
            </Link>
            .
          </div>
        ) : (
          <div className="mb-3.5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {own.facilities.map((f) => (
              <Link
                key={f.id}
                href={`/facilities/${f.id}`}
                className="rounded-2xl border border-stt-line bg-white p-4 shadow-[var(--stt-shadow)] transition hover:border-stt-amber/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="grid size-10 place-items-center rounded-xl bg-[#FFF1D6] text-stt-amber">
                    <Factory className="size-5" strokeWidth={1.75} />
                  </div>
                  {f.is_verified ? (
                    <Badge className="rounded-full bg-stt-green-soft text-stt-green-dark">
                      Verified
                    </Badge>
                  ) : (
                    <Badge className="rounded-full bg-[#EDF1F6] text-stt-muted">
                      Declared
                    </Badge>
                  )}
                </div>
                <div className="mt-3 text-[14px] font-bold text-stt-ink">{f.name}</div>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-stt-muted">
                  <MapPin className="size-3" />
                  {[f.city, f.facility_type].filter(Boolean).join(' · ') || '—'}
                </div>
                <div className="font-mono-stt mt-1 text-[10px] text-stt-faint">
                  {f.tier_level ?? 'tier —'}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="grid gap-3.5 lg:grid-cols-2">
          <div className="rounded-2xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
            <div className="flex items-center gap-2 border-b border-stt-line px-4 py-3">
              <FileBadge2 className="size-4 text-stt-green-dark" />
              <h3 className="text-[13.5px] font-bold">TCs you issued</h3>
              <Link
                href="/tc"
                className="ml-auto text-[11px] font-semibold text-stt-blue hover:underline"
              >
                All →
              </Link>
            </div>
            <ul className="divide-y divide-stt-line">
              {own.recentTcs.length === 0 ? (
                <li className="px-4 py-6 text-[12px] text-stt-muted">No issued TCs yet.</li>
              ) : (
                own.recentTcs.map((tc) => (
                  <li
                    key={tc.id}
                    className="flex items-center justify-between gap-2 px-4 py-2.5"
                  >
                    <div>
                      <Link
                        href={`/tc/${tc.id}`}
                        className="font-mono-stt text-[11px] text-stt-blue hover:underline"
                      >
                        {tc.tc_number}
                      </Link>
                      <div className="text-[10px] text-stt-muted">{tc.issue_date}</div>
                    </div>
                    <Badge className="rounded-full bg-stt-green-soft text-stt-green-dark">
                      {tc.tc_status}
                    </Badge>
                  </li>
                ))
              )}
            </ul>
          </div>

          {partnerFacilities.length > 0 ? (
            <div className="rounded-2xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
              <div className="flex items-center gap-2 border-b border-stt-line px-4 py-3">
                <Package className="size-4 text-stt-navy" />
                <h3 className="text-[13.5px] font-bold">Partner plants (linked)</h3>
              </div>
              <ul className="divide-y divide-stt-line">
                {partnerFacilities.slice(0, 10).map((f) => (
                  <li key={f.id} className="px-4 py-2.5">
                    <div className="text-[12px] font-semibold">{f.name}</div>
                    <div className="text-[10px] text-stt-muted">
                      {nameBySupplier?.get(f.organization_id) ?? 'Partner'}
                      {' · '}
                      {[f.city, f.country].filter(Boolean).join(', ') || f.facility_type}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-stt-line bg-[#F8FAFC] px-4 py-8 text-center text-[12px] text-stt-muted">
              Compliance tasks open: {own.summary.complianceTasks} · high signals:{' '}
              {own.summary.overdueTasksCount}. Check{' '}
              <Link href="/risk" className="font-semibold text-stt-blue underline">
                Risk
              </Link>
              .
            </div>
          )}
        </div>
      </PageWrapper>
    );
  }

  if (ctx.orgType === 'supplier') {
    const own = await loadSupplierDashboardData(ctx);
    return renderFloor({ own });
  }

  if (brandLike || supplierLike) {
    const [own, brandNet] = await Promise.all([
      loadSupplierDashboardData(ctx),
      loadBrandDashboardData(ctx),
    ]);
    const supabase = createClient();
    const supplierIds = brandNet.suppliers.map((s) => s.supplier_org_id);
    const { data: partnerFacilities } = supplierIds.length
      ? await supabase
          .from('facilities')
          .select(
            'id, name, facility_type, tier_level, city, country, organization_id, is_verified'
          )
          .in('organization_id', supplierIds)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(40)
      : { data: [] as Array<{
          id: string;
          name: string;
          facility_type: string;
          tier_level: string | null;
          city: string | null;
          country: string | null;
          organization_id: string;
          is_verified: boolean;
        }> };

    const nameBySupplier = new Map(
      brandNet.suppliers.map((s) => {
        const org = s.organizations;
        const name = Array.isArray(org) ? org[0]?.name : org?.name;
        return [s.supplier_org_id, name ?? 'Supplier'] as const;
      })
    );

    return renderFloor({
      own,
      partnerFacilities: partnerFacilities ?? [],
      nameBySupplier,
      showNetworkNote: true,
    });
  }

  return (
    <PageWrapper title="Supplier Hub" description={`${ctx.orgName} · ${ctx.orgType}`}>
      <div className="rounded-xl border border-stt-line bg-white p-4 text-[13px] text-stt-muted shadow-[var(--stt-shadow)]">
        Open{' '}
        <Link href="/facilities" className="font-semibold text-stt-blue hover:underline">
          Facilities
        </Link>{' '}
        or{' '}
        <Link href="/tc" className="font-semibold text-stt-blue hover:underline">
          TC
        </Link>
        .
      </div>
    </PageWrapper>
  );
}
