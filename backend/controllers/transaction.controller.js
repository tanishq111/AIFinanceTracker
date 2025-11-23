import Transaction from '../models/Transaction.model.js';
import Budget from '../models/Budget.model.js';
import { v2 as cloudinary } from 'cloudinary';
import { createNotification, checkHighValueTransaction, checkUnusualSpending } from '../services/notification.service.js';

// Cloudinary config will be initialized lazily when needed

// @desc    Get all transactions for user
// @route   GET /api/transactions
// @access  Private
export const getTransactions = async (req, res) => {
  try {
    const { type, category, startDate, endDate, minAmount, maxAmount, search } = req.query;
    
    const query = { user: req.user._id };

    // Apply filters
    if (type) query.type = type;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = parseFloat(minAmount);
      if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
    }
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { merchant: { $regex: search, $options: 'i' } }
      ];
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .limit(parseInt(req.query.limit) || 100);

    res.json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions'
    });
  }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
export const getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction'
    });
  }
};

// @desc    Create transaction
// @route   POST /api/transactions
// @access  Private
export const createTransaction = async (req, res) => {
  try {
    const transactionData = {
      ...req.body,
      user: req.user._id
    };

    // Handle recurringFrequency: convert empty string to null
    if (!transactionData.isRecurring || transactionData.recurringFrequency === '') {
      transactionData.recurringFrequency = null;
    }

    const transaction = await Transaction.create(transactionData); // simply created

    // Update budget if expense
    if (transaction.type === 'expense') {
      const date = new Date(transaction.date);
      const budget = await Budget.findOneAndUpdate( // finding the budget
        {
          user: req.user._id,
          category: transaction.category,
          month: date.getMonth() + 1,
          year: date.getFullYear()
        },
        { $inc: { spent: transaction.amount } },
        { new: true }
      );

      // Check if budget alert threshold is reached
      if (budget && !budget.alertSent) {
        const percentageSpent = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
        
        if (percentageSpent >= budget.alertThreshold) { // is the spent amount greater than the threshold
          await createNotification(
            req.user._id,
            'budget_alert',
            `Budget Alert: ${budget.category}`,
            `You've spent ${percentageSpent.toFixed(1)}% of your ${budget.category} budget ($${budget.spent.toFixed(2)} of $${budget.amount.toFixed(2)})`,
            {
              budgetId: budget._id,
              category: budget.category,
              percentageSpent: percentageSpent.toFixed(2)
            }
          );
          
          budget.alertSent = true;
          await budget.save();
        }
      }

      // Check for unusual spending
      await checkUnusualSpending(req.user._id, transaction);
      
      // Check for high-value transactions
      await checkHighValueTransaction(req.user._id, transaction);
    }

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating transaction'
    });
  }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
export const updateTransaction = async (req, res) => {
  try {
    const oldTransaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!oldTransaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Handle recurringFrequency: convert empty string to null
    const updateData = { ...req.body };
    if (!updateData.isRecurring || updateData.recurringFrequency === '') {
      updateData.recurringFrequency = null;
    }

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    // Update budgets if expense and amount/category changed
    if (oldTransaction.type === 'expense') {
      const oldDate = new Date(oldTransaction.date);
      await Budget.findOneAndUpdate(
        {
          user: req.user._id,
          category: oldTransaction.category,
          month: oldDate.getMonth() + 1,
          year: oldDate.getFullYear()
        },
        { $inc: { spent: -oldTransaction.amount } }
      );
    }

    if (transaction.type === 'expense') {
      const newDate = new Date(transaction.date);
      await Budget.findOneAndUpdate(
        {
          user: req.user._id,
          category: transaction.category,
          month: newDate.getMonth() + 1,
          year: newDate.getFullYear()
        },
        { $inc: { spent: transaction.amount } }
      );
    }

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating transaction'
    });
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Delete receipt from cloudinary if exists
    if (transaction.receipt && transaction.receipt.publicId) {
      // Configure Cloudinary (lazy initialization)
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });
      await cloudinary.uploader.destroy(transaction.receipt.publicId);
    }

    // Update budget if expense
    if (transaction.type === 'expense') {
      const date = new Date(transaction.date);
      await Budget.findOneAndUpdate(
        {
          user: req.user._id,
          category: transaction.category,
          month: date.getMonth() + 1,
          year: date.getFullYear()
        },
        { $inc: { spent: -transaction.amount } }
      );
    }

    await transaction.deleteOne();

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting transaction'
    });
  }
};

// @desc    Upload receipt
// @route   POST /api/transactions/:id/receipt
// @access  Private
export const uploadReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Configure Cloudinary (lazy initialization)
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    // Upload to cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'finance-tracker/receipts',
      resource_type: 'auto'
    });

    // Delete old receipt if exists
    if (transaction.receipt && transaction.receipt.publicId) {
      await cloudinary.uploader.destroy(transaction.receipt.publicId);
    }

    transaction.receipt = {
      url: result.secure_url,
      publicId: result.public_id
    };

    await transaction.save();

    res.json({
      success: true,
      message: 'Receipt uploaded successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Upload receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading receipt'
    });
  }
};
