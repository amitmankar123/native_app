const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
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
    category: {
      type: String,
      required: true,
    },
    budget_limit_paise: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

budgetSchema.index({ user: 1, month: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);

