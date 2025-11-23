import React, { useEffect, useState } from 'react';
import { analyticsAPI, aiAPI } from '../services/api.service';
import { useAnalyticsStore } from '../stores/analyticsStore';
import { useAIStore } from '../stores/aiStore';
import { useAuthStore } from '../stores/authStore';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const getCurrencySymbol = (currency) => { // move this to a uitils file later and reuseit
  switch (currency) {
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'JPY': return '¥';
    case 'INR': return '₹';
    // Add more currency cases as needed
    default: return '';
  }
};

const Dashboard = () => {
  const { dashboard, trends, setDashboard, setTrends } = useAnalyticsStore();
  const { insights, setInsight, loading: aiLoading } = useAIStore();
  const [loading, setLoading] = useState(true);
  const [selectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear] = useState(new Date().getFullYear());
  const {getUser} = useAuthStore();

  console.log("Dashboard rendered for user:", getUser()?.currency);
  const currencySymbol = getCurrencySymbol(getUser()?.currency);
  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth, selectedYear]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, trendsRes] = await Promise.all([
        analyticsAPI.getDashboard(selectedMonth, selectedYear),
        analyticsAPI.getTrends(6)
      ]);

      if (dashboardRes.success) setDashboard(dashboardRes.data);
      if (trendsRes.success) setTrends(trendsRes.data);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAISummary = async () => {
    try {
      const response = await aiAPI.generateSummary(selectedMonth, selectedYear);
      if (response.success) {
        setInsight('monthlySummary', response.data.summary);
        toast.success('AI summary generated!');
      }
    } catch (error) {
      toast.error('Failed to generate AI summary');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-xl">Loading dashboard...</div>
      </div>
    );
  }

  const { summary, categoryBreakdown } = dashboard || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={fetchAISummary}
          className="btn btn-primary flex items-center gap-2"
          disabled={aiLoading}
        >
          <Sparkles size={20} />
          {aiLoading ? 'Generating...' : 'AI Summary'}
        </button>
      </div>

      {/* AI Insight */}
      {console.log("Rendering AI Insight:", insights.monthlySummary)}
      {insights.monthlySummary && (
        <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200">
          <div className="flex items-start gap-3">
            <Sparkles className="text-primary-600 mt-1" size={24} />
            <div>
              <h3 className="font-semibold text-lg mb-2">AI Financial Summary</h3>
              <p className="text-gray-700 whitespace-pre-line">{insights.monthlySummary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Income</p>
              <p className="text-2xl font-bold text-green-600">
                {currencySymbol}{summary?.income?.toFixed(2) || '0.00'}
              </p>
            </div>
            <TrendingUp className="text-green-600" size={32} />
          </div>
        </div>

        {/* expense card */}
        <div className="card bg-red-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expenses</p>
              <p className="text-2xl font-bold text-red-600">
                {currencySymbol}{summary?.expense?.toFixed(2) || '0.00'}
              </p>
            </div>
            <TrendingDown className="text-red-600" size={32} />
          </div>
        </div>

{/*  BALANCE CARD*/}
        <div className="card bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Balance</p>
              <p className="text-2xl font-bold text-blue-600">
                {currencySymbol}{summary?.balance?.toFixed(2) || '0.00'}
              </p>
            </div>
            <DollarSign className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="card bg-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Savings Rate</p>
              <p className="text-2xl font-bold text-purple-600">
                {summary?.savingsRate?.toFixed(1) || '0'}%
              </p>
            </div>
            <PiggyBank className="text-purple-600" size={32} />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expense Trend */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Income vs Expense Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Expense by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryBreakdown}
                dataKey="total"
                nameKey="_id"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {categoryBreakdown?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category List */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Top Spending Categories</h3>
        <div className="space-y-3">
          {categoryBreakdown?.slice(0, 5).map((category, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="font-medium">{category._id}</span>
              </div>
              <div className="text-right">
                <p className="font-semibold">{currencySymbol}{category.total.toFixed(2)}</p>
                <p className="text-sm text-gray-500">{category.count} transactions</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
