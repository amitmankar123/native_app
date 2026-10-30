const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/financeController');
const { protect } = require('../middlewares/authMiddleware');

// All finance routes require user authentication
router.use(protect);

// Dashboard
router.get('/dashboard', getDashboard);

// Transactions CRUD
router.get('/transactions', listTransactions);
router.post('/transactions', addTransaction);
router.put('/transactions/:id', editTransaction);
router.delete('/transactions/:id', removeTransaction);

// Savings
router.get('/savings', getSavings);
router.post('/savings/goal', updateSavingsGoal);
router.post('/savings/transfer', transferSavings);

// Debts (Friends Lending & Borrowing)
router.get('/debts', listDebts);
router.post('/debts', addDebt);
router.post('/debts/:id/repay', addRepayment);
router.delete('/debts/:id', removeDebt);

// Budgets
router.get('/budgets', listBudgets);
router.post('/budgets', saveBudget);

// Reports & Analytics
router.get('/reports', reports);

module.exports = router;

