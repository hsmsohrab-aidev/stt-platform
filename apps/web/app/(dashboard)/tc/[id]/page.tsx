import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { VerifyTcButton } from '@/app/(dashboard)/tc/verify-button';
import { PrintTcButton } from '@/app/(dashboard)/tc/print-button';
import { VerifyIntegrityButton } from '@/app/(dashboard)/tc/integrity-button';
import { LinkShipmentForm } from '@/app/(dashboard)/tc/link-shipment-form';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { requireSessionContext } from '@/lib/auth/session';
import { generateTcQrDataUrl } from '@/lib/tc/qr';
import { createClient } from '@/lib/supabase/server';

type PageProps = {
  params: { id: string };
};

export default async function TcDetailPage({ params }: PageProps) {
  const ctx = await requireSessionContext();
  const supabase = createClient();

  const { data: tc } = await supabase
    .from('transaction_certificates')
    .select(
      `
      id,
      tc_number,
      tc_status,
      total_quantity,
      quantity_unit,
      issue_date,
      expiry_date,
      notes,
      issuer_org_id,
      receiver_org_id,
      verified_at,
      shipment_id,
      order_id,
      blockchain_hash,
      blockchain_tx_id,
      blockchain_anchored_at,
      is_blockchain_anchored
    `
    )
    .eq('id', params.id)
    .maybeSingle();

  if (!tc) notFound();

  const canView =
    tc.issuer_org_id === ctx.organizationId ||
    tc.receiver_org_id === ctx.organizationId;

  if (!canView) notFound();

  const isIssuer = tc.issuer_org_id === ctx.organizationId;

  const [
    { data: partyOrgs },
    { data: lines },
    { data: chainRecord },
    { data: dppLinks },
    shipmentResult,
    availableShipmentsResult,
  ] = await Promise.all([
    supabase
      .from('organizations')
      .select('id, name')
      .in('id', [tc.issuer_org_id, tc.receiver_org_id]),
    supabase
      .from('tc_line_items')
      .select(
        'id, quantity, unit, certification, materials(name, standard, material_type)'
      )
      .eq('tc_id', tc.id),
    supabase
      .from('tc_blockchain_records')
      .select('tx_id, document_hash, network, block_number, anchored_at')
      .eq('tc_id', tc.id)
      .order('anchored_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('passport_materials')
      .select(
        'id, percentage, product_passports(id, product_name, status, organization_id)'
      )
      .eq('tc_id', tc.id)
      .limit(20),
    tc.shipment_id
      ? supabase
          .from('shipments')
          .select('id, shipment_number, status')
          .eq('id', tc.shipment_id)
          .maybeSingle()
      : Promise.resolve({ data: null as { id: string; shipment_number: string; status: string } | null }),
    isIssuer
      ? supabase
          .from('shipments')
          .select('id, shipment_number, status')
          .or(
            `organization_id.eq.${ctx.organizationId},shipper_org_id.eq.${ctx.organizationId},consignee_org_id.eq.${ctx.organizationId}`
          )
          .order('created_at', { ascending: false })
          .limit(40)
      : Promise.resolve({ data: [] as { id: string; shipment_number: string; status: string }[] }),
  ]);

  const linkedShipment = shipmentResult.data;
  const orgById = new Map((partyOrgs ?? []).map((o) => [o.id, o.name]));
  const issuerName = orgById.get(tc.issuer_org_id) ?? '—';
  const receiverName = orgById.get(tc.receiver_org_id) ?? '—';

  const headerList = headers();
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host');
  const proto = headerList.get('x-forwarded-proto') ?? 'http';
  const verifyUrl = host
    ? `${proto}://${host}/tc/${tc.id}`
    : `/tc/${tc.id}`;

  const qrDataUrl = await generateTcQrDataUrl(verifyUrl);
  const canVerify =
    tc.receiver_org_id === ctx.organizationId && tc.tc_status === 'issued';

  const anchored = Boolean(tc.is_blockchain_anchored && tc.blockchain_hash);
  const hashDisplay = tc.blockchain_hash ?? chainRecord?.document_hash;
  const txDisplay = tc.blockchain_tx_id ?? chainRecord?.tx_id;

  return (
    <PageWrapper
      title={tc.tc_number}
      description="Transaction certificate · QR + hash anchored"
      actions={
        <div className="flex items-center gap-2 print:hidden">
          <PrintTcButton />
          {canVerify ? <VerifyTcButton tcId={tc.id} /> : null}
          <Button asChild variant="outline" className="h-8 rounded-[9px] text-xs">
            <Link href="/tc">Back</Link>
          </Button>
        </div>
      }
    >
      <article className="mx-auto max-w-3xl rounded-xl border border-stt-line bg-white p-6 shadow-[var(--stt-shadow)] print:max-w-none print:border-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-stt-line pb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-stt-faint">
              Smart Traceability Technology
            </p>
            <h2 className="mt-1 font-display text-[22px] font-extrabold text-stt-navy">
              Transaction Certificate
            </h2>
            <p className="font-mono-stt mt-1 text-[13px] font-semibold text-stt-blue">
              {tc.tc_number}
            </p>
          </div>
          <div className="text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt={`QR for ${tc.tc_number}`}
              width={120}
              height={120}
              className="mx-auto rounded-lg border border-stt-line"
            />
            <p className="mt-1 max-w-[120px] break-all font-mono-stt text-[8px] text-stt-faint">
              Scan to open
            </p>
          </div>
        </header>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[9px] border border-stt-line bg-[#F8FAFC] px-3 py-2.5">
            <div className="text-[10px] font-semibold uppercase text-stt-faint">
              Issuer
            </div>
            <div className="mt-0.5 text-[13px] font-semibold text-stt-ink">
              {issuerName}
            </div>
          </div>
          <div className="rounded-[9px] border border-stt-line bg-[#F8FAFC] px-3 py-2.5">
            <div className="text-[10px] font-semibold uppercase text-stt-faint">
              Receiver
            </div>
            <div className="mt-0.5 text-[13px] font-semibold text-stt-ink">
              {receiverName}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-[12px]">
          <Badge className="rounded-full bg-stt-green-soft text-stt-green-dark">
            {tc.tc_status}
          </Badge>
          {anchored ? (
            <Badge className="rounded-full bg-[#E8F0FE] text-[#1E4FA8]">
              Anchored
            </Badge>
          ) : (
            <Badge className="rounded-full bg-[#EDF1F6] text-stt-muted">
              Not anchored
            </Badge>
          )}
          {linkedShipment ? (
            <Link
              href={`/shipments/${linkedShipment.id}`}
              className="inline-flex items-center rounded-full bg-stt-blue-soft px-2.5 py-0.5 font-mono-stt text-[11px] font-semibold text-stt-blue hover:underline"
            >
              {linkedShipment.shipment_number} · {linkedShipment.status}
            </Link>
          ) : null}
          <span className="text-stt-muted">
            Issued <b className="font-mono-stt text-stt-ink">{tc.issue_date}</b>
          </span>
          {tc.expiry_date ? (
            <span className="text-stt-muted">
              Expires{' '}
              <b className="font-mono-stt text-stt-ink">{tc.expiry_date}</b>
            </span>
          ) : null}
          {tc.verified_at ? (
            <span className="text-stt-muted">
              Verified{' '}
              <b className="font-mono-stt text-stt-ink">
                {new Date(tc.verified_at).toLocaleString()}
              </b>
            </span>
          ) : null}
        </div>

        <div className="mt-5 overflow-hidden rounded-[9px] border border-stt-line">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-[#F8FAFC]">
              <tr>
                <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-stt-faint">
                  Material
                </th>
                <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-stt-faint">
                  Qty
                </th>
                <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-stt-faint">
                  Cert
                </th>
              </tr>
            </thead>
            <tbody>
              {(lines ?? []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-3 text-stt-muted">
                    No line items
                  </td>
                </tr>
              ) : (
                (lines ?? []).map((line) => {
                  const mat = line.materials as
                    | { name: string; standard: string | null }
                    | { name: string; standard: string | null }[]
                    | null;
                  const m = Array.isArray(mat) ? mat[0] : mat;
                  return (
                    <tr key={line.id} className="border-t border-stt-line">
                      <td className="px-3 py-2.5">
                        <div className="font-semibold">{m?.name ?? '—'}</div>
                        {m?.standard ? (
                          <div className="text-[10px] text-stt-muted">
                            {m.standard}
                          </div>
                        ) : null}
                      </td>
                      <td className="font-mono-stt px-3 py-2.5">
                        {Number(line.quantity).toLocaleString()} {line.unit}
                      </td>
                      <td className="px-3 py-2.5">{line.certification ?? '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-[9px] border border-stt-line bg-[#F8FAFC] px-3 py-3 print:break-inside-avoid">
          <div className="text-[10px] font-semibold uppercase text-stt-faint">
            Linked shipment
          </div>
          {linkedShipment ? (
            <p className="mt-1.5 text-[12px]">
              <Link
                href={`/shipments/${linkedShipment.id}`}
                className="font-mono-stt font-semibold text-stt-blue hover:underline"
              >
                {linkedShipment.shipment_number}
              </Link>
              <span className="text-stt-muted"> · {linkedShipment.status}</span>
            </p>
          ) : (
            <p className="mt-1.5 text-[11px] text-stt-muted">
              No shipment linked.
              {!isIssuer ? ' Issuer can attach one from this page.' : ''}
            </p>
          )}
          {isIssuer && (availableShipmentsResult.data?.length ?? 0) > 0 ? (
            <div className="mt-2 print:hidden">
              <LinkShipmentForm
                tcId={tc.id}
                shipments={availableShipmentsResult.data ?? []}
                currentShipmentId={tc.shipment_id}
              />
            </div>
          ) : null}
        </div>

        <div className="mt-4 rounded-[9px] border border-stt-line bg-[#F8FAFC] px-3 py-3 print:break-inside-avoid">
          <div className="text-[10px] font-semibold uppercase text-stt-faint">
            Linked product passports
          </div>
          {(dppLinks ?? []).length === 0 ? (
            <p className="mt-1.5 text-[11px] text-stt-muted">
              No DPP material links yet. Link from{' '}
              <Link href="/dpp" className="font-semibold text-stt-blue hover:underline">
                Digital Product Passport
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {(dppLinks ?? []).map((row) => {
                const pp = row.product_passports as
                  | {
                      id: string;
                      product_name: string;
                      status: string;
                      organization_id: string;
                    }
                  | {
                      id: string;
                      product_name: string;
                      status: string;
                      organization_id: string;
                    }[]
                  | null;
                const p = Array.isArray(pp) ? pp[0] : pp;
                if (!p) return null;
                const canOpen = p.organization_id === ctx.organizationId;
                return (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-2 text-[12px]"
                  >
                    <span className="font-semibold text-stt-ink">
                      {p.product_name}
                      {row.percentage != null
                        ? ` · ${Number(row.percentage)}%`
                        : ''}
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge className="rounded-full bg-[#EDF1F6] text-stt-muted">
                        {p.status}
                      </Badge>
                      {canOpen ? (
                        <Link
                          href={`/dpp/${p.id}`}
                          className="text-[11px] font-semibold text-stt-blue hover:underline"
                        >
                          Open
                        </Link>
                      ) : p.status === 'published' ? (
                        <Link
                          href={`/p/${p.id}`}
                          className="text-[11px] font-semibold text-stt-blue hover:underline"
                        >
                          Public
                        </Link>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-4 rounded-[9px] border border-stt-line bg-[#F8FAFC] px-3 py-3 print:break-inside-avoid">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              <div className="text-[10px] font-semibold uppercase text-stt-faint">
                Hash anchor · {chainRecord?.network ?? 'stt_mock'}
              </div>
              {hashDisplay ? (
                <>
                  <p className="font-mono-stt break-all text-[11px] text-stt-ink">
                    sha256:{hashDisplay}
                  </p>
                  {txDisplay ? (
                    <p className="font-mono-stt text-[10px] text-stt-muted">
                      tx {txDisplay}
                      {chainRecord?.block_number != null
                        ? ` · block ${chainRecord.block_number}`
                        : ''}
                    </p>
                  ) : null}
                  {tc.blockchain_anchored_at || chainRecord?.anchored_at ? (
                    <p className="text-[10px] text-stt-faint">
                      Anchored{' '}
                      {new Date(
                        tc.blockchain_anchored_at ??
                          chainRecord!.anchored_at!
                      ).toLocaleString()}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-[11px] text-stt-muted">
                  No anchor yet (legacy TC or anchor write failed).
                </p>
              )}
            </div>
            <div className="print:hidden">
              <VerifyIntegrityButton tcId={tc.id} />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-dashed border-stt-line pt-4">
          <div>
            <div className="text-[10px] font-semibold uppercase text-stt-faint">
              Total quantity
            </div>
            <div className="font-display text-[22px] font-bold text-stt-ink">
              {Number(tc.total_quantity ?? 0).toLocaleString()}{' '}
              <span className="text-[12px] text-stt-muted">{tc.quantity_unit}</span>
            </div>
            {tc.notes ? (
              <p className="mt-2 max-w-md text-[11px] text-stt-muted">{tc.notes}</p>
            ) : null}
          </div>
          <p className="max-w-[220px] text-right text-[10px] leading-relaxed text-stt-faint">
            Mass-balance enforced. Document SHA-256 anchored on STT mock ledger
            (Hyperledger Fabric swap later). Verify integrity on-platform.
          </p>
        </div>
      </article>
    </PageWrapper>
  );
}
