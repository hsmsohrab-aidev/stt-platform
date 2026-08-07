import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { generateTcQrDataUrl } from '@/lib/tc/qr';

type PageProps = {
  params: { id: string };
  searchParams?: { type?: string; code?: string };
};

type PublicPassport = {
  id: string;
  product_name: string;
  product_sku: string | null;
  product_category: string | null;
  batch_number: string | null;
  material_composition: { material?: string; pct?: number | null }[] | null;
  country_of_origin: string | null;
  carbon_footprint_kg: number | null;
  water_usage_liters: number | null;
  care_instructions: { text?: string } | null;
  recyclability_info: string | null;
  end_of_life_instructions: string | null;
  repairability_score: number | null;
  chemical_compliance: { summary?: string; standards?: string[] } | null;
  published_at: string | null;
  supply_chain: {
    tier_level: string | null;
    process_type: string | null;
    country: string | null;
    display_name: string | null;
  }[];
  sustainability: {
    metric: string;
    value: number | null;
    unit: string | null;
    verified: boolean;
  }[];
  materials?: {
    material_name: string;
    percentage: number | null;
    certification: string | null;
    origin_country: string | null;
    is_verified: boolean;
    tc_number: string | null;
    tc_status: string | null;
  }[];
};

export default async function PublicPassportPage({
  params,
  searchParams,
}: PageProps) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_public_passport', {
    p_passport_id: params.id,
  });

  if (error || !data) notFound();

  const passport = data as PublicPassport;
  const variantType =
    searchParams?.type === 'batch' || searchParams?.type === 'unit'
      ? searchParams.type
      : null;
  const variantCode = searchParams?.code?.trim() || null;

  // Fire-and-forget scan analytics (ignore failures)
  const ua = headers().get('user-agent');
  void supabase.from('passport_scans').insert({
    passport_id: params.id,
    user_agent: ua,
    device_type: ua?.toLowerCase().includes('mobile') ? 'mobile' : 'desktop',
  });

  const host = headers().get('x-forwarded-host') ?? headers().get('host');
  const proto = headers().get('x-forwarded-proto') ?? 'http';
  const absolute = host ? `${proto}://${host}/p/${params.id}` : `/p/${params.id}`;
  const qr = await generateTcQrDataUrl(absolute);

  const composition = Array.isArray(passport.material_composition)
    ? passport.material_composition
    : [];
  const chain = Array.isArray(passport.supply_chain) ? passport.supply_chain : [];
  const linkedMats = Array.isArray(passport.materials) ? passport.materials : [];
  const care = passport.care_instructions?.text ?? null;
  const chemicals =
    passport.chemical_compliance?.summary ??
    passport.chemical_compliance?.standards?.join(' · ') ??
    null;
  const recycleHint = passport.recyclability_info
    ? passport.recyclability_info.length > 28
      ? `${passport.recyclability_info.slice(0, 28)}…`
      : passport.recyclability_info
    : '—';

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#0F3B2E_0%,#081C33_340px,#F2F5F9_340px)] px-3.5 py-7 pb-16">
      <div className="mx-auto w-full max-w-[480px]">
        <div className="mb-4 text-center text-white">
          <div className="text-[10px] tracking-[2px] text-[#7FD9AC]">
            DIGITAL PRODUCT PASSPORT · EU ESPR READY
          </div>
          <div className="mt-1.5 font-display text-[17px] font-extrabold tracking-wide">
            S<span className="text-stt-green">TT</span>
          </div>
        </div>

        <article className="overflow-hidden rounded-[18px] border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="flex items-center gap-4 border-b border-stt-line bg-[linear-gradient(135deg,#E9F6EF,#F4FBF7)] p-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qr}
              alt="Passport QR"
              width={88}
              height={88}
              className="rounded-lg border border-stt-line bg-white"
            />
            <div className="min-w-0">
              <div className="text-[10px] tracking-wide text-stt-muted">PASSPORT ID</div>
              <div className="font-mono-stt text-[12px] font-semibold text-stt-ink">
                {passport.product_sku ?? passport.id.slice(0, 8).toUpperCase()}
              </div>
              <h1 className="mt-1.5 font-display text-[17px] font-bold leading-snug text-stt-ink">
                {passport.product_name}
              </h1>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <div className="inline-flex rounded-full bg-stt-green-soft px-2 py-0.5 text-[10px] font-semibold text-stt-green-dark">
                  ✓ Published on STT
                </div>
                {variantType ? (
                  <div className="inline-flex rounded-full bg-[#E8F0FE] px-2 py-0.5 font-mono-stt text-[10px] font-semibold uppercase text-[#1E4FA8]">
                    {variantType}
                    {variantCode ? ` · ${variantCode}` : ''}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-3.5 p-4">
            <section>
              <h2 className="mb-2 text-[12px] font-bold">🧵 Materials & Composition</h2>
              <div className="flex flex-wrap gap-1.5">
                {composition.length === 0 && linkedMats.length === 0 ? (
                  <span className="text-[11.5px] text-stt-muted">Not disclosed</span>
                ) : composition.length > 0 ? (
                  composition.map((c, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-stt-green-soft px-2 py-0.5 text-[10.5px] font-semibold text-stt-green-dark"
                    >
                      {c.pct != null ? `${c.pct}% ` : ''}
                      {c.material}
                    </span>
                  ))
                ) : (
                  linkedMats.map((m, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-stt-green-soft px-2 py-0.5 text-[10.5px] font-semibold text-stt-green-dark"
                    >
                      {m.percentage != null ? `${m.percentage}% ` : ''}
                      {m.material_name}
                    </span>
                  ))
                )}
              </div>
              {linkedMats.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {linkedMats.map((m, i) => (
                    <li
                      key={i}
                      className="rounded-[9px] border border-stt-line bg-[#F8FAFC] px-3 py-2"
                    >
                      <div className="text-[12px] font-semibold text-stt-ink">
                        {m.material_name}
                        {m.percentage != null ? ` · ${m.percentage}%` : ''}
                      </div>
                      <div className="mt-0.5 text-[10.5px] text-stt-muted">
                        {[m.certification, m.origin_country]
                          .filter(Boolean)
                          .join(' · ') || 'Certified fiber'}
                      </div>
                      {m.tc_number ? (
                        <div className="mt-1 font-mono-stt text-[10px] text-stt-blue">
                          TC {m.tc_number}
                          {m.is_verified || m.tc_status === 'verified'
                            ? ' · verified'
                            : ''}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            <section>
              <h2 className="mb-2 text-[12px] font-bold">🌍 Origin & Journey</h2>
              {passport.country_of_origin ? (
                <p className="mb-2 text-[11.5px] text-stt-muted">
                  Country of origin: <b>{passport.country_of_origin}</b>
                </p>
              ) : null}
              <div className="relative space-y-3 border-l border-stt-line pl-4">
                {chain.length === 0 ? (
                  <p className="text-[11.5px] text-stt-muted">Journey steps coming soon.</p>
                ) : (
                  chain.map((s, i) => (
                    <div key={i} className="relative">
                      <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-stt-green" />
                      <div className="text-[12px] font-semibold text-stt-ink">
                        {s.display_name ?? s.process_type ?? 'Step'}
                      </div>
                      <div className="text-[10.5px] text-stt-muted">
                        {[s.process_type, s.country, s.tier_level]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="grid grid-cols-3 gap-2">
              {[
                {
                  label: 'water footprint',
                  value: passport.water_usage_liters,
                  unit: 'L',
                },
                {
                  label: 'CO₂e per unit',
                  value: passport.carbon_footprint_kg,
                  unit: 'kg',
                },
                {
                  label: 'repairability',
                  value: passport.repairability_score,
                  unit: '/100',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[11px] border border-stt-line p-2.5 text-center"
                >
                  <div className="mt-0.5 font-display text-[15px] font-bold">
                    {item.value ?? '—'}
                    {item.value != null && item.unit ? (
                      <span className="text-[10px] font-medium text-stt-muted">
                        {' '}
                        {item.unit}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[9.5px] text-stt-muted">{item.label}</div>
                </div>
              ))}
            </section>

            <section className="rounded-[11px] border border-stt-line bg-[#F8FAFC] p-3">
              <h2 className="mb-1.5 text-[12px] font-bold">ESPR · circularity</h2>
              <p className="text-[11.5px] leading-relaxed text-stt-muted">
                <b>Recyclability:</b> {passport.recyclability_info ?? recycleHint}
              </p>
              {passport.end_of_life_instructions ? (
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-stt-muted">
                  <b>End of life:</b> {passport.end_of_life_instructions}
                </p>
              ) : null}
              {chemicals ? (
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-stt-muted">
                  <b>Chemicals:</b> {chemicals}
                </p>
              ) : null}
            </section>

            <section>
              <h2 className="mb-2 text-[12px] font-bold">Care instructions</h2>
              <p className="text-[11.5px] leading-relaxed text-stt-muted">
                {care ?? 'Care details not provided.'}
              </p>
            </section>
          </div>
        </article>

        <p className="mt-3.5 text-center text-[10px] text-[#8FA6BE]">
          Scanned via QR · no login required · Smart Traceability Technology
        </p>
      </div>
    </div>
  );
}
