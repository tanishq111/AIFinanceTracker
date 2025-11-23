import api from '../utils/api';

export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  }
};

export const transactionAPI = {
  getAll: async (filters = {}) => {
    const response = await api.get('/transactions', { params: filters });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  create: async (transactionData) => {
    const response = await api.post('/transactions', transactionData);
    return response.data;
  },

  update: async (id, transactionData) => {
    const response = await api.put(`/transactions/${id}`, transactionData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  },

  uploadReceipt: async (id, file) => {
    const formData = new FormData();
    formData.append('receipt', file);
    const response = await api.post(`/transactions/${id}/receipt`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};

export const budgetAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/budgets', { params });
    return response.data;
  },

  create: async (budgetData) => {
    const response = await api.post('/budgets', budgetData);
    return response.data;
  },

  update: async (id, budgetData) => {
    const response = await api.put(`/budgets/${id}`, budgetData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/budgets/${id}`);
    return response.data;
  },

  recalculate: async (month, year) => {
    const response = await api.post('/budgets/recalculate', { month, year });
    return response.data;
  }
};

export const savingsGoalAPI = {
  getAll: async (status) => {
    const response = await api.get('/savings-goals', { params: { status } });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/savings-goals/${id}`);
    return response.data;
  },

  create: async (goalData) => {
    const response = await api.post('/savings-goals', goalData);
    return response.data;
  },

  update: async (id, goalData) => {
    const response = await api.put(`/savings-goals/${id}`, goalData);
    return response.data;
  },

  addAmount: async (id, amount) => {
    const response = await api.post(`/savings-goals/${id}/add`, { amount });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/savings-goals/${id}`);
    return response.data;
  }
};

export const analyticsAPI = {
  getDashboard: async (month, year) => {
    const response = await api.get('/analytics/dashboard', { params: { month, year } });
    return response.data;
  },

  getTrends: async (months = 6) => {
    const response = await api.get('/analytics/trends', { params: { months } });
    return response.data;
  },

  getCategories: async (startDate, endDate, type) => {
    const response = await api.get('/analytics/categories', {
      params: { startDate, endDate, type }
    });
    return response.data;
  },

  getCashflow: async (year) => {
    const response = await api.get('/analytics/cashflow', { params: { year } });
    return response.data;
  },

  getPatterns: async () => {
    const response = await api.get('/analytics/patterns');
    return response.data;
  }
};

export const aiAPI = {
  categorize: async (description, amount) => {
    const response = await api.post('/ai/categorize', { description, amount });
    return response.data;
  },

  explainSpending: async (currentMonth, currentYear, compareMonth, compareYear) => {
    const response = await api.post('/ai/explain-spending', {
      currentMonth, currentYear, compareMonth, compareYear
    });
    return response.data;
  },

  predictExpenses: async (months = 6) => {
    const response = await api.get('/ai/predict-expenses', { params: { months } });
    return response.data;
  },

  generateSummary: async (month, year) => {
    const response = await api.post('/ai/summary', { month, year });
    return response.data;
  },

  getSavingsRecommendations: async () => {
    const response = await api.get('/ai/savings-recommendations');
    return response.data;
  }
};

export const notificationAPI = {
  getAll: async (isRead, limit) => {
    const response = await api.get('/notifications', { params: { isRead, limit } });
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },

  clearAll: async () => {
    const response = await api.delete('/notifications');
    return response.data;
  }
};
