import { create } from 'zustand';

export const useBudgetStore = create((set, get) => ({
  budgets: [],
  loading: false,

  setBudgets: (budgets) => set({ budgets }),

  addBudget: (budget) => {
    set({ budgets: [...get().budgets, budget] });
  },

  setLoading: (loading) => set({ loading })
}));
