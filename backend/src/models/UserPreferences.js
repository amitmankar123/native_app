const mongoose = require('mongoose');

const DEFAULT_WIDGETS = [
  { id: 'balance', title: 'Total Balance', visible: true, order: 1 },
  { id: 'income_expense', title: 'Income & Expense Cards', visible: true, order: 2 },
  { id: 'savings_progress', title: 'Monthly Savings Progress', visible: true, order: 3 },
  { id: 'quick_actions', title: 'Quick Action Buttons', visible: true, order: 4 },
  { id: 'expense_chart', title: 'Expense Distribution Chart', visible: true, order: 5 },
  { id: 'recent_transactions', title: 'Recent Transactions', visible: true, order: 6 },
];

const userPreferencesSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    theme_mode: {
      type: String,
      enum: ['system', 'light', 'dark'],
      default: 'system',
    },
    accent_color: {
      type: String,
      default: '#2563EB',
    },
    interface_style: {
      type: String,
      enum: ['glassmorphism', 'minimal'],
      default: 'glassmorphism',
    },
    haptic_feedback: {
      type: Boolean,
      default: true,
    },
    animations_enabled: {
      type: Boolean,
      default: true,
    },
    date_format: {
      type: String,
      default: 'DD/MM/YYYY',
    },
    number_format: {
      type: String,
      default: 'en-IN',
    },
    dashboard_widgets: {
      type: Array,
      default: DEFAULT_WIDGETS,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('UserPreferences', userPreferencesSchema);

