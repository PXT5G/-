import { create } from 'zustand';

interface BusinessCompany {
  companyId: string;
  name: string;
  tradeName: string;
  category: string;
  status: string;
  availableBalance: number;
  netProfit: number;
  employeeCount: number;
  customerCount: number;
}

interface BusinessStoreState {
  activeCompanyId: string | null;
  companies: BusinessCompany[];
  activeTab: string;
  permissions: string[];
  setActiveCompany: (id: string | null) => void;
  setCompanies: (companies: BusinessCompany[]) => void;
  setActiveTab: (tab: string) => void;
  setPermissions: (permissions: string[]) => void;
}

export const useBusinessStore = create<BusinessStoreState>((set) => ({
  activeCompanyId: null,
  companies: [],
  activeTab: 'dashboard',
  permissions: [],
  setActiveCompany: (activeCompanyId) => set({ activeCompanyId }),
  setCompanies: (companies) =>
    set((state) => ({
      companies,
      activeCompanyId: state.activeCompanyId ?? companies[0]?.companyId ?? null,
    })),
  setActiveTab: (activeTab) => set({ activeTab }),
  setPermissions: (permissions) => set({ permissions }),
}));
