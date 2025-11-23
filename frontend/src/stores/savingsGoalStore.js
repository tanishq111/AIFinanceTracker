import { create } from 'zustand';

export const useSavingsGoalStore = create((set, get) => ({
  goals: [],
  loading: false,

  setGoals: (goals) => set({ goals }),

  addGoal: (goal) => {
    set({ goals: [...get().goals, goal] });
  },

  updateGoal: (id, updatedData) => {
    set({
      goals: get().goals.map(g =>
        g._id === id ? { ...g, ...updatedData } : g
      )
    });
  },

  deleteGoal: (id) => {
    set({ goals: get().goals.filter(g => g._id !== id) });
  },

  setLoading: (loading) => set({ loading })
}));
