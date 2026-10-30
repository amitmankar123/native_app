import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useFinance } from '../context/FinanceContext';
import { financeService } from '../services/financeService';
import GlassCard from '../components/GlassCard';
import AnimatedCounter from '../components/AnimatedCounter';
import { formatINR } from '../utils/formatters';

export default function ReportsScreen() {
  const { theme } = useTheme();
  const { currentMonth } = useFinance();

  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadReports = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await financeService.getReports({ month: currentMonth });
      setReportsData(data);
    } catch (err) {
      console.log('Reports load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const summary = reportsData?.summary || {
    income_paise: 0,
    expense_paise: 0,
    net_savings_paise: 0,
    previous_month_expense_paise: 0,
  };

  const categoryBreakdown = reportsData?.categoryBreakdown || [];
  const paymentMethods = reportsData?.paymentMethods || [];

  const maxIncomeExpense = Math.max(summary.income_paise, summary.expense_paise, 1);
  const incomeBarPct = Math.round((summary.income_paise / maxIncomeExpense) * 100);
  const expenseBarPct = Math.round((summary.expense_paise / maxIncomeExpense) * 100);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadReports(true)}
          tintColor={theme.accent}
          colors={[theme.accent]}
        />
      }
    >
      {/* Overview Card */}
      <GlassCard style={styles.overviewCard} glow>
        <Text style={[styles.periodTitle, { color: theme.textSecondary }]}>
          Analytics Overview ({currentMonth})
        </Text>
        <AnimatedCounter
          value={summary.net_savings_paise}
          style={[
            styles.netSavingsAmount,
            {
              color:
                summary.net_savings_paise >= 0
                  ? theme.semantic.income
                  : theme.semantic.expense,
            },
          ]}
        />
        <Text style={[styles.netSavingsSub, { color: theme.textMuted }]}>
          Net Monthly Cashflow (Income - Expenses)
        </Text>

        <View style={styles.comparisonMetrics}>
          <View style={styles.compCol}>
            <Text style={[styles.compLabel, { color: theme.textMuted }]}>Total Inflow</Text>
            <Text style={[styles.compVal, { color: theme.semantic.income }]}>
              {formatINR(summary.income_paise)}
            </Text>
          </View>

          <View style={styles.compCol}>
            <Text style={[styles.compLabel, { color: theme.textMuted }]}>Total Outflow</Text>
            <Text style={[styles.compVal, { color: theme.semantic.expense }]}>
              {formatINR(summary.expense_paise)}
            </Text>
          </View>

          <View style={styles.compCol}>
            <Text style={[styles.compLabel, { color: theme.textMuted }]}>Prev Month Exp</Text>
            <Text style={[styles.compVal, { color: theme.textSecondary }]}>
              {formatINR(summary.previous_month_expense_paise)}
            </Text>
          </View>
        </View>
      </GlassCard>

      {/* Income vs Expenses Bar Chart */}
      <GlassCard style={styles.chartCard}>
        <Text style={[styles.chartTitle, { color: theme.text }]}>
          Income vs Expenses Ratio
        </Text>

        {/* Income Bar */}
        <View style={styles.ratioRow}>
          <View style={styles.ratioLabelCol}>
            <Text style={[styles.ratioLabel, { color: theme.text }]}>Income</Text>
            <Text style={[styles.ratioAmount, { color: theme.semantic.income }]}>
              {formatINR(summary.income_paise)}
            </Text>
          </View>
          <View style={[styles.barTrack, { backgroundColor: theme.glassBorder }]}>
            <View
              style={[
                styles.barFill,
                { width: `${incomeBarPct}%`, backgroundColor: theme.semantic.income },
              ]}
            />
          </View>
        </View>

        {/* Expense Bar */}
        <View style={styles.ratioRow}>
          <View style={styles.ratioLabelCol}>
            <Text style={[styles.ratioLabel, { color: theme.text }]}>Expenses</Text>
            <Text style={[styles.ratioAmount, { color: theme.semantic.expense }]}>
              {formatINR(summary.expense_paise)}
            </Text>
          </View>
          <View style={[styles.barTrack, { backgroundColor: theme.glassBorder }]}>
            <View
              style={[
                styles.barFill,
                { width: `${expenseBarPct}%`, backgroundColor: theme.semantic.expense },
              ]}
            />
          </View>
        </View>
      </GlassCard>

      {/* Category Expense Distribution */}
      <GlassCard style={styles.distCard}>
        <Text style={[styles.chartTitle, { color: theme.text }]}>
          Category-wise Expense Distribution
        </Text>

        {categoryBreakdown.length === 0 ? (
          <Text style={[styles.emptyNotice, { color: theme.textMuted }]}>
            No expenses recorded for this month to generate distribution.
          </Text>
        ) : (
          categoryBreakdown.map((cat, idx) => {
            const total = summary.expense_paise || 1;
            const pct = Math.round((cat.total_paise / total) * 100);

            return (
              <View key={cat.category} style={styles.distRow}>
                <View style={styles.distHeader}>
                  <Text style={[styles.distName, { color: theme.text }]}>
                    {idx + 1}. {cat.category} ({cat.count} txns)
                  </Text>
                  <Text style={[styles.distAmount, { color: theme.text }]}>
                    {formatINR(cat.total_paise)} ({pct}%)
                  </Text>
                </View>
                <View style={[styles.barTrack, { backgroundColor: theme.glassBorder }]}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${Math.min(100, pct)}%`, backgroundColor: theme.accent },
                    ]}
                  />
                </View>
              </View>
            );
          })
        )}
      </GlassCard>

      {/* Payment Methods Utilization */}
      <GlassCard style={styles.distCard}>
        <Text style={[styles.chartTitle, { color: theme.text }]}>
          Payment Methods Utilization
        </Text>

        {paymentMethods.length === 0 ? (
          <Text style={[styles.emptyNotice, { color: theme.textMuted }]}>
            No payment transaction records in current period.
          </Text>
        ) : (
          paymentMethods.map((pm) => {
            const total = summary.expense_paise || 1;
            const pct = Math.round((pm.total_paise / total) * 100);

            return (
              <View key={pm.payment_method} style={styles.distRow}>
                <View style={styles.distHeader}>
                  <Text style={[styles.distName, { color: theme.text }]}>
                    ⚡ {pm.payment_method}
                  </Text>
                  <Text style={[styles.distAmount, { color: theme.text }]}>
                    {formatINR(pm.total_paise)} ({pct}%)
                  </Text>
                </View>
                <View style={[styles.barTrack, { backgroundColor: theme.glassBorder }]}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${Math.min(100, pct)}%`, backgroundColor: theme.semantic.savings },
                    ]}
                  />
                </View>
              </View>
            );
          })
        )}
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingTop: 12,
    paddingBottom: 90,
  },
  overviewCard: {
    padding: 20,
    marginBottom: 14,
  },
  periodTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  netSavingsAmount: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  netSavingsSub: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 14,
  },
  comparisonMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  compCol: {
    flex: 1,
  },
  compLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  compVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  chartCard: {
    padding: 18,
    marginBottom: 14,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 14,
  },
  ratioRow: {
    marginBottom: 14,
  },
  ratioLabelCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  ratioLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  ratioAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  distCard: {
    padding: 18,
    marginBottom: 14,
  },
  distRow: {
    marginBottom: 12,
  },
  distHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  distName: {
    fontSize: 13,
    fontWeight: '600',
  },
  distAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyNotice: {
    fontSize: 13,
    paddingVertical: 10,
    textAlign: 'center',
  },
});

