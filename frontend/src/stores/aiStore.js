import { create } from 'zustand';

export const useAIStore = create((set) => ({
  insights: {},
  loading: false,

  setInsight: (key, value) => {
    set((state) => ({
      insights: { ...state.insights, [key]: value }
    }));
  },

  clearInsights: () => set({ insights: {} }),
  setLoading: (loading) => set({ loading })
}));
