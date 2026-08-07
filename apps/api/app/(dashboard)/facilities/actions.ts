'use server';

import { revalidatePath } from 'next/cache';
import type { FacilityType, TierLevel } from '@stt/types';
import { requireActionContext } from '@/lib/auth/session';

export type FacilityActionState = {
  error: string | null;
  success?: boolean;
};

export async function createFacilityAction(
  _prev: FacilityActionState,
  formData: FormData
): Promise<FacilityActionState> {
  const name = String(formData.get('name') ?? '').trim();
  const facilityType = String(formData.get('facility_type') ?? '') as FacilityType;
  const tierLevel = String(formData.get('tier_level') ?? '') as TierLevel;
  const city = String(formData.get('city') ?? '').trim() || null;
  const country = String(formData.get('country') ?? 'BD').trim() || 'BD';

  if (!name) return { error: 'Facility name is required.' };
  if (!facilityType) return { error: 'Facility type is required.' };

  const { supabase, organizationId } = await requireActionContext();

  const { error } = await supabase.from('facilities').insert({
    organization_id: organizationId,
    name,
    facility_type: facilityType,
    tier_level: tierLevel || null,
    city,
    country,
  });

  if (error) return { error: error.message };

  revalidatePath('/facilities');
  return { error: null, success: true };
}
