import React, { useEffect, useState } from 'react';
import { analyticsAPI, aiAPI } from '../services/api.service';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, Calendar, DollarSign, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const Analytics = () => {
  const [trends, setTrends] = useState([]);
  const [cashflow, setCashflow] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState(null);
  const [selectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedYear]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [trendsRes, cashflowRes, categoriesRes] = await Promise.all([
        analyticsAPI.getTrends(12),
        analyticsAPI.getCashflow(selectedYear),
        analyticsAPI.getCategories()
      ]);

      if (trendsRes.success) setTrends(trendsRes.data);
      if (cashflowRes.success) setCashflow(cashflowRes.data);
      if (categoriesRes.success) setCategories(categoriesRes.data);
    } catch (error) {
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const getAIPrediction = async () => {
    try {
      const response = await aiAPI.predictExpenses(6);
      if (response.success) {
        setAiInsight(response.data.prediction);
        toast.success('AI prediction generated!');
      }
    } catch (error) {
      toast.error('Failed to generate prediction');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <button onClick={getAIPrediction} className="btn btn-primary flex items-center gap-2">
          <Sparkles size={20} />
          AI Prediction
        </button>
      </div>

      {/* AI Insight */}
      {aiInsight && (
        <div className="card bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200">
          <div className="flex items-start gap-3">
            <Sparkles className="text-purple-600 mt-1" size={24} />
            <div>
              <h3 className="font-semibold text-lg mb-2">AI Expense Prediction</h3>
              <p className="text-gray-700 whitespace-pre-line">{aiInsight}</p>
            </div>
          </div>
        </div>
      )}

      {/* Income vs Expense Trends */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={24} />
          Income vs Expense Trends (12 Months)
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={trends}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" />
            <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Cashflow */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar size={24} />
          Monthly Cashflow ({selectedYear})
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={cashflow}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={(month) => `Month ${month}`} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="income" fill="#10b981" name="Income" />
            <Bar dataKey="expense" fill="#ef4444" name="Expense" />
            <Bar dataKey="netCashflow" fill="#3b82f6" name="Net Cashflow" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Categories */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <DollarSign size={24} />
          Top Expense Categories
        </h3>
        <div className="space-y-4">
          {categories.slice(0, 10).map((category, index) => (
            <div key={index}>
              <div className="flex justify-between mb-2">
                <span className="font-medium">{category._id}</span>
                <span className="text-gray-600">
                  ${category.total.toFixed(2)} ({category.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full"
                  style={{ width: `${Math.min(category.percentage, 100)}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {category.count} transactions • Avg: ${category.avgAmount.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
