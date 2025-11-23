import Transaction from '../models/Transaction.model.js';

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private
export const getDashboardAnalytics = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    // Total income and expenses
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

    // Category breakdown
    const categoryBreakdown = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'expense',
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    // Recent transactions
    const recentTransactions = await Transaction.find({
      user: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    })
      .sort({ date: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        summary: {
          income,
          expense,
          balance: income - expense,
          savingsRate: income > 0 ? ((income - expense) / income) * 100 : 0
        },
        categoryBreakdown,
        recentTransactions
      }
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard analytics'
    });
  }
};

// @desc    Get monthly trends
// @route   GET /api/analytics/trends
// @access  Private
export const getMonthlyTrends = async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const monthsToFetch = parseInt(months);

    const trends = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      },
      {
        $limit: monthsToFetch * 2 // income + expense
      }
    ]);

    // Format the data
    const formattedTrends = {};
    trends.forEach(item => {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      if (!formattedTrends[key]) {
        formattedTrends[key] = { month: key, income: 0, expense: 0 };
      }
      formattedTrends[key][item._id.type] = item.total;
    });

    res.json({
      success: true,
      data: Object.values(formattedTrends).reverse()
    });
  } catch (error) {
    console.error('Monthly trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching monthly trends'
    });
  }
};

// @desc    Get category analysis
// @route   GET /api/analytics/categories
// @access  Private
export const getCategoryAnalysis = async (req, res) => {
  try {
    const { startDate, endDate, type = 'expense' } = req.query;

    const matchQuery = {
      user: req.user._id,
      type
    };

    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) matchQuery.date.$lte = new Date(endDate);
    }

    const categoryData = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    // Calculate percentages
    const totalAmount = categoryData.reduce((sum, cat) => sum + cat.total, 0);
    const withPercentages = categoryData.map(cat => ({
      ...cat,
      percentage: totalAmount > 0 ? (cat.total / totalAmount) * 100 : 0
    }));

    res.json({
      success: true,
      data: withPercentages
    });
  } catch (error) {
    console.error('Category analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching category analysis'
    });
  }
};

// @desc    Get cashflow data
// @route   GET /api/analytics/cashflow
// @access  Private
export const getCashflow = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const cashflow = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: {
            $gte: new Date(targetYear, 0, 1),
            $lte: new Date(targetYear, 11, 31, 23, 59, 59)
          }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.month': 1 }
      }
    ]);

    // Format data for all 12 months
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: 0,
      expense: 0,
      netCashflow: 0
    }));

    cashflow.forEach(item => {
      const monthIndex = item._id.month - 1;
      monthlyData[monthIndex][item._id.type] = item.total;
    });

    monthlyData.forEach(month => {
      month.netCashflow = month.income - month.expense;
    });

    res.json({
      success: true,
      data: monthlyData
    });
  } catch (error) {
    console.error('Cashflow error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cashflow data'
    });
  }
};

// @desc    Get spending patterns
// @route   GET /api/analytics/patterns
// @access  Private
export const getSpendingPatterns = async (req, res) => {
  try {
    // Day of week spending
    const dayOfWeekPattern = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'expense'
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: '$date' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Recurring transactions detection
    const recurringTransactions = await Transaction.find({
      user: req.user._id,
      isRecurring: true
    })
      .sort({ date: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        dayOfWeekPattern,
        recurringTransactions
      }
    });
  } catch (error) {
    console.error('Spending patterns error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching spending patterns'
    });
  }
};
