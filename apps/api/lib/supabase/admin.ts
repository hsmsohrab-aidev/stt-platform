import { createClient } from '@supabase/supabase-js';

/** Service-role client for cross-org demo seed/wipe. Never import in client components. */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required to load or wipe demo data.'
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
