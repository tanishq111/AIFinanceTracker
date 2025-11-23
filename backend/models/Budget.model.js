import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  category: {
    type: String,
    required: [true, 'Category is required']
  },
  amount: {
    type: Number,
    required: [true, 'Budget amount is required'],
    min: [0, 'Budget amount cannot be negative']
  },
  spent: {
    type: Number,
    default: 0,
    min: 0
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  alertThreshold: {
    type: Number,
    default: 80,
    min: 0,
    max: 100
  },
  alertSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index for unique budget per category per month
budgetSchema.index({ user: 1, category: 1, month: 1, year: 1 }, { unique: true });

// Virtual for percentage spent
budgetSchema.virtual('percentageSpent').get(function() {
  return this.amount > 0 ? (this.spent / this.amount) * 100 : 0;
});

budgetSchema.set('toJSON', { virtuals: true });
budgetSchema.set('toObject', { virtuals: true });

const Budget = mongoose.model('Budget', budgetSchema);

export default Budget;
