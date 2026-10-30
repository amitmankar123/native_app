const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    mobile: {
      type: String,
      trim: true,
    },
    password_hash: {
      type: String,
      required: true,
    },
    profile_image: {
      type: String,
      default: '👑',
    },
    currency: {
      type: String,
      default: 'INR',
    },
    monthly_salary: {
      type: Number,
      default: 1500000, // ₹15,000 stored in paise
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

module.exports = mongoose.model('User', userSchema);

