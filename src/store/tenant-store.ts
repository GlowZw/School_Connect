import { create } from 'zustand';

type TenantStore = {
  schoolId: string | null;
  setSchoolId: (schoolId: string | null) => void;
};

export const useTenantStore = create<TenantStore>((set) => ({
  schoolId: null,
  setSchoolId: (schoolId) => set({ schoolId }),
}));
