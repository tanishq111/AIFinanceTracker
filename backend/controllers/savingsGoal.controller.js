import SavingsGoal from '../models/SavingsGoal.model.js';

// @desc    Get all savings goals
// @route   GET /api/savings-goals
// @access  Private
export const getSavingsGoals = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { user: req.user._id };
    
    if (status) query.status = status;

    const goals = await SavingsGoal.find(query).sort({ deadline: 1 });

    res.json({
      success: true,
      count: goals.length,
      data: goals
    });
  } catch (error) {
    console.error('Get savings goals error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching savings goals'
    });
  }
};

// @desc    Get single savings goal
// @route   GET /api/savings-goals/:id
// @access  Private
export const getSavingsGoal = async (req, res) => {
  try {
    const goal = await SavingsGoal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found'
      });
    }

    res.json({
      success: true,
      data: goal
    });
  } catch (error) {
    console.error('Get savings goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching savings goal'
    });
  }
};

// @desc    Create savings goal
// @route   POST /api/savings-goals
// @access  Private
export const createSavingsGoal = async (req, res) => {
  try {
    const goalData = {
      ...req.body,
      user: req.user._id
    };

    const goal = await SavingsGoal.create(goalData);

    res.status(201).json({
      success: true,
      message: 'Savings goal created successfully',
      data: goal
    });
  } catch (error) {
    console.error('Create savings goal error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating savings goal'
    });
  }
};

// @desc    Update savings goal
// @route   PUT /api/savings-goals/:id
// @access  Private
export const updateSavingsGoal = async (req, res) => {
  try {
    const goal = await SavingsGoal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found'
      });
    }

    const updatedGoal = await SavingsGoal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Auto-complete if target reached
    if (updatedGoal.currentAmount >= updatedGoal.targetAmount) {
      updatedGoal.status = 'completed';
      await updatedGoal.save();
    }

    res.json({
      success: true,
      message: 'Savings goal updated successfully',
      data: updatedGoal
    });
  } catch (error) {
    console.error('Update savings goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating savings goal'
    });
  }
};

// @desc    Add amount to savings goal
// @route   POST /api/savings-goals/:id/add
// @access  Private
export const addToSavingsGoal = async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid amount'
      });
    }

    const goal = await SavingsGoal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found'
      });
    }

    goal.currentAmount += amount;

    // Auto-complete if target reached
    if (goal.currentAmount >= goal.targetAmount) {
      goal.status = 'completed';
    }

    await goal.save();

    res.json({
      success: true,
      message: 'Amount added to savings goal',
      data: goal
    });
  } catch (error) {
    console.error('Add to savings goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding to savings goal'
    });
  }
};

// @desc    Delete savings goal
// @route   DELETE /api/savings-goals/:id
// @access  Private
export const deleteSavingsGoal = async (req, res) => {
  try {
    const goal = await SavingsGoal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found'
      });
    }

    await goal.deleteOne();

    res.json({
      success: true,
      message: 'Savings goal deleted successfully'
    });
  } catch (error) {
    console.error('Delete savings goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting savings goal'
    });
  }
};
