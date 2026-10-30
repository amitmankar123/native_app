import { apiRequest } from './apiClient';

export const financeService = {
  async getDashboard(month) {
    const query = month ? `?month=${month}` : '';
    const res = await apiRequest(`/finance/dashboard${query}`);
    return res.data;
  },

  async getTransactions(params = {}) {
    const queryParts = [];
    if (params.type) queryParts.push(`type=${encodeURIComponent(params.type)}`);
    if (params.category) queryParts.push(`category=${encodeURIComponent(params.category)}`);
    if (params.startDate) queryParts.push(`startDate=${encodeURIComponent(params.startDate)}`);
    if (params.endDate) queryParts.push(`endDate=${encodeURIComponent(params.endDate)}`);
    if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
    if (params.sortBy) queryParts.push(`sortBy=${encodeURIComponent(params.sortBy)}`);
    if (params.page) queryParts.push(`page=${params.page}`);
    if (params.limit) queryParts.push(`limit=${params.limit}`);

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const res = await apiRequest(`/finance/transactions${queryString}`);
    return res.data;
  },

  async addTransaction(transactionData) {
    const res = await apiRequest('/finance/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
    return res.data;
  },

  async updateTransaction(id, transactionData) {
    const res = await apiRequest(`/finance/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transactionData),
    });
    return res.data;
  },

  async deleteTransaction(id) {
    return await apiRequest(`/finance/transactions/${id}`, {
      method: 'DELETE',
    });
  },

  async getSavings(month) {
    const query = month ? `?month=${month}` : '';
    const res = await apiRequest(`/finance/savings${query}`);
    return res.data;
  },

  async setSavingsGoal({ month, target_paise, emergency_fund_paise }) {
    const res = await apiRequest('/finance/savings/goal', {
      method: 'POST',
      body: JSON.stringify({ month, target_paise, emergency_fund_paise }),
    });
    return res.data;
  },

  async recordSavingsTransfer({ amount_paise, transfer_type, notes, date }) {
    const res = await apiRequest('/finance/savings/transfer', {
      method: 'POST',
      body: JSON.stringify({ amount_paise, transfer_type, notes, date }),
    });
    return res.data;
  },

  async getDebts(type) {
    const query = type ? `?type=${type}` : '';
    const res = await apiRequest(`/finance/debts${query}`);
    return res.data;
  },

  async addDebt(debtData) {
    const res = await apiRequest('/finance/debts', {
      method: 'POST',
      body: JSON.stringify(debtData),
    });
    return res.data;
  },

  async recordRepayment(debtId, repaymentData) {
    const res = await apiRequest(`/finance/debts/${debtId}/repay`, {
      method: 'POST',
      body: JSON.stringify(repaymentData),
    });
    return res.data;
  },

  async deleteDebt(debtId) {
    return await apiRequest(`/finance/debts/${debtId}`, {
      method: 'DELETE',
    });
  },

  async getBudgets(month) {
    const query = month ? `?month=${month}` : '';
    const res = await apiRequest(`/finance/budgets${query}`);
    return res.data;
  },

  async setBudget({ month, category, budget_limit_paise }) {
    const res = await apiRequest('/finance/budgets', {
      method: 'POST',
      body: JSON.stringify({ month, category, budget_limit_paise }),
    });
    return res.data;
  },

  async getReports({ startDate, endDate, month }) {
    const queryParts = [];
    if (startDate) queryParts.push(`startDate=${encodeURIComponent(startDate)}`);
    if (endDate) queryParts.push(`endDate=${encodeURIComponent(endDate)}`);
    if (month) queryParts.push(`month=${encodeURIComponent(month)}`);

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const res = await apiRequest(`/finance/reports${queryString}`);
    return res.data;
  },
};

