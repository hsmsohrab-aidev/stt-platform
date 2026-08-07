/**
 * One-shot: wipe existing demo batch (if any) then seed ≥10/menu for host org.
 * Usage: npx tsx scripts/run-demo-seed.ts  (from apps/api)
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { seedDemoDataset } from '../lib/demo/seed';
import { wipeDemoBatches } from '../lib/demo/wipe';

config({ path: resolve(__dirname, '../.env.local') });

const HOST_ORG_ID = '974d018a-9aa8-42e7-95e3-aff3d699239c';
const USER_ID = '3780d8ad-beed-43bc-8919-6c7338b4dee5';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase URL or service role key');

  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: org, error: orgErr } = await admin
    .from('organizations')
    .select('id, name, org_type')
    .eq('id', HOST_ORG_ID)
    .single();
  if (orgErr || !org) throw new Error(orgErr?.message ?? 'Host org not found');

  console.log('Wiping previous demo batches…');
  const wiped = await wipeDemoBatches({ admin, hostOrgId: HOST_ORG_ID });
  console.log('Wipe:', wiped);

  console.log('Seeding full pilot dataset…');
  const result = await seedDemoDataset({
    admin,
    hostOrgId: HOST_ORG_ID,
    hostOrgType: org.org_type,
    hostOrgName: org.name,
    userId: USER_ID,
  });

  console.log('OK', result.label);
  console.log(result.meta.summary.join('\n'));
  console.log(
    JSON.stringify(
      {
        orders: result.meta.orderIds.length,
        shipments: result.meta.shipmentIds.length,
        tcs: result.meta.tcIds.length,
        passports: result.meta.passportIds.length,
        facilities: result.meta.facilityIds.length,
        verifications: result.meta.verificationIds.length,
        alerts: result.meta.notificationIds.length,
        invites: result.meta.invitationIds.length,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
