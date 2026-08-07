'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MapPin, Ship } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type TrackingPin = {
  id: string;
  label: string;
  origin: string;
  destination: string;
  status: string;
  href: string;
  x: number;
  y: number;
};

const PORT_XY: Record<string, { x: number; y: number }> = {
  Chattogram: { x: 72, y: 58 },
  Hamburg: { x: 24, y: 30 },
  Rotterdam: { x: 20, y: 34 },
  Antwerp: { x: 18, y: 36 },
  Dubai: { x: 48, y: 48 },
  Singapore: { x: 78, y: 72 },
  Mongla: { x: 69, y: 64 },
};

export function OrderTrackingMap({ pins }: { pins: TrackingPin[] }) {
  const [activeId, setActiveId] = useState(pins[0]?.id ?? null);
  const active = pins.find((p) => p.id === activeId) ?? pins[0] ?? null;

  return (
    <div className="rounded-xl border border-stt-line bg-white shadow-[var(--stt-shadow)]">
      <div className="flex items-center border-b border-stt-line px-4 py-3">
        <h3 className="text-[13.5px] font-bold">Order tracking map</h3>
        <Badge className="ml-auto rounded-full bg-stt-blue-soft text-stt-blue">
          {pins.length} active
        </Badge>
      </div>
      <div className="relative overflow-hidden bg-[linear-gradient(180deg,#DCEAF6_0%,#F4F8FC_50%,#E8F4EE_100%)] p-3">
        <svg viewBox="0 0 640 240" className="h-[200px] w-full" aria-label="Shipment route map">
          <ellipse cx="160" cy="100" rx="90" ry="48" fill="#B9D4EA" opacity="0.85" />
          <ellipse cx="460" cy="130" rx="70" ry="42" fill="#A8C9A8" opacity="0.9" />
          <text x="130" y="95" fill="#5D7189" fontSize="11" fontWeight="600">
            Europe
          </text>
          <text x="448" y="135" fill="#3D5A40" fontSize="11" fontWeight="700">
            BD
          </text>
          {pins.length >= 2 ? (
            <path
              d={buildPath(pins)}
              fill="none"
              stroke="#12A45B"
              strokeWidth="2.5"
              strokeDasharray="6 5"
              opacity="0.85"
            />
          ) : null}
          {pins.map((pin) => {
            const selected = active?.id === pin.id;
            return (
              <g
                key={pin.id}
                transform={`translate(${(pin.x / 100) * 640}, ${(pin.y / 100) * 240})`}
                className="cursor-pointer"
                onClick={() => setActiveId(pin.id)}
              >
                <circle
                  r={selected ? 14 : 10}
                  fill={selected ? '#12A45B' : '#fff'}
                  stroke="#12A45B"
                  strokeWidth="2"
                />
              </g>
            );
          })}
        </svg>
        {active ? (
          <div className="absolute bottom-3 left-3 right-3 rounded-[10px] border border-stt-line bg-white/95 p-3 sm:right-auto sm:w-[280px]">
            <div className="flex items-start gap-2">
              <Ship className="mt-0.5 size-4 text-stt-green" strokeWidth={1.75} />
              <div className="min-w-0">
                <div className="font-mono-stt text-[12px] font-bold text-stt-ink">
                  {active.label}
                </div>
                <div className="text-[11.5px] text-stt-muted">
                  {active.origin} → {active.destination}
                </div>
                <Badge className="mt-1 rounded-full bg-stt-blue-soft text-[10px] text-stt-blue">
                  {active.status}
                </Badge>
              </div>
            </div>
            <Link
              href={active.href}
              className={cn(
                'mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-stt-blue hover:underline'
              )}
            >
              <MapPin className="size-3.5" /> Open shipment
            </Link>
          </div>
        ) : (
          <p className="px-2 pb-2 text-[12px] text-stt-muted">No active shipments to map.</p>
        )}
      </div>
    </div>
  );
}

export function pinForShipment(input: {
  id: string;
  shipment_number: string;
  status: string;
  origin_port: string | null;
  destination_port: string | null;
}): TrackingPin {
  const dest = input.destination_port ?? 'Hamburg';
  const origin = input.origin_port ?? 'Chattogram';
  const destXy = PORT_XY[dest] ?? { x: 28, y: 32 };
  const originXy = PORT_XY[origin] ?? { x: 70, y: 56 };
  // Place pin along route (favor destination for in-transit narrative)
  const t = input.status === 'delivered' ? 1 : input.status === 'pending' ? 0.15 : 0.55;
  return {
    id: input.id,
    label: input.shipment_number,
    origin,
    destination: dest,
    status: input.status,
    href: `/shipments/${input.id}`,
    x: originXy.x + (destXy.x - originXy.x) * t,
    y: originXy.y + (destXy.y - originXy.y) * t,
  };
}

function buildPath(pins: TrackingPin[]) {
  const ordered = [...pins].sort((a, b) => a.x - b.x);
  const pts = ordered.map((p) => [(p.x / 100) * 640, (p.y / 100) * 240] as const);
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i += 1) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    d += ` Q ${(x0 + x1) / 2} ${Math.min(y0, y1) - 20} ${x1} ${y1}`;
  }
  return d;
}
