const Transaction = require('../models/Transaction');
const SavingsGoal = require('../models/SavingsGoal');
const SavingsTransfer = require('../models/SavingsTransfer');
const Debt = require('../models/Debt');
const DebtRepayment = require('../models/DebtRepayment');
const Budget = require('../models/Budget');

function getCurrentMonthString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get comprehensive financial dashboard metrics for a user using MongoDB
 */
async function getDashboardData(userId, month = getCurrentMonthString()) {
  const monthStart = `${month}-01`;
  const monthEnd = `${month}-31`;

  // 1. All-time Income (in paise)
  const incomeAgg = await Transaction.aggregate([
    { $match: { user: userId, type: 'income' } },
    { $group: { _id: null, total: { $sum: '$amount_paise' } } },
  ]);
  const totalAllTimeIncome = incomeAgg[0]?.total || 0;

  // 2. All-time Expenses (in paise)
  const expenseAgg = await Transaction.aggregate([
    { $match: { user: userId, type: 'expense' } },
    { $group: { _id: null, total: { $sum: '$amount_paise' } } },
  ]);
  const totalAllTimeExpenses = expenseAgg[0]?.total || 0;

  // 3. Savings transfers
  const savingsDepAgg = await SavingsTransfer.aggregate([
    { $match: { user: userId, transfer_type: 'deposit' } },
    { $group: { _id: null, total: { $sum: '$amount_paise' } } },
  ]);
  const totalSavingsDeposits = savingsDepAgg[0]?.total || 0;

  const savingsWithAgg = await SavingsTransfer.aggregate([
    { $match: { user: userId, transfer_type: 'withdrawal' } },
    { $group: { _id: null, total: { $sum: '$amount_paise' } } },
  ]);
  const totalSavingsWithdrawals = savingsWithAgg[0]?.total || 0;

  const currentSavingsBalance = Math.max(0, totalSavingsDeposits - totalSavingsWithdrawals);

  // 3b. Active Lending & Borrowing
  const lentAgg = await Debt.aggregate([
    { $match: { user: userId, type: 'lent', status: { $ne: 'repaid' } } },
    { $group: { _id: null, total: { $sum: '$remaining_amount_paise' } } },
  ]);
  const totalReceivables = lentAgg[0]?.total || 0;

  const borrowedAgg = await Debt.aggregate([
    { $match: { user: userId, type: 'borrowed', status: { $ne: 'repaid' } } },
    { $group: { _id: null, total: { $sum: '$remaining_amount_paise' } } },
  ]);
  const totalLiabilities = borrowedAgg[0]?.total || 0;

  // Available Spending Balance formula:
  // Available Spending Balance = Total Income + Savings Withdrawals - Total Expenses - Savings Deposits - Total Money Lent Outstanding
  const availableSpendingBalance = totalAllTimeIncome + totalSavingsWithdrawals - totalAllTimeExpenses - totalSavingsDeposits - totalReceivables;

  // 4. Monthly metrics for the selected month
  const monthlyIncomeAgg = await Transaction.aggregate([
    { $match: { user: userId, type: 'income', date: { $gte: monthStart, $lte: monthEnd } } },
    { $group: { _id: null, total: { $sum: '$amount_paise' } } },
  ]);
  const monthlyIncome = monthlyIncomeAgg[0]?.total || 0;

  const monthlyExpenseAgg = await Transaction.aggregate([
    { $match: { user: userId, type: 'expense', date: { $gte: monthStart, $lte: monthEnd } } },
    { $group: { _id: null, total: { $sum: '$amount_paise' } } },
  ]);
  const monthlyExpense = monthlyExpenseAgg[0]?.total || 0;

  // Monthly savings net change
  const monthlyDepAgg = await SavingsTransfer.aggregate([
    { $match: { user: userId, transfer_type: 'deposit', date: { $gte: monthStart, $lte: monthEnd } } },
    { $group: { _id: null, total: { $sum: '$amount_paise' } } },
  ]);
  const monthlySavingsDep = monthlyDepAgg[0]?.total || 0;

  const monthlyWithAgg = await SavingsTransfer.aggregate([
    { $match: { user: userId, transfer_type: 'withdrawal', date: { $gte: monthStart, $lte: monthEnd } } },
    { $group: { _id: null, total: { $sum: '$amount_paise' } } },
  ]);
  const monthlySavingsWith = monthlyWithAgg[0]?.total || 0;

  const monthlySavings = monthlySavingsDep - monthlySavingsWith;

  // 5. Savings Goal
  let savingsGoal = await SavingsGoal.findOne({ user: userId, month });
  if (!savingsGoal) {
    savingsGoal = await SavingsGoal.create({
      user: userId,
      month,
      target_paise: 500000,
      emergency_fund_paise: 0,
    });
  }

  // Net worth formula:
  // Net worth = Spending balance + Savings balance + Receivables - Liabilities
  const netWorth = availableSpendingBalance + currentSavingsBalance + totalReceivables - totalLiabilities;

  // 7. Category-wise expense breakdown
  const categoryBreakdown = await Transaction.aggregate([
    { $match: { user: userId, type: 'expense', date: { $gte: monthStart, $lte: monthEnd } } },
    { $group: { _id: '$category', total_paise: { $sum: '$amount_paise' }, count: { $sum: 1 } } },
    { $project: { category: '$_id', total_paise: 1, count: 1, _id: 0 } },
    { $sort: { total_paise: -1 } },
  ]);

  // 8. Recent 10 transactions & lent activity
  const recentTxList = await Transaction.find({ user: userId })
    .sort({ date: -1, createdAt: -1 })
    .limit(10);

  const recentDebts = await Debt.find({ user: userId, type: 'lent' })
    .sort({ createdAt: -1 })
    .limit(10);

  const mappedDebts = recentDebts.map((d) => ({
    id: d._id.toString(),
    _id: d._id,
    type: 'lent',
    amount_paise: d.original_amount_paise,
    category: 'Friend Lending',
    subcategory: d.person_name,
    date: d.createdAt ? d.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    payment_method: 'Lent',
    description: `Money Lent to ${d.person_name}${d.description ? ` (${d.description})` : ''}`,
    notes: d.description || '',
    status: d.status,
    remaining_amount_paise: d.remaining_amount_paise,
    person_name: d.person_name,
    is_debt: true,
    createdAt: d.createdAt,
  }));

  const recentTransactions = [...recentTxList.map((t) => (t.toJSON ? t.toJSON() : t)), ...mappedDebts]
    .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
    .slice(0, 10);

  // 9. Monthly Budget summary
  const budgetAgg = await Budget.aggregate([
    { $match: { user: userId, month } },
    { $group: { _id: null, total: { $sum: '$budget_limit_paise' } } },
  ]);
  const totalMonthlyBudget = budgetAgg[0]?.total || 0;
  const remainingBudget = Math.max(0, totalMonthlyBudget - monthlyExpense);

  return {
    month,
    balance: {
      available_spending_paise: availableSpendingBalance,
      current_savings_paise: currentSavingsBalance,
      receivables_paise: totalReceivables,
      liabilities_paise: totalLiabilities,
      net_worth_paise: netWorth,
    },
    monthly: {
      income_paise: monthlyIncome,
      expense_paise: monthlyExpense,
      savings_paise: monthlySavings,
      budget_paise: totalMonthlyBudget,
      remaining_budget_paise: remainingBudget,
    },
    savingsGoal: {
      id: savingsGoal._id.toString(),
      month: savingsGoal.month,
      target_paise: savingsGoal.target_paise,
      saved_paise: currentSavingsBalance,
      progress_percentage: savingsGoal.target_paise > 0
        ? Math.min(100, Math.round((currentSavingsBalance / savingsGoal.target_paise) * 100))
        : 0,
      emergency_fund_paise: savingsGoal.emergency_fund_paise,
    },
    categoryBreakdown,
    recentTransactions,
  };
}

/**
 * Add a transaction
 */
async function createTransaction(userId, data) {
  const {
    type,
    amount_paise,
    category,
    subcategory = '',
    date = new Date().toISOString().split('T')[0],
    payment_method = 'UPI',
    description,
    notes = '',
    is_recurring = false,
  } = data;

  if (!type || !['income', 'expense'].includes(type)) {
    throw new Error('Transaction type must be income or expense');
  }

  const parsedAmount = parseInt(amount_paise, 10);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new Error('Amount must be a positive integer in paise');
  }

  if (!category || !description) {
    throw new Error('Category and description are required');
  }

  const txn = await Transaction.create({
    user: userId,
    type,
    amount_paise: parsedAmount,
    category: category.trim(),
    subcategory: subcategory?.trim() || '',
    date,
    payment_method,
    description: description.trim(),
    notes: notes?.trim() || '',
    is_recurring: Boolean(is_recurring),
  });

  return txn;
}

/**
 * Update transaction
 */
async function updateTransaction(userId, id, data) {
  const txn = await Transaction.findOneAndUpdate(
    { _id: id, user: userId },
    { $set: data },
    { new: true }
  );

  if (!txn) {
    const error = new Error('Transaction not found');
    error.status = 404;
    throw error;
  }

  return txn;
}

/**
 * Delete transaction
 */
async function deleteTransaction(userId, id) {
  const result = await Transaction.deleteOne({ _id: id, user: userId });
  if (result.deletedCount === 0) {
    const error = new Error('Transaction not found');
    error.status = 404;
    throw error;
  }
  return { success: true, message: 'Transaction deleted successfully' };
}

/**
 * Query transactions with filters (including Lent records)
 */
async function getTransactions(userId, { type, category, startDate, endDate, search, sortBy = 'date_desc', page = 1, limit = 50 } = {}) {
  const query = { user: userId };

  if (category) {
    query.category = category;
  }

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }

  if (search) {
    query.$or = [
      { description: { $regex: search, $options: 'i' } },
      { notes: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
    ];
  }

  // 1. If only 'lent' items are requested
  if (type === 'lent') {
    const debtQuery = { user: userId, type: 'lent' };
    if (search) {
      debtQuery.$or = [
        { person_name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    const debts = await Debt.find(debtQuery).sort({ createdAt: -1 });
    const formatted = debts.map((d) => ({
      id: d._id.toString(),
      _id: d._id,
      type: 'lent',
      amount_paise: d.original_amount_paise,
      category: 'Friend Lending',
      subcategory: d.person_name,
      date: d.createdAt ? d.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      payment_method: 'Lent',
      description: `Money Lent to ${d.person_name}${d.description ? ` (${d.description})` : ''}`,
      notes: d.description || '',
      status: d.status,
      remaining_amount_paise: d.remaining_amount_paise,
      person_name: d.person_name,
      is_debt: true,
      createdAt: d.createdAt,
    }));

    if (sortBy === 'amount_desc') {
      formatted.sort((a, b) => b.amount_paise - a.amount_paise);
    } else if (sortBy === 'amount_asc') {
      formatted.sort((a, b) => a.amount_paise - b.amount_paise);
    } else if (sortBy === 'date_asc') {
      formatted.sort((a, b) => new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime());
    } else {
      formatted.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
    }

    return {
      transactions: formatted,
      total: formatted.length,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };
  }

  // 2. If single transaction type 'income' or 'expense'
  if (type && ['income', 'expense'].includes(type)) {
    query.type = type;
    let sort = { date: -1, createdAt: -1 };
    if (sortBy === 'amount_desc') sort = { amount_paise: -1, date: -1 };
    if (sortBy === 'amount_asc') sort = { amount_paise: 1, date: -1 };
    if (sortBy === 'date_asc') sort = { date: 1, createdAt: 1 };

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const items = await Transaction.find(query).sort(sort).skip(skip).limit(parseInt(limit, 10));
    const totalCount = await Transaction.countDocuments(query);

    return {
      transactions: items,
      total: totalCount,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };
  }

  // 3. 'all' or default: combine transactions and lent records
  let sort = { date: -1, createdAt: -1 };
  if (sortBy === 'amount_desc') sort = { amount_paise: -1, date: -1 };
  if (sortBy === 'amount_asc') sort = { amount_paise: 1, date: -1 };
  if (sortBy === 'date_asc') sort = { date: 1, createdAt: 1 };

  const txItems = await Transaction.find(query).sort(sort).limit(100);

  const debtQuery = { user: userId, type: 'lent' };
  if (search) {
    debtQuery.$or = [
      { person_name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  const debts = await Debt.find(debtQuery).sort({ createdAt: -1 }).limit(100);
  const formattedDebts = debts.map((d) => ({
    id: d._id.toString(),
    _id: d._id,
    type: 'lent',
    amount_paise: d.original_amount_paise,
    category: 'Friend Lending',
    subcategory: d.person_name,
    date: d.createdAt ? d.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    payment_method: 'Lent',
    description: `Money Lent to ${d.person_name}${d.description ? ` (${d.description})` : ''}`,
    notes: d.description || '',
    status: d.status,
    remaining_amount_paise: d.remaining_amount_paise,
    person_name: d.person_name,
    is_debt: true,
    createdAt: d.createdAt,
  }));

  const combined = [
    ...txItems.map((t) => (t.toJSON ? t.toJSON() : t)),
    ...formattedDebts,
  ];

  if (sortBy === 'amount_desc') {
    combined.sort((a, b) => b.amount_paise - a.amount_paise);
  } else if (sortBy === 'amount_asc') {
    combined.sort((a, b) => a.amount_paise - b.amount_paise);
  } else if (sortBy === 'date_asc') {
    combined.sort((a, b) => new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime());
  } else {
    // date_desc
    combined.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
  }

  const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const paginated = combined.slice(skip, skip + parseInt(limit, 10));

  return {
    transactions: paginated,
    total: combined.length,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };
}

/**
 * Savings Goal Management
 */
async function setSavingsGoal(userId, { month, target_paise, emergency_fund_paise }) {
  const currentMonth = month || getCurrentMonthString();
  const target = parseInt(target_paise, 10);

  const goal = await SavingsGoal.findOneAndUpdate(
    { user: userId, month: currentMonth },
    {
      $set: {
        target_paise: target,
        ...(emergency_fund_paise !== undefined && { emergency_fund_paise: parseInt(emergency_fund_paise, 10) }),
      },
    },
    { new: true, upsert: true }
  );

  return goal;
}

/**
 * Transfer funds to/from savings
 */
async function recordSavingsTransfer(userId, { amount_paise, transfer_type, notes = '', date = new Date().toISOString().split('T')[0] }) {
  const amount = parseInt(amount_paise, 10);
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Transfer amount must be positive');
  }

  if (!['deposit', 'withdrawal'].includes(transfer_type)) {
    throw new Error('Transfer type must be deposit or withdrawal');
  }

  return await SavingsTransfer.create({
    user: userId,
    amount_paise: amount,
    transfer_type,
    notes,
    date,
  });
}

/**
 * Get savings summary & transfers history
 */
async function getSavingsData(userId, month = getCurrentMonthString()) {
  const goal = await SavingsGoal.findOne({ user: userId, month });

  const depAgg = await SavingsTransfer.aggregate([
    { $match: { user: userId, transfer_type: 'deposit' } },
    { $group: { _id: null, total: { $sum: '$amount_paise' } } },
  ]);
  const deposits = depAgg[0]?.total || 0;

  const withAgg = await SavingsTransfer.aggregate([
    { $match: { user: userId, transfer_type: 'withdrawal' } },
    { $group: { _id: null, total: { $sum: '$amount_paise' } } },
  ]);
  const withdrawals = withAgg[0]?.total || 0;

  const currentSavings = Math.max(0, deposits - withdrawals);
  const history = await SavingsTransfer.find({ user: userId }).sort({ date: -1, createdAt: -1 }).limit(30);

  return {
    goal: goal || {
      month,
      target_paise: 500000,
      emergency_fund_paise: 0,
    },
    totalSavingsPaise: currentSavings,
    history,
  };
}

/**
 * Lending and Borrowing (Debts)
 */
async function createDebt(userId, data) {
  const { type, person_name, original_amount_paise, due_date = null, description = '' } = data;

  if (!type || !['lent', 'borrowed'].includes(type)) {
    throw new Error('Debt type must be lent or borrowed');
  }

  const amount = parseInt(original_amount_paise, 10);
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Amount must be positive');
  }

  if (!person_name || !person_name.trim()) {
    throw new Error('Person name is required');
  }

  return await Debt.create({
    user: userId,
    type,
    person_name: person_name.trim(),
    original_amount_paise: amount,
    remaining_amount_paise: amount,
    status: 'pending',
    due_date,
    description: description.trim(),
  });
}

/**
 * Record a repayment for a debt
 */
async function recordRepayment(userId, debtId, { amount_paise, date = new Date().toISOString().split('T')[0], notes = '' }) {
  const debt = await Debt.findOne({ _id: debtId, user: userId });
  if (!debt) {
    const error = new Error('Debt record not found');
    error.status = 404;
    throw error;
  }

  const repayAmount = parseInt(amount_paise, 10);
  if (isNaN(repayAmount) || repayAmount <= 0) {
    throw new Error('Repayment amount must be positive');
  }

  if (repayAmount > debt.remaining_amount_paise) {
    throw new Error(`Repayment cannot exceed remaining balance of ₹${(debt.remaining_amount_paise / 100).toFixed(2)}`);
  }

  const repayment = await DebtRepayment.create({
    debt: debt._id,
    user: userId,
    amount_paise: repayAmount,
    date,
    notes,
  });

  const newRemaining = debt.remaining_amount_paise - repayAmount;
  debt.remaining_amount_paise = newRemaining;
  debt.status = newRemaining === 0 ? 'repaid' : 'partially_repaid';
  await debt.save();

  return { debt, repayment };
}

/**
 * Get all debts with their repayments
 */
async function getDebts(userId, { type } = {}) {
  const query = { user: userId };
  if (type && ['lent', 'borrowed'].includes(type)) {
    query.type = type;
  }

  const debts = await Debt.find(query).sort({ createdAt: -1 });

  const populated = await Promise.all(
    debts.map(async (d) => {
      const repayments = await DebtRepayment.find({ debt: d._id }).sort({ date: -1 });
      const obj = d.toJSON();
      obj.repayments = repayments;
      return obj;
    })
  );

  const lentAgg = await Debt.aggregate([
    { $match: { user: userId, type: 'lent', status: { $ne: 'repaid' } } },
    { $group: { _id: null, total: { $sum: '$remaining_amount_paise' } } },
  ]);
  const lentTotal = lentAgg[0]?.total || 0;

  const borrowedAgg = await Debt.aggregate([
    { $match: { user: userId, type: 'borrowed', status: { $ne: 'repaid' } } },
    { $group: { _id: null, total: { $sum: '$remaining_amount_paise' } } },
  ]);
  const borrowedTotal = borrowedAgg[0]?.total || 0;

  return {
    debts: populated,
    summary: {
      totalLentReceivablePaise: lentTotal,
      totalBorrowedLiabilityPaise: borrowedTotal,
      netDebtPositionPaise: lentTotal - borrowedTotal,
    },
  };
}

/**
 * Delete debt
 */
async function deleteDebt(userId, debtId) {
  const result = await Debt.deleteOne({ _id: debtId, user: userId });
  if (result.deletedCount === 0) {
    const error = new Error('Debt not found');
    error.status = 404;
    throw error;
  }
  await DebtRepayment.deleteMany({ debt: debtId });
  return { success: true, message: 'Debt record deleted' };
}

/**
 * Monthly Budgets
 */
async function getBudgets(userId, month = getCurrentMonthString()) {
  const budgets = await Budget.find({ user: userId, month });
  const monthStart = `${month}-01`;
  const monthEnd = `${month}-31`;

  const enriched = await Promise.all(
    budgets.map(async (b) => {
      const spentAgg = await Transaction.aggregate([
        { $match: { user: userId, type: 'expense', category: b.category, date: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount_paise' } } },
      ]);
      const spent = spentAgg[0]?.total || 0;
      const remaining = Math.max(0, b.budget_limit_paise - spent);
      const percentage = b.budget_limit_paise > 0 ? Math.round((spent / b.budget_limit_paise) * 100) : 0;

      const obj = b.toJSON();
      obj.spent_paise = spent;
      obj.remaining_paise = remaining;
      obj.percentage = percentage;
      obj.isWarning = percentage >= 80 && percentage < 100;
      obj.isExceeded = percentage >= 100;
      return obj;
    })
  );

  return enriched;
}

/**
 * Upsert category budget
 */
async function setBudget(userId, { month, category, budget_limit_paise }) {
  const currentMonth = month || getCurrentMonthString();
  const limit = parseInt(budget_limit_paise, 10);

  await Budget.findOneAndUpdate(
    { user: userId, month: currentMonth, category },
    { $set: { budget_limit_paise: limit } },
    { new: true, upsert: true }
  );

  return await getBudgets(userId, currentMonth);
}

/**
 * Analytics & Reports
 */
async function getReports(userId, { startDate, endDate, month = getCurrentMonthString() } = {}) {
  let rangeStart = startDate || `${month}-01`;
  let rangeEnd = endDate || `${month}-31`;

  const incomeAgg = await Transaction.aggregate([
    { $match: { user: userId, type: 'income', date: { $gte: rangeStart, $lte: rangeEnd } } },
    { $group: { _id: null, total: { $sum: '$amount_paise' } } },
  ]);
  const totalIncome = incomeAgg[0]?.total || 0;

  const expenseAgg = await Transaction.aggregate([
    { $match: { user: userId, type: 'expense', date: { $gte: rangeStart, $lte: rangeEnd } } },
    { $group: { _id: null, total: { $sum: '$amount_paise' } } },
  ]);
  const totalExpense = expenseAgg[0]?.total || 0;

  const categoryBreakdown = await Transaction.aggregate([
    { $match: { user: userId, type: 'expense', date: { $gte: rangeStart, $lte: rangeEnd } } },
    { $group: { _id: '$category', total_paise: { $sum: '$amount_paise' }, count: { $sum: 1 } } },
    { $project: { category: '$_id', total_paise: 1, count: 1, _id: 0 } },
    { $sort: { total_paise: -1 } },
  ]);

  const paymentMethods = await Transaction.aggregate([
    { $match: { user: userId, type: 'expense', date: { $gte: rangeStart, $lte: rangeEnd } } },
    { $group: { _id: '$payment_method', total_paise: { $sum: '$amount_paise' }, count: { $sum: 1 } } },
    { $project: { payment_method: '$_id', total_paise: 1, count: 1, _id: 0 } },
    { $sort: { total_paise: -1 } },
  ]);

  return {
    period: { start: rangeStart, end: rangeEnd, month },
    summary: {
      income_paise: totalIncome,
      expense_paise: totalExpense,
      net_savings_paise: totalIncome - totalExpense,
    },
    categoryBreakdown,
    paymentMethods,
  };
}

module.exports = {
  getDashboardData,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactions,
  setSavingsGoal,
  recordSavingsTransfer,
  getSavingsData,
  createDebt,
  recordRepayment,
  getDebts,
  deleteDebt,
  getBudgets,
  setBudget,
  getReports,
  getCurrentMonthString,
};
