import { collection, getDocs, orderBy, query } from 'firebase/firestore';

import { firestore } from '@/services/firebase/firestore';
import { schoolCollectionPath } from '@/services/tenant/pathing';
import type { WeeklyMenu } from '@/features/lunch/types';

export async function listWeeklyMenus(schoolId: string) {
  const snapshot = await getDocs(
    query(
      collection(firestore, schoolCollectionPath(schoolId, 'lunch_menus')),
      orderBy('weekOf', 'desc'),
    ),
  );

  return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<WeeklyMenu, 'id'>) }));
}

export const sampleMenus: WeeklyMenu[] = [
  {
    id: 'menu-1',
    schoolId: 'school-demo',
    weekOf: new Date('2026-05-18'),
    meals: [
      {
        id: 'meal-1',
        schoolId: 'school-demo',
        date: new Date('2026-05-18'),
        title: 'Rice, grilled chicken and vegetables',
        description: 'Balanced lunch with a fruit cup.',
        dietaryNotes: ['Contains poultry'],
      },
      {
        id: 'meal-2',
        schoolId: 'school-demo',
        date: new Date('2026-05-19'),
        title: 'Beef stew with sadza',
        description: 'Served with spinach and fresh oranges.',
        dietaryNotes: ['Gluten free'],
      },
    ],
  },
];
