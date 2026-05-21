import type { SchoolCollection, TenantScopedPath } from '@/types/firestore';

export function assertTenantSchoolId(schoolId: string): string {
  const normalizedSchoolId = schoolId.trim();

  if (!normalizedSchoolId || normalizedSchoolId.includes('/')) {
    throw new Error('A valid tenant schoolId is required.');
  }

  return normalizedSchoolId;
}

export function schoolCollectionPath(
  schoolId: string,
  collection: SchoolCollection,
): TenantScopedPath {
  return `schools/${assertTenantSchoolId(schoolId)}/${collection}`;
}
