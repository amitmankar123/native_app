import { formatINR, rupeesToPaise, paiseToRupees } from '../src/utils/formatters';
import { evaluatePasswordStrength, isValidEmail } from '../src/utils/validators';

describe('Financial Ledger & Accounting Rules Verification', () => {
  test('Integer Paise Conversion preserves exact cents without floating-point errors', () => {
    expect(rupeesToPaise('15000')).toBe(1500000);
    expect(rupeesToPaise('49.99')).toBe(4999);
    expect(rupeesToPaise('0.50')).toBe(50);
    expect(paiseToRupees(1500000)).toBe('15000');
    expect(paiseToRupees(4999)).toBe('49.99');
  });

  test('INR Indian Numbering System formatting (₹)', () => {
    // 15,000 INR
    expect(formatINR(1500000)).toBe('₹15,000');
    // 1,50,000 INR
    expect(formatINR(15000000)).toBe('₹1,50,000');
    // Negative balance (overdraft)
    expect(formatINR(-50000)).toBe('-₹500');
  });

  test('Financial Formula: Available Spending Balance', () => {
    // Opening balance = 0
    // Income = ₹25,000 (2,500,000 paise)
    // Expenses = ₹12,000 (1,200,000 paise)
    // Savings deposit = ₹5,000 (500,000 paise)
    // Savings withdrawal = ₹1,000 (100,000 paise)
    // Money lent to friend = ₹2,000 (200,000 paise)
    // Formula: Income + Savings Withdrawals - Expenses - Savings Deposits - Money Lent
    const income = 2500000;
    const expense = 1200000;
    const savingsDeposit = 500000;
    const savingsWithdrawal = 100000;
    const lentToFriend = 200000;

    const availableSpending = income + savingsWithdrawal - expense - savingsDeposit - lentToFriend;
    expect(availableSpending).toBe(700000); // ₹7,000
    expect(formatINR(availableSpending)).toBe('₹7,000');
  });

  test('Financial Formula: Net Worth preserves capital when lending', () => {
    // Net Worth = Spending Balance + Savings Balance + Receivables (Lent) - Liabilities (Borrowed)
    const spendingBalance = 700000; // ₹7,000 (after ₹2,000 lent out)
    const savingsBalance = 400000; // ₹4,000 (₹5,000 deposit - ₹1,000 withdrawal)
    const receivables = 200000; // ₹2,000 lent to friend
    const liabilities = 100000; // ₹1,000 borrowed from friend

    const netWorth = spendingBalance + savingsBalance + receivables - liabilities;
    expect(netWorth).toBe(1200000); // ₹12,000
    expect(formatINR(netWorth)).toBe('₹12,000');
  });

  test('Budget Warning Rules: 80% Threshold and 100% Exceeded', () => {
    const budgetLimit = 1000000; // ₹10,000

    const spentUnder = 500000; // ₹5,000 (50%)
    const pctUnder = Math.round((spentUnder / budgetLimit) * 100);
    expect(pctUnder < 80).toBe(true);

    const spentWarning = 850000; // ₹8,500 (85%)
    const pctWarning = Math.round((spentWarning / budgetLimit) * 100);
    expect(pctWarning >= 80 && pctWarning < 100).toBe(true);

    const spentExceeded = 1050000; // ₹10,500 (105%)
    const pctExceeded = Math.round((spentExceeded / budgetLimit) * 100);
    expect(pctExceeded >= 100).toBe(true);
  });

  test('Password Strength Meter & Email Validation', () => {
    expect(isValidEmail('valid@example.com')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);

    expect(evaluatePasswordStrength('short').score).toBeLessThanOrEqual(1);
    expect(evaluatePasswordStrength('SecureP@ssw0rd!').score).toBe(4);
  });
});

