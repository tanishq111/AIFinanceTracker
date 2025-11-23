import mongoose from 'mongoose';

const savingsGoalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Goal name is required'],
    trim: true
  },
  targetAmount: {
    type: Number,
    required: [true, 'Target amount is required'],
    min: [0, 'Target amount cannot be negative']
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required']
  },
  category: {
    type: String,
    enum: ['Emergency Fund', 'Vacation', 'Electronics', 'Education', 'Home', 'Vehicle', 'Other'],
    default: 'Other'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  icon: {
    type: String,
    default: '🎯'
  }
}, {
  timestamps: true
});

// Virtual for progress percentage
savingsGoalSchema.virtual('progressPercentage').get(function() {
  return this.targetAmount > 0 ? (this.currentAmount / this.targetAmount) * 100 : 0;
});

// Virtual for required monthly saving
savingsGoalSchema.virtual('requiredMonthlySaving').get(function() {
  const today = new Date();
  const deadline = new Date(this.deadline);
  const monthsRemaining = Math.max(1, (deadline.getFullYear() - today.getFullYear()) * 12 + deadline.getMonth() - today.getMonth());
  const remaining = this.targetAmount - this.currentAmount;
  return Math.max(0, remaining / monthsRemaining);
});

savingsGoalSchema.set('toJSON', { virtuals: true });
savingsGoalSchema.set('toObject', { virtuals: true });

const SavingsGoal = mongoose.model('SavingsGoal', savingsGoalSchema);

export default SavingsGoal;
