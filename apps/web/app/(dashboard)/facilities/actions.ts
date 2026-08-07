'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { FacilityType, TierLevel } from '@stt/types';
import { createClient } from '@/lib/supabase/server';

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

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not signed in.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.organization_id) {
    redirect('/onboarding');
  }

  const { error } = await supabase.from('facilities').insert({
    organization_id: profile.organization_id,
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
