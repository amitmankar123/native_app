export const EXPENSE_CATEGORIES = [
  {
    id: 'bike_transport',
    name: 'Bike & Transportation',
    icon: '🛵',
    color: '#3B82F6',
    subcategories: ['Petrol', 'Servicing', 'Engine oil', 'Repairs', 'Insurance', 'Accessories'],
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: '🛍️',
    color: '#EC4899',
    subcategories: ['Clothes', 'Shoes', 'Accessories', 'Online shopping'],
  },
  {
    id: 'food_snacks',
    name: 'Food & Snacks',
    icon: '🍔',
    color: '#F97316',
    subcategories: ['Junk food', 'Restaurant', 'Tea/coffee', 'Street food', 'Food delivery'],
  },
  {
    id: 'mobile_digital',
    name: 'Mobile & Digital',
    icon: '📱',
    color: '#8B5CF6',
    subcategories: ['Mobile recharge', 'Internet', 'OTT subscriptions', 'Software subscriptions'],
  },
  {
    id: 'household',
    name: 'Household',
    icon: '🏠',
    color: '#10B981',
    subcategories: ['Groceries', 'Kitchen essentials', 'Cleaning supplies', 'Home requirements'],
  },
  {
    id: 'friends_social',
    name: 'Friends & Social',
    icon: '👥',
    color: '#06B6D4',
    subcategories: ['Shared bills', 'Gifts', 'Social activities'],
  },
  {
    id: 'medical_healthcare',
    name: 'Medical & Healthcare',
    icon: '🩺',
    color: '#EF4444',
    subcategories: ['Medicines', 'Doctor visits', 'Medical tests'],
  },
  {
    id: 'it_career',
    name: 'IT & Career',
    icon: '💻',
    color: '#6366F1',
    subcategories: ['Courses', 'Books', 'Hosting', 'Domains', 'Technical equipment', 'Interview expenses'],
  },
  {
    id: 'travel',
    name: 'Travel',
    icon: '✈️',
    color: '#F59E0B',
    subcategories: ['Auto/cab', 'Bus/train', 'Parking', 'Other travel'],
  },
  {
    id: 'bills_utilities',
    name: 'Bills & Utilities',
    icon: '⚡',
    color: '#EAB308',
    subcategories: ['Electricity', 'Water', 'Gas', 'Other bills'],
  },
  {
    id: 'savings_investments',
    name: 'Savings & Investments',
    icon: '📈',
    color: '#14B8A6',
    subcategories: ['Emergency fund', 'RD/FD', 'Investments'],
  },
  {
    id: 'miscellaneous',
    name: 'Miscellaneous',
    icon: '📦',
    color: '#64748B',
    subcategories: ['Personal care', 'Entertainment', 'Gifts', 'Unexpected expenses'],
  },
];

export const INCOME_CATEGORIES = [
  { id: 'salary', name: 'Salary', icon: '💼', color: '#10B981', default: true },
  { id: 'freelancing', name: 'Freelancing', icon: '💻', color: '#06B6D4' },
  { id: 'bonus', name: 'Bonus', icon: '🎁', color: '#F59E0B' },
  { id: 'cashback', name: 'Cashback', icon: '🪙', color: '#8B5CF6' },
  { id: 'refund', name: 'Refund', icon: '↩️', color: '#3B82F6' },
  { id: 'other_income', name: 'Other income', icon: '💰', color: '#14B8A6' },
];

export const PAYMENT_METHODS = [
  { id: 'UPI', name: 'UPI (GPay / PhonePe / Paytm)', icon: '⚡' },
  { id: 'Bank Account', name: 'Bank Transfer / NetBanking', icon: '🏦' },
  { id: 'Cash', name: 'Cash', icon: '💵' },
  { id: 'Other', name: 'Other / Card', icon: '💳' },
];

