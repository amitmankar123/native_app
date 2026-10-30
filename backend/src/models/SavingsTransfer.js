const mongoose = require('mongoose');

const savingsTransferSchema = new mongoose.Schema(
  {
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
    transfer_type: {
      type: String,
      enum: ['deposit', 'withdrawal'],
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
    date: {
      type: String,
      required: true,
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

module.exports = mongoose.model('SavingsTransfer', savingsTransferSchema);

