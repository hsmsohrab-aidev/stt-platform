import { DemoDataForms } from '@/app/(dashboard)/demo-data/demo-forms';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Badge } from '@/components/ui/badge';
import { requireSessionContext } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export default async function DemoDataPage() {
  const ctx = await requireSessionContext();
  const supabase = createClient();

  const { data: batch } = await supabase
    .from('demo_batches')
    .select('id, label, created_at, meta')
    .eq('host_organization_id', ctx.organizationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const summary =
    batch?.meta &&
    typeof batch.meta === 'object' &&
    Array.isArray((batch.meta as { summary?: string[] }).summary)
      ? ((batch.meta as { summary: string[] }).summary)
      : [];

  return (
    <PageWrapper
      title="Demo Data"
      description={`${ctx.orgName} · seed or wipe realistic pilot data across the platform`}
      actions={
        batch ? (
          <Badge className="rounded-full bg-stt-green-soft text-stt-green-dark">
            Demo loaded
          </Badge>
        ) : (
          <Badge className="rounded-full bg-[#EDF1F6] text-stt-muted">
            Empty
          </Badge>
        )
      }
    >
      <div className="grid gap-3.5 lg:grid-cols-[1.2fr_1fr]">
        <DemoDataForms
          hasBatch={Boolean(batch)}
          batchLabel={batch?.label ?? null}
        />

        <div className="rounded-xl border border-stt-line bg-white p-4 shadow-[var(--stt-shadow)]">
          <h3 className="text-[13px] font-bold text-stt-ink">What gets filled</h3>
          <ul className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-stt-muted">
            <li>· ≥10 suppliers + brand (Nordic Loom) + auditor (SGC)</li>
            <li>· ≥10 host facilities + partner sites + certs</li>
            <li>· ≥10 wallet credits / balances (all active materials)</li>
            <li>· ≥10 orders · ≥10 shipments · ≥10 TCs</li>
            <li>· ≥10 digital product passports + QR</li>
            <li>· ≥10 verification requests (+ assignments)</li>
            <li>· ≥10 alerts · ≥10 membership invites</li>
            <li>· Materials catalog already ≥10 (shared)</li>
            <li>· Risk · Compliance · Sustainability · Reports derived</li>
          </ul>

          {summary.length > 0 ? (
            <div className="mt-4 border-t border-stt-line pt-3">
              <p className="text-[10.5px] font-semibold uppercase tracking-wide text-stt-faint">
                Last batch
              </p>
              <ul className="mt-1.5 space-y-1">
                {summary.map((line) => (
                  <li key={line} className="text-[11.5px] text-stt-ink">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="mt-4 rounded-[9px] border border-[#CCDCF9] bg-stt-blue-soft px-3 py-2 text-[11px] leading-relaxed text-[#1E4FA8]">
            Requires <code className="font-mono-stt">SUPABASE_SERVICE_ROLE_KEY</code> in
            the server environment so partner orgs can be created safely. Never expose
            that key to the browser.
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}
