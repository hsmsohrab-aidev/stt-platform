import Link from 'next/link';
import { notFound } from 'next/navigation';
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
import { createClient } from '@/lib/supabase/server';

type PageProps = { params: { id: string } };

export default async function FacilityDetailPage({ params }: PageProps) {
  const ctx = await requireSessionContext();
  const supabase = createClient();

  const { data: facility } = await supabase
    .from('facilities')
    .select(
      'id, name, facility_type, tier_level, address_line1, city, country, latitude, longitude, is_verified, is_active, organization_id, created_at'
    )
    .eq('id', params.id)
    .maybeSingle();

  if (!facility) notFound();
  if (facility.organization_id !== ctx.organizationId) notFound();

  const [{ data: verifications }, { data: shipments }, { data: certs }] =
    await Promise.all([
      supabase
        .from('verification_requests')
        .select(
          'id, request_number, status, verification_type, scope, created_at, supplier_org_id'
        )
        .eq('supplier_org_id', ctx.organizationId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('shipments')
        .select(
          'id, shipment_number, status, origin_port, destination_port, created_at'
        )
        .or(
          `organization_id.eq.${ctx.organizationId},shipper_org_id.eq.${ctx.organizationId},consignee_org_id.eq.${ctx.organizationId}`
        )
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('facility_certifications')
        .select('id, cert_name, cert_number, issuing_body, expiry_date, is_verified')
        .eq('facility_id', facility.id)
        .order('created_at', { ascending: false })
        .limit(15),
    ]);

  return (
    <PageWrapper
      title={facility.name}
      description={`${facility.facility_type} · Tier ${facility.tier_level ?? '—'}`}
      actions={
        <Button asChild variant="outline" className="h-8 rounded-[9px] text-xs">
          <Link href="/facilities">Back to facilities</Link>
        </Button>
      }
    >
      <div className="mb-3.5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Status', facility.is_verified ? 'Verified' : 'Declared'],
          ['Active', facility.is_active ? 'Yes' : 'No'],
          ['City', facility.city ?? '—'],
          ['Country', facility.country ?? '—'],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-stt-line bg-white p-3.5 shadow-[var(--stt-shadow)]"
          >
            <div className="text-[11px] font-semibold text-stt-muted">{label}</div>
            <div className="mt-1 font-display text-[18px] font-bold text-stt-ink">
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3.5 lg:grid-cols-2">
        <div className="rounded-xl border border-stt-line bg-white p-4 shadow-[var(--stt-shadow)]">
          <h3 className="mb-3 text-[13.5px] font-bold">Location</h3>
          <dl className="space-y-2 text-[12.5px]">
            <div className="flex justify-between gap-3">
              <dt className="text-stt-muted">Address</dt>
              <dd className="text-right font-semibold text-stt-ink">
                {facility.address_line1 ?? '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-stt-muted">Coordinates</dt>
              <dd className="font-mono-stt text-right text-stt-ink">
                {facility.latitude != null && facility.longitude != null
                  ? `${Number(facility.latitude).toFixed(3)}, ${Number(facility.longitude).toFixed(3)}`
                  : '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-stt-muted">Declared</dt>
              <dd className="font-mono-stt text-right text-stt-ink">
                {new Date(facility.created_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>

          {facility.latitude != null && facility.longitude != null ? (
            <div className="relative mt-4 h-40 overflow-hidden rounded-[10px] border border-stt-line bg-[linear-gradient(160deg,#E8F1FB_0%,#F4F7FB_55%,#EEF8F2_100%)]">
              <div
                className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-stt-green shadow"
                style={{ left: '52%', top: '48%' }}
                title={facility.name}
              />
              <p className="absolute bottom-2 left-3 text-[11px] font-semibold text-stt-muted">
                Map pin · {facility.city ?? facility.country}
              </p>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="border-b border-stt-line px-4 py-3">
            <h3 className="text-[13.5px] font-bold">Certifications</h3>
          </div>
          {(certs ?? []).length === 0 ? (
            <p className="px-4 py-6 text-[12px] text-stt-muted">
              No facility certifications on file.
            </p>
          ) : (
            <ul className="divide-y divide-stt-line">
              {(certs ?? []).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <div className="text-[12.5px] font-semibold">{c.cert_name}</div>
                    <div className="text-[11px] text-stt-muted">
                      {c.issuing_body ?? c.cert_number ?? '—'}
                      {c.expiry_date ? ` · exp ${c.expiry_date}` : ''}
                    </div>
                  </div>
                  <Badge className="rounded-full bg-stt-green-soft text-stt-green-dark">
                    {c.is_verified ? 'Verified' : 'On file'}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)] lg:col-span-2">
          <div className="flex items-center border-b border-stt-line px-4 py-3">
            <h3 className="text-[13.5px] font-bold">Related ops (org)</h3>
          </div>
          <div className="grid gap-0 lg:grid-cols-2">
            <div className="border-b border-stt-line lg:border-b-0 lg:border-r">
              <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-stt-faint">
                Recent verifications
              </div>
              <Table>
                <TableBody>
                  {(verifications ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell className="text-[12px] text-stt-muted">
                        No verification requests.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (verifications ?? []).map((v) => (
                      <TableRow key={v.id} className="hover:bg-[#F7FAFC]">
                        <TableCell>
                          <Link
                            href="/verification"
                            className="font-mono-stt text-[11px] text-stt-blue hover:underline"
                          >
                            {v.request_number}
                          </Link>
                          <div className="text-[10px] text-stt-muted">
                            {v.verification_type}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="rounded-full bg-stt-purple-soft text-stt-purple">
                            {v.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div>
              <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-stt-faint">
                Recent shipments
              </div>
              <Table>
                <TableBody>
                  {(shipments ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell className="text-[12px] text-stt-muted">
                        No shipments.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (shipments ?? []).map((s) => (
                      <TableRow key={s.id} className="hover:bg-[#F7FAFC]">
                        <TableCell>
                          <Link
                            href={`/shipments/${s.id}`}
                            className="font-mono-stt text-[11px] text-stt-blue hover:underline"
                          >
                            {s.shipment_number}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge className="rounded-full bg-stt-blue-soft text-stt-blue">
                            {s.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
