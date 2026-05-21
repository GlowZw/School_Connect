import { create } from 'zustand';

export type TenantBranding = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
};

type TenantStore = {
  schoolId: string | null;
  schoolName: string | null;
  branding: TenantBranding | null;
  logoUrl: string | null;
  setSchoolId: (schoolId: string | null) => void;
  setTenantContext: (
    schoolId: string | null,
    schoolName: string | null,
    branding: TenantBranding | null,
    logoUrl: string | null,
  ) => void;
  resetTenantContext: () => void;
};

export const useTenantStore = create<TenantStore>((set) => ({
  schoolId: null,
  schoolName: null,
  branding: null,
  logoUrl: null,
  setSchoolId: (schoolId) => set({ schoolId }),
  setTenantContext: (schoolId, schoolName, branding, logoUrl) =>
    set({ schoolId, schoolName, branding, logoUrl }),
  resetTenantContext: () =>
    set({ schoolId: null, schoolName: null, branding: null, logoUrl: null }),
}));
