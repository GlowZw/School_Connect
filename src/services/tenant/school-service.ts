import {
  collection,
  doc,
  getDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';

import { firestore } from '@/services/firebase/firestore';

export type SchoolBranding = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
};

export type SchoolTheme = {
  mode: 'light' | 'dark';
};

export type SchoolDirectoryEntry = {
  id: string; // e.g. "SCH-001"
  name: string; // e.g. "Celebration International School"
  logoUrl: string;
  branding: SchoolBranding;
  theme: SchoolTheme;
};

export async function getSchoolsDirectory(): Promise<SchoolDirectoryEntry[]> {
  const snapshot = await getDocs(collection(firestore, 'schools_directory'));
  if (snapshot.empty) {
    // If empty, auto-seed and return default list
    await seedDefaultSchools();
    const refetched = await getDocs(collection(firestore, 'schools_directory'));
    return refetched.docs.map((item) => item.data() as SchoolDirectoryEntry);
  }
  return snapshot.docs.map((item) => item.data() as SchoolDirectoryEntry);
}

export async function getSchoolDirectoryEntry(schoolId: string): Promise<SchoolDirectoryEntry | null> {
  const reference = doc(firestore, 'schools_directory', schoolId);
  const snapshot = await getDoc(reference);
  if (!snapshot.exists()) {
    return null;
  }
  return snapshot.data() as SchoolDirectoryEntry;
}

export async function seedDefaultSchools() {
  const batch = writeBatch(firestore);

  const defaultSchools: SchoolDirectoryEntry[] = [
    {
      id: 'SCH-001',
      name: 'Celebration International College',
      logoUrl: 'https://images.unsplash.com/photo-1594608661623-aa0bd3a69d28?w=200&auto=format&fit=crop&q=80',
      branding: {
        primaryColor: '#059669', // Emerald
        secondaryColor: '#D97706', // Gold / Amber
        accentColor: '#047857',
      },
      theme: {
        mode: 'light',
      },
    },
    {
      id: 'SCH-002',
      name: 'Hillcrest College',
      logoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&auto=format&fit=crop&q=80',
      branding: {
        primaryColor: '#7C3AED', // Violet
        secondaryColor: '#4C1D95', // Deep Purple
        accentColor: '#8B5CF6',
      },
      theme: {
        mode: 'light',
      },
    },
    {
      id: 'SCH-003',
      name: 'Helenic College',
      logoUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=200&auto=format&fit=crop&q=80',
      branding: {
        primaryColor: '#059669',
        secondaryColor: '#2563EB',
        accentColor: '#0F766E',
      },
      theme: {
        mode: 'light',
      },
    },
  ];

  for (const school of defaultSchools) {
    const dirRef = doc(firestore, 'schools_directory', school.id);
    batch.set(dirRef, school);

    // Also link the branding, logo, and theme to the private school path as required:
    // schools/{schoolId}/info/branding
    // schools/{schoolId}/info/logo
    // schools/{schoolId}/info/theme
    const brandingRef = doc(firestore, 'schools', school.id, 'info', 'branding');
    const logoRef = doc(firestore, 'schools', school.id, 'info', 'logo');
    const themeRef = doc(firestore, 'schools', school.id, 'info', 'theme');

    batch.set(brandingRef, {
      ...school.branding,
      schoolName: school.name,
    });
    batch.set(logoRef, {
      logoUrl: school.logoUrl,
    });
    batch.set(themeRef, school.theme);
  }

  await batch.commit();
}
