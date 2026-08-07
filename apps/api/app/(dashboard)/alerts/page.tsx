import Link from 'next/link';
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from '@/app/(dashboard)/alerts/actions';
import {
  DonutChart,
  StatBoxes,
  countBy,
} from '@/components/charts/stat-charts';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { requireSessionContext } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

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
  const severityData = countBy(rows, (n) => n.severity ?? 'info');

  return (
    <PageWrapper
      title="Alerts"
      description="In-app notifications · TC & ops signals"
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
      <StatBoxes
        items={[
          { label: 'Unread', value: unread },
          { label: 'Total', value: rows.length },
          { label: 'Read', value: rows.length - unread },
          { label: 'Severities', value: severityData.length },
        ]}
      />

      <div className="mb-3.5 grid gap-3.5 lg:grid-cols-2">
        <DonutChart title="By severity" data={severityData} />
      </div>

      <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
        <div className="flex items-center border-b border-stt-line px-4 py-3">
          <h3 className="text-[12.5px] font-bold">Inbox</h3>
          <Badge className="ml-auto rounded-full bg-stt-blue-soft text-stt-blue">
            {unread} unread
          </Badge>
        </div>

        {rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-[12px] text-stt-muted">
            No alerts yet. When a partner issues a TC to you, it appears here.
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
                    {!n.is_read ? (
                      <Badge className="rounded-full bg-stt-green-soft text-stt-green-dark">
                        New
                      </Badge>
                    ) : null}
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
                        Read
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
