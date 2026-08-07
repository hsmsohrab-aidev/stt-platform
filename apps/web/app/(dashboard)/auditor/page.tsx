import Link from 'next/link';
import { redirect } from 'next/navigation';
import { logoutAction } from '@/app/(auth)/actions';
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

export default async function AuditorHubPage() {
  const ctx = await requireSessionContext();
  if (ctx.orgType !== 'auditor') redirect('/verification');

  const supabase = createClient();

  const [
    { count: openCount },
    { count: mineCount },
    { count: doneCount },
    { data: openJobs },
    { data: myJobs },
  ] = await Promise.all([
    supabase
      .from('verification_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open'),
    supabase
      .from('verification_assignments')
      .select('id', { count: 'exact', head: true })
      .eq('auditor_org_id', ctx.organizationId)
      .neq('status', 'completed'),
    supabase
      .from('verification_assignments')
      .select('id', { count: 'exact', head: true })
      .eq('auditor_org_id', ctx.organizationId)
      .eq('status', 'completed'),
    supabase
      .from('verification_requests')
      .select(
        'id, request_number, verification_type, scope, status, buyer_org_id, supplier_org_id, deadline_date'
      )
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('verification_assignments')
      .select('id, status, request_id, accepted_at')
      .eq('auditor_org_id', ctx.organizationId)
      .order('assigned_at', { ascending: false })
      .limit(8),
  ]);

  const requestIds = (myJobs ?? []).map((j) => j.request_id);
  const { data: myRequests } =
    requestIds.length > 0
      ? await supabase
          .from('verification_requests')
          .select('id, request_number, verification_type, status')
          .in('id', requestIds)
      : { data: [] };
  const reqById = new Map((myRequests ?? []).map((r) => [r.id, r]));

  const kpis: Array<[string, number, string]> = [
    ['Open marketplace', openCount ?? 0, 'Claimable'],
    ['Active jobs', mineCount ?? 0, 'In progress'],
    ['Completed', doneCount ?? 0, 'Reports'],
  ];

  return (
    <PageWrapper
      title="Auditor Dashboard"
      description={`${ctx.orgName} · verification marketplace`}
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="h-8 rounded-[9px] text-xs">
            <Link href="/verification">Marketplace</Link>
          </Button>
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
      <div className="grid gap-3 sm:grid-cols-3">
        {kpis.map(([label, value, hint]) => (
          <div
            key={label}
            className="rounded-xl border border-stt-line bg-white p-3.5 shadow-[var(--stt-shadow)]"
          >
            <div className="flex justify-between text-[10.5px] font-semibold text-stt-muted">
              <span>{label}</span>
              <span>{hint}</span>
            </div>
            <div className="mt-1 font-display text-[23px] font-bold">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-3.5 grid gap-3.5 lg:grid-cols-2">
        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="border-b border-stt-line px-4 py-3">
            <h3 className="text-[12.5px] font-bold">Open jobs</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase text-stt-faint">VR</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Type</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Deadline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(openJobs ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-[12px] text-stt-muted">
                    No open requests.
                  </TableCell>
                </TableRow>
              ) : (
                (openJobs ?? []).map((j) => (
                  <TableRow key={j.id}>
                    <TableCell className="font-mono-stt text-[11px] text-stt-blue">
                      {j.request_number}
                    </TableCell>
                    <TableCell className="text-[12px]">{j.verification_type}</TableCell>
                    <TableCell className="font-mono-stt text-[11px]">
                      {j.deadline_date ?? '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="border-t border-stt-line px-4 py-3">
            <Button asChild className="h-8 rounded-[9px] bg-stt-green text-xs hover:bg-stt-green-dark">
              <Link href="/verification">Claim on marketplace →</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
          <div className="border-b border-stt-line px-4 py-3">
            <h3 className="text-[12.5px] font-bold">My assignments</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] uppercase text-stt-faint">VR</TableHead>
                <TableHead className="text-[10px] uppercase text-stt-faint">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(myJobs ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-[12px] text-stt-muted">
                    No assignments yet.
                  </TableCell>
                </TableRow>
              ) : (
                (myJobs ?? []).map((j) => {
                  const req = reqById.get(j.request_id);
                  return (
                    <TableRow key={j.id}>
                      <TableCell>
                        <div className="font-mono-stt text-[11px] text-stt-blue">
                          {req?.request_number ?? j.request_id.slice(0, 8)}
                        </div>
                        <div className="text-[10px] text-stt-muted">
                          {req?.verification_type}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="rounded-full bg-stt-amber-soft text-stt-amber">
                          {j.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageWrapper>
  );
}
