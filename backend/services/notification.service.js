import Notification from '../models/Notification.model.js';
import Budget from '../models/Budget.model.js';
import Transaction from '../models/Transaction.model.js';
import User from '../models/User.model.js';

// Create notification helper
// TODO:: send the notification via email
export const createNotification = async (userId, type, title, message, metadata = {}) => {
  try {
    await Notification.create({ // notification model.
      user: userId,
      type,
      title,
      message,
      metadata
    });
  } catch (error) {
    console.error('Create notification error:', error);
  }
};

// Check budget alerts (called by cron job)
export const checkBudgetAlerts = async () => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Find budgets that are over threshold and haven't sent alert
    const budgets = await Budget.find({
      month: currentMonth,
      year: currentYear,
      alertSent: false
    }).populate('user');

    for (const budget of budgets) {
      const percentageSpent = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;

      if (percentageSpent >= budget.alertThreshold) {
        await createNotification(
          budget.user._id,
          'budget_alert',
          `Budget Alert: ${budget.category}`,
          `You've spent ${percentageSpent.toFixed(1)}% of your ${budget.category} budget (${budget.user.currency} ${budget.spent.toFixed(2)} of ${budget.amount.toFixed(2)})`,
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

    console.log(`Checked ${budgets.length} budgets for alerts`);
  } catch (error) {
    console.error('Check budget alerts error:', error);
  }
};

// Check for unusual spending
export const checkUnusualSpending = async (userId, transaction) => {
  try {
    // Get average transaction amount for this category
    const avgResult = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          category: transaction.category,
          type: 'expense',
          _id: { $ne: transaction._id }
        }
      },
      {
        $group: {
          _id: null,
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);

    if (avgResult.length > 0) {
      const avgAmount = avgResult[0].avgAmount;
      
      // Alert if transaction is 2x or more than average
      if (transaction.amount >= avgAmount * 2) {
        await createNotification(
          userId,
          'unusual_spending',
          'Unusual Spending Detected',
          `Your recent ${transaction.category} transaction of $${transaction.amount.toFixed(2)} is significantly higher than your average of $${avgAmount.toFixed(2)}`,
          {
            transactionId: transaction._id,
            category: transaction.category,
            amount: transaction.amount,
            average: avgAmount
          }
        );
      }
    }
  } catch (error) {
    console.error('Check unusual spending error:', error);
  }
};

// Check for high-value transactions
export const checkHighValueTransaction = async (userId, transaction) => {
  try {
    // Get user to check currency
    const user = await User.findById(userId);
    
    // Threshold for high-value (can be customized)
    const threshold = 50000;

    if (transaction.amount >= threshold) {
      await createNotification(
        userId,
        'high_expense',
        'High-Value Transaction',
        `You made a large ${transaction.type} of ${user.currency} ${transaction.amount.toFixed(2)} in ${transaction.category}`,
        {
          transactionId: transaction._id,
          category: transaction.category,
          amount: transaction.amount
        }
      );
    }
  } catch (error) {
    console.error('Check high-value transaction error:', error);
  }
};
