'use server';

import { revalidatePath } from 'next/cache';
import { requireActionContext } from '@/lib/auth/session';

export type DppActionState = {
  error: string | null;
  success?: string;
  passportId?: string;
};

export async function createPassportAction(
  _prev: DppActionState,
  formData: FormData
): Promise<DppActionState> {
  const productName = String(formData.get('product_name') ?? '').trim();
  const productSku = String(formData.get('product_sku') ?? '').trim() || null;
  const productCategory =
    String(formData.get('product_category') ?? '').trim() || 'apparel';
  const countryOfOrigin =
    String(formData.get('country_of_origin') ?? '').trim() || null;
  const composition = String(formData.get('composition') ?? '').trim();
  const carbon = Number(formData.get('carbon_footprint_kg'));
  const water = Number(formData.get('water_usage_liters'));
  const chainStep = String(formData.get('chain_step') ?? '').trim();
  const care = String(formData.get('care_instructions') ?? '').trim() || null;

  if (!productName) return { error: 'Product name is required.' };

  const { supabase, organizationId, userId } = await requireActionContext();

  let materialComposition: unknown = null;
  if (composition) {
    // "60% Organic Cotton, 40% Recycled Polyester"
    materialComposition = composition.split(',').map((part) => {
      const t = part.trim();
      const m = t.match(/^(\d+(?:\.\d+)?)\s*%\s*(.+)$/i);
      if (m) {
        return { material: m[2].trim(), pct: Number(m[1]), certified: true };
      }
      return { material: t, pct: null, certified: false };
    });
  }

  const { data: passport, error } = await supabase
    .from('product_passports')
    .insert({
      organization_id: organizationId,
      product_name: productName,
      product_sku: productSku,
      product_category: productCategory,
      country_of_origin: countryOfOrigin,
      material_composition: materialComposition,
      carbon_footprint_kg: Number.isFinite(carbon) ? carbon : null,
      water_usage_liters: Number.isFinite(water) ? water : null,
      care_instructions: care ? { text: care } : null,
      recyclability_info: 'Return to partner store for fiber-to-fiber recycling.',
      status: 'draft',
      created_by: userId,
    })
    .select('id')
    .single();

  if (error || !passport) {
    return { error: error?.message ?? 'Could not create passport.' };
  }

  if (chainStep) {
    await supabase.from('passport_supply_chain').insert({
      passport_id: passport.id,
      display_name: chainStep,
      process_type: 'manufacturing',
      country: countryOfOrigin,
      tier_level: 'tier_1',
      sequence_order: 1,
      is_visible_to_public: true,
    });
  }

  if (Number.isFinite(carbon)) {
    await supabase.from('passport_sustainability').insert({
      passport_id: passport.id,
      metric_name: 'carbon_footprint',
      metric_value: carbon,
      metric_unit: 'kg CO2e',
      is_verified: false,
    });
  }
  if (Number.isFinite(water)) {
    await supabase.from('passport_sustainability').insert({
      passport_id: passport.id,
      metric_name: 'water_usage',
      metric_value: water,
      metric_unit: 'L',
      is_verified: false,
    });
  }

  revalidatePath('/dpp');
  return {
    error: null,
    success: 'Draft passport created.',
    passportId: passport.id,
  };
}

export async function publishPassportAction(passportId: string): Promise<DppActionState> {
  const { supabase, organizationId } = await requireActionContext();

  const publicPath = `/p/${passportId}`;

  const { data: passport, error } = await supabase
    .from('product_passports')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      public_url: publicPath,
    })
    .eq('id', passportId)
    .eq('organization_id', organizationId)
    .select('id')
    .maybeSingle();

  if (error || !passport) {
    return { error: error?.message ?? 'Publish failed.' };
  }

  await supabase.from('passport_qr_codes').insert({
    passport_id: passportId,
    qr_type: 'product',
    qr_data: publicPath,
    is_active: true,
  });

  revalidatePath('/dpp');
  revalidatePath(`/dpp/${passportId}`);
  revalidatePath(publicPath);
  return { error: null, success: 'Published.', passportId };
}

export async function createPassportQrVariantAction(
  _prev: DppActionState,
  formData: FormData
): Promise<DppActionState> {
  const passportId = String(formData.get('passport_id') ?? '').trim();
  const qrType = String(formData.get('qr_type') ?? '').trim();
  const code = String(formData.get('code') ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-');

  if (!passportId) return { error: 'Passport required.' };
  if (qrType !== 'batch' && qrType !== 'unit') {
    return { error: 'QR type must be batch or unit.' };
  }
  if (!code || code.length < 2) {
    return { error: 'Enter a batch or unit code (min 2 chars).' };
  }

  const { supabase, organizationId } = await requireActionContext();

  const { data: passport } = await supabase
    .from('product_passports')
    .select('id, status, batch_number')
    .eq('id', passportId)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (!passport) return { error: 'Passport not found.' };
  if (passport.status !== 'published') {
    return { error: 'Publish the passport before creating batch/unit QRs.' };
  }

  const publicPath = `/p/${passportId}?type=${qrType}&code=${encodeURIComponent(code)}`;

  const { data: existing } = await supabase
    .from('passport_qr_codes')
    .select('id')
    .eq('passport_id', passportId)
    .eq('qr_type', qrType)
    .eq('qr_data', publicPath)
    .maybeSingle();

  if (existing) return { error: 'This QR variant already exists.' };

  const { error } = await supabase.from('passport_qr_codes').insert({
    passport_id: passportId,
    qr_type: qrType,
    qr_data: publicPath,
    is_active: true,
  });

  if (error) return { error: error.message };

  if (qrType === 'batch' && !passport.batch_number) {
    await supabase
      .from('product_passports')
      .update({ batch_number: code })
      .eq('id', passportId)
      .eq('organization_id', organizationId);
  }

  revalidatePath(`/dpp/${passportId}`);
  revalidatePath(`/p/${passportId}`);
  return {
    error: null,
    success: `${qrType === 'batch' ? 'Batch' : 'Unit'} QR created · ${code}`,
    passportId,
  };
}

export async function linkPassportMaterialAction(
  _prev: DppActionState,
  formData: FormData
): Promise<DppActionState> {
  const passportId = String(formData.get('passport_id') ?? '').trim();
  const materialId = String(formData.get('material_id') ?? '').trim();
  const tcId = String(formData.get('tc_id') ?? '').trim() || null;
  const percentage = Number(formData.get('percentage'));
  const certification =
    String(formData.get('certification') ?? '').trim() || null;
  const originCountry =
    String(formData.get('origin_country') ?? '').trim() || null;

  if (!passportId) return { error: 'Passport required.' };
  if (!materialId) return { error: 'Select a material.' };

  const { supabase, organizationId } = await requireActionContext();

  const { data: passport } = await supabase
    .from('product_passports')
    .select('id')
    .eq('id', passportId)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (!passport) return { error: 'Passport not found.' };

  let isVerified = false;
  if (tcId) {
    const { data: tc } = await supabase
      .from('transaction_certificates')
      .select('id, tc_status, issuer_org_id, receiver_org_id')
      .eq('id', tcId)
      .maybeSingle();

    if (!tc) return { error: 'TC not found.' };
    if (
      tc.issuer_org_id !== organizationId &&
      tc.receiver_org_id !== organizationId
    ) {
      return { error: 'TC is not visible to your organization.' };
    }
    isVerified = tc.tc_status === 'verified';
  }

  const { error } = await supabase.from('passport_materials').insert({
    passport_id: passportId,
    material_id: materialId,
    tc_id: tcId,
    percentage:
      Number.isFinite(percentage) && percentage > 0 ? percentage : null,
    certification,
    origin_country: originCountry,
    is_verified: isVerified,
  });

  if (error) return { error: error.message };

  revalidatePath(`/dpp/${passportId}`);
  revalidatePath(`/p/${passportId}`);
  if (tcId) revalidatePath(`/tc/${tcId}`);
  return { error: null, success: 'Material linked to passport.' };
}

export async function unlinkPassportMaterialAction(
  linkId: string,
  passportId: string
): Promise<DppActionState> {
  const { supabase, organizationId } = await requireActionContext();

  const { data: passport } = await supabase
    .from('product_passports')
    .select('id')
    .eq('id', passportId)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (!passport) return { error: 'Passport not found.' };

  const { error } = await supabase
    .from('passport_materials')
    .delete()
    .eq('id', linkId)
    .eq('passport_id', passportId);

  if (error) return { error: error.message };

  revalidatePath(`/dpp/${passportId}`);
  revalidatePath(`/p/${passportId}`);
  return { error: null, success: 'Link removed.' };
}
