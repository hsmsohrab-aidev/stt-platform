import { cn } from '@/lib/utils';

export type ChartSlice = {
  label: string;
  value: number;
  color: string;
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
