import type { SessionContext } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import type {
  ActivityItem,
  JourneyStep,
  MapPinData,
} from '@/components/dashboard/interactive-overview';

const CITY_COORDS: Record<string, { x: number; y: number }> = {
  Chattogram: { x: 68, y: 58 },
  Dhaka: { x: 66, y: 52 },
  Gazipur: { x: 65, y: 50 },
  Narayanganj: { x: 67, y: 54 },
  Savar: { x: 64, y: 51 },
  Stockholm: { x: 48, y: 28 },
  Hamburg: { x: 46, y: 32 },
  Rotterdam: { x: 44, y: 34 },
  Mongla: { x: 64, y: 62 },
};

function coordsFor(city: string | null | undefined, fallbackIndex: number) {
  if (city && CITY_COORDS[city]) return CITY_COORDS[city];
  return { x: 30 + (fallbackIndex % 6) * 10, y: 35 + (fallbackIndex % 4) * 12 };
}

export async function loadInteractiveOverview(ctx: SessionContext) {
  const supabase = createClient();
  const orgId = ctx.organizationId;

  const [{ data: facilities }, { data: shipments }, { data: notifications }, { data: passports }, { data: tcs }] =
    await Promise.all([
      supabase
        .from('facilities')
        .select('id, name, city, country, facility_type, is_verified, is_active')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(12),
      supabase
        .from('shipments')
        .select(
          'id, shipment_number, status, origin_port, destination_port, current_location, updated_at'
        )
        .or(
          `organization_id.eq.${orgId},shipper_org_id.eq.${orgId},consignee_org_id.eq.${orgId}`
        )
        .order('updated_at', { ascending: false })
        .limit(8),
      supabase
        .from('notifications')
        .select('id, title, body, severity, action_url, created_at')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(6),
      supabase
        .from('product_passports')
        .select('id, product_name, product_sku, status, material_composition')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('transaction_certificates')
        .select('id, tc_number, tc_status, issue_date')
        .or(
          `organization_id.eq.${orgId},issuer_org_id.eq.${orgId},receiver_org_id.eq.${orgId}`
        )
        .order('created_at', { ascending: false })
        .limit(4),
    ]);

  const pins: MapPinData[] = [];
  (facilities ?? []).slice(0, 8).forEach((f, i) => {
    const c = coordsFor(f.city, i);
    pins.push({
      id: f.id,
      label: f.name,
      city: f.city ?? '—',
      country: f.country ?? 'BD',
      kind: 'facility',
      status: f.is_verified ? 'Active · verified' : 'Active',
      x: c.x,
      y: c.y,
    });
  });

  // Destination ports as secondary pins
  (shipments ?? []).slice(0, 3).forEach((s, i) => {
    const dest = s.destination_port ?? 'Hamburg';
    const c = coordsFor(dest, 10 + i);
    pins.push({
      id: `ship-${s.id}`,
      label: s.shipment_number,
      city: dest,
      country: s.current_location ?? 'In transit',
      kind: 'port',
      status: s.status,
      x: Math.min(92, c.x + 2),
      y: Math.max(18, c.y - 4),
    });
  });

  if (pins.length === 0) {
    pins.push({
      id: 'hq',
      label: ctx.orgName,
      city: 'Dhaka',
      country: 'BD',
      kind: ctx.orgType === 'brand' ? 'brand' : 'facility',
      status: 'HQ',
      x: 66,
      y: 52,
    });
  }

  const journey: JourneyStep[] = [
    { id: '1', label: 'Raw', place: 'BD / IN', date: 'Q1', done: true },
    { id: '2', label: 'Spin', place: 'Narayanganj', date: 'Q1', done: true },
    { id: '3', label: 'Knit', place: 'Gazipur', date: 'Q2', done: true },
    { id: '4', label: 'Dye', place: 'Savar', date: 'Q2', done: true },
    { id: '5', label: 'Cut & sew', place: 'Chattogram', date: 'Q2', done: true },
    { id: '6', label: 'Finish', place: 'CEPZ', date: 'Q2', done: true },
    {
      id: '7',
      label: 'Inspect',
      place: 'SGC',
      date: tcs?.[0]?.issue_date?.slice(0, 7) ?? 'Q3',
      done: Boolean(tcs?.length),
    },
    {
      id: '8',
      label: 'Ship',
      place: shipments?.[0]?.destination_port ?? 'EU',
      date: 'ETA',
      done: shipments?.some((s) => s.status === 'delivered') ?? false,
    },
  ];

  const activity: ActivityItem[] = (notifications ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    meta: n.body?.slice(0, 80) ?? new Date(n.created_at).toLocaleString(),
    href: n.action_url ?? undefined,
    tone:
      n.severity === 'critical' || n.severity === 'high'
        ? 'danger'
        : n.severity === 'medium'
          ? 'warning'
          : n.severity === 'low'
            ? 'info'
            : 'success',
  }));

  if (activity.length === 0 && (tcs ?? []).length) {
    for (const tc of tcs ?? []) {
      activity.push({
        id: tc.id,
        title: `TC ${tc.tc_number}`,
        meta: `${tc.tc_status} · ${tc.issue_date}`,
        href: `/tc/${tc.id}`,
        tone: 'info',
      });
    }
  }

  const composition = passports?.material_composition;
  let materials = '';
  if (Array.isArray(composition) && composition[0] && typeof composition[0] === 'object') {
    const first = composition[0] as { material?: string; pct?: number };
    materials = `${first.material ?? 'Material'}${first.pct != null ? ` ${first.pct}%` : ''}`;
  }

  const passport = passports
    ? {
        name: passports.product_name,
        sku: passports.product_sku ?? '—',
        status: passports.status === 'published' ? 'Verified & compliant' : passports.status,
        href: `/dpp/${passports.id}`,
        materials,
      }
    : null;

  return { pins, journey, activity, passport };
}
