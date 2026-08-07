import type { SessionContext } from '@/lib/auth/session';
import { canActAsBrand } from '@/lib/auth/capabilities';
import { createClient } from '@/lib/supabase/server';
import type {
  ActivityItem,
  JourneyStep,
  MapPinData,
} from '@/components/dashboard/interactive-overview';

/** Stylized South Asia → Europe canvas coords (x/y 0–100). */
const CITY_COORDS: Record<string, { x: number; y: number }> = {
  Chattogram: { x: 72, y: 58 },
  Dhaka: { x: 70, y: 52 },
  Gazipur: { x: 69, y: 50 },
  Narayanganj: { x: 71, y: 54 },
  Savar: { x: 68, y: 51 },
  Mongla: { x: 69, y: 64 },
  CEPZ: { x: 73, y: 59 },
  Stockholm: { x: 28, y: 22 },
  Hamburg: { x: 24, y: 30 },
  Rotterdam: { x: 20, y: 34 },
  Antwerp: { x: 18, y: 36 },
  Dubai: { x: 48, y: 48 },
  Colombo: { x: 62, y: 68 },
  Singapore: { x: 78, y: 72 },
};

function coordsFor(city: string | null | undefined, fallbackIndex: number) {
  if (city && CITY_COORDS[city]) return CITY_COORDS[city];
  // Spread unknown BD facilities around the BD mass
  return {
    x: 66 + (fallbackIndex % 5) * 2.2,
    y: 48 + (fallbackIndex % 4) * 3.5,
  };
}

export async function loadInteractiveOverview(ctx: SessionContext) {
  const supabase = createClient();
  const orgId = ctx.organizationId;
  const brandLike = canActAsBrand(ctx.orgType);

  const [
    { data: facilities },
    { data: shipments },
    { data: notifications },
    { data: passports },
    { data: tcs },
    { data: rels },
  ] = await Promise.all([
    supabase
      .from('facilities')
      .select('id, name, city, country, facility_type, is_verified, is_active')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(16),
    supabase
      .from('shipments')
      .select(
        'id, shipment_number, status, origin_port, destination_port, current_location, updated_at'
      )
      .or(
        `organization_id.eq.${orgId},shipper_org_id.eq.${orgId},consignee_org_id.eq.${orgId}`
      )
      .order('updated_at', { ascending: false })
      .limit(10),
    supabase
      .from('notifications')
      .select('id, title, body, severity, action_url, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(8),
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
      .limit(6),
    brandLike
      ? supabase
          .from('supplier_relationships')
          .select('supplier_org_id, tier_level')
          .eq('brand_org_id', orgId)
          .eq('status', 'active')
          .limit(12)
      : Promise.resolve({ data: [] as { supplier_org_id: string; tier_level: string }[] }),
  ]);

  const partnerIds = (rels ?? []).map((r) => r.supplier_org_id);
  const [{ data: partnerOrgs }, { data: partnerFacilities }] =
    partnerIds.length > 0
      ? await Promise.all([
          supabase.from('organizations').select('id, name, city, country').in('id', partnerIds),
          supabase
            .from('facilities')
            .select('id, name, city, country, organization_id, is_verified')
            .in('organization_id', partnerIds)
            .eq('is_active', true)
            .limit(12),
        ])
      : [{ data: [] as { id: string; name: string; city: string | null; country: string | null }[] }, { data: [] as { id: string; name: string; city: string | null; country: string | null; organization_id: string; is_verified: boolean }[] }];

  const pins: MapPinData[] = [];

  // Brand HQ pin (Europe-ish for brand/admin narrative, or BD for local HQ)
  pins.push({
    id: `hq-${orgId}`,
    label: ctx.orgName,
    city: 'Dhaka',
    country: 'BD',
    kind: 'brand',
    status: 'HQ',
    href: '/brand',
    x: 70,
    y: 52,
  });

  (facilities ?? []).slice(0, 8).forEach((f, i) => {
    const c = coordsFor(f.city, i);
    pins.push({
      id: f.id,
      label: f.name,
      city: f.city ?? '—',
      country: f.country ?? 'BD',
      kind: 'facility',
      status: f.is_verified ? 'Verified facility' : 'Declared facility',
      href: `/facilities/${f.id}`,
      x: c.x,
      y: c.y,
    });
  });

  (partnerOrgs ?? []).slice(0, 6).forEach((o, i) => {
    const c = coordsFor(o.city, 20 + i);
    pins.push({
      id: `partner-${o.id}`,
      label: o.name,
      city: o.city ?? 'BD',
      country: o.country ?? 'BD',
      kind: 'partner',
      status: 'Linked supplier',
      href: '/supplier',
      x: Math.min(88, c.x + 1),
      y: Math.min(78, c.y + 2),
    });
  });

  (partnerFacilities ?? []).slice(0, 4).forEach((f, i) => {
    const c = coordsFor(f.city, 30 + i);
    pins.push({
      id: `pfac-${f.id}`,
      label: f.name,
      city: f.city ?? '—',
      country: f.country ?? 'BD',
      kind: 'facility',
      status: f.is_verified ? 'Partner · verified' : 'Partner facility',
      href: '/supply-chain',
      x: c.x,
      y: c.y,
    });
  });

  (shipments ?? []).slice(0, 4).forEach((s, i) => {
    const dest = s.destination_port ?? 'Hamburg';
    const c = coordsFor(dest, 40 + i);
    pins.push({
      id: `ship-${s.id}`,
      label: s.shipment_number,
      city: dest,
      country: s.current_location ?? 'In transit',
      kind: 'port',
      status: s.status,
      href: `/shipments/${s.id}`,
      x: Math.max(16, Math.min(36, c.x)),
      y: Math.max(18, Math.min(42, c.y)),
    });
  });

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
      place: 'Audit',
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
