import Link from 'next/link';
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
import { canActAsAuditor } from '@/lib/auth/capabilities';
import { loadVerificationHubData } from '@/lib/dashboard/loaders';
import { createClient } from '@/lib/supabase/server';

const statusClass: Record<string, string> = {
  open: 'rounded-full bg-stt-purple-soft text-stt-purple',
  assigned: 'rounded-full bg-stt-blue-soft text-stt-blue',
  in_progress: 'rounded-full bg-stt-amber-soft text-stt-amber',
  completed: 'rounded-full bg-stt-green-soft text-stt-green-dark',
  cancelled: 'rounded-full bg-[#EDF1F6] text-stt-muted',
};

export default async function AuditorHubPage() {
  const ctx = await requireSessionContext();
  const supabase = createClient();
  const hub = await loadVerificationHubData(ctx);

  const orgIds = Array.from(
    new Set(hub.requests.flatMap((r) => [r.buyer_org_id, r.supplier_org_id]))
  );
  const { data: orgs } =
    orgIds.length > 0
      ? await supabase.from('organizations').select('id, name').in('id', orgIds)
      : { data: [] };
  const nameById = new Map((orgs ?? []).map((o) => [o.id, o.name]));

  const isAuditor = canActAsAuditor(ctx.orgType);

  const kpis: Array<[string, number, string]> = isAuditor
    ? [
        ['Open marketplace', hub.kpis.open, 'Claimable'],
        ['Active', hub.kpis.active, 'In progress'],
        ['Completed', hub.kpis.completed, 'Reports'],
      ]
    : [
        ['Total involving you', hub.kpis.total, 'All statuses'],
        ['Open / active', hub.kpis.open + hub.kpis.active, 'Pending'],
        ['Completed', hub.kpis.completed, 'Done'],
      ];

  return (
    <PageWrapper
      title="Auditor Hub"
      description={
        isAuditor
          ? `${ctx.orgName} · verification marketplace`
          : `${ctx.orgName} · verification jobs involving your org`
      }
      actions={
        <div className="flex items-center gap-2">
          {!isAuditor ? (
            <Badge className="rounded-full bg-stt-blue-soft text-stt-blue">
              Viewing as {ctx.orgType}
            </Badge>
          ) : null}
          <Button asChild variant="outline" className="h-8 rounded-[9px] text-xs">
            <Link href="/verification">Verification</Link>
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
      {!isAuditor ? (
        <div className="mb-3 rounded-[9px] border border-[#CCDCF9] bg-stt-blue-soft px-3 py-2 text-[11.5px] text-[#1E4FA8]">
          Auditor claim/publish actions need an <b>auditor</b> org. This page stays here and
          lists verification requests where you are buyer or supplier — no redirect.
        </div>
      ) : null}

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

      <div className="mt-3.5 rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
        <div className="flex items-center border-b border-stt-line px-4 py-3">
          <h3 className="text-[12.5px] font-bold">
            {isAuditor ? 'Marketplace & jobs' : 'Your verification requests'}
          </h3>
          <Badge className="ml-auto rounded-full bg-stt-purple-soft text-stt-purple">
            {hub.requests.length}
          </Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px] uppercase text-stt-faint">VR</TableHead>
              <TableHead className="text-[10px] uppercase text-stt-faint">Parties</TableHead>
              <TableHead className="text-[10px] uppercase text-stt-faint">Type</TableHead>
              <TableHead className="text-[10px] uppercase text-stt-faint">Status</TableHead>
              <TableHead className="text-[10px] uppercase text-stt-faint">Deadline</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hub.requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-[12px] text-stt-muted">
                  No verification requests visible. Load Demo Data, or open Verification to
                  create one (brands).
                </TableCell>
              </TableRow>
            ) : (
              hub.requests.map((j) => (
                <TableRow key={j.id}>
                  <TableCell className="font-mono-stt text-[11px] text-stt-blue">
                    {j.request_number}
                  </TableCell>
                  <TableCell className="text-[11px]">
                    <div>{nameById.get(j.buyer_org_id) ?? 'Buyer'}</div>
                    <div className="text-stt-muted">
                      → {nameById.get(j.supplier_org_id) ?? 'Supplier'}
                    </div>
                  </TableCell>
                  <TableCell className="text-[12px]">{j.verification_type}</TableCell>
                  <TableCell>
                    <Badge className={statusClass[j.status] ?? statusClass.open}>
                      {j.status}
                    </Badge>
                  </TableCell>
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
            <Link href="/verification">Open Verification →</Link>
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
}
