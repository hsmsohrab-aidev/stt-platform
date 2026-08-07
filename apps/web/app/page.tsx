import type { OrgType } from '@stt/types';
import { logoutAction } from '@/app/(auth)/actions';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

const orgTypes: OrgType[] = [
  'brand',
  'supplier',
  'auditor',
  'logistics',
  'regulator',
  'financial',
];

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from('profiles')
        .select('full_name, organization_id')
        .eq('id', user.id)
        .maybeSingle()
    : { data: null };

  return (
    <PageWrapper
      title="Executive Overview"
      description="All business units"
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
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Session', user?.email ?? '—'],
          ['Profile', profile?.full_name ?? '—'],
          ['Organization', profile?.organization_id ? 'Linked' : 'Not linked'],
          ['Design system', 'Prototype v1.0 locked'],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-stt-line bg-white p-3.5 shadow-[var(--stt-shadow)]"
          >
            <div className="text-[10.5px] font-semibold tracking-wide text-stt-muted">
              {label}
            </div>
            <div className="mt-1 truncate font-display text-[18px] font-bold text-stt-ink">
              {value}
            </div>
          </div>
        ))}
      </div>

      <Card className="mt-3.5 rounded-xl border-stt-line shadow-[var(--stt-shadow)]">
        <CardHeader className="border-b border-stt-line py-3">
          <CardTitle className="text-[12.5px] font-bold">Stakeholder roles</CardTitle>
          <CardDescription className="text-[11px]">
            Shared OrgType — full dashboards land in Phase 1
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 pt-4">
          {orgTypes.map((type) => (
            <Badge
              key={type}
              className="rounded-full bg-stt-green-soft text-stt-green-dark hover:bg-stt-green-soft"
            >
              {type}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <div className="mt-3.5 rounded-[9px] border border-[#CCDCF9] bg-stt-blue-soft px-3 py-2.5 text-[11px] leading-relaxed text-[#1E4FA8]">
        UI tokens follow <b>docs/DESIGN_SYSTEM.md</b> (from interactive prototype).
        Next: Phase 1.1 core schema, then organization onboarding.
      </div>
    </PageWrapper>
  );
}
