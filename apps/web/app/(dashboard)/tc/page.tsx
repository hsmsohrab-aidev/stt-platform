import Link from 'next/link';
import dynamic from 'next/dynamic';
import { VerifyTcButton } from '@/app/(dashboard)/tc/verify-button';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { requireSessionContext } from '@/lib/auth/session';
import { loadReceiverOrgOptions } from '@/lib/tc/receivers';
import { createClient } from '@/lib/supabase/server';

const IssueTcForm = dynamic(
  () =>
    import('@/app/(dashboard)/tc/issue-form').then((m) => m.IssueTcForm),
  {
    loading: () => (
      <p className="text-[12px] text-stt-muted">Loading issue form…</p>
    ),
  }
);
export default async function TcPage() {
  const ctx = await requireSessionContext();
  const supabase = createClient();
  const orgId = ctx.organizationId;

  const [{ data: materials }, { data: tcs }, receivers, { data: relatedOrders }, { data: relatedShipments }] =
    await Promise.all([
      supabase
        .from('materials')
        .select('id, name, standard')
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('transaction_certificates')
        .select(
          'id, tc_number, tc_status, total_quantity, quantity_unit, issue_date, receiver_org_id, issuer_org_id'
        )
        .or(
          `organization_id.eq.${orgId},issuer_org_id.eq.${orgId},receiver_org_id.eq.${orgId}`
        )
        .order('created_at', { ascending: false })
        .limit(30),
      loadReceiverOrgOptions(ctx.organizationId, ctx.orgType),
      supabase
        .from('orders')
        .select('id, order_number')
        .or(
          `organization_id.eq.${orgId},buyer_org_id.eq.${orgId},supplier_org_id.eq.${orgId}`
        )
        .order('created_at', { ascending: false })
        .limit(40),
      supabase
        .from('shipments')
        .select('id, shipment_number, status')
        .or(
          `organization_id.eq.${orgId},shipper_org_id.eq.${orgId},consignee_org_id.eq.${orgId}`
        )
        .order('created_at', { ascending: false })
        .limit(40),
    ]);

  return (
    <PageWrapper
      title="Transaction Certificates"
      description="Mass-balance enforced · every transfer certified"
    >
      <div className="grid gap-3.5 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="border-b border-stt-line px-4 py-3">
            <h3 className="text-[12.5px] font-bold">Issued / received TCs</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase text-stt-faint">TC</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Status</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Qty</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Date</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(tcs ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-[12px] text-stt-muted">
                    No certificates yet.
                  </TableCell>
                </TableRow>
              ) : (
                (tcs ?? []).map((tc) => {
                  const canVerify =
                    tc.receiver_org_id === orgId && tc.tc_status === 'issued';
                  return (
                    <TableRow key={tc.id}>
                      <TableCell className="font-mono-stt text-[11px] text-stt-blue">
                        <Link
                          href={`/tc/${tc.id}`}
                          className="underline-offset-2 hover:underline"
                        >
                          {tc.tc_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge className="rounded-full bg-stt-green-soft text-stt-green-dark">
                          {tc.tc_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono-stt text-[11px]">
                        {Number(tc.total_quantity ?? 0).toLocaleString()}{' '}
                        {tc.quantity_unit}
                      </TableCell>
                      <TableCell className="font-mono-stt text-[11px]">
                        {tc.issue_date}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/tc/${tc.id}`}
                            className="text-[11px] font-semibold text-stt-blue hover:underline"
                          >
                            View
                          </Link>
                          {canVerify ? <VerifyTcButton tcId={tc.id} /> : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="border-b border-stt-line px-4 py-3">
            <h3 className="text-[12.5px] font-bold">＋ Issue TC</h3>
          </div>
          <div className="p-4">
            <IssueTcForm
              materials={materials ?? []}
              receivers={receivers}
              orders={relatedOrders ?? []}
              shipments={relatedShipments ?? []}
            />
            <p className="mt-3 rounded-[9px] border border-[#CCDCF9] bg-stt-blue-soft px-3 py-2 text-[11px] text-[#1E4FA8]">
              Pick a receiver from the directory (★ = linked partner). Optionally
              attach an order and shipment. Each TC gets a QR + print view on the
              certificate page.
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
