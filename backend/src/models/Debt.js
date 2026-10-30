const mongoose = require('mongoose');

const debtSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['lent', 'borrowed'],
      required: true,
    },
    person_name: {
      type: String,
      required: true,
      trim: true,
    },
    original_amount_paise: {
      type: Number,
      required: true,
      min: 1,
    },
    remaining_amount_paise: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'partially_repaid', 'repaid'],
      default: 'pending',
    },
    due_date: {
      type: String,
      default: null,
    },
    description: {
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

module.exports = mongoose.model('Debt', debtSchema);

