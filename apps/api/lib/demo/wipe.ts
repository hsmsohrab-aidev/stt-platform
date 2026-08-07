import type { SupabaseClient } from '@supabase/supabase-js';
import type { DemoBatchMeta } from '@/lib/demo/seed';

async function delIn(admin: SupabaseClient, table: string, column: string, ids: string[]) {
  if (!ids.length) return;
  const { error } = await admin.from(table).delete().in(column, ids);
  if (error) throw new Error(`${table}: ${error.message}`);
}

/**
 * Wipe one demo batch (or all batches for host) in FK-safe order.
 * Never deletes the host organization or materials/roles catalog.
 */
export async function wipeDemoBatches(input: {
  admin: SupabaseClient;
  hostOrgId: string;
  batchId?: string | null;
}): Promise<{ wipedBatches: number; label: string }> {
  const { admin, hostOrgId, batchId } = input;

  let query = admin
    .from('demo_batches')
    .select('id, label, org_ids, meta')
    .eq('host_organization_id', hostOrgId)
    .order('created_at', { ascending: false });

  if (batchId) query = query.eq('id', batchId);

  const { data: batches, error } = await query;
  if (error) throw new Error(error.message);
  if (!batches?.length) {
    return { wipedBatches: 0, label: 'No demo batches found' };
  }

  const labels: string[] = [];

  for (const batch of batches) {
    const meta = (batch.meta ?? {}) as Partial<DemoBatchMeta>;
    const orgIds = (batch.org_ids as string[] | null) ?? meta.orgIds ?? [];
    const facilityIds = meta.facilityIds ?? [];
    const walletIds = meta.walletIds ?? [];
    const orderIds = meta.orderIds ?? [];
    const shipmentIds = meta.shipmentIds ?? [];
    const tcIds = meta.tcIds ?? [];
    const passportIds = meta.passportIds ?? [];
    const verificationIds = meta.verificationIds ?? [];
    const notificationIds = meta.notificationIds ?? [];
    const invitationIds = meta.invitationIds ?? [];
    const relationshipIds = meta.relationshipIds ?? [];
    const tierIds = meta.tierIds ?? [];
    const transactionIds = meta.transactionIds ?? [];

    // Children first
    if (transactionIds.length) {
      await delIn(admin, 'material_transactions', 'id', transactionIds);
    }
    if (verificationIds.length) {
      await delIn(admin, 'audit_reports', 'request_id', verificationIds);
      await delIn(admin, 'verification_assignments', 'request_id', verificationIds);
      await delIn(admin, 'verification_requests', 'id', verificationIds);
    }

    if (passportIds.length) {
      await delIn(admin, 'passport_scans', 'passport_id', passportIds);
      await delIn(admin, 'passport_qr_codes', 'passport_id', passportIds);
      await delIn(admin, 'passport_sustainability', 'passport_id', passportIds);
      await delIn(admin, 'passport_supply_chain', 'passport_id', passportIds);
      await delIn(admin, 'passport_materials', 'passport_id', passportIds);
      await delIn(admin, 'product_passports', 'id', passportIds);
    }

    if (tcIds.length) {
      await delIn(admin, 'tc_blockchain_records', 'tc_id', tcIds);
      await delIn(admin, 'tc_documents', 'tc_id', tcIds);
      await delIn(admin, 'tc_verifications', 'tc_id', tcIds);
      await delIn(admin, 'tc_line_items', 'tc_id', tcIds);
      // Clear passport_materials.tc_id refs already deleted with passports
      await delIn(admin, 'transaction_certificates', 'id', tcIds);
    }

    if (shipmentIds.length) {
      await delIn(admin, 'shipment_events', 'shipment_id', shipmentIds);
      await delIn(admin, 'shipments', 'id', shipmentIds);
    }

    if (orderIds.length) {
      await delIn(admin, 'order_items', 'order_id', orderIds);
      await delIn(admin, 'orders', 'id', orderIds);
    }

    if (walletIds.length) {
      await delIn(admin, 'material_transactions', 'wallet_id', walletIds);
      await delIn(admin, 'wallet_balances', 'wallet_id', walletIds);
      await delIn(admin, 'material_wallets', 'id', walletIds);
    }

    // Host wallet kept; clear orphan balances after demo txs removed
    if (meta.hostWalletId) {
      await admin
        .from('wallet_balances')
        .delete()
        .eq('wallet_id', meta.hostWalletId);
    }

    if (facilityIds.length) {
      await delIn(admin, 'facility_certifications', 'facility_id', facilityIds);
      await delIn(admin, 'facility_declarations', 'facility_id', facilityIds);
      await delIn(admin, 'facilities', 'id', facilityIds);
    }

    if (relationshipIds.length) {
      await delIn(admin, 'supplier_relationships', 'id', relationshipIds);
    }
    if (tierIds.length) {
      await delIn(admin, 'supply_chain_tiers', 'id', tierIds);
    }

    if (notificationIds.length) {
      await delIn(admin, 'notifications', 'id', notificationIds);
    }
    if (invitationIds.length) {
      await delIn(admin, 'invitations', 'id', invitationIds);
    }

    // Demo partner orgs only (never host)
    const safeOrgIds = orgIds.filter((id) => id && id !== hostOrgId);
    if (safeOrgIds.length) {
      await admin.from('mass_balance_records').delete().in('organization_id', safeOrgIds);
      await admin.from('notifications').delete().in('organization_id', safeOrgIds);
      await admin.from('invitations').delete().in('organization_id', safeOrgIds);
      await admin
        .from('supplier_relationships')
        .delete()
        .or(
          `brand_org_id.in.(${safeOrgIds.join(',')}),supplier_org_id.in.(${safeOrgIds.join(',')})`
        );
      await admin
        .from('supply_chain_tiers')
        .delete()
        .or(
          `brand_org_id.in.(${safeOrgIds.join(',')}),supplier_org_id.in.(${safeOrgIds.join(',')})`
        );
      await admin.from('organization_members').delete().in('organization_id', safeOrgIds);
      await admin.from('organizations').delete().in('id', safeOrgIds);
    }

    await admin.from('demo_batches').delete().eq('id', batch.id);
    labels.push(batch.label as string);
  }

  return {
    wipedBatches: batches.length,
    label: labels.join(', '),
  };
}
