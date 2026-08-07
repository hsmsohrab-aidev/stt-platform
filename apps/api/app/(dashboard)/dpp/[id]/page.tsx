import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { PublishPassportButton } from '@/app/(dashboard)/dpp/publish-button';
import { LinkMaterialForm } from '@/app/(dashboard)/dpp/link-material-form';
import { UnlinkMaterialButton } from '@/app/(dashboard)/dpp/unlink-button';
import { CreateQrVariantForm } from '@/app/(dashboard)/dpp/qr-variant-form';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { requireSessionContext } from '@/lib/auth/session';
import { generateTcQrDataUrl } from '@/lib/tc/qr';
import { createClient } from '@/lib/supabase/server';

type PageProps = { params: { id: string } };

export default async function DppDetailPage({ params }: PageProps) {
  const ctx = await requireSessionContext();
  const supabase = createClient();

  const { data: passport } = await supabase
    .from('product_passports')
    .select(
      'id, product_name, product_sku, product_category, status, published_at, country_of_origin, material_composition, carbon_footprint_kg, water_usage_liters, care_instructions, recyclability_info, end_of_life_instructions, repairability_score, chemical_compliance, public_url'
    )
    .eq('id', params.id)
    .eq('organization_id', ctx.organizationId)
    .maybeSingle();

  if (!passport) notFound();

  const [
    { data: chain },
    { data: metrics },
    { data: linkedMaterials },
    { data: materials },
    { data: tcRows },
    { data: qrCodes },
  ] = await Promise.all([
    supabase
      .from('passport_supply_chain')
      .select('id, display_name, process_type, country, tier_level, sequence_order')
      .eq('passport_id', passport.id)
      .order('sequence_order', { ascending: true }),
    supabase
      .from('passport_sustainability')
      .select('metric_name, metric_value, metric_unit, is_verified')
      .eq('passport_id', passport.id),
    supabase
      .from('passport_materials')
      .select(
        'id, percentage, certification, origin_country, is_verified, tc_id, materials(name, standard), transaction_certificates(id, tc_number, tc_status)'
      )
      .eq('passport_id', passport.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('materials')
      .select('id, name, standard')
      .eq('is_active', true)
      .order('name')
      .limit(80),
    supabase
      .from('transaction_certificates')
      .select(
        'id, tc_number, tc_status, issuer_org_id, receiver_org_id, tc_line_items(material_id)'
      )
      .or(
        `issuer_org_id.eq.${ctx.organizationId},receiver_org_id.eq.${ctx.organizationId}`
      )
      .order('created_at', { ascending: false })
      .limit(40),
    supabase
      .from('passport_qr_codes')
      .select('id, qr_type, qr_data, is_active, created_at')
      .eq('passport_id', passport.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
  ]);

  const headerList = headers();
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host');
  const proto = headerList.get('x-forwarded-proto') ?? 'http';
  const publicPath = `/p/${passport.id}`;
  const absolute = host ? `${proto}://${host}${publicPath}` : publicPath;
  const qr =
    passport.status === 'published'
      ? await generateTcQrDataUrl(absolute)
      : null;

  const variantQrs = await Promise.all(
    (qrCodes ?? [])
      .filter((q) => q.qr_type === 'batch' || q.qr_type === 'unit')
      .slice(0, 8)
      .map(async (q) => {
        const href = q.qr_data.startsWith('http')
          ? q.qr_data
          : host
            ? `${proto}://${host}${q.qr_data.startsWith('/') ? '' : '/'}${q.qr_data}`
            : q.qr_data;
        const dataUrl = await generateTcQrDataUrl(href);
        return { ...q, href, dataUrl };
      })
  );

  const composition = Array.isArray(passport.material_composition)
    ? (passport.material_composition as { material?: string; pct?: number }[])
    : [];

  const care =
    passport.care_instructions &&
    typeof passport.care_instructions === 'object' &&
    'text' in (passport.care_instructions as object)
      ? String((passport.care_instructions as { text: string }).text)
      : null;

  const tcOptions = (tcRows ?? []).map((t) => {
    const lines = t.tc_line_items as
      | { material_id: string }[]
      | { material_id: string }
      | null;
    const materialIds = Array.isArray(lines)
      ? lines.map((l) => l.material_id)
      : lines
        ? [lines.material_id]
        : [];
    return {
      id: t.id,
      tc_number: t.tc_number,
      tc_status: t.tc_status,
      material_ids: materialIds,
    };
  });

  return (
    <PageWrapper
      title={passport.product_name}
      description="Digital Product Passport · materials linked to TCs"
      actions={
        <div className="flex items-center gap-2">
          {passport.status === 'draft' ? (
            <PublishPassportButton passportId={passport.id} />
          ) : (
            <Button asChild className="h-8 rounded-[9px] bg-stt-green text-xs hover:bg-stt-green-dark">
              <Link href={publicPath} target="_blank">
                Public view
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" className="h-8 rounded-[9px] text-xs">
            <Link href="/dpp">Back</Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-3.5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-3.5">
          <div className="rounded-xl border border-stt-line bg-white p-4 shadow-[var(--stt-shadow)]">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={
                  passport.status === 'published'
                    ? 'rounded-full bg-stt-green-soft text-stt-green-dark'
                    : 'rounded-full bg-[#EDF1F6] text-stt-muted'
                }
              >
                {passport.status}
              </Badge>
              <span className="font-mono-stt text-[11px] text-stt-blue">
                {passport.product_sku ?? passport.id.slice(0, 8)}
              </span>
              {passport.country_of_origin ? (
                <span className="text-[11px] text-stt-muted">
                  Origin {passport.country_of_origin}
                </span>
              ) : null}
            </div>
            <h2 className="mt-2 font-display text-[20px] font-bold">
              {passport.product_name}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {composition.map((c, i) => (
                <Badge
                  key={i}
                  className="rounded-full bg-stt-green-soft text-stt-green-dark"
                >
                  {c.pct != null ? `${c.pct}% ` : ''}
                  {c.material}
                </Badge>
              ))}
            </div>
            {care ? (
              <p className="mt-3 text-[11.5px] text-stt-muted">{care}</p>
            ) : null}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-stt-line bg-[#F8FAFC] px-3 py-2">
                <div className="text-[10px] font-semibold uppercase text-stt-faint">
                  Repairability
                </div>
                <div className="font-mono-stt text-[13px] font-semibold">
                  {passport.repairability_score != null
                    ? `${passport.repairability_score}/100`
                    : '—'}
                </div>
              </div>
              <div className="rounded-lg border border-stt-line bg-[#F8FAFC] px-3 py-2">
                <div className="text-[10px] font-semibold uppercase text-stt-faint">
                  Chemicals
                </div>
                <div className="text-[12px]">
                  {passport.chemical_compliance &&
                  typeof passport.chemical_compliance === 'object' &&
                  'summary' in (passport.chemical_compliance as object)
                    ? String(
                        (passport.chemical_compliance as { summary?: string }).summary ??
                          '—'
                      )
                    : '—'}
                </div>
              </div>
            </div>
            {passport.recyclability_info ? (
              <p className="mt-2 text-[11.5px] text-stt-muted">
                <b>Recyclability:</b> {passport.recyclability_info}
              </p>
            ) : null}
            {passport.end_of_life_instructions ? (
              <p className="mt-1 text-[11.5px] text-stt-muted">
                <b>End of life:</b> {passport.end_of_life_instructions}
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
            <div className="flex items-center border-b border-stt-line px-4 py-3">
              <h3 className="text-[12.5px] font-bold">Linked materials · TC</h3>
              <Badge className="ml-auto rounded-full bg-stt-blue-soft text-stt-blue">
                {linkedMaterials?.length ?? 0}
              </Badge>
            </div>
            <ul className="divide-y divide-stt-line">
              {(linkedMaterials ?? []).length === 0 ? (
                <li className="px-4 py-6 text-center text-[12px] text-stt-muted">
                  No material–TC links yet. Add one on the right.                </li>
              ) : (
                (linkedMaterials ?? []).map((row) => {
                  const mat = row.materials as
                    | { name: string; standard: string | null }
                    | { name: string; standard: string | null }[]
                    | null;
                  const m = Array.isArray(mat) ? mat[0] : mat;
                  const tc = row.transaction_certificates as
                    | { id: string; tc_number: string; tc_status: string }
                    | { id: string; tc_number: string; tc_status: string }[]
                    | null;
                  const t = Array.isArray(tc) ? tc[0] : tc;
                  return (
                    <li
                      key={row.id}
                      className="flex flex-wrap items-start justify-between gap-2 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="text-[12px] font-semibold text-stt-ink">
                          {m?.name ?? 'Material'}
                          {row.percentage != null
                            ? ` · ${Number(row.percentage)}%`
                            : ''}
                        </div>
                        <div className="mt-0.5 text-[11px] text-stt-muted">
                          {[
                            row.certification,
                            row.origin_country,
                            m?.standard,
                          ]
                            .filter(Boolean)
                            .join(' · ') || '—'}
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          {row.is_verified ? (
                            <Badge className="rounded-full bg-stt-green-soft text-stt-green-dark">
                              Verified via TC
                            </Badge>
                          ) : (
                            <Badge className="rounded-full bg-[#EDF1F6] text-stt-muted">
                              Unverified
                            </Badge>
                          )}
                          {t ? (
                            <Link
                              href={`/tc/${t.id}`}
                              className="font-mono-stt text-[11px] font-semibold text-stt-blue hover:underline"
                            >
                              {t.tc_number}
                            </Link>
                          ) : (
                            <span className="text-[11px] text-stt-faint">
                              No TC
                            </span>
                          )}
                        </div>
                      </div>
                      <UnlinkMaterialButton
                        linkId={row.id}
                        passportId={passport.id}
                      />
                    </li>
                  );
                })
              )}
            </ul>
          </div>

          <div className="rounded-xl border border-stt-line bg-white p-4 shadow-[var(--stt-shadow)]">
            <h3 className="text-[12.5px] font-bold">Public journey</h3>
            <ul className="mt-3 space-y-2">
              {(chain ?? []).length === 0 ? (
                <li className="text-[12px] text-stt-muted">No chain steps yet.</li>
              ) : (
                (chain ?? []).map((s) => (
                  <li
                    key={s.id}
                    className="rounded-[9px] border border-stt-line bg-[#F8FAFC] px-3 py-2 text-[12px]"
                  >
                    <b>{s.display_name}</b>
                    <div className="text-[10.5px] text-stt-muted">
                      {[s.process_type, s.country, s.tier_level]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-3.5">
          <div className="rounded-xl border border-stt-line bg-white p-4 shadow-[var(--stt-shadow)]">
            <h3 className="text-[12.5px] font-bold">Link material to TC</h3>
            <p className="mt-1 text-[11px] text-stt-muted">
              Ties passport composition to a certificate for public proof.
            </p>
            <div className="mt-3">
              {(materials ?? []).length === 0 ? (
                <p className="text-[12px] text-stt-muted">
                  No materials in catalog — add via Materials / Wallet first.
                </p>
              ) : (
                <LinkMaterialForm
                  passportId={passport.id}
                  materials={(materials ?? []).map((m) => ({
                    id: m.id,
                    name: m.name,
                    standard: m.standard,
                  }))}
                  tcs={tcOptions}
                />
              )}
            </div>
          </div>

          <div className="rounded-xl border border-stt-line bg-white p-4 shadow-[var(--stt-shadow)]">
            <h3 className="text-[12.5px] font-bold">Metrics</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-[9px] border border-stt-line p-3 text-center">
                <div className="text-[10px] text-stt-muted">CO₂e</div>
                <div className="font-display text-[18px] font-bold">
                  {passport.carbon_footprint_kg ?? '—'}
                </div>
              </div>
              <div className="rounded-[9px] border border-stt-line p-3 text-center">
                <div className="text-[10px] text-stt-muted">Water L</div>
                <div className="font-display text-[18px] font-bold">
                  {passport.water_usage_liters ?? '—'}
                </div>
              </div>
            </div>
            {(metrics ?? []).length > 0 ? (
              <ul className="mt-3 space-y-1 text-[11px] text-stt-muted">
                {(metrics ?? []).map((m, i) => (
                  <li key={i}>
                    {m.metric_name}: {Number(m.metric_value)} {m.metric_unit}
                    {m.is_verified ? ' · verified' : ''}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {qr ? (
            <div className="rounded-xl border border-stt-line bg-white p-4 text-center shadow-[var(--stt-shadow)]">
              <h3 className="text-[12.5px] font-bold">Consumer QR · product</h3>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qr}
                alt="DPP QR"
                width={160}
                height={160}
                className="mx-auto mt-3 rounded-lg border border-stt-line"
              />
              <p className="font-mono-stt mt-2 break-all text-[10px] text-stt-blue">
                {absolute}
              </p>
            </div>
          ) : (
            <div className="rounded-[9px] border border-[#CCDCF9] bg-stt-blue-soft px-3 py-2 text-[11px] text-[#1E4FA8]">
              Publish to generate the public URL and QR consumers can scan without
              login.
            </div>
          )}

          {passport.status === 'published' ? (
            <div className="rounded-xl border border-stt-line bg-white p-4 shadow-[var(--stt-shadow)]">
              <h3 className="text-[12.5px] font-bold">Batch / unit QR</h3>
              <p className="mt-1 text-[11px] text-stt-muted">
                Extra labels for carton batches or single-unit hangtags.
              </p>
              <div className="mt-3">
                <CreateQrVariantForm passportId={passport.id} />
              </div>
              {variantQrs.length > 0 ? (
                <ul className="mt-4 space-y-3 border-t border-stt-line pt-3">
                  {variantQrs.map((q) => (
                    <li
                      key={q.id}
                      className="flex items-start gap-3 rounded-[9px] border border-stt-line bg-[#F8FAFC] p-2.5"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={q.dataUrl}
                        alt={`${q.qr_type} QR`}
                        width={72}
                        height={72}
                        className="rounded border border-stt-line bg-white"
                      />
                      <div className="min-w-0">
                        <Badge className="rounded-full bg-stt-navy/10 capitalize text-stt-navy">
                          {q.qr_type}
                        </Badge>
                        <p className="font-mono-stt mt-1 break-all text-[10px] text-stt-blue">
                          {q.qr_data}
                        </p>
                        <Link
                          href={q.qr_data}
                          target="_blank"
                          className="mt-1 inline-block text-[11px] font-semibold text-stt-blue hover:underline"
                        >
                          Open public view
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </PageWrapper>
  );
}
