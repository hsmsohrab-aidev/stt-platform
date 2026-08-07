import { createClient } from '@/lib/supabase/server';
import type { OrgType } from '@stt/types';

export type ReceiverOrgOption = {
  id: string;
  name: string;
  org_type: OrgType;
  linked: boolean;
};

/**
 * Preferred receivers = linked partners via supplier_relationships.
 * Also includes other active orgs (directory RLS) excluding self, marked unlinked.
 */
export async function loadReceiverOrgOptions(
  organizationId: string,
  orgType: OrgType
): Promise<ReceiverOrgOption[]> {
  const supabase = createClient();

  const preferredType: OrgType | null =
    orgType === 'brand' ? 'supplier' : orgType === 'supplier' ? 'brand' : null;

  let directoryQuery = supabase
    .from('organizations')
    .select('id, name, org_type')
    .eq('is_active', true)
    .neq('id', organizationId)
    .order('name')
    .limit(80);

  if (preferredType) {
    directoryQuery = directoryQuery.eq('org_type', preferredType);
  }

  const relationshipsPromise =
    orgType === 'brand'
      ? supabase
          .from('supplier_relationships')
          .select('supplier_org_id')
          .eq('brand_org_id', organizationId)
          .eq('status', 'active')
      : orgType === 'supplier'
        ? supabase
            .from('supplier_relationships')
            .select('brand_org_id')
            .eq('supplier_org_id', organizationId)
            .eq('status', 'active')
        : Promise.resolve({ data: [] as { supplier_org_id?: string; brand_org_id?: string }[] });

  const [relsResult, orgsResult] = await Promise.all([
    relationshipsPromise,
    directoryQuery,
  ]);

  const linkedIds = new Set<string>();
  for (const r of relsResult.data ?? []) {
    const id =
      'supplier_org_id' in r && r.supplier_org_id
        ? r.supplier_org_id
        : 'brand_org_id' in r && r.brand_org_id
          ? r.brand_org_id
          : null;
    if (id) linkedIds.add(id);
  }

  const options = (orgsResult.data ?? []).map((o) => ({
    id: o.id,
    name: o.name,
    org_type: o.org_type as OrgType,
    linked: linkedIds.has(o.id),
  }));

  return options.sort((a, b) => {
    if (a.linked !== b.linked) return a.linked ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}
