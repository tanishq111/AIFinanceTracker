import Budget from '../models/Budget.model.js';
import Transaction from '../models/Transaction.model.js';

// @desc    Get all budgets for user
// @route   GET /api/budgets
// @access  Private
export const getBudgets = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    
    const query = { user: req.user._id };
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    
    // Default to current month if not specified
    if (!month && !year) {
      query.month = currentDate.getMonth() + 1;
      query.year = currentDate.getFullYear();
    }

    const budgets = await Budget.find(query).sort({ category: 1 });

    res.json({
      success: true,
      count: budgets.length,
      data: budgets
    });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching budgets'
    });
  }
};

// @desc    Create or update budget
// @route   POST /api/budgets
// @access  Private
export const createBudget = async (req, res) => {
  try {
    const { category, amount, month, year, alertThreshold } = req.body;
    console.log('Create budget request body:', req.body);
    
    // Calculate current spent for this category
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const transactions = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'expense',
          category,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const spent = transactions.length > 0 ? transactions[0].total : 0;

    // Create or update budget
    const budget = await Budget.findOneAndUpdate(
      {
        user: req.user._id,
        category,
        month,
        year
      },
      {
        user: req.user._id,
        category,
        amount,
        month,
        year,
        spent,
        alertThreshold: alertThreshold || 80,
        alertSent: false
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json({
      success: true,
      message: 'Budget created/updated successfully',
      data: budget
    });
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating budget'
    });
  }
};

// @desc    Update budget
// @route   PUT /api/budgets/:id
// @access  Private
export const updateBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    const updatedBudget = await Budget.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Budget updated successfully',
      data: updatedBudget
    });
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating budget'
    });
  }
};

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
export const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    await budget.deleteOne();

    res.json({
      success: true,
      message: 'Budget deleted successfully'
    });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting budget'
    });
  }
};

// @desc    Recalculate budget spent amounts
// @route   POST /api/budgets/recalculate
// @access  Private
export const recalculateBudgets = async (req, res) => {
  try {
    const { month, year } = req.body;
    
    const budgets = await Budget.find({
      user: req.user._id,
      month,
      year
    });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    for (const budget of budgets) {
      const transactions = await Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            type: 'expense',
            category: budget.category,
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      budget.spent = transactions.length > 0 ? transactions[0].total : 0;
      await budget.save();
    }

    res.json({
      success: true,
      message: 'Budgets recalculated successfully',
      data: budgets
    });
  } catch (error) {
    console.error('Recalculate budgets error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recalculating budgets'
    });
  }
};
