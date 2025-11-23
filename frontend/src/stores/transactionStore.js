import { create } from 'zustand';

export const useTransactionStore = create((set, get) => ({
  transactions: [],
  loading: false,
  filters: {
    type: 'all',
    category: 'all',
    startDate: null,
    endDate: null,
    minAmount: null,
    maxAmount: null,
    search: ''
  },

  setTransactions: (transactions) => set({ transactions }),

  addTransaction: (transaction) => {
    set({ transactions: [transaction, ...get().transactions] });
  },

  updateTransaction: (id, updatedData) => {
    set({
      transactions: get().transactions.map(t =>
        t._id === id ? { ...t, ...updatedData } : t
      )
    });
  },

  deleteTransaction: (id) => {
    set({
      transactions: get().transactions.filter(t => t._id !== id)
    });
  },

  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } });
  },

  resetFilters: () => {
    set({
      filters: {
        type: 'all',
        category: 'all',
        startDate: null,
        endDate: null,
        minAmount: null,
        maxAmount: null,
        search: ''
      }
    });
  },

  setLoading: (loading) => set({ loading })
}));
