import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { financeService } from '../services/financeService';
import { useAuth } from './AuthContext';

const FinanceContext = createContext(null);

export function FinanceProvider({ children }) {
  const { isAuthenticated } = useAuth();

  const getInitialMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const [currentMonth, setCurrentMonth] = useState(getInitialMonth());
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async (monthToFetch = currentMonth, isPullRefresh = false) => {
    if (!isAuthenticated) return;
    try {
      if (isPullRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const data = await financeService.getDashboard(monthToFetch);
      setDashboardData(data);
    } catch (err) {
      console.log('Finance fetch error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, currentMonth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboard(currentMonth);
    } else {
      setDashboardData(null);
    }
  }, [isAuthenticated, currentMonth, fetchDashboard]);

  const changeMonth = (newMonth) => {
    setCurrentMonth(newMonth);
  };

  const refreshAll = async () => {
    await fetchDashboard(currentMonth, true);
  };

  const addTransaction = async (txData) => {
    const res = await financeService.addTransaction(txData);
    await fetchDashboard(currentMonth);
    return res;
  };

  const deleteTransaction = async (id) => {
    const res = await financeService.deleteTransaction(id);
    await fetchDashboard(currentMonth);
    return res;
  };

  const recordSavingsTransfer = async (transferData) => {
    const res = await financeService.recordSavingsTransfer(transferData);
    await fetchDashboard(currentMonth);
    return res;
  };

  const setSavingsGoal = async (goalData) => {
    const res = await financeService.setSavingsGoal(goalData);
    await fetchDashboard(currentMonth);
    return res;
  };

  const addDebt = async (debtData) => {
    const res = await financeService.addDebt(debtData);
    await fetchDashboard(currentMonth);
    return res;
  };

  const recordRepayment = async (debtId, repaymentData) => {
    const res = await financeService.recordRepayment(debtId, repaymentData);
    await fetchDashboard(currentMonth);
    return res;
  };

  const deleteDebt = async (debtId) => {
    const res = await financeService.deleteDebt(debtId);
    await fetchDashboard(currentMonth);
    return res;
  };

  const setBudget = async (budgetData) => {
    const res = await financeService.setBudget(budgetData);
    await fetchDashboard(currentMonth);
    return res;
  };

  const value = {
    currentMonth,
    changeMonth,
    dashboardData,
    loading,
    refreshing,
    error,
    refreshAll,
    addTransaction,
    deleteTransaction,
    recordSavingsTransfer,
    setSavingsGoal,
    addDebt,
    recordRepayment,
    deleteDebt,
    setBudget,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}

