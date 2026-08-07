import Link from 'next/link';
import { redirect } from 'next/navigation';
import { completeOnboardingStepAction } from '@/app/(dashboard)/onboarding/actions';
import { CreateOrgForm } from '@/app/(dashboard)/onboarding/create-org-form';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';

const phases = [
  { n: 1, title: 'Registration', desc: 'Create organization profile' },
  { n: 2, title: 'Supply Chain Mapping', desc: 'Declare facilities (next)' },
  { n: 3, title: 'Wallet Activation', desc: 'Material balances' },
  { n: 4, title: 'TC Activation', desc: 'Issue first certificate' },
  { n: 5, title: 'Live Operations', desc: 'Go live' },
];

type PageProps = {
  searchParams: { step?: string };
};

export default async function OnboardingPage({ searchParams }: PageProps) {
  const stepParam = Number(searchParams.step ?? '1');

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, organization_id')
    .eq('id', user.id)
    .maybeSingle();

  const { data: org } = profile?.organization_id
    ? await supabase
        .from('organizations')
        .select('id, name, org_type, onboarding_step, onboarding_completed, subscription_plan')
        .eq('id', profile.organization_id)
        .maybeSingle()
    : { data: null };

  if (org?.onboarding_completed) {
    redirect('/');
  }

  const currentStep = org ? Math.max(org.onboarding_step ?? 1, stepParam) : 1;

  return (
    <PageWrapper
      title="Onboarding Journey"
      description={`Phase ${currentStep} of 5 · Guided setup`}
    >
      <div className="rounded-xl border border-stt-line bg-white p-4 shadow-[var(--stt-shadow)]">
        <div className="flex flex-wrap gap-0 overflow-x-auto">
          {phases.map((phase, index) => {
            const hot = phase.n <= currentStep;
            return (
              <div
                key={phase.n}
                className="relative min-w-[120px] flex-1 px-2 py-2 text-center"
              >
                {index < phases.length - 1 ? (
                  <span className="absolute right-[-6px] top-6 z-10 font-bold text-stt-green">
                    →
                  </span>
                ) : null}
                <div
                  className={`mx-auto grid size-[42px] place-items-center rounded-xl border text-[15px] ${
                    hot
                      ? 'border-stt-green bg-stt-green text-white'
                      : 'border-[#BFE8D2] bg-stt-green-soft text-stt-green-dark'
                  }`}
                >
                  {phase.n}
                </div>
                <div className="mt-2 text-[10.5px] font-bold text-stt-ink">
                  Phase {phase.n}
                </div>
                <div className="text-[9.5px] text-stt-muted">{phase.title}</div>
                <div className="font-mono-stt mt-0.5 text-[8.5px] text-stt-blue">
                  {hot ? (phase.n < currentStep ? 'Complete' : 'In Progress') : 'Pending'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3.5 grid gap-3.5 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="flex items-center gap-2 border-b border-stt-line px-4 py-3">
            <h3 className="text-[12.5px] font-bold">
              {org
                ? `Phase ${currentStep} — ${phases[currentStep - 1]?.title}`
                : 'Phase 1 — Registration'}
            </h3>
            <Badge className="ml-auto rounded-full bg-stt-blue-soft text-stt-blue hover:bg-stt-blue-soft">
              {org ? 'In Progress' : 'Start here'}
            </Badge>
          </div>
          <div className="space-y-3 p-4">
            {!org ? (
              <>
                <p className="text-[12px] text-stt-muted">
                  Hello {profile?.full_name ?? 'there'} — create your organization to
                  unlock facilities, wallet, and TC workflows.
                </p>
                <CreateOrgForm defaultEmail={user.email} />
              </>
            ) : currentStep < 5 ? (
              <>
                <p className="text-[12px] text-stt-muted">
                  Organization <b>{org.name}</b> ({org.org_type}) is registered.
                  Continue the guided phases — facility mapping is Step 1.3.
                </p>
                <div className="flex flex-wrap gap-2">
                  <form
                    action={async () => {
                      'use server';
                      await completeOnboardingStepAction(currentStep + 1);
                    }}
                  >
                    <Button
                      type="submit"
                      className="h-8 rounded-[9px] bg-stt-green text-xs font-semibold hover:bg-stt-green-dark"
                    >
                      Mark phase complete →
                    </Button>
                  </form>
                  <Button
                    asChild
                    variant="outline"
                    className="h-8 rounded-[9px] text-xs font-semibold"
                  >
                    <Link href="/facilities">Go to facilities</Link>
                  </Button>
                </div>
              </>
            ) : (
              <form
                action={async () => {
                  'use server';
                  await completeOnboardingStepAction(5);
                }}
              >
                <Button
                  type="submit"
                  className="h-8 rounded-[9px] bg-stt-green text-xs font-semibold hover:bg-stt-green-dark"
                >
                  Finish onboarding →
                </Button>
              </form>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="border-b border-stt-line px-4 py-3">
            <h3 className="text-[12.5px] font-bold">Registration summary</h3>
          </div>
          <div className="space-y-2 p-4 text-[12px]">
            {[
              ['User', profile?.full_name ?? '—'],
              ['Email', user.email ?? '—'],
              ['Organization', org?.name ?? 'Not created'],
              ['Type', org?.org_type ?? '—'],
              ['Plan', org?.subscription_plan ?? 'view_access'],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between border-b border-dashed border-stt-line pb-2"
              >
                <span className="text-stt-muted">{k}</span>
                <b className="text-stt-ink">{v}</b>
              </div>
            ))}
          </div>
          <div className="mx-4 mb-4 rounded-[9px] border border-[#CCDCF9] bg-stt-blue-soft px-3 py-2 text-[11px] leading-relaxed text-[#1E4FA8]">
            Target onboarding window: <b>7–21 days</b> (prototype Phase 2 screen).
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
