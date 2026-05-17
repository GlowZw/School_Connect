import type { Timestamp } from 'firebase/firestore';

export type DailyMeal = {
  id: string;
  schoolId: string;
  date: Timestamp | Date;
  title: string;
  description: string;
  dietaryNotes: string[];
};

export type WeeklyMenu = {
  id: string;
  schoolId: string;
  weekOf: Timestamp | Date;
  meals: DailyMeal[];
};
