const mongoose = require('mongoose');

const debtRepaymentSchema = new mongoose.Schema(
  {
    debt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Debt',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount_paise: {
      type: Number,
      required: true,
      min: 1,
    },
    date: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      default: '',
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

module.exports = mongoose.model('DebtRepayment', debtRepaymentSchema);

