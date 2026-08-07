import Link from 'next/link';
import { cn } from '@/lib/utils';

export type ChartSlice = {
  label: string;
  value: number;
  color: string;
};

export type TrendPoint = {
  label: string;
  value: number;
};

export type HeatCell = {
  row: string;
  col: string;
  value: number;
  href?: string;
};

const COLORS = [
  '#12A45B',
  '#2D6CDF',
  '#D98A1F',
  '#7A4FD0',
  '#D64545',
  '#0E2A47',
  '#5D7189',
  '#0B7A42',
];

export function StatBoxes({
  items,
}: {
  items: Array<{ label: string; value: string | number; hint?: string }>;
}) {
  return (
    <div className="mb-3.5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-stt-line bg-white p-3.5 shadow-[var(--stt-shadow)]"
        >
          <div className="flex justify-between text-[11px] font-semibold text-stt-muted">
            <span>{item.label}</span>
            {item.hint ? <span>{item.hint}</span> : null}
          </div>
          <div className="mt-1 font-display text-[24px] font-bold text-stt-ink">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export function FilterBar({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="mb-3.5 flex flex-wrap items-center gap-2 rounded-xl border border-stt-line bg-white px-3 py-2.5 shadow-[var(--stt-shadow)]">
      {items.map((item) => (
        <span
          key={item.label}
          className="inline-flex items-center gap-1.5 rounded-full border border-stt-line bg-[#F8FAFC] px-2.5 py-1 text-[11px]"
        >
          <span className="font-semibold text-stt-muted">{item.label}</span>
          <span className="font-mono-stt text-stt-ink">{item.value}</span>
        </span>
      ))}
    </div>
  );
}

export function BarChart({
  title,
  data,
  className,
}: {
  title?: string;
  data: ChartSlice[];
  className?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div
      className={cn(
        'rounded-xl border border-stt-line bg-white p-4 shadow-[var(--stt-shadow)]',
        className
      )}
    >
      {title ? <h3 className="mb-3 text-[13.5px] font-bold">{title}</h3> : null}
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={d.label} className="grid grid-cols-[88px_1fr_40px] items-center gap-2">
            <span className="truncate text-[11.5px] text-stt-muted">{d.label}</span>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#EDF1F6]">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.max(4, (d.value / max) * 100)}%`,
                  background: d.color || COLORS[i % COLORS.length],
                }}
              />
            </div>
            <span className="text-right font-mono-stt text-[11px] text-stt-ink">
              {d.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DonutChart({
  title,
  data,
  className,
}: {
  title?: string;
  data: ChartSlice[];
  className?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div
      className={cn(
        'rounded-xl border border-stt-line bg-white p-4 shadow-[var(--stt-shadow)]',
        className
      )}
    >
      {title ? <h3 className="mb-3 text-[13.5px] font-bold">{title}</h3> : null}
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 120 120" className="size-[110px] shrink-0">
          <g transform="translate(60,60)">
            {data.map((d, i) => {
              const len = (d.value / total) * c;
              const el = (
                <circle
                  key={d.label}
                  r={r}
                  fill="transparent"
                  stroke={d.color || COLORS[i % COLORS.length]}
                  strokeWidth="14"
                  strokeDasharray={`${len} ${c - len}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90)"
                />
              );
              offset += len;
              return el;
            })}
            <circle r="28" fill="white" />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-stt-ink"
              style={{ fontSize: 14, fontWeight: 700 }}
            >
              {total}
            </text>
          </g>
        </svg>
        <ul className="min-w-0 flex-1 space-y-1.5">
          {data.map((d, i) => (
            <li key={d.label} className="flex items-center gap-2 text-[12px]">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: d.color || COLORS[i % COLORS.length] }}
              />
              <span className="min-w-0 flex-1 truncate text-stt-muted">{d.label}</span>
              <span className="font-mono-stt text-stt-ink">{d.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function TrendChart({
  title,
  data,
  className,
  color = '#12A45B',
}: {
  title?: string;
  data: TrendPoint[];
  className?: string;
  color?: string;
}) {
  const w = 320;
  const h = 120;
  const pad = 12;
  const max = Math.max(...data.map((d) => d.value), 1);
  const pts = data.map((d, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
    const y = h - pad - (d.value / max) * (h - pad * 2);
    return { x, y, ...d };
  });
  const path = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
  const area =
    pts.length > 0
      ? `${path} L ${pts[pts.length - 1].x.toFixed(1)} ${h - pad} L ${pts[0].x.toFixed(1)} ${h - pad} Z`
      : '';

  return (
    <div
      className={cn(
        'rounded-xl border border-stt-line bg-white p-4 shadow-[var(--stt-shadow)]',
        className
      )}
    >
      {title ? <h3 className="mb-3 text-[13.5px] font-bold">{title}</h3> : null}
      {data.length === 0 ? (
        <p className="text-[12px] text-stt-muted">No trend data yet.</p>
      ) : (
        <>
          <svg viewBox={`0 0 ${w} ${h}`} className="h-[120px] w-full">
            <path d={area} fill={color} opacity="0.12" />
            <path d={path} fill="none" stroke={color} strokeWidth="2.5" />
            {pts.map((p) => (
              <circle key={p.label} cx={p.x} cy={p.y} r="3.5" fill={color} />
            ))}
          </svg>
          <div className="mt-1 flex justify-between text-[10px] text-stt-faint">
            <span>{data[0]?.label}</span>
            <span>{data[data.length - 1]?.label}</span>
          </div>
        </>
      )}
    </div>
  );
}

export function HeatMap({
  title,
  rows,
  cols,
  cells,
  className,
}: {
  title?: string;
  rows: string[];
  cols: string[];
  cells: HeatCell[];
  className?: string;
}) {
  const max = Math.max(...cells.map((c) => c.value), 1);
  const lookup = new Map(cells.map((c) => [`${c.row}::${c.col}`, c]));

  function cellColor(v: number) {
    if (v <= 0) return '#F3F6F9';
    const t = v / max;
    if (t > 0.75) return '#F2A0A0';
    if (t > 0.5) return '#F6C28B';
    if (t > 0.25) return '#F5E6A6';
    return '#C8EBD6';
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-stt-line bg-white p-4 shadow-[var(--stt-shadow)]',
        className
      )}
    >
      {title ? <h3 className="mb-3 text-[13.5px] font-bold">{title}</h3> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[280px] border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="text-left text-[10px] uppercase text-stt-faint" />
              {cols.map((c) => (
                <th
                  key={c}
                  className="px-1 text-center text-[10px] font-semibold uppercase text-stt-faint"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r}>
                <td className="whitespace-nowrap pr-2 text-[11px] font-semibold text-stt-muted">
                  {r}
                </td>
                {cols.map((c) => {
                  const cell = lookup.get(`${r}::${c}`);
                  const v = cell?.value ?? 0;
                  const inner = (
                    <span
                      className="grid h-9 min-w-[44px] place-items-center rounded-md font-mono-stt text-[11px] font-bold text-stt-ink"
                      style={{ background: cellColor(v) }}
                    >
                      {v || '·'}
                    </span>
                  );
                  return (
                    <td key={c} className="p-0.5 text-center">
                      {cell?.href && v > 0 ? (
                        <Link href={cell.href} className="block hover:opacity-90">
                          {inner}
                        </Link>
                      ) : (
                        inner
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex items-center gap-2 text-[10px] text-stt-faint">
        <span>Low</span>
        <span className="h-2 w-16 rounded-full bg-[linear-gradient(90deg,#C8EBD6,#F5E6A6,#F6C28B,#F2A0A0)]" />
        <span>High</span>
      </div>
    </div>
  );
}

export function JourneyStrip({
  steps,
}: {
  steps: Array<{ label: string; done?: boolean; current?: boolean }>;
}) {
  return (
    <div className="mb-3.5 overflow-x-auto rounded-xl border border-stt-line bg-white px-4 py-3 shadow-[var(--stt-shadow)]">
      <div className="flex min-w-max items-center gap-0">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center">
            <div className="w-[100px] text-center">
              <div
                className={cn(
                  'mx-auto size-2.5 rounded-full',
                  step.done || step.current ? 'bg-stt-green' : 'bg-stt-line'
                )}
              />
              <div
                className={cn(
                  'mt-1.5 text-[11px] font-semibold',
                  step.current ? 'text-stt-green-dark' : 'text-stt-muted'
                )}
              >
                {step.label}
              </div>
            </div>
            {i < steps.length - 1 ? (
              <div
                className={cn(
                  'mb-4 h-0.5 w-6',
                  step.done ? 'bg-stt-green' : 'bg-stt-line'
                )}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function InsightCard({
  title,
  body,
  href,
  hrefLabel = 'Open →',
}: {
  title: string;
  body: string;
  href: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-3.5 rounded-xl border border-[#CCDCF9] bg-stt-blue-soft px-4 py-3 shadow-[var(--stt-shadow)]">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[#1E4FA8]">
        Insight
      </div>
      <div className="mt-1 text-[13.5px] font-bold text-stt-ink">{title}</div>
      <p className="mt-1 text-[12px] leading-relaxed text-[#1E4FA8]">{body}</p>
      <Link
        href={href}
        className="mt-2 inline-block text-[12px] font-semibold text-stt-blue hover:underline"
      >
        {hrefLabel}
      </Link>
    </div>
  );
}

export function countBy<T>(
  rows: T[],
  keyFn: (row: T) => string,
  colors?: string[]
): ChartSlice[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const k = keyFn(row) || '—';
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], i) => ({
      label,
      value,
      color: colors?.[i] ?? COLORS[i % COLORS.length],
    }));
}

/** Build simple monthly buckets for last N months from date strings. */
export function trendFromDates(
  dates: Array<string | null | undefined>,
  months = 6
): TrendPoint[] {
  const now = new Date();
  const buckets: TrendPoint[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('en', { month: 'short' });
    buckets.push({ label, value: 0 });
    (buckets[buckets.length - 1] as TrendPoint & { key?: string }).label = label;
    Object.assign(buckets[buckets.length - 1], { _key: key });
  }
  const byKey = new Map(
    buckets.map((b, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - idx), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return [key, b] as const;
    })
  );
  for (const raw of dates) {
    if (!raw) continue;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const bucket = byKey.get(key);
    if (bucket) bucket.value += 1;
  }
  return buckets;
}
