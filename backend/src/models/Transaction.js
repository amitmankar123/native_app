const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
    },
    amount_paise: {
      type: Number,
      required: true,
      min: 1,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    subcategory: {
      type: String,
      trim: true,
      default: '',
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    payment_method: {
      type: String,
      default: 'UPI',
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      default: '',
    },
    is_recurring: {
      type: Boolean,
      default: false,
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

module.exports = mongoose.model('Transaction', transactionSchema);

