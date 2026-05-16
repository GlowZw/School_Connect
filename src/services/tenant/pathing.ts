import type { SchoolCollection, TenantScopedPath } from '@/types/firestore';

export function schoolCollectionPath(
  schoolId: string,
  collection: SchoolCollection,
): TenantScopedPath {
  return `schools/${schoolId}/${collection}`;
}
