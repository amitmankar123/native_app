const {
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
} = require('../services/financeService');

const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { month } = req.query;
    const data = await getDashboardData(userId, month);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const listTransactions = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { type, category, startDate, endDate, search, sortBy, page, limit } = req.query;
    const data = await getTransactions(userId, {
      type,
      category,
      startDate,
      endDate,
      search,
      sortBy,
      page,
      limit,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const addTransaction = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const data = await createTransaction(userId, req.body);
    res.status(201).json({
      success: true,
      message: `${req.body.type === 'income' ? 'Income' : 'Expense'} recorded successfully`,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const editTransaction = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;
    const data = await updateTransaction(userId, id, req.body);
    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const removeTransaction = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;
    const result = await deleteTransaction(userId, id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getSavings = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { month } = req.query;
    const data = await getSavingsData(userId, month);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const updateSavingsGoal = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const data = await setSavingsGoal(userId, req.body);
    res.status(200).json({
      success: true,
      message: 'Savings goal updated',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const transferSavings = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const data = await recordSavingsTransfer(userId, req.body);
    res.status(201).json({
      success: true,
      message: `Savings ${req.body.transfer_type} recorded successfully`,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const listDebts = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { type } = req.query;
    const data = await getDebts(userId, { type });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const addDebt = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const data = await createDebt(userId, req.body);
    res.status(201).json({
      success: true,
      message: `Money ${req.body.type === 'lent' ? 'lent' : 'borrowed'} recorded successfully`,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const addRepayment = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;
    const data = await recordRepayment(userId, id, req.body);
    res.status(201).json({
      success: true,
      message: 'Repayment recorded successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const removeDebt = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;
    const result = await deleteDebt(userId, id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const listBudgets = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { month } = req.query;
    const data = await getBudgets(userId, month);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const saveBudget = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const data = await setBudget(userId, req.body);
    res.status(200).json({
      success: true,
      message: 'Budget saved successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const reports = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { startDate, endDate, month } = req.query;
    const data = await getReports(userId, { startDate, endDate, month });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  listTransactions,
  addTransaction,
  editTransaction,
  removeTransaction,
  getSavings,
  updateSavingsGoal,
  transferSavings,
  listDebts,
  addDebt,
  addRepayment,
  removeDebt,
  listBudgets,
  saveBudget,
  reports,
};
