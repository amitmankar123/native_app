import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import AnimatedCounter from '../components/AnimatedCounter';
import SkeletonLoader from '../components/SkeletonLoader';
import { formatINR, formatDisplayDate } from '../utils/formatters';

export default function DashboardScreen({
  onOpenAddTransaction,
  onOpenSavingsModal,
  onOpenDebtModal,
  onNavigateTransactions,
  onNavigateBudget,
  onNavigateSavings,
}) {
  const { theme, isDark } = useTheme();
  const { user, preferences } = useAuth();
  const { dashboardData, loading, refreshing, refreshAll, currentMonth, changeMonth } = useFinance();

  const [showBalance, setShowBalance] = useState(true);

  const prevMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number);
    const prev = new Date(y, m - 2, 1);
    const newMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    changeMonth(newMonth);
  };

  const nextMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number);
    const next = new Date(y, m, 1);
    const newMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    changeMonth(newMonth);
  };

  const formatMonthTitle = (mStr) => {
    const [y, m] = mStr.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    const names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${names[d.getMonth()]} ${d.getFullYear()}`;
  };

  const widgets = preferences?.dashboard_widgets || [];
  const isVisible = (id) => {
    const w = widgets.find((item) => item.id === id);
    return w ? w.visible : true;
  };

  const balance = dashboardData?.balance || {
    available_spending_paise: 0,
    current_savings_paise: 0,
    receivables_paise: 0,
    liabilities_paise: 0,
    net_worth_paise: 0,
  };

  const monthly = dashboardData?.monthly || {
    income_paise: 0,
    expense_paise: 0,
    savings_paise: 0,
    budget_paise: 0,
    remaining_budget_paise: 0,
  };

  const savingsGoal = dashboardData?.savingsGoal || {
    target_paise: 500000,
    saved_paise: 0,
    progress_percentage: 0,
  };

  const recent = dashboardData?.recentTransactions || [];
  const categoryBreakdown = dashboardData?.categoryBreakdown || [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refreshAll}
          tintColor={theme.accent}
          colors={[theme.accent]}
        />
      }
    >
      {/* Month Navigator Bar */}
      <View style={styles.monthBar}>
        <TouchableOpacity onPress={prevMonth} style={styles.monthNavBtn}>
          <Text style={[styles.monthNavArrow, { color: theme.textSecondary }]}>‹</Text>
        </TouchableOpacity>

        <View style={styles.monthTitleWrapper}>
          <Text style={[styles.monthTitle, { color: theme.text }]}>
            {formatMonthTitle(currentMonth)}
          </Text>
          <Text style={[styles.currencySub, { color: theme.textMuted }]}>
            Currency: INR (₹)
          </Text>
        </View>

        <TouchableOpacity onPress={nextMonth} style={styles.monthNavBtn}>
          <Text style={[styles.monthNavArrow, { color: theme.textSecondary }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 1. Total Balance Card */}
      {isVisible('balance') && (
        <GlassCard style={styles.balanceCard} glow>
          <View style={styles.balanceHeader}>
            <View>
              <Text style={[styles.balanceSub, { color: theme.textSecondary }]}>
                Available Spending Balance
              </Text>
              <View style={styles.amountEyeRow}>
                {loading && !dashboardData ? (
                  <SkeletonLoader width={180} height={36} />
                ) : (
                  <AnimatedCounter
                    value={showBalance ? balance.available_spending_paise : 0}
                    style={[styles.balanceAmount, { color: theme.text }]}
                    options={{ showDecimals: false }}
                  />
                )}
                <TouchableOpacity
                  onPress={() => setShowBalance(!showBalance)}
                  style={styles.eyeToggle}
                >
                  <Text style={styles.eyeEmoji}>{showBalance ? '👁️' : '🙈'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View
              style={[
                styles.netWorthPill,
                { backgroundColor: theme.accentGlow, borderColor: theme.accent },
              ]}
            >
              <Text style={[styles.netWorthLabel, { color: theme.accent }]}>
                Net Worth: {formatINR(balance.net_worth_paise)}
              </Text>
            </View>
          </View>

          <View style={styles.balanceMetricsRow}>
            <View style={styles.subMetric}>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>In Savings</Text>
              <Text style={[styles.metricValue, { color: theme.semantic.savings }]}>
                {formatINR(balance.current_savings_paise)}
              </Text>
            </View>

            <View style={styles.subMetric}>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Receivables (Lent)</Text>
              <Text style={[styles.metricValue, { color: theme.semantic.income }]}>
                {formatINR(balance.receivables_paise)}
              </Text>
            </View>

            <View style={styles.subMetric}>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Liabilities (Borrowed)</Text>
              <Text style={[styles.metricValue, { color: theme.semantic.liability }]}>
                {formatINR(balance.liabilities_paise)}
              </Text>
            </View>
          </View>
        </GlassCard>
      )}

      {/* 2. Monthly Income & Expense Cards */}
      {isVisible('income_expense') && (
        <View style={styles.incomeExpenseRow}>
          <GlassCard style={styles.summaryCard} variant="success">
            <View style={styles.cardTopRow}>
              <Text style={[styles.summaryCardLabel, { color: theme.textSecondary }]}>
                Monthly Income
              </Text>
              <Text style={styles.indicatorIcon}>↓</Text>
            </View>
            <AnimatedCounter
              value={monthly.income_paise}
              style={[styles.summaryCardAmount, { color: theme.semantic.income }]}
            />
            <Text style={[styles.summarySub, { color: theme.textMuted }]}>
              Configured: {formatINR(user?.monthly_salary || 1500000)}
            </Text>
          </GlassCard>

          <GlassCard style={styles.summaryCard} variant="danger">
            <View style={styles.cardTopRow}>
              <Text style={[styles.summaryCardLabel, { color: theme.textSecondary }]}>
                Monthly Expenses
              </Text>
              <Text style={styles.indicatorIcon}>↑</Text>
            </View>
            <AnimatedCounter
              value={monthly.expense_paise}
              style={[styles.summaryCardAmount, { color: theme.semantic.expense }]}
            />
            <Text style={[styles.summarySub, { color: theme.textMuted }]}>
              {categoryBreakdown.length} Categories
            </Text>
          </GlassCard>
        </View>
      )}

      {/* 3. Quick Action Buttons */}
      {isVisible('quick_actions') && (
        <View style={styles.quickActionsContainer}>
          <Text style={[styles.sectionHeading, { color: theme.text }]}>Quick Actions</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsScroll}
          >
            <TouchableOpacity
              style={[styles.actionChip, { backgroundColor: theme.semantic.expenseBg, borderColor: theme.semantic.expenseBorder }]}
              onPress={() => onOpenAddTransaction('expense')}
            >
              <Text style={styles.actionChipIcon}>💸</Text>
              <Text style={[styles.actionChipText, { color: theme.semantic.expense }]}>Add Expense</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionChip, { backgroundColor: theme.semantic.incomeBg, borderColor: theme.semantic.incomeBorder }]}
              onPress={() => onOpenAddTransaction('income')}
            >
              <Text style={styles.actionChipIcon}>💰</Text>
              <Text style={[styles.actionChipText, { color: theme.semantic.income }]}>Add Income</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionChip, { backgroundColor: theme.semantic.savingsBg, borderColor: theme.semantic.savingsBorder }]}
              onPress={onOpenSavingsModal}
            >
              <Text style={styles.actionChipIcon}>🏦</Text>
              <Text style={[styles.actionChipText, { color: theme.semantic.savings }]}>To Savings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionChip, { backgroundColor: theme.accentGlow, borderColor: theme.accent }]}
              onPress={() => onOpenDebtModal('lent')}
            >
              <Text style={styles.actionChipIcon}>🤝</Text>
              <Text style={[styles.actionChipText, { color: theme.accent }]}>Lend Money</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionChip, { backgroundColor: 'rgba(244, 63, 94, 0.12)', borderColor: 'rgba(244, 63, 94, 0.3)' }]}
              onPress={() => onOpenDebtModal('borrowed')}
            >
              <Text style={styles.actionChipIcon}>🤲</Text>
              <Text style={[styles.actionChipText, { color: theme.semantic.liability }]}>Borrow Money</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* 4. Monthly Savings Progress */}
      {isVisible('savings_progress') && (
        <TouchableOpacity onPress={onNavigateSavings} activeOpacity={0.9}>
          <GlassCard style={styles.savingsGoalCard}>
            <View style={styles.savingsGoalHeader}>
              <View>
                <Text style={[styles.savingsGoalTitle, { color: theme.text }]}>
                  Monthly Savings Target
                </Text>
                <Text style={[styles.savingsGoalSub, { color: theme.textSecondary }]}>
                  {formatINR(balance.current_savings_paise)} saved of {formatINR(savingsGoal.target_paise)}
                </Text>
              </View>
              <Text style={[styles.savingsGoalPercent, { color: theme.accent }]}>
                {savingsGoal.progress_percentage}%
              </Text>
            </View>

            <View style={[styles.progressBarTrack, { backgroundColor: theme.glassBorder }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(100, savingsGoal.progress_percentage)}%`,
                    backgroundColor: theme.accent,
                  },
                ]}
              />
            </View>
          </GlassCard>
        </TouchableOpacity>
      )}

      {/* 5. Category-wise Spending Breakdown */}
      {isVisible('expense_chart') && categoryBreakdown.length > 0 && (
        <GlassCard style={styles.categoryCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeading, { color: theme.text }]}>
              Spending by Category
            </Text>
            <TouchableOpacity onPress={onNavigateBudget}>
              <Text style={[styles.seeAllText, { color: theme.accent }]}>
                View Budgets →
              </Text>
            </TouchableOpacity>
          </View>

          {categoryBreakdown.slice(0, 5).map((cat) => {
            const totalExp = monthly.expense_paise || 1;
            const pct = Math.round((cat.total_paise / totalExp) * 100);
            return (
              <View key={cat.category} style={styles.catRow}>
                <View style={styles.catHeader}>
                  <Text style={[styles.catName, { color: theme.text }]}>{cat.category}</Text>
                  <Text style={[styles.catAmount, { color: theme.text }]}>
                    {formatINR(cat.total_paise)} ({pct}%)
                  </Text>
                </View>
                <View style={[styles.catBarTrack, { backgroundColor: theme.glassBorder }]}>
                  <View
                    style={[
                      styles.catBarFill,
                      {
                        width: `${Math.min(100, pct)}%`,
                        backgroundColor: theme.accent,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </GlassCard>
      )}

      {/* 6. Recent Transactions */}
      {isVisible('recent_transactions') && (
        <View style={styles.recentSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeading, { color: theme.text }]}>
              Recent Transactions
            </Text>
            <TouchableOpacity onPress={onNavigateTransactions}>
              <Text style={[styles.seeAllText, { color: theme.accent }]}>
                See All ({recent.length}) →
              </Text>
            </TouchableOpacity>
          </View>

          {recent.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No transactions recorded for this month yet.
              </Text>
              <GlassButton
                title="Add First Transaction"
                onPress={() => onOpenAddTransaction('expense')}
                variant="primary"
                size="sm"
                style={{ marginTop: 10 }}
              />
            </GlassCard>
          ) : (
            recent.map((tx) => {
              const isIncome = tx.type === 'income';
              const isLent = tx.type === 'lent';
              return (
                <GlassCard key={tx.id} style={styles.txCard}>
                  <View style={styles.txLeft}>
                    <View
                      style={[
                        styles.txIconContainer,
                        {
                          backgroundColor: isIncome
                            ? theme.semantic.incomeBg
                            : isLent
                            ? 'rgba(245, 158, 11, 0.15)'
                            : theme.semantic.expenseBg,
                        },
                      ]}
                    >
                      <Text style={styles.txEmoji}>
                        {isIncome ? '💰' : isLent ? '🤝' : '🛍️'}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.txDesc, { color: theme.text }]}>
                        {tx.description}
                      </Text>
                      <Text style={[styles.txCategory, { color: theme.textSecondary }]}>
                        {tx.category} • {formatDisplayDate(tx.date, 'short')}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.txAmount,
                      {
                        color: isIncome
                          ? theme.semantic.income
                          : isLent
                          ? '#f59e0b'
                          : theme.semantic.expense,
                      },
                    ]}
                  >
                    {isIncome ? '+' : '-'} {formatINR(tx.amount_paise)}
                  </Text>
                </GlassCard>
              );
            })
          )}
        </View>
      )}
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
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavArrow: {
    fontSize: 26,
    fontWeight: '700',
  },
  monthTitleWrapper: {
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  currencySub: {
    fontSize: 11,
    marginTop: 2,
  },
  balanceCard: {
    padding: 20,
    marginBottom: 14,
  },
  balanceHeader: {
    marginBottom: 16,
  },
  balanceSub: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  amountEyeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  eyeToggle: {
    marginLeft: 12,
    padding: 4,
  },
  eyeEmoji: {
    fontSize: 20,
  },
  netWorthPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 10,
  },
  netWorthLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  balanceMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  subMetric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  incomeExpenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryCardLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  indicatorIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryCardAmount: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  summarySub: {
    fontSize: 11,
  },
  quickActionsContainer: {
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  quickActionsScroll: {
    paddingVertical: 2,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
  },
  actionChipIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  actionChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  savingsGoalCard: {
    padding: 18,
    marginBottom: 14,
  },
  savingsGoalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  savingsGoalTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  savingsGoalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  savingsGoalPercent: {
    fontSize: 20,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryCard: {
    padding: 18,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  catRow: {
    marginBottom: 12,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
  },
  catAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  catBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  catBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  recentSection: {
    marginTop: 4,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    marginVertical: 4,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  txIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txEmoji: {
    fontSize: 18,
  },
  txDesc: {
    fontSize: 14,
    fontWeight: '700',
  },
  txCategory: {
    fontSize: 12,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
});

