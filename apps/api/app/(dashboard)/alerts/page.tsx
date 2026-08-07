import Link from 'next/link';
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from '@/app/(dashboard)/alerts/actions';
import {
  DonutChart,
  FilterBar,
  StatBoxes,
  TrendChart,
  countBy,
  trendFromDates,
} from '@/components/charts/stat-charts';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { requireSessionContext } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

const severityTone: Record<string, string> = {
  critical: 'bg-stt-red-soft text-stt-red',
  high: 'bg-[#FDE8E8] text-[#B42318]',
  medium: 'bg-stt-amber-soft text-stt-amber',
  low: 'bg-stt-blue-soft text-stt-blue',
  info: 'bg-[#EDF1F6] text-stt-muted',
};

export default async function AlertsPage() {
  const ctx = await requireSessionContext();
  const supabase = createClient();

  const { data: notifications } = await supabase
    .from('notifications')
    .select(
      'id, title, body, severity, module, action_url, is_read, created_at, sent_at'
    )
    .eq('organization_id', ctx.organizationId)
    .order('created_at', { ascending: false })
    .limit(60);

  const rows = notifications ?? [];
  const unread = rows.filter((n) => !n.is_read).length;
  const critical = rows.filter((n) => n.severity === 'critical').length;
  const high = rows.filter((n) => n.severity === 'high').length;
  const medium = rows.filter((n) => n.severity === 'medium').length;
  const low = rows.filter(
    (n) => n.severity === 'low' || n.severity === 'info' || !n.severity
  ).length;

  const severityData = countBy(rows, (n) => n.severity ?? 'info');
  const moduleData = countBy(rows, (n) => n.module ?? 'general');
  const statusData = countBy(rows, (n) => (n.is_read ? 'read' : 'open'));
  const trend = trendFromDates(
    rows.map((n) => n.created_at),
    6
  );

  return (
    <PageWrapper
      title="Alerting & Notifications"
      description="Right alert · right person · right time"
      actions={
        unread > 0 ? (
          <form action={markAllNotificationsReadAction}>
            <Button
              type="submit"
              variant="outline"
              className="h-8 rounded-[9px] text-xs font-semibold"
            >
              Mark all read
            </Button>
          </form>
        ) : null
      }
    >
      <FilterBar
        items={[
          { label: 'Channel', value: 'In-app' },
          { label: 'Window', value: 'Recent 60' },
          { label: 'Org', value: ctx.orgName.slice(0, 24) },
        ]}
      />

      <StatBoxes
        items={[
          { label: 'Total alerts', value: rows.length },
          { label: 'Critical', value: critical },
          { label: 'High', value: high },
          { label: 'Medium / low', value: medium + low, hint: `${unread} unread` },
        ]}
      />

      <div className="mb-3.5 grid gap-3.5 lg:grid-cols-2 xl:grid-cols-4">
        <DonutChart title="By severity" data={severityData} />
        <DonutChart title="By category / module" data={moduleData} />
        <DonutChart title="By status" data={statusData} />
        <TrendChart title="Alerts over time" data={trend} color="#2D6CDF" />
      </div>

      <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
        <div className="flex items-center border-b border-stt-line px-4 py-3">
          <h3 className="text-[13.5px] font-bold">Recent alerts</h3>
          <Badge className="ml-auto rounded-full bg-stt-blue-soft text-stt-blue">
            {unread} unread
          </Badge>
        </div>

        {rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-[12px] text-stt-muted">
            No alerts yet. TC issues, risk signals and membership events appear here.
          </p>
        ) : (
          <ul className="divide-y divide-stt-line">
            {rows.map((n) => (
              <li
                key={n.id}
                className={`flex flex-wrap items-start gap-3 px-4 py-3 hover:bg-[#F7FAFC] ${
                  n.is_read ? 'bg-white' : 'bg-stt-blue-soft/40'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {n.action_url ? (
                      <Link
                        href={n.action_url}
                        className="text-[12.5px] font-semibold text-stt-blue hover:underline"
                      >
                        {n.title}
                      </Link>
                    ) : (
                      <p className="text-[12.5px] font-semibold text-stt-ink">{n.title}</p>
                    )}
                    <Badge
                      className={`rounded-full capitalize ${
                        severityTone[n.severity ?? 'info'] ?? severityTone.info
                      }`}
                    >
                      {n.severity ?? 'info'}
                    </Badge>
                    {!n.is_read ? (
                      <Badge className="rounded-full bg-stt-green-soft text-stt-green-dark">
                        Open
                      </Badge>
                    ) : (
                      <Badge className="rounded-full bg-[#EDF1F6] text-stt-muted">
                        Read
                      </Badge>
                    )}
                    {n.module ? (
                      <span className="font-mono-stt text-[10px] text-stt-faint">
                        {n.module}
                      </span>
                    ) : null}
                  </div>
                  {n.body ? (
                    <p className="mt-1 text-[11.5px] text-stt-muted">{n.body}</p>
                  ) : null}
                  <p className="font-mono-stt mt-1 text-[10px] text-stt-faint">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {n.action_url ? (
                    <Button
                      asChild
                      variant="outline"
                      className="h-7 rounded-[9px] text-[11px]"
                    >
                      <Link href={n.action_url}>Open</Link>
                    </Button>
                  ) : null}
                  {!n.is_read ? (
                    <form action={markNotificationReadAction.bind(null, n.id)}>
                      <Button
                        type="submit"
                        variant="outline"
                        className="h-7 rounded-[9px] text-[11px]"
                      >
                        Ack
                      </Button>
                    </form>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageWrapper>
  );
}
