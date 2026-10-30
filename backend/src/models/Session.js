const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token_hash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    device_info: {
      type: String,
      default: 'Mobile Client',
    },
    ip_address: {
      type: String,
      default: '127.0.0.1',
    },
    is_revoked: {
      type: Boolean,
      default: false,
    },
    expires_at: {
      type: Date,
      required: true,
    },
    last_used_at: {
      type: Date,
      default: Date.now,
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

module.exports = mongoose.model('Session', sessionSchema);

