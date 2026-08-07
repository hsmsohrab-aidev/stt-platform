'use server';

import { revalidatePath } from 'next/cache';
import type { TierLevel } from '@stt/types';
import { requireActionContext } from '@/lib/auth/session';

export type LinkSupplierState = {
  error: string | null;
  success?: string;
};

export async function linkSupplierAction(
  _prev: LinkSupplierState,
  formData: FormData
): Promise<LinkSupplierState> {
  const supplierOrgId = String(formData.get('supplier_org_id') ?? '').trim();
  const tierLevel = String(formData.get('tier_level') ?? 'tier_1') as TierLevel;

  if (!supplierOrgId) return { error: 'Supplier organization UUID is required.' };

  const { supabase, organizationId, orgType } = await requireActionContext();

  if (orgType !== 'brand') {
    return { error: 'Only brand organizations can link suppliers.' };
  }

  const { data: supplierOrg } = await supabase
    .from('organizations')
    .select('id, name, org_type')
    .eq('id', supplierOrgId)
    .maybeSingle();

  if (!supplierOrg) return { error: 'Supplier organization not found.' };
  if (supplierOrg.org_type !== 'supplier') {
    return { error: 'Target org must be a supplier.' };
  }

  const { error } = await supabase.from('supplier_relationships').insert({
    brand_org_id: organizationId,
    supplier_org_id: supplierOrg.id,
    tier_level: tierLevel || 'tier_1',
    status: 'active',
  });

  if (error) {
    if (error.code === '23505') {
      return { error: 'This supplier is already linked.' };
    }
    return { error: error.message };
  }

  await supabase.from('supply_chain_tiers').insert({
    brand_org_id: organizationId,
    supplier_org_id: supplierOrg.id,
    tier_level: tierLevel || 'tier_1',
  });

  revalidatePath('/');
  revalidatePath('/brand');
  return { error: null, success: `Linked ${supplierOrg.name}` };
}
