import type { OrgType } from '@stt/types';

/** Brand-buyer capabilities (orders, VR create, link suppliers). */
export function canActAsBrand(orgType: OrgType | string): boolean {
  return orgType === 'brand' || orgType === 'platform_admin';
}

/** Auditor marketplace claim / complete. */
export function canActAsAuditor(orgType: OrgType | string): boolean {
  return orgType === 'auditor' || orgType === 'platform_admin';
}

/** Supplier facility / issue TC side. */
export function canActAsSupplier(orgType: OrgType | string): boolean {
  return orgType === 'supplier' || orgType === 'platform_admin';
}

export function isPlatformAdmin(orgType: OrgType | string, roleName?: string | null): boolean {
  return orgType === 'platform_admin' || roleName === 'platform_admin';
}
