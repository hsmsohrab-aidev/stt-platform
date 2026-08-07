import Link from 'next/link';
import { logoutAction } from '@/app/(auth)/actions';
import { LinkSupplierForm } from '@/app/(dashboard)/brand/link-supplier-form';
import { BrandDashboard } from '@/components/dashboard/brand-dashboard';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { requireSessionContext } from '@/lib/auth/session';
import {
  loadBrandDashboardData,
  loadBuyerNetworkData,
} from '@/lib/dashboard/loaders';

export default async function BrandDashboardPage() {
  const ctx = await requireSessionContext();

  if (ctx.orgType === 'brand') {
    const data = await loadBrandDashboardData(ctx);
    return (
      <PageWrapper
        title="Brand Hub"
        description={`${ctx.orgName} · buyer / brand workspace`}
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
        <BrandDashboard
          orgName={ctx.orgName}
          orgId={ctx.organizationId}
          summary={data.summary}
          suppliers={data.suppliers}
          recentTcs={data.recentTcs}
        />
        <div className="mt-3.5 max-w-md rounded-xl border border-stt-line bg-white p-4 shadow-[var(--stt-shadow)]">
          <h3 className="mb-3 text-[12.5px] font-bold">＋ Link supplier</h3>
          <LinkSupplierForm />
        </div>
      </PageWrapper>
    );
  }

  // Supplier / auditor / other — show buyer network (no bounce redirect)
  const network = await loadBuyerNetworkData(ctx);

  return (
    <PageWrapper
      title="Brand Hub"
      description={`${ctx.orgName} · linked buyers & brand programs (read view)`}
      actions={
        <Badge className="rounded-full bg-stt-blue-soft text-stt-blue">
          Viewing as {ctx.orgType}
        </Badge>
      }
    >
      <div className="mb-3 rounded-[9px] border border-[#CCDCF9] bg-stt-blue-soft px-3 py-2 text-[11.5px] text-[#1E4FA8]">
        You are logged in as a <b>{ctx.orgType}</b>. This hub shows brands linked to
        your org — no redirect. Switch org type only via a separate brand account.
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {(
          [
            ['Linked buyers', network.summary.linkedBuyers],
            ['Active orders', network.summary.activeOrders],
            ['Issued TCs', network.summary.issuedTCs],
          ] as const
        ).map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-stt-line bg-white p-3.5 shadow-[var(--stt-shadow)]"
          >
            <div className="text-[10.5px] font-semibold text-stt-muted">{label}</div>
            <div className="mt-1 font-display text-[23px] font-bold">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-3.5 grid gap-3.5 lg:grid-cols-2">
        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="border-b border-stt-line px-4 py-3">
            <h3 className="text-[12.5px] font-bold">Buyer brands</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase text-stt-faint">Brand</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Tier</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {network.buyers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-[12px] text-stt-muted">
                    No buyer links yet. Load Demo Data or ask a brand to link you.
                  </TableCell>
                </TableRow>
              ) : (
                network.buyers.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="text-[12px] font-semibold">
                      {b.name}
                      {b.country ? (
                        <span className="ml-1 text-[10px] font-normal text-stt-muted">
                          · {b.country}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="font-mono-stt text-[11px]">{b.tier_level}</TableCell>
                    <TableCell>
                      <Badge className="rounded-full bg-stt-green-soft text-stt-green-dark">
                        {b.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="flex items-center border-b border-stt-line px-4 py-3">
            <h3 className="text-[12.5px] font-bold">Orders from buyers</h3>
            <Button asChild variant="outline" className="ml-auto h-7 rounded-[9px] text-[10px]">
              <Link href="/orders">All orders</Link>
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase text-stt-faint">PO / Order</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Status</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {network.orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-[12px] text-stt-muted">
                    No purchase orders yet.
                  </TableCell>
                </TableRow>
              ) : (
                network.orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <div className="font-mono-stt text-[11px] text-stt-blue">
                        {o.po_number ?? o.order_number}
                      </div>
                      <div className="text-[10px] text-stt-muted">{o.season ?? o.order_date}</div>
                    </TableCell>
                    <TableCell className="text-[11px]">{o.status}</TableCell>
                    <TableCell className="font-mono-stt text-[11px]">
                      {o.total_quantity?.toLocaleString() ?? '—'} {o.quantity_unit}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageWrapper>
  );
}
