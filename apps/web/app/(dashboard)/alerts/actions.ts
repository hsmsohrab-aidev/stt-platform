'use server';

import { revalidatePath } from 'next/cache';
import { requireActionContext } from '@/lib/auth/session';

export async function markNotificationReadAction(id: string) {
  const { supabase, organizationId } = await requireActionContext();
  await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', organizationId);
  revalidatePath('/alerts');
}

export async function markAllNotificationsReadAction() {
  const { supabase, organizationId } = await requireActionContext();
  await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('organization_id', organizationId)
    .eq('is_read', false);
  revalidatePath('/alerts');
}
