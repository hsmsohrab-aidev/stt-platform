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
 * Seeds a realistic multi-org dataset attached to the logged-in host org.
 * Uses service role so supplier/auditor orgs and cross-party rows can be written.
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

  const byName = (name: string) =>
    materials.find((m) => m.name === name)?.id as string | undefined;
  const organicCotton = byName('Organic Cotton') ?? materials[0].id;
  const recycledPoly = byName('Recycled Polyester') ?? materials[1]?.id ?? materials[0].id;
  const bciCotton = byName('BCI Cotton') ?? materials[0].id;
  const merino = byName('Merino Wool') ?? materials[0].id;

  // ── Partner orgs (realistic trade names) ──────────────────────────
  let brandId = hostOrgId;
  let brandName = hostOrgName;
  const createdPartners: Array<{ id: string; name: string; org_type: OrgType }> = [];

  if (hostOrgType !== 'brand') {
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

  const supplierSpecs = [
    {
      name: 'Chattogram Apparel Ltd.',
      slug: `chattogram-apparel-${stamp}`,
      city: 'Chattogram',
      email: 'ops@chattogramapparel.com',
      tier: 'tier_1' as const,
      facility: {
        name: 'CEPZ Unit-3 Knit Complex',
        type: 'garment_factory',
        city: 'Chattogram',
        capacity: 185000,
      },
    },
    {
      name: 'Pacific Knitwear BD',
      slug: `pacific-knitwear-${stamp}`,
      city: 'Gazipur',
      email: 'planning@pacificknitwear.com',
      tier: 'tier_2' as const,
      facility: {
        name: 'Gazipur Fabric Mill',
        type: 'fabric_supplier',
        city: 'Gazipur',
        capacity: 420000,
      },
    },
    {
      name: 'Delta Spinning Mills',
      slug: `delta-spinning-${stamp}`,
      city: 'Narayanganj',
      email: 'qc@deltaspinning.com.bd',
      tier: 'tier_4' as const,
      facility: {
        name: 'Fatullah Spinning Plant',
        type: 'spinning_mill',
        city: 'Narayanganj',
        capacity: 96000,
      },
    },
  ];

  const suppliers: Array<{
    id: string;
    name: string;
    tier: string;
    walletId: string;
    facilityId: string;
  }> = [];

  for (const spec of supplierSpecs) {
    let orgId: string;
    let orgName: string;
    if (hostOrgType === 'supplier' && suppliers.length === 0) {
      orgId = hostOrgId;
      orgName = hostOrgName;
    } else {
      const org = await insertOrg(admin, {
        name: spec.name,
        slug: spec.slug,
        org_type: 'supplier',
        country: 'BD',
        city: spec.city,
        email: spec.email,
      });
      createdPartners.push(org);
      orgId = org.id;
      orgName = org.name;
    }

    const walletId = await ensureWallet(admin, orgId);
    meta.walletIds.push(walletId);

    const { data: facility, error: facErr } = await admin
      .from('facilities')
      .insert({
        organization_id: orgId,
        name: spec.facility.name,
        facility_type: spec.facility.type,
        country: 'BD',
        city: spec.facility.city,
        address_line1: `${spec.facility.city}, Bangladesh`,
        production_capacity: spec.facility.capacity,
        is_active: true,
        is_verified: true,
        verified_at: isoDaysAgo(30),
      })
      .select('id')
      .single();
    if (facErr || !facility) throw new Error(facErr?.message ?? 'Facility failed');
    meta.facilityIds.push(facility.id);

    await admin.from('facility_certifications').insert([
      {
        facility_id: facility.id,
        cert_name: 'GOTS',
        cert_number: `GOTS-BD-${stamp.slice(-4)}-${suppliers.length + 1}`,
        issuing_body: 'Control Union',
        issued_date: daysAgo(220),
        expiry_date: daysAgo(-400),
        is_verified: true,
      },
      {
        facility_id: facility.id,
        cert_name: 'GRS',
        cert_number: `GRS-BD-${stamp.slice(-4)}-${suppliers.length + 1}`,
        issuing_body: 'Textile Exchange',
        issued_date: daysAgo(180),
        expiry_date: daysAgo(-500),
        is_verified: true,
      },
    ]);

    if (brandId !== orgId) {
      const { data: rel, error: relErr } = await admin
        .from('supplier_relationships')
        .insert({
          brand_org_id: brandId,
          supplier_org_id: orgId,
          tier_level: spec.tier,
          status: 'active',
        })
        .select('id')
        .single();
      if (!relErr && rel) meta.relationshipIds.push(rel.id);

      const { data: tier, error: tierErr } = await admin
        .from('supply_chain_tiers')
        .insert({
          brand_org_id: brandId,
          supplier_org_id: orgId,
          tier_level: spec.tier,
        })
        .select('id')
        .single();
      if (!tierErr && tier) meta.tierIds.push(tier.id);
    }

    suppliers.push({
      id: orgId,
      name: orgName,
      tier: spec.tier,
      walletId,
      facilityId: facility.id,
    });
    summary.push(`Supplier · ${orgName}`);
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
  summary.push(`Auditor · ${auditorName}`);

  meta.orgIds = createdPartners.map((o) => o.id);

  const brandWalletId = await ensureWallet(admin, brandId);
  meta.hostWalletId = brandId === hostOrgId ? brandWalletId : null;
  if (brandId !== hostOrgId) meta.walletIds.push(brandWalletId);

  // Brand HQ facility for supply-chain map density
  if (hostOrgType === 'brand' || brandId !== hostOrgId) {
    const { data: brandFac } = await admin
      .from('facilities')
      .insert({
        organization_id: brandId,
        name: `${brandName} Distribution Hub`,
        facility_type: 'warehouse',
        country: hostOrgType === 'brand' ? 'BD' : 'SE',
        city: hostOrgType === 'brand' ? 'Dhaka' : 'Stockholm',
        is_active: true,
        is_verified: false,
      })
      .select('id')
      .single();
    if (brandFac) meta.facilityIds.push(brandFac.id);
  }

  // ── Wallet credits (opening balances) ─────────────────────────────
  const creditPlan: Array<{
    walletId: string;
    orgId: string;
    materialId: string;
    qty: number;
    note: string;
  }> = [
    {
      walletId: suppliers[0].walletId,
      orgId: suppliers[0].id,
      materialId: organicCotton,
      qty: 18500,
      note: 'GOTS lot intake · Q2 ginning season',
    },
    {
      walletId: suppliers[0].walletId,
      orgId: suppliers[0].id,
      materialId: recycledPoly,
      qty: 9200,
      note: 'GRS yarn receipt · Busan feeder',
    },
    {
      walletId: suppliers[1].walletId,
      orgId: suppliers[1].id,
      materialId: bciCotton,
      qty: 14300,
      note: 'BCI fabric greige · opening stock',
    },
    {
      walletId: suppliers[2].walletId,
      orgId: suppliers[2].id,
      materialId: merino,
      qty: 4100,
      note: 'Merino tops · NZ farm group',
    },
    {
      walletId: brandWalletId,
      orgId: brandId,
      materialId: organicCotton,
      qty: 2400,
      note: 'Inbound TC inventory · sample room',
    },
  ];

  for (const c of creditPlan) {
    const { data: tx, error } = await admin
      .from('material_transactions')
      .insert({
        wallet_id: c.walletId,
        material_id: c.materialId,
        transaction_type: 'credit',
        quantity: c.qty,
        unit: 'KG',
        reference_type: 'opening_balance',
        description: c.note,
        created_by: userId,
      })
      .select('id')
      .single();
    if (error || !tx) throw new Error(error?.message ?? 'Credit failed');
    meta.transactionIds.push(tx.id);
    await syncMassBalanceForMaterial({
      supabase: admin,
      organizationId: c.orgId,
      walletId: c.walletId,
      materialId: c.materialId,
    }).catch(() => undefined);
  }
  summary.push('Material wallets credited');

  // ── Orders ────────────────────────────────────────────────────────
  const orderDefs = [
    {
      supplier: suppliers[0],
      po: 'PO-2026-4481',
      season: 'SS27',
      qty: 48000,
      status: 'in_production',
      desc: "Women's organic tee · style NL-TEE-220",
    },
    {
      supplier: suppliers[1],
      po: 'PO-2026-4512',
      season: 'SS27',
      qty: 22000,
      status: 'confirmed',
      desc: 'Recycled poly fleece · style NL-FLC-088',
    },
    {
      supplier: suppliers[0],
      po: 'PO-2026-4390',
      season: 'AW26',
      qty: 31000,
      status: 'shipped',
      desc: 'Merino base layer · style NL-BL-014',
    },
  ];

  const orderIds: string[] = [];
  for (let i = 0; i < orderDefs.length; i += 1) {
    const def = orderDefs[i];
    const orderNumber = `ORD-2026${String(i + 3).padStart(2, '0')}-${4400 + i}`;
    const { data: order, error } = await admin
      .from('orders')
      .insert({
        organization_id: brandId,
        buyer_org_id: brandId,
        supplier_org_id: def.supplier.id,
        order_number: orderNumber,
        po_number: def.po,
        season: def.season,
        total_quantity: def.qty,
        quantity_unit: 'pcs',
        status: def.status,
        order_date: daysAgo(40 - i * 7),
        notes: `${def.desc} · packed for EU DC`,
      })
      .select('id')
      .single();
    if (error || !order) throw new Error(error?.message ?? 'Order failed');
    orderIds.push(order.id);
    meta.orderIds.push(order.id);

    await admin.from('order_items').insert({
      order_id: order.id,
      description: def.desc,
      quantity: def.qty,
    });
  }
  summary.push(`${orderIds.length} purchase orders`);

  // ── Shipments ─────────────────────────────────────────────────────
  const shipDefs = [
    {
      orderId: orderIds[0],
      shipper: suppliers[0].id,
      number: `SHP-2607-${5100 + Number(stamp.slice(-3) || 1)}`,
      bl: 'MEDU8821941',
      container: 'TGHU4598213',
      origin: 'Chattogram',
      dest: 'Hamburg',
      status: 'in_transit',
      weight: 12600,
      loc: 'Colombo anchorage',
    },
    {
      orderId: orderIds[2],
      shipper: suppliers[0].id,
      number: `SHP-2606-${5200 + Number(stamp.slice(-3) || 2)}`,
      bl: 'HLCUBD2605187',
      container: 'MSCU7712044',
      origin: 'Chattogram',
      dest: 'Rotterdam',
      status: 'delivered',
      weight: 9800,
      loc: 'Rotterdam DC',
    },
  ];

  const shipmentIds: string[] = [];
  for (const s of shipDefs) {
    const { data: shipment, error } = await admin
      .from('shipments')
      .insert({
        organization_id: brandId,
        order_id: s.orderId,
        shipment_number: s.number,
        bl_number: s.bl,
        container_number: s.container,
        shipper_org_id: s.shipper,
        consignee_org_id: brandId,
        origin_port: s.origin,
        destination_port: s.dest,
        total_weight_kg: s.weight,
        status: s.status,
        current_location: s.loc,
        eta: isoDaysAgo(s.status === 'delivered' ? 12 : -8),
        actual_departure: isoDaysAgo(18),
        actual_arrival: s.status === 'delivered' ? isoDaysAgo(12) : null,
      })
      .select('id')
      .single();
    if (error || !shipment) throw new Error(error?.message ?? 'Shipment failed');
    shipmentIds.push(shipment.id);
    meta.shipmentIds.push(shipment.id);

    await admin.from('shipment_events').insert([
      {
        shipment_id: shipment.id,
        event_type: 'created',
        location: s.origin,
        description: `Booking confirmed · ${s.number}`,
        source: 'manual',
        event_time: isoDaysAgo(20),
      },
      {
        shipment_id: shipment.id,
        event_type: 'departed',
        location: s.origin,
        description: 'Vessel departed',
        source: 'carrier',
        event_time: isoDaysAgo(18),
      },
      {
        shipment_id: shipment.id,
        event_type: s.status === 'delivered' ? 'delivered' : 'in_transit',
        location: s.loc,
        description:
          s.status === 'delivered'
            ? 'Gate-in at destination DC'
            : 'Transshipment underway',
        source: 'carrier',
        event_time: isoDaysAgo(s.status === 'delivered' ? 12 : 3),
      },
    ]);
  }
  summary.push(`${shipmentIds.length} shipments with milestones`);

  // ── Transaction certificates ──────────────────────────────────────
  async function issueTc(opts: {
    issuer: (typeof suppliers)[0];
    materialId: string;
    qty: number;
    certification: string;
    orderId?: string;
    shipmentId?: string;
    status?: string;
  }) {
    const { data: tc, error } = await admin
      .from('transaction_certificates')
      .insert({
        organization_id: opts.issuer.id,
        issuer_org_id: opts.issuer.id,
        receiver_org_id: brandId,
        tc_status: opts.status ?? 'issued',
        total_quantity: opts.qty,
        quantity_unit: 'KG',
        issue_date: daysAgo(14),
        notes: `${opts.certification} transfer · ${opts.issuer.name}`,
        created_by: userId,
        ...(opts.orderId ? { order_id: opts.orderId } : {}),
        ...(opts.shipmentId ? { shipment_id: opts.shipmentId } : {}),
      })
      .select('id, tc_number, issue_date')
      .single();
    if (error || !tc) throw new Error(error?.message ?? 'TC failed');

    await admin.from('tc_line_items').insert({
      tc_id: tc.id,
      material_id: opts.materialId,
      quantity: opts.qty,
      unit: 'KG',
      certification: opts.certification,
    });

    const { data: debitTx, error: debitErr } = await admin
      .from('material_transactions')
      .insert({
        wallet_id: opts.issuer.walletId,
        material_id: opts.materialId,
        transaction_type: 'debit',
        quantity: opts.qty,
        unit: 'KG',
        reference_type: 'tc',
        reference_id: tc.id,
        description: `TC issue ${tc.tc_number}`,
        created_by: userId,
      })
      .select('id')
      .single();
    if (debitErr) throw new Error(debitErr.message);
    if (debitTx) meta.transactionIds.push(debitTx.id);

    await syncMassBalanceForMaterial({
      supabase: admin,
      organizationId: opts.issuer.id,
      walletId: opts.issuer.walletId,
      materialId: opts.materialId,
    }).catch(() => undefined);

    await anchorTcDocument({
      supabase: admin,
      tcId: tc.id,
      tcNumber: tc.tc_number,
      issuerOrgId: opts.issuer.id,
      receiverOrgId: brandId,
      issueDate: tc.issue_date,
      totalQuantity: opts.qty,
      quantityUnit: 'KG',
      lines: [
        {
          material_id: opts.materialId,
          quantity: opts.qty,
          unit: 'KG',
          certification: opts.certification,
        },
      ],
    }).catch(() => undefined);

    meta.tcIds.push(tc.id);
    return tc;
  }

  const tc1 = await issueTc({
    issuer: suppliers[0],
    materialId: organicCotton,
    qty: 4200,
    certification: 'GOTS',
    orderId: orderIds[0],
    shipmentId: shipmentIds[0],
  });
  const tc2 = await issueTc({
    issuer: suppliers[1],
    materialId: bciCotton,
    qty: 3100,
    certification: 'BCI',
    orderId: orderIds[1],
  });
  await issueTc({
    issuer: suppliers[0],
    materialId: recycledPoly,
    qty: 1800,
    certification: 'GRS',
    orderId: orderIds[2],
    shipmentId: shipmentIds[1],
    status: 'verified',
  });
  summary.push('Transaction certificates issued + anchored');

  // Credit brand wallet from verified inbound (already have opening; add received)
  {
    const { data: inbound, error: inboundErr } = await admin
      .from('material_transactions')
      .insert({
        wallet_id: brandWalletId,
        material_id: recycledPoly,
        transaction_type: 'credit',
        quantity: 1800,
        unit: 'KG',
        reference_type: 'tc',
        reference_id: tc1.id,
        description: `Inbound GRS from ${suppliers[0].name}`,
        created_by: userId,
      })
      .select('id')
      .single();
    if (inboundErr) throw new Error(inboundErr.message);
    if (inbound) meta.transactionIds.push(inbound.id);
  }

  // ── Digital product passports ─────────────────────────────────────
  const passportDefs = [
    {
      name: 'Nordic Soft Tee',
      sku: 'NL-TEE-220-WHT',
      category: 'apparel',
      origin: 'BD',
      composition: [
        { material: 'Organic Cotton', pct: 92, certified: true },
        { material: 'Elastane', pct: 8, certified: false },
      ],
      carbon: 4.8,
      water: 1860,
      tcId: tc1.id,
      materialId: organicCotton,
    },
    {
      name: 'Harbor Fleece Midlayer',
      sku: 'NL-FLC-088-NVY',
      category: 'apparel',
      origin: 'BD',
      composition: [
        { material: 'Recycled Polyester', pct: 100, certified: true },
      ],
      carbon: 6.2,
      water: 940,
      tcId: tc2.id,
      materialId: recycledPoly,
    },
  ];

  for (const p of passportDefs) {
    const { data: passport, error } = await admin
      .from('product_passports')
      .insert({
        organization_id: brandId,
        product_name: p.name,
        product_sku: p.sku,
        product_category: p.category,
        country_of_origin: p.origin,
        material_composition: p.composition,
        carbon_footprint_kg: p.carbon,
        water_usage_liters: p.water,
        care_instructions: {
          text: 'Wash cold, hang dry. Return to partner store for fiber recycling.',
        },
        recyclability_info: 'Fiber-to-fiber eligible via partner take-back.',
        status: 'published',
        published_at: isoDaysAgo(5),
        created_by: userId,
      })
      .select('id')
      .single();
    if (error || !passport) throw new Error(error?.message ?? 'DPP failed');
    meta.passportIds.push(passport.id);

    await admin.from('passport_materials').insert({
      passport_id: passport.id,
      material_id: p.materialId,
      percentage: p.composition[0]?.pct ?? 100,
      tc_id: p.tcId,
      certification: p.composition[0]?.material ?? null,
      is_verified: true,
      origin_country: p.origin,
    });

    await admin.from('passport_supply_chain').insert([
      {
        passport_id: passport.id,
        display_name: suppliers[2].name,
        process_type: 'spinning',
        country: 'BD',
        tier_level: 'tier_4',
        sequence_order: 1,
        is_visible_to_public: true,
      },
      {
        passport_id: passport.id,
        display_name: suppliers[1].name,
        process_type: 'knitting',
        country: 'BD',
        tier_level: 'tier_2',
        sequence_order: 2,
        is_visible_to_public: true,
      },
      {
        passport_id: passport.id,
        display_name: suppliers[0].name,
        process_type: 'cut_sew',
        country: 'BD',
        tier_level: 'tier_1',
        sequence_order: 3,
        is_visible_to_public: true,
      },
    ]);

    await admin.from('passport_sustainability').insert({
      passport_id: passport.id,
      metric_name: 'carbon_footprint',
      metric_value: p.carbon,
      metric_unit: 'kg_co2e',
      verification_source: 'Higgs MSI + facility primary data',
      is_verified: true,
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
        qr_data: `STT-B-SS27-${passport.id.slice(0, 6).toUpperCase()}`,
        is_active: true,
      },
    ]);
  }
  summary.push(`${passportDefs.length} digital product passports`);

  // ── Verification marketplace ──────────────────────────────────────
  const { data: vr, error: vrErr } = await admin
    .from('verification_requests')
    .insert({
      buyer_org_id: brandId,
      supplier_org_id: suppliers[0].id,
      verification_type: 'physical',
      scope: 'CEPZ Unit-3 capacity, GOTS process, social compliance',
      standards: ['GOTS', 'GRS', 'SMETA'],
      deadline_date: daysAgo(-21),
      budget_max_usd: 1850,
      notes: 'Priority pre-shipment verification for SS27 tee program',
      status: 'assigned',
      created_by: userId,
    })
    .select('id, request_number')
    .single();
  if (vrErr || !vr) throw new Error(vrErr?.message ?? 'Verification failed');
  meta.verificationIds.push(vr.id);

  await admin.from('verification_assignments').insert({
    request_id: vr.id,
    auditor_org_id: auditorId,
    status: 'accepted',
    assigned_at: isoDaysAgo(4),
    accepted_at: isoDaysAgo(3),
  });

  const { data: vr2 } = await admin
    .from('verification_requests')
    .insert({
      buyer_org_id: brandId,
      supplier_org_id: suppliers[1].id,
      verification_type: 'certificate',
      scope: 'GRS scope certificate authenticity',
      standards: ['GRS'],
      deadline_date: daysAgo(-35),
      budget_max_usd: 650,
      status: 'open',
      created_by: userId,
    })
    .select('id')
    .single();
  if (vr2) meta.verificationIds.push(vr2.id);
  summary.push('Verification requests + auditor assignment');

  // ── Membership invite + notifications / alerts ────────────────────
  const { data: invite } = await admin
    .from('invitations')
    .insert({
      organization_id: brandId,
      email: 'maya.rahman@nordicloom.com',
      invited_by: userId,
      expires_at: isoDaysAgo(-14),
    })
    .select('id')
    .single();
  if (invite) meta.invitationIds.push(invite.id);

  const notifRows = [
    {
      organization_id: brandId,
      title: `TC received · ${tc1.tc_number}`,
      body: `${suppliers[0].name} issued GOTS organic cotton to your wallet.`,
      severity: 'info',
      module: 'tc',
      entity_type: 'transaction_certificate',
      entity_id: tc1.id,
      action_url: `/tc/${tc1.id}`,
    },
    {
      organization_id: brandId,
      title: `Shipment in transit · ${shipDefs[0].number}`,
      body: 'Container TGHU4598213 reported at Colombo anchorage.',
      severity: 'warning',
      module: 'shipments',
      entity_type: 'shipment',
      entity_id: shipmentIds[0],
      action_url: `/shipments/${shipmentIds[0]}`,
    },
    {
      organization_id: brandId,
      title: `Verification assigned · ${vr.request_number}`,
      body: `${auditorName} accepted the physical verification at CEPZ Unit-3.`,
      severity: 'success',
      module: 'verification',
      entity_type: 'verification_request',
      entity_id: vr.id,
      action_url: '/verification',
    },
    {
      organization_id: suppliers[0].id,
      title: 'Purchase order confirmed',
      body: `PO-2026-4481 from ${brandName} is in production.`,
      severity: 'info',
      module: 'orders',
      entity_type: 'order',
      entity_id: orderIds[0],
      action_url: '/orders',
    },
  ];

  for (const n of notifRows) {
    const { data: row } = await admin
      .from('notifications')
      .insert({
        ...n,
        channel: 'in_app',
        is_read: false,
      })
      .select('id')
      .single();
    if (row) meta.notificationIds.push(row.id);
  }
  summary.push('Alerts + membership invite');

  meta.summary = summary;
  const label = `Pilot dataset · ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`;

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
