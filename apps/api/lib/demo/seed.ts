import type { SupabaseClient } from '@supabase/supabase-js';
import type { OrgType } from '@stt/types';
import { anchorTcDocument } from '@/lib/tc/anchor';
import { syncMassBalanceForMaterial } from '@/lib/wallet/mass-balance';

export type DemoBatchMeta = {
  orgIds: string[];
  facilityIds: string[];
  walletIds: string[];
  orderIds: string[];
  shipmentIds: string[];
  tcIds: string[];
  passportIds: string[];
  verificationIds: string[];
  notificationIds: string[];
  invitationIds: string[];
  relationshipIds: string[];
  tierIds: string[];
  transactionIds: string[];
  hostWalletId: string | null;
  summary: string[];
};

type SeedInput = {
  admin: SupabaseClient;
  hostOrgId: string;
  hostOrgType: OrgType;
  hostOrgName: string;
  userId: string;
};

const N = 25;
/** Partner supplier orgs created (orders/TCs cycle these). Caps for seed performance. */
const PARTNER_SUPPLIER_COUNT = Math.min(N, 15);

const FACILITY_TYPES = [
  'garment_factory',
  'knitting_unit',
  'weaving_unit',
  'dyeing_unit',
  'printing_unit',
  'washing_unit',
  'finishing_unit',
  'packing_logistics',
  'warehouse',
  'fabric_supplier',
] as const;

const ORDER_STATUSES = [
  'draft',
  'confirmed',
  'in_production',
  'shipped',
  'delivered',
  'confirmed',
  'in_production',
  'shipped',
  'delivered',
  'confirmed',
  'draft',
  'confirmed',
  'in_production',
  'shipped',
  'delivered',
  'confirmed',
  'in_production',
  'shipped',
  'delivered',
  'confirmed',
  'in_production',
  'shipped',
  'delivered',
  'confirmed',
  'delivered',
] as const;

const SHIP_STATUSES = [
  'pending',
  'in_transit',
  'customs',
  'delivered',
  'exception',
  'in_transit',
  'customs',
  'delivered',
  'pending',
  'in_transit',
  'pending',
  'in_transit',
  'customs',
  'delivered',
  'exception',
  'in_transit',
  'customs',
  'delivered',
  'pending',
  'in_transit',
  'customs',
  'delivered',
  'in_transit',
  'pending',
  'delivered',
] as const;

const TC_STATUSES = [
  'issued',
  'issued',
  'verified',
  'issued',
  'verified',
  'transferred',
  'issued',
  'verified',
  'issued',
  'draft',
  'issued',
  'verified',
  'issued',
  'verified',
  'transferred',
  'issued',
  'verified',
  'issued',
  'draft',
  'issued',
  'verified',
  'issued',
  'verified',
  'issued',
  'transferred',
] as const;

const VR_STATUSES = [
  'open',
  'assigned',
  'in_progress',
  'completed',
  'open',
  'assigned',
  'in_progress',
  'open',
  'completed',
  'open',
  'assigned',
  'in_progress',
  'completed',
  'open',
  'assigned',
  'in_progress',
  'open',
  'completed',
  'open',
  'assigned',
  'in_progress',
  'completed',
  'open',
  'assigned',
  'completed',
] as const;

const SEVERITIES = [
  'info',
  'low',
  'medium',
  'high',
  'critical',
  'info',
  'medium',
  'high',
  'low',
  'info',
  'info',
  'low',
  'medium',
  'high',
  'critical',
  'info',
  'medium',
  'high',
  'low',
  'info',
  'medium',
  'high',
  'critical',
  'low',
  'info',
] as const;

const PRODUCT_NAMES = [
  'Nordic Soft Tee',
  'Harbor Fleece Midlayer',
  'Coastline Oxford Shirt',
  'Fjell Merino Base',
  'Delta Cargo Pant',
  'Aurora Puffer Vest',
  'Sundown Linen Dress',
  'Trail Recycled Shell',
  'City Knit Polo',
  'Harbor Kids Tee',
  'Baltic Organic Hoodie',
  'River Stretch Chino',
  'Summit Softshell Jacket',
  'Canal Denim Jacket',
  'Meadow Rib Tank',
  'Harbor Utility Short',
  'Nordic Quilted Overshirt',
  'Coast Terry Sweatshirt',
  'Fjord Track Pant',
  'Drift Organic Crew',
  'Pine Merino Sock Pack',
  'Seabreeze Camp Shirt',
  'Alpine Cap Sleeve Tee',
  'Dockside Cargo Skirt',
  'Ember Recycled Bomber',
];

const SUPPLIER_PARTNERS = [
  { name: 'Chattogram Apparel Ltd.', city: 'Chattogram', tier: 'tier_1' as const },
  { name: 'Pacific Knitwear BD', city: 'Gazipur', tier: 'tier_2' as const },
  { name: 'Delta Spinning Mills', city: 'Narayanganj', tier: 'tier_4' as const },
  { name: 'Jamuna Dyeing Works', city: 'Savar', tier: 'tier_3' as const },
  { name: 'Padma Weave Industries', city: 'Narsingdi', tier: 'tier_3' as const },
  { name: 'Bay Finishing Ltd.', city: 'Chattogram', tier: 'tier_2' as const },
  { name: 'Greenleaf Packing BD', city: 'Dhaka', tier: 'tier_1' as const },
  { name: 'Surma Yarn Traders', city: 'Sylhet', tier: 'tier_4' as const },
  { name: 'Karnaphuli Print House', city: 'Chattogram', tier: 'tier_2' as const },
  { name: 'Meghna Accessories Co.', city: 'Cumilla', tier: 'tier_1' as const },
  { name: 'Tejgaon Knit Composite', city: 'Dhaka', tier: 'tier_1' as const },
  { name: 'Ashulia Wet Process Ltd.', city: 'Savar', tier: 'tier_3' as const },
  { name: 'Tongi Fabric Mills', city: 'Gazipur', tier: 'tier_3' as const },
  { name: 'Feni Embroidery Works', city: 'Feni', tier: 'tier_2' as const },
  { name: 'Mirpur Trim Suppliers', city: 'Dhaka', tier: 'tier_1' as const },
  { name: 'Barisal Cotton Ginning', city: 'Barisal', tier: 'tier_4' as const },
  { name: 'Khulna Denim Wash Co.', city: 'Khulna', tier: 'tier_2' as const },
  { name: 'Rajshahi Silk Weavers', city: 'Rajshahi', tier: 'tier_3' as const },
  { name: 'Mymensingh Yarn Hub', city: 'Mymensingh', tier: 'tier_4' as const },
  { name: 'Bogra Apparel Partners', city: 'Bogura', tier: 'tier_1' as const },
  { name: 'Jessore Knit Exports', city: 'Jashore', tier: 'tier_2' as const },
  { name: 'Rangpur Organic Spinners', city: 'Rangpur', tier: 'tier_4' as const },
  { name: 'Coxs Bazar Logistics BD', city: 'Cox\'s Bazar', tier: 'tier_1' as const },
  { name: 'Habiganj Finishing Mills', city: 'Habiganj', tier: 'tier_3' as const },
  { name: 'Pabna Garment Solutions', city: 'Pabna', tier: 'tier_1' as const },
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString();
}

function slugify(name: string, stamp: string) {
  return `${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40)}-${stamp}`;
}

function isBuyerHost(orgType: OrgType): boolean {
  return orgType === 'brand' || orgType === 'platform_admin';
}

async function insertOrg(
  admin: SupabaseClient,
  row: {
    name: string;
    slug: string;
    org_type: OrgType;
    country: string;
    city?: string;
    email?: string;
  }
) {
  const { data, error } = await admin
    .from('organizations')
    .insert({
      name: row.name,
      slug: row.slug,
      org_type: row.org_type,
      country: row.country,
      city: row.city ?? null,
      email: row.email ?? null,
      onboarding_completed: true,
      onboarding_step: 99,
      is_active: true,
    })
    .select('id, name, org_type')
    .single();
  if (error || !data) throw new Error(error?.message ?? `Failed creating ${row.name}`);
  return data as { id: string; name: string; org_type: OrgType };
}

async function ensureWallet(admin: SupabaseClient, orgId: string) {
  const { data: existing } = await admin
    .from('material_wallets')
    .select('id')
    .eq('organization_id', orgId)
    .is('facility_id', null)
    .maybeSingle();
  if (existing) return existing.id as string;

  const { data, error } = await admin
    .from('material_wallets')
    .insert({ organization_id: orgId })
    .select('id')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Wallet create failed');
  return data.id as string;
}

/**
 * Seeds ≥25 realistic rows for every Operate / Assure / Decide list surface.
 * Attaches visibility to the host org so the logged-in tenant sees full menus.
 */
export async function seedDemoDataset(input: SeedInput): Promise<{
  batchId: string;
  label: string;
  meta: DemoBatchMeta;
}> {
  const { admin, hostOrgId, hostOrgType, hostOrgName, userId } = input;
  const stamp = Date.now().toString(36);
  const summary: string[] = [];
  const meta: DemoBatchMeta = {
    orgIds: [],
    facilityIds: [],
    walletIds: [],
    orderIds: [],
    shipmentIds: [],
    tcIds: [],
    passportIds: [],
    verificationIds: [],
    notificationIds: [],
    invitationIds: [],
    relationshipIds: [],
    tierIds: [],
    transactionIds: [],
    hostWalletId: null,
    summary: [],
  };

  const { data: materials, error: matErr } = await admin
    .from('materials')
    .select('id, name, standard')
    .eq('is_active', true)
    .order('name');
  if (matErr || !materials?.length) {
    throw new Error(matErr?.message ?? 'Materials catalog is empty.');
  }

  const createdPartners: Array<{ id: string; name: string; org_type: OrgType }> = [];
  const hostAsBuyer = isBuyerHost(hostOrgType);

  // ── Brand + auditor ───────────────────────────────────────────────
  // platform_admin uses host as brandId (no Nordic Loom brand org).
  let brandId = hostOrgId;
  let brandName = hostOrgName;
  if (!hostAsBuyer) {
    const brand = await insertOrg(admin, {
      name: 'Nordic Loom Collective',
      slug: `nordic-loom-${stamp}`,
      org_type: 'brand',
      country: 'SE',
      city: 'Stockholm',
      email: 'sourcing@nordicloom.com',
    });
    createdPartners.push(brand);
    brandId = brand.id;
    brandName = brand.name;
  }

  let auditorId: string;
  let auditorName: string;
  if (hostOrgType === 'auditor') {
    auditorId = hostOrgId;
    auditorName = hostOrgName;
  } else {
    const auditor = await insertOrg(admin, {
      name: 'SGC Global Assurance',
      slug: `sgc-assurance-${stamp}`,
      org_type: 'auditor',
      country: 'BD',
      city: 'Dhaka',
      email: 'scheduling@sgc-assurance.com',
    });
    createdPartners.push(auditor);
    auditorId = auditor.id;
    auditorName = auditor.name;
  }
  summary.push(`Brand · ${brandName}`);
  summary.push(`Auditor · ${auditorName}`);

  // ── Partner suppliers (reuse host as #1 only when host is supplier) ─
  const suppliers: Array<{
    id: string;
    name: string;
    tier: string;
    walletId: string;
    facilityId: string;
  }> = [];

  for (let i = 0; i < PARTNER_SUPPLIER_COUNT; i += 1) {
    const spec = SUPPLIER_PARTNERS[i % SUPPLIER_PARTNERS.length];
    const facilityType = FACILITY_TYPES[i % FACILITY_TYPES.length];
    let orgId: string;
    let orgName: string;

    if (hostOrgType === 'supplier' && i === 0) {
      orgId = hostOrgId;
      orgName = hostOrgName;
    } else {
      const org = await insertOrg(admin, {
        name: spec.name,
        slug: slugify(spec.name, `${stamp}${i}`),
        org_type: 'supplier',
        country: 'BD',
        city: spec.city,
        email: `ops@${slugify(spec.name, 'mail')}.com`,
      });
      createdPartners.push(org);
      orgId = org.id;
      orgName = org.name;
    }

    const walletId = await ensureWallet(admin, orgId);
    if (orgId !== hostOrgId) meta.walletIds.push(walletId);
    else meta.hostWalletId = walletId;

    const { data: facility, error: facErr } = await admin
      .from('facilities')
      .insert({
        organization_id: orgId,
        name: `${spec.city} ${facilityType.replace(/_/g, ' ')}`,
        facility_type: facilityType,
        country: 'BD',
        city: spec.city,
        address_line1: `${spec.city}, Bangladesh`,
        production_capacity: 80000 + i * 12000,
        is_active: true,
        is_verified: i % 3 !== 0,
        verified_at: i % 3 !== 0 ? isoDaysAgo(20 + i) : null,
        tier_level: spec.tier,
      })
      .select('id')
      .single();
    if (facErr || !facility) throw new Error(facErr?.message ?? 'Facility failed');
    meta.facilityIds.push(facility.id);

    await admin.from('facility_certifications').insert([
      {
        facility_id: facility.id,
        cert_name: 'GOTS',
        cert_number: `GOTS-BD-${stamp}-${i + 1}`,
        issuing_body: 'Control Union',
        issued_date: daysAgo(200 + i),
        expiry_date: i < 2 ? daysAgo(5) : daysAgo(-400 - i),
        is_verified: i % 3 !== 0,
      },
      {
        facility_id: facility.id,
        cert_name: 'GRS',
        cert_number: `GRS-BD-${stamp}-${i + 1}`,
        issuing_body: 'Textile Exchange',
        issued_date: daysAgo(160 + i),
        expiry_date: daysAgo(-360 - i),
        is_verified: true,
      },
    ]);

    if (brandId !== orgId) {
      const { data: rel } = await admin
        .from('supplier_relationships')
        .insert({
          brand_org_id: brandId,
          supplier_org_id: orgId,
          tier_level: spec.tier,
          status: 'active',
        })
        .select('id')
        .single();
      if (rel) meta.relationshipIds.push(rel.id);

      const { data: tier } = await admin
        .from('supply_chain_tiers')
        .insert({
          brand_org_id: brandId,
          supplier_org_id: orgId,
          tier_level: spec.tier,
        })
        .select('id')
        .single();
      if (tier) meta.tierIds.push(tier.id);
    }

    suppliers.push({
      id: orgId,
      name: orgName,
      tier: spec.tier,
      walletId,
      facilityId: facility.id,
    });
  }
  summary.push(`${suppliers.length} suppliers + relationships`);

  // Host always gets N dedicated facilities (facilities / supply-chain pages)
  const hostFacilityNames = [
    'CEPZ Unit-1 Cut & Sew',
    'CEPZ Unit-2 Finishing',
    'Agrabad Packing Hub',
    'Halishahar Knit Line',
    'Patenga Dye House',
    'Kalurghat Print Floor',
    'Nasirabad QC Lab',
    'EPZ Warehouse A',
    'EPZ Warehouse B',
    'Anowara Sample Room',
    'CEPZ Unit-3 Assembly',
    'CEPZ Unit-4 Embroidery',
    'Agrabad Trim Store',
    'Halishahar Wash Line',
    'Patenga Softflow Dye',
    'Kalurghat Screen Print',
    'Nasirabad Lab Annex',
    'EPZ Warehouse C',
    'EPZ Cold Store',
    'Anowara Fitting Room',
    'CEPZ Unit-5 Packing',
    'Fouzdarhat Cut Room',
    'Bhatiary Sewing Floor',
    'Sitakunda Fabric Yard',
    'Karnaphuli Sample Hub',
  ];
  for (let i = 0; i < N; i += 1) {
    const facilityType = FACILITY_TYPES[i % FACILITY_TYPES.length];
    const { data: fac, error } = await admin
      .from('facilities')
      .insert({
        organization_id: hostOrgId,
        name: hostFacilityNames[i],
        facility_type: facilityType,
        country: 'BD',
        city: 'Chattogram',
        address_line1: `Chattogram EPZ Block ${i + 1}`,
        production_capacity: 50000 + i * 8000,
        is_active: true,
        is_verified: i > 1,
        verified_at: i > 1 ? isoDaysAgo(10 + i) : null,
        tier_level: 'tier_1',
      })
      .select('id')
      .single();
    if (error || !fac) throw new Error(error?.message ?? 'Host facility failed');
    meta.facilityIds.push(fac.id);

    await admin.from('facility_certifications').insert({
      facility_id: fac.id,
      cert_name: i % 2 === 0 ? 'GOTS' : 'OEKO-TEX',
      cert_number: `HOST-${stamp}-${i + 1}`,
      issuing_body: 'Control Union',
      issued_date: daysAgo(90 + i),
      expiry_date: i < 3 ? daysAgo(2) : daysAgo(-300),
      is_verified: i > 1,
    });
  }
  summary.push(`${N} host facilities`);

  const brandWalletId = await ensureWallet(admin, brandId);
  if (brandId === hostOrgId) meta.hostWalletId = brandWalletId;
  else meta.walletIds.push(brandWalletId);

  const hostWalletId =
    meta.hostWalletId ?? (await ensureWallet(admin, hostOrgId));
  meta.hostWalletId = hostWalletId;

  meta.orgIds = createdPartners.map((o) => o.id);

  // ── Wallet credits (≥N materials on host) ─────────────────────────
  const creditMats = materials.slice(0, N);
  for (let i = 0; i < creditMats.length; i += 1) {
    const m = creditMats[i];
    const qty = 2500 + i * 450;
    const { data: tx, error } = await admin
      .from('material_transactions')
      .insert({
        wallet_id: hostWalletId,
        material_id: m.id,
        transaction_type: 'credit',
        quantity: qty,
        unit: 'KG',
        reference_type: 'opening_balance',
        description: `Demo opening · ${m.name}`,
        created_by: userId,
      })
      .select('id')
      .single();
    if (error || !tx) throw new Error(error?.message ?? 'Credit failed');
    meta.transactionIds.push(tx.id);
    await syncMassBalanceForMaterial({
      supabase: admin,
      organizationId: hostOrgId,
      walletId: hostWalletId,
      materialId: m.id,
    }).catch(() => undefined);
  }

  // Extra credits on partner wallets (needed when brand/admin TCs cycle issuers)
  for (const s of suppliers) {
    for (let mi = 0; mi < Math.min(materials.length, 8); mi += 1) {
      const m = materials[mi];
      const { data: tx } = await admin
        .from('material_transactions')
        .insert({
          wallet_id: s.walletId,
          material_id: m.id,
          transaction_type: 'credit',
          quantity: 8000,
          unit: 'KG',
          reference_type: 'opening_balance',
          description: `Partner stock · ${s.name}`,
          created_by: userId,
        })
        .select('id')
        .single();
      if (tx) meta.transactionIds.push(tx.id);
    }
  }
  summary.push(`${N}+ wallet credits / balances`);

  // ── Orders (≥N visible to host) ───────────────────────────────────
  // brand/platform_admin: buyer = host; supplier cycles partners
  // supplier host: supplier = host
  for (let i = 0; i < N; i += 1) {
    const partner = suppliers[i % suppliers.length];
    const supplierOrgId = hostOrgType === 'supplier' ? hostOrgId : partner.id;
    const orderNumber = `ORD-2026-${stamp}-${String(i + 1).padStart(2, '0')}`;
    const { data: order, error } = await admin
      .from('orders')
      .insert({
        organization_id: brandId,
        buyer_org_id: brandId,
        supplier_org_id: supplierOrgId,
        order_number: orderNumber,
        po_number: `PO-2026-${4500 + i}`,
        season: i % 2 === 0 ? 'SS27' : 'AW26',
        total_quantity: 12000 + i * 2500,
        quantity_unit: 'pcs',
        status: ORDER_STATUSES[i],
        order_date: daysAgo(55 - i * 3),
        notes: `${PRODUCT_NAMES[i]} program · EU DC`,
        facility_id:
          hostOrgType === 'supplier' ? meta.facilityIds[i] : partner.facilityId,
      })
      .select('id')
      .single();
    if (error || !order) throw new Error(error?.message ?? 'Order failed');
    meta.orderIds.push(order.id);

    await admin.from('order_items').insert({
      order_id: order.id,
      description: PRODUCT_NAMES[i],
      quantity: 12000 + i * 2500,
    });
  }
  summary.push(`${N} purchase orders`);

  // ── Shipments (≥N) ────────────────────────────────────────────────
  const ports = [
    ['Chattogram', 'Hamburg'],
    ['Chattogram', 'Rotterdam'],
    ['Mongla', 'Antwerp'],
    ['Chattogram', 'Gdansk'],
    ['Chattogram', 'Felixstowe'],
    ['Chattogram', 'Le Havre'],
    ['Chattogram', 'Gothenburg'],
    ['Chattogram', 'Barcelona'],
    ['Chattogram', 'Trieste'],
    ['Chattogram', 'Piraeus'],
    ['Chattogram', 'Valencia'],
    ['Chattogram', 'Marseille'],
    ['Mongla', 'Hamburg'],
    ['Chattogram', 'Bremerhaven'],
    ['Chattogram', 'Copenhagen'],
    ['Chattogram', 'Oslo'],
    ['Chattogram', 'Helsinki'],
    ['Chattogram', 'Aarhus'],
    ['Chattogram', 'Lisbon'],
    ['Chattogram', 'Genoa'],
    ['Mongla', 'Rotterdam'],
    ['Chattogram', 'Zeebrugge'],
    ['Chattogram', 'Koper'],
    ['Chattogram', 'Constanta'],
    ['Chattogram', 'Istanbul'],
  ];
  for (let i = 0; i < N; i += 1) {
    const partner = suppliers[i % suppliers.length];
    const shipper = hostOrgType === 'supplier' ? hostOrgId : partner.id;
    const [origin, destination] = ports[i];
    const { data: shipment, error } = await admin
      .from('shipments')
      .insert({
        organization_id: brandId,
        order_id: meta.orderIds[i],
        shipment_number: `SHP-26${stamp.slice(-4)}-${5100 + i}`,
        bl_number: `BL${stamp.toUpperCase()}${1000 + i}`,
        container_number: `TGHU${4500000 + i}`,
        shipper_org_id: shipper,
        consignee_org_id: brandId,
        origin_port: origin,
        destination_port: destination,
        country_of_origin: 'BD',
        total_weight_kg: 6000 + i * 700,
        status: SHIP_STATUSES[i],
        current_location:
          SHIP_STATUSES[i] === 'delivered' ? destination : 'Indian Ocean transit',
        eta: isoDaysAgo(SHIP_STATUSES[i] === 'delivered' ? 8 : -6 - i),
        actual_departure: isoDaysAgo(16 - i),
        actual_arrival: SHIP_STATUSES[i] === 'delivered' ? isoDaysAgo(8) : null,
      })
      .select('id')
      .single();
    if (error || !shipment) throw new Error(error?.message ?? 'Shipment failed');
    meta.shipmentIds.push(shipment.id);

    await admin.from('shipment_events').insert([
      {
        shipment_id: shipment.id,
        event_type: 'created',
        location: origin,
        description: 'Booking confirmed',
        source: 'manual',
        event_time: isoDaysAgo(18 - i),
      },
      {
        shipment_id: shipment.id,
        event_type: 'departed',
        location: origin,
        description: 'Vessel departed',
        source: 'carrier',
        event_time: isoDaysAgo(16 - i),
      },
      {
        shipment_id: shipment.id,
        event_type: SHIP_STATUSES[i] === 'delivered' ? 'delivered' : 'in_transit',
        location: SHIP_STATUSES[i] === 'delivered' ? destination : 'Colombo',
        description: 'Milestone update',
        source: 'carrier',
        event_time: isoDaysAgo(4),
      },
    ]);
  }
  summary.push(`${N} shipments`);

  // ── TCs (≥N) — brand/platform_admin: inbound from partners; supplier: host issues
  for (let i = 0; i < N; i += 1) {
    const material = materials[i % materials.length];
    const qty = 180 + i * 35;
    const status = TC_STATUSES[i];
    const issuer =
      hostOrgType === 'supplier'
        ? {
            id: hostOrgId,
            name: hostOrgName,
            walletId: hostWalletId,
            tier: 'tier_1',
            facilityId: meta.facilityIds[0],
          }
        : suppliers[i % suppliers.length];
    const receiverOrgId = brandId;

    const { data: tc, error } = await admin
      .from('transaction_certificates')
      .insert({
        organization_id: issuer.id,
        issuer_org_id: issuer.id,
        receiver_org_id: receiverOrgId,
        tc_status: status === 'draft' ? 'draft' : status,
        total_quantity: qty,
        quantity_unit: 'KG',
        issue_date: daysAgo(30 - i),
        notes: `${material.standard ?? 'Certified'} transfer · ${PRODUCT_NAMES[i]}`,
        created_by: userId,
        order_id: meta.orderIds[i],
        shipment_id: meta.shipmentIds[i],
      })
      .select('id, tc_number, issue_date')
      .single();
    if (error || !tc) throw new Error(error?.message ?? 'TC failed');
    meta.tcIds.push(tc.id);

    await admin.from('tc_line_items').insert({
      tc_id: tc.id,
      material_id: material.id,
      quantity: qty,
      unit: 'KG',
      certification: material.standard ?? material.name,
    });

    if (status !== 'draft') {
      const { data: debitTx } = await admin
        .from('material_transactions')
        .insert({
          wallet_id: issuer.walletId,
          material_id: material.id,
          transaction_type: 'debit',
          quantity: qty,
          unit: 'KG',
          reference_type: 'tc',
          reference_id: tc.id,
          description: `TC issue ${tc.tc_number}`,
          created_by: userId,
        })
        .select('id')
        .single();
      if (debitTx) meta.transactionIds.push(debitTx.id);

      await syncMassBalanceForMaterial({
        supabase: admin,
        organizationId: issuer.id,
        walletId: issuer.walletId,
        materialId: material.id,
      }).catch(() => undefined);

      await anchorTcDocument({
        supabase: admin,
        tcId: tc.id,
        tcNumber: tc.tc_number,
        issuerOrgId: issuer.id,
        receiverOrgId,
        issueDate: tc.issue_date,
        totalQuantity: qty,
        quantityUnit: 'KG',
        lines: [
          {
            material_id: material.id,
            quantity: qty,
            unit: 'KG',
            certification: material.standard ?? material.name,
          },
        ],
      }).catch(() => undefined);
    }
  }
  summary.push(`${N} transaction certificates`);

  // ── Digital product passports (≥N on HOST so /dpp fills) ──────────
  for (let i = 0; i < N; i += 1) {
    const material = materials[i % materials.length];
    const published = i < 18;
    const { data: passport, error } = await admin
      .from('product_passports')
      .insert({
        organization_id: hostOrgId,
        product_name: PRODUCT_NAMES[i],
        product_sku: `NL-${200 + i}-${String(i).padStart(3, '0')}`,
        product_category: 'apparel',
        season: i % 2 === 0 ? 'SS27' : 'AW26',
        country_of_origin: 'BD',
        material_composition: [
          { material: material.name, pct: 90 + (i % 8), certified: true },
          { material: 'Elastane', pct: 10 - (i % 8), certified: false },
        ],
        carbon_footprint_kg: 3.2 + i * 0.45,
        water_usage_liters: 900 + i * 120,
        care_instructions: {
          text: 'Wash cold, hang dry. Partner take-back eligible.',
        },
        recyclability_info: 'Fiber-to-fiber eligible',
        status: published ? 'published' : 'draft',
        published_at: published ? isoDaysAgo(8 - (i % 5)) : null,
        created_by: userId,
      })
      .select('id')
      .single();
    if (error || !passport) throw new Error(error?.message ?? 'DPP failed');
    meta.passportIds.push(passport.id);

    await admin.from('passport_materials').insert({
      passport_id: passport.id,
      material_id: material.id,
      percentage: 92,
      tc_id: meta.tcIds[i] ?? null,
      certification: material.standard,
      is_verified: published,
      origin_country: 'BD',
    });

    await admin.from('passport_supply_chain').insert([
      {
        passport_id: passport.id,
        display_name: suppliers[Math.min(2, suppliers.length - 1)].name,
        process_type: 'spinning',
        country: 'BD',
        tier_level: 'tier_4',
        sequence_order: 1,
        is_visible_to_public: true,
      },
      {
        passport_id: passport.id,
        display_name: hostOrgName,
        process_type: 'cut_sew',
        country: 'BD',
        tier_level: 'tier_1',
        sequence_order: 2,
        is_visible_to_public: true,
      },
    ]);

    await admin.from('passport_sustainability').insert({
      passport_id: passport.id,
      metric_name: 'carbon_footprint',
      metric_value: 3.2 + i * 0.45,
      metric_unit: 'kg_co2e',
      verification_source: 'Higgs MSI + facility data',
      is_verified: published,
    });

    await admin.from('passport_qr_codes').insert([
      {
        passport_id: passport.id,
        qr_type: 'product',
        qr_data: `STT-P-${passport.id.slice(0, 8).toUpperCase()}`,
        is_active: true,
      },
      {
        passport_id: passport.id,
        qr_type: 'batch',
        qr_data: `STT-B-${stamp}-${i + 1}`,
        is_active: true,
      },
    ]);
  }
  summary.push(`${N} digital product passports`);

  // ── Verification marketplace (≥N) ─────────────────────────────────
  const standardsPool = [
    ['GOTS', 'GRS'],
    ['GRS'],
    ['SMETA', 'GOTS'],
    ['OEKO-TEX'],
    ['BCI', 'GOTS'],
    ['GRS', 'RCS'],
    ['SMETA'],
    ['GOTS'],
    ['GRS', 'OEKO-TEX'],
    ['BCI'],
    ['GOTS', 'SMETA'],
    ['GRS'],
    ['OEKO-TEX', 'GOTS'],
    ['RCS'],
    ['BCI', 'GRS'],
    ['SMETA', 'OEKO-TEX'],
    ['GOTS'],
    ['GRS', 'SMETA'],
    ['OEKO-TEX'],
    ['BCI'],
    ['GOTS', 'RCS'],
    ['GRS'],
    ['SMETA'],
    ['GOTS', 'OEKO-TEX'],
    ['BCI', 'SMETA'],
  ];
  for (let i = 0; i < N; i += 1) {
    const status = VR_STATUSES[i];
    const supplierId =
      hostOrgType === 'supplier' ? hostOrgId : suppliers[i % suppliers.length].id;
    const { data: vr, error } = await admin
      .from('verification_requests')
      .insert({
        buyer_org_id: brandId,
        supplier_org_id: supplierId,
        verification_type: i % 2 === 0 ? 'physical' : 'certificate',
        scope: `Demo scope ${i + 1} · ${PRODUCT_NAMES[i]}`,
        standards: standardsPool[i],
        deadline_date: daysAgo(-14 - i),
        budget_max_usd: 500 + i * 120,
        notes: 'Pilot verification batch',
        status,
        created_by: userId,
      })
      .select('id')
      .single();
    if (error || !vr) throw new Error(error?.message ?? 'Verification failed');
    meta.verificationIds.push(vr.id);

    if (status !== 'open') {
      const { data: assignment } = await admin
        .from('verification_assignments')
        .insert({
          request_id: vr.id,
          auditor_org_id: auditorId,
          status: status === 'completed' ? 'completed' : 'accepted',
          assigned_at: isoDaysAgo(6),
          accepted_at: isoDaysAgo(5),
        })
        .select('id')
        .single();

      if (status === 'completed' && assignment) {
        await admin.from('audit_reports').insert({
          assignment_id: assignment.id,
          request_id: vr.id,
          report_title: `Pilot audit · ${PRODUCT_NAMES[i]}`,
          overall_rating: i % 2 === 0 ? 'pass' : 'conditional',
          score: 70 + (i % 25),
          findings_summary: `Demo findings for ${PRODUCT_NAMES[i]}`,
          audit_date: daysAgo(3),
          is_published: true,
          published_at: isoDaysAgo(2),
        });
      }
    }
  }
  summary.push(`${N} verification requests (+ audit reports)`);

  // ── Alerts / membership (≥N each) ─────────────────────────────────
  for (let i = 0; i < N; i += 1) {
    const { data: row } = await admin
      .from('notifications')
      .insert({
        organization_id: hostOrgId,
        title: `Demo alert ${i + 1} · ${PRODUCT_NAMES[i]}`,
        body: `Pilot notification for ${PRODUCT_NAMES[i]} workflow.`,
        severity: SEVERITIES[i],
        module: ['orders', 'shipments', 'tc', 'verification', 'wallet'][i % 5],
        entity_type: 'demo',
        action_url: ['/orders', '/shipments', '/tc', '/verification', '/wallet'][i % 5],
        channel: 'in_app',
        is_read: i % 3 === 0,
      })
      .select('id')
      .single();
    if (row) meta.notificationIds.push(row.id);
  }

  for (let i = 0; i < N; i += 1) {
    const { data: invite } = await admin
      .from('invitations')
      .insert({
        organization_id: hostOrgId,
        email: `pilot.user${i + 1}@nordicloom-demo.com`,
        invited_by: userId,
        expires_at: isoDaysAgo(-10 - i),
      })
      .select('id')
      .single();
    if (invite) meta.invitationIds.push(invite.id);
  }
  summary.push(`${N} alerts + ${N} membership invites`);
  summary.push('Risk · Compliance · Sustainability · Reports derived from ops data');

  meta.summary = summary;
  const label = `Full pilot · ${N}/menu · ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`;

  const { data: batch, error: batchErr } = await admin
    .from('demo_batches')
    .insert({
      label,
      host_organization_id: hostOrgId,
      created_by: userId,
      org_ids: meta.orgIds,
      meta,
    })
    .select('id')
    .single();
  if (batchErr || !batch) {
    throw new Error(batchErr?.message ?? 'Could not record demo batch.');
  }

  return { batchId: batch.id as string, label, meta };
}
