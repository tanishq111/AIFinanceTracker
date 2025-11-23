import Transaction from '../models/Transaction.model.js';
import {
  categorizeTransaction,
  explainSpendingChange,
  predictExpenses,
  generateFinancialSummary,
  getSavingsRecommendations
} from '../services/ai.service.js';
import SavingsGoal from '../models/SavingsGoal.model.js';

// @desc    Categorize transaction with AI
// @route   POST /api/ai/categorize
// @access  Private
export const aiCategorize = async (req, res) => {
  try {
    const { description, amount } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Description is required'
      });
    }

    const category = await categorizeTransaction(description, amount);

    res.json({
      success: true,
      data: { category }
    });
  } catch (error) {
    console.error('AI categorize error:', error);
    res.status(500).json({
      success: false,
      message: 'Error categorizing transaction'
    });
  }
};

// @desc    Explain spending changes
// @route   POST /api/ai/explain-spending
// @access  Private
export const aiExplainSpending = async (req, res) => {
  try {
    const { currentMonth, currentYear, compareMonth, compareYear } = req.body;

    // Get current period data
    const currentStart = new Date(currentYear, currentMonth - 1, 1);
    const currentEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const currentData = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'expense',
          date: { $gte: currentStart, $lte: currentEnd }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Get comparison period data
    const compareStart = new Date(compareYear, compareMonth - 1, 1);
    const compareEnd = new Date(compareYear, compareMonth, 0, 23, 59, 59);

    const compareData = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'expense',
          date: { $gte: compareStart, $lte: compareEnd }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' }
        }
      }
    ]);

    const currentTotal = currentData.reduce((sum, cat) => sum + cat.total, 0);
    const compareTotal = compareData.reduce((sum, cat) => sum + cat.total, 0);

    const explanation = await explainSpendingChange(
      { total: currentTotal, breakdown: currentData },
      { total: compareTotal, breakdown: compareData }
    );

    res.json({
      success: true,
      data: {
        explanation,
        currentTotal,
        compareTotal,
        change: currentTotal - compareTotal,
        percentageChange: compareTotal > 0 ? ((currentTotal - compareTotal) / compareTotal * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    console.error('AI explain spending error:', error);
    res.status(500).json({
      success: false,
      message: 'Error explaining spending'
    });
  }
};

// @desc    Predict next month expenses
// @route   GET /api/ai/predict-expenses
// @access  Private
export const aiPredictExpenses = async (req, res) => {
  try {
    const { months = 6 } = req.query;

    // Get historical data
    const historicalData = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'expense'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            category: '$category'
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      },
      {
        $limit: parseInt(months) * 10
      }
    ]);

    const prediction = await predictExpenses(historicalData);

    res.json({
      success: true,
      data: {
        prediction,
        historicalData
      }
    });
  } catch (error) {
    console.error('AI predict expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error predicting expenses'
    });
  }
};

// @desc    Generate monthly summary
// @route   POST /api/ai/summary
// @access  Private
export const aiGenerateSummary = async (req, res) => {
  try {
    const { month, year } = req.body; // it will get the date /

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get all data for the month
    const transactions = await Transaction.aggregate([ // calling the mongoose for data
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { type: '$type', category: '$category' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const income = transactions
      .filter(t => t._id.type === 'income')
      .reduce((sum, t) => sum + t.total, 0);

    const expense = transactions
      .filter(t => t._id.type === 'expense')
      .reduce((sum, t) => sum + t.total, 0);

    const summaryData = {
      month: `${year}-${month}`,
      income,
      expense,
      balance: income - expense,
      savingsRate: income > 0 ? ((income - expense) / income * 100).toFixed(2) : 0,
      transactions
    };

    const summary = await generateFinancialSummary(summaryData);

    res.json({
      success: true,
      data: {
        summary,
        stats: summaryData
      }
    });
  } catch (error) {
    console.error('AI summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating summary'
    });
  }
};

// @desc    Get savings recommendations
// @route   GET /api/ai/savings-recommendations
// @access  Private
export const aiSavingsRecommendations = async (req, res) => {
  try {
    const currentDate = new Date();
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Get current month income/expense
    const summary = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    const income = summary.find(s => s._id === 'income')?.total || 0;
    const expense = summary.find(s => s._id === 'expense')?.total || 0;

    // Get active savings goals
    const goals = await SavingsGoal.find({
      user: req.user._id,
      status: 'active'
    });

    const recommendations = await getSavingsRecommendations(income, expense, goals);

    res.json({
      success: true,
      data: {
        recommendations,
        currentIncome: income,
        currentExpense: expense,
        currentSavings: income - expense,
        goals
      }
    });
  } catch (error) {
    console.error('AI savings recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating savings recommendations'
    });
  }
};
