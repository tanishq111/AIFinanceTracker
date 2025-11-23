import { create } from 'zustand';

export const useAnalyticsStore = create((set) => ({
  dashboard: null,
  trends: [],
  categories: [],
  cashflow: [],
  loading: false,

  setDashboard: (dashboard) => set({ dashboard }),
  setTrends: (trends) => set({ trends }),
  setCategories: (categories) => set({ categories }),
  setCashflow: (cashflow) => set({ cashflow }),
  setLoading: (loading) => set({ loading })
}));
