import React, { useEffect, useState } from 'react';
import { budgetAPI, savingsGoalAPI, aiAPI } from '../services/api.service';
import { useBudgetStore } from '../stores/budgetStore';
import { useSavingsGoalStore } from '../stores/savingsGoalStore';
import { Plus, Target, TrendingUp, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const BudgetsGoals = () => {
  const { budgets, setBudgets } = useBudgetStore();
  const { goals, setGoals } = useSavingsGoalStore();
  const [loading, setLoading] = useState(true);
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [selectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear] = useState(new Date().getFullYear());
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({
    category: '',
    amount: '',
    alertThreshold: 80
  });
  const [goalForm, setGoalForm] = useState({
    name: '',
    targetAmount: '',
    currentAmount: 0,
    deadline: '',
    category: '',
    icon: '🎯'
  });

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [budgetsRes, goalsRes] = await Promise.all([
        budgetAPI.getAll({ month: selectedMonth, year: selectedYear }),
        savingsGoalAPI.getAll('active')
      ]);

      if (budgetsRes.success) setBudgets(budgetsRes.data);
      if (goalsRes.success) setGoals(goalsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const getAIRecommendations = async () => {
    try {
      const response = await aiAPI.getSavingsRecommendations();
      if (response.success) {
        setAiRecommendations(response.data.recommendations);
        toast.success('AI recommendations generated!');
      }
    } catch (error) {
      toast.error('Failed to generate recommendations');
    }
  };

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    try {
      const response = await budgetAPI.create({
        ...budgetForm,
        month: selectedMonth,
        year: selectedYear
      });
      
      if (response.success) {
        toast.success('Budget created successfully!');
        setShowBudgetModal(false);
        setBudgetForm({ category: '', amount: '', alertThreshold: 80 });
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create budget');
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    try {
      const response = await savingsGoalAPI.create(goalForm);
      
      if (response.success) {
        toast.success('Savings goal created successfully!');
        setShowGoalModal(false);
        setGoalForm({
          name: '',
          targetAmount: '',
          currentAmount: 0,
          deadline: '',
          category: '',
          icon: '🎯'
        });
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create goal');
    }
  };

  const getBudgetColor = (percentage) => {
    if (percentage >= 100) return 'text-red-600 bg-red-50';
    if (percentage >= 80) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Budgets & Goals</h1>
        <button onClick={getAIRecommendations} className="btn btn-primary flex items-center gap-2">
          <Sparkles size={20} />
          AI Recommendations
        </button>
      </div>

      {/* AI Recommendations */}
      {aiRecommendations && (
        <div className="card bg-gradient-to-r from-green-50 to-green-100 border border-green-200">
          <div className="flex items-start gap-3">
            <Sparkles className="text-green-600 mt-1" size={24} />
            <div>
              <h3 className="font-semibold text-lg mb-2">AI Savings Recommendations</h3>
              <p className="text-gray-700 whitespace-pre-line">{aiRecommendations}</p>
            </div>
          </div>
        </div>
      )}

      {/* Budgets Section */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Monthly Budgets</h2>
          <button onClick={() => setShowBudgetModal(true)} className="btn btn-primary flex items-center gap-2">
            <Plus size={20} />
            Add Budget
          </button>
        </div>

        {budgets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No budgets set for this month. Create your first budget!
          </div>
        ) : (
          <div className="space-y-4">
            {budgets.map((budget) => (
              <div key={budget._id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{budget.category}</h3>
                    <p className="text-sm text-gray-500">
                      {budget.month}/{budget.year}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getBudgetColor(budget.percentageSpent)}`}>
                    {budget.percentageSpent.toFixed(1)}%
                  </div>
                </div>
                
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>${budget.spent.toFixed(2)} spent</span>
                    <span>${budget.amount.toFixed(2)} budgeted</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        budget.percentageSpent >= 100 ? 'bg-red-500' :
                        budget.percentageSpent >= 80 ? 'bg-orange-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(budget.percentageSpent, 100)}%` }}
                    />
                  </div>
                </div>
                
                <p className="text-sm text-gray-600">
                  ${(budget.amount - budget.spent).toFixed(2)} remaining
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Savings Goals Section */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Savings Goals</h2>
          <button onClick={() => setShowGoalModal(true)} className="btn btn-primary flex items-center gap-2">
            <Plus size={20} />
            Add Goal
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No savings goals yet. Set your first goal!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((goal) => (
              <div key={goal._id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{goal.icon}</span>
                    <div>
                      <h3 className="font-semibold">{goal.name}</h3>
                      <p className="text-sm text-gray-500">{goal.category}</p>
                    </div>
                  </div>
                  <Target className="text-primary-600" size={20} />
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>${goal.currentAmount.toFixed(2)}</span>
                    <span>${goal.targetAmount.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-primary-600 h-3 rounded-full"
                      style={{ width: `${Math.min(goal.progressPercentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {goal.progressPercentage.toFixed(1)}% complete
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-gray-600">Required/month</p>
                    <p className="font-semibold text-primary-600">
                      ${goal.requiredMonthlySaving.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600">Deadline</p>
                    <p className="font-semibold">
                      {new Date(goal.deadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add Budget</h3>
            <form onSubmit={handleCreateBudget}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Category</label>
                <input
                  type="text"
                  className="input-field"
                  value={budgetForm.category}
                  onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
                  placeholder="e.g., Food, Transportation"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Budget Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input-field"
                  value={budgetForm.amount}
                  onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Alert Threshold (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input-field"
                  value={budgetForm.alertThreshold}
                  onChange={(e) => setBudgetForm({ ...budgetForm, alertThreshold: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary flex-1">Create Budget</button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBudgetModal(false);
                    setBudgetForm({ category: '', amount: '', alertThreshold: 80 });
                  }}
                  className="btn bg-gray-200 hover:bg-gray-300 flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add Savings Goal</h3>
            <form onSubmit={handleCreateGoal}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Goal Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={goalForm.name}
                  onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
                  placeholder="e.g., Emergency Fund"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  className="input-field"
                  value={goalForm.category}
                  onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value })}
                  required
                >
                  <option value="">Select category</option>
                  <option value="Emergency Fund">Emergency Fund</option>
                  <option value="Vacation">Vacation</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Education">Education</option>
                  <option value="Home">Home</option>
                  <option value="Vehicle">Vehicle</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Target Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input-field"
                  value={goalForm.targetAmount}
                  onChange={(e) => setGoalForm({ ...goalForm, targetAmount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Current Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input-field"
                  value={goalForm.currentAmount}
                  onChange={(e) => setGoalForm({ ...goalForm, currentAmount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Deadline</label>
                <input
                  type="date"
                  className="input-field"
                  value={goalForm.deadline}
                  onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Icon</label>
                <input
                  type="text"
                  className="input-field"
                  value={goalForm.icon}
                  onChange={(e) => setGoalForm({ ...goalForm, icon: e.target.value })}
                  placeholder="🎯"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary flex-1">Create Goal</button>
                <button
                  type="button"
                  onClick={() => {
                    setShowGoalModal(false);
                    setGoalForm({
                      name: '',
                      targetAmount: '',
                      currentAmount: 0,
                      deadline: '',
                      category: '',
                      icon: '🎯'
                    });
                  }}
                  className="btn bg-gray-200 hover:bg-gray-300 flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetsGoals;
