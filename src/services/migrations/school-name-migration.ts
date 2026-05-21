import { httpsCallable } from 'firebase/functions';

import { getFirebaseFunctions } from '@/services/firebase/functions';

export const OLD_SCHOOL_NAME = ['Celebration International', 'College'].join(' ');
export const NEW_SCHOOL_NAME = 'Celebration International School';

export type SchoolNameMigrationResult = {
  oldName: string;
  newName: string;
  updated: number;
  commits: number;
  byCollection: Record<string, number>;
  verification: {
    remainingSchoolNameMatches: number;
    remainingDirectoryNameMatches: number;
  };
};

export async function runSchoolNameMigration() {
  const migrateSchoolName = httpsCallable<void, SchoolNameMigrationResult>(
    getFirebaseFunctions(),
    'migrateSchoolName',
  );
  const result = await migrateSchoolName();

  return result.data;
}
