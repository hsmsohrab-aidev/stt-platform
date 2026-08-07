import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { loadSession } from '@/lib/auth/session';

/** Deduped per request — layout + PageWrapper share one count query. */
export const getUnreadNotificationCount = cache(async (): Promise<number> => {
  const session = await loadSession();
  if (session.status !== 'ready') return 0;

  const supabase = createClient();
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', session.context.organizationId)
    .eq('is_read', false);

  return count ?? 0;
});
