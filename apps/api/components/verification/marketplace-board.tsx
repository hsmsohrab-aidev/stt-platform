'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ClaimRequestButton } from '@/app/(dashboard)/verification/claim-button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export const SERVICE_TYPES = [
  'physical',
  'certificate',
  'social',
  'material',
  'esg',
  'supply_chain',
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];

export type MarketplaceRequest = {
  id: string;
  request_number: string;
  buyer_org_id: string;
  supplier_org_id: string;
  verification_type: string;
  scope: string | null;
  status: string;
  deadline_date?: string | null;
};

export type MarketplaceReport = {
  request_id: string;
  overall_rating: string | null;
  score: number | null;
};

const statusClass: Record<string, string> = {
  open: 'rounded-full bg-stt-purple-soft text-stt-purple',
  assigned: 'rounded-full bg-stt-blue-soft text-stt-blue',
  in_progress: 'rounded-full bg-stt-amber-soft text-stt-amber',
  completed: 'rounded-full bg-stt-green-soft text-stt-green-dark',
  cancelled: 'rounded-full bg-[#EDF1F6] text-stt-muted',
};

const typeClass: Record<string, string> = {
  physical: 'bg-stt-green-soft text-stt-green-dark',
  certificate: 'bg-stt-blue-soft text-stt-blue',
  social: 'bg-stt-purple-soft text-stt-purple',
  material: 'bg-stt-amber-soft text-stt-amber',
  esg: 'bg-[#EDF1F6] text-stt-navy',
  supply_chain: 'bg-stt-navy/10 text-stt-navy',
};

type TabKey = 'open' | 'mine' | 'completed' | 'all';

type MarketplaceBoardProps = {
  requests: MarketplaceRequest[];
  nameById: Record<string, string>;
  myRequestIds: string[];
  assignmentByRequest: Record<
    string,
    { id: string; status: string } | undefined
  >;
  reportByRequest: Record<string, MarketplaceReport | undefined>;
  auditorLike: boolean;
  orgId: string;
  initialTab?: TabKey;
};

function typeLabel(t: string) {
  return t.replace(/_/g, ' ');
}

export function MarketplaceBoard({
  requests,
  nameById,
  myRequestIds,
  assignmentByRequest,
  reportByRequest,
  auditorLike,
  orgId,
  initialTab = 'open',
}: MarketplaceBoardProps) {
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [typeFilter, setTypeFilter] = useState<string | 'all'>('all');

  const mySet = useMemo(() => new Set(myRequestIds), [myRequestIds]);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (typeFilter !== 'all' && r.verification_type !== typeFilter) return false;
      if (tab === 'all') return true;
      if (tab === 'open') return r.status === 'open';
      if (tab === 'completed') return r.status === 'completed';
      // mine: assigned to me OR my org is party
      return (
        mySet.has(r.id) ||
        r.buyer_org_id === orgId ||
        r.supplier_org_id === orgId
      );
    });
  }, [requests, tab, typeFilter, mySet, orgId]);

  const tabs: Array<{ key: TabKey; label: string; count: number }> = [
    {
      key: 'open',
      label: 'Open',
      count: requests.filter((r) => r.status === 'open').length,
    },
    {
      key: 'mine',
      label: 'Mine',
      count: requests.filter(
        (r) =>
          mySet.has(r.id) ||
          r.buyer_org_id === orgId ||
          r.supplier_org_id === orgId
      ).length,
    },
    {
      key: 'completed',
      label: 'Completed',
      count: requests.filter((r) => r.status === 'completed').length,
    },
    { key: 'all', label: 'All', count: requests.length },
  ];

  return (
    <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
      <div className="border-b border-stt-line px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="mr-2 text-[12.5px] font-bold">Marketplace board</h3>
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition',
                tab === t.key
                  ? 'border-stt-green bg-stt-green-soft text-stt-green-dark'
                  : 'border-stt-line bg-white text-stt-muted hover:border-stt-green/40'
              )}
            >
              {t.label}
              <span className="font-mono-stt text-[10px] opacity-80">{t.count}</span>
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={cn(
              'rounded-full border px-2.5 py-1 text-[10.5px] font-semibold capitalize',
              typeFilter === 'all'
                ? 'border-stt-navy bg-stt-navy text-white'
                : 'border-stt-line text-stt-muted hover:border-stt-navy/30'
            )}
          >
            All services
          </button>
          {SERVICE_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-[10.5px] font-semibold capitalize',
                typeFilter === t
                  ? 'border-stt-navy bg-stt-navy text-white'
                  : cn('border-stt-line', typeClass[t] ?? 'text-stt-muted')
              )}
            >
              {typeLabel(t)}
            </button>
          ))}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-[10px] uppercase text-stt-faint">VR</TableHead>
            <TableHead className="text-[10px] uppercase text-stt-faint">Type</TableHead>
            <TableHead className="text-[10px] uppercase text-stt-faint">Parties</TableHead>
            <TableHead className="text-[10px] uppercase text-stt-faint">Status</TableHead>
            <TableHead className="text-[10px] uppercase text-stt-faint">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-[12px] text-stt-muted">
                No requests in this view.
                {tab === 'open' ? (
                  <>
                    {' '}
                    Brands create jobs from the panel; check{' '}
                    <button
                      type="button"
                      className="font-semibold text-stt-blue hover:underline"
                      onClick={() => setTab('all')}
                    >
                      All
                    </button>
                    .
                  </>
                ) : null}
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((r) => {
              const assignment = assignmentByRequest[r.id];
              const report = reportByRequest[r.id];
              return (
                <TableRow key={r.id} className="hover:bg-[#F7FAFC]">
                  <TableCell>
                    <div className="font-mono-stt text-[11px] text-stt-blue">
                      {r.request_number}
                    </div>
                    {r.scope ? (
                      <div className="text-[10px] text-stt-muted">{r.scope}</div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        'rounded-full capitalize',
                        typeClass[r.verification_type] ?? 'bg-[#EDF1F6] text-stt-muted'
                      )}
                    >
                      {typeLabel(r.verification_type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[11px]">
                    <div>Buyer: {nameById[r.buyer_org_id] ?? '—'}</div>
                    <div className="text-stt-muted">
                      Supplier: {nameById[r.supplier_org_id] ?? '—'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusClass[r.status] ?? statusClass.open}>
                      {r.status}
                    </Badge>
                    {report ? (
                      <div className="mt-1 text-[10px] text-stt-muted">
                        {report.overall_rating}
                        {report.score != null ? ` · ${report.score}` : ''}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {auditorLike && r.status === 'open' ? (
                      <ClaimRequestButton requestId={r.id} />
                    ) : null}
                    {auditorLike &&
                    assignment &&
                    assignment.status !== 'completed' &&
                    (r.status === 'in_progress' || r.status === 'assigned') ? (
                      <span className="text-[10px] font-semibold text-stt-green-dark">
                        Yours · complete →
                      </span>
                    ) : null}
                    {r.status === 'completed' ? (
                      <Link
                        href="/auditor"
                        className="text-[11px] font-semibold text-stt-blue hover:underline"
                      >
                        Report
                      </Link>
                    ) : null}
                    {!auditorLike && r.status !== 'completed' ? (
                      <span className="text-[11px] text-stt-muted">View only</span>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
