const mongoose = require('mongoose');

const savingsGoalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    month: {
      type: String, // YYYY-MM
      required: true,
    },
    target_paise: {
      type: Number,
      default: 500000,
    },
    emergency_fund_paise: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

savingsGoalSchema.index({ user: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('SavingsGoal', savingsGoalSchema);

