import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useFinance } from '../context/FinanceContext';
import { financeService } from '../services/financeService';
import GlassCard from '../components/GlassCard';
import GlassModal from '../components/GlassModal';
import GlassInput from '../components/GlassInput';
import GlassButton from '../components/GlassButton';
import AnimatedCounter from '../components/AnimatedCounter';
import { EXPENSE_CATEGORIES } from '../constants/categories';
import { formatINR, rupeesToPaise } from '../utils/formatters';

export default function BudgetScreen() {
  const { theme } = useTheme();
  const { currentMonth, refreshAll } = useFinance();

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Set Budget Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCat, setSelectedCat] = useState(EXPENSE_CATEGORIES[0].name);
  const [limitAmount, setLimitAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const loadBudgets = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await financeService.getBudgets(currentMonth);
      setBudgets(data || []);
    } catch (err) {
      console.log('Budget load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  const handleSaveBudget = async () => {
    const paise = rupeesToPaise(limitAmount);
    if (paise <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid budget limit');
      return;
    }

    setSaving(true);
    try {
      await financeService.setBudget({
        month: currentMonth,
        category: selectedCat,
        budget_limit_paise: paise,
      });

      setModalVisible(false);
      setLimitAmount('');
      loadBudgets();
      refreshAll();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save budget limit');
    } finally {
      setSaving(false);
    }
  };

  const totalBudget = budgets.reduce((acc, b) => acc + (b.budget_limit_paise || 0), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + (b.spent_paise || 0), 0);
  const totalRemaining = Math.max(0, totalBudget - totalSpent);
  const overallPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadBudgets(true)}
          tintColor={theme.accent}
          colors={[theme.accent]}
        />
      }
    >
      {/* Monthly Budget Summary Card */}
      <GlassCard style={styles.summaryCard} glow>
        <Text style={[styles.summaryTitle, { color: theme.textSecondary }]}>
          Overall Monthly Budget ({currentMonth})
        </Text>
        <AnimatedCounter
          value={totalBudget}
          style={[styles.budgetTotal, { color: theme.text }]}
        />

        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Spent</Text>
            <Text style={[styles.metricVal, { color: theme.semantic.expense }]}>
              {formatINR(totalSpent)}
            </Text>
          </View>

          <View style={styles.metric}>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Remaining</Text>
            <Text style={[styles.metricVal, { color: theme.semantic.income }]}>
              {formatINR(totalRemaining)}
            </Text>
          </View>

          <View style={styles.metric}>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>Consumed</Text>
            <Text
              style={[
                styles.metricVal,
                {
                  color:
                    overallPct >= 100
                      ? theme.semantic.expense
                      : overallPct >= 80
                      ? theme.semantic.warning
                      : theme.accent,
                },
              ]}
            >
              {overallPct}%
            </Text>
          </View>
        </View>

        <View style={[styles.progressTrack, { backgroundColor: theme.glassBorder }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(100, overallPct)}%`,
                backgroundColor:
                  overallPct >= 100
                    ? theme.semantic.expense
                    : overallPct >= 80
                    ? theme.semantic.warning
                    : theme.accent,
              },
            ]}
          />
        </View>
      </GlassCard>

      {/* Action to set a category budget */}
      <GlassButton
        title="+ Set Category Budget Limit"
        onPress={() => setModalVisible(true)}
        variant="primary"
        size="md"
        style={styles.setBtn}
      />

      {/* Category Budgets List */}
      <View style={styles.listSection}>
        <Text style={[styles.sectionHeading, { color: theme.text }]}>
          Category Budget Limits ({budgets.length})
        </Text>

        {budgets.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No Budgets Configured
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
              Set category limits to control your expenses with automated 80% & 100% warnings.
            </Text>
          </GlassCard>
        ) : (
          budgets.map((b) => {
            const isWarning = b.percentage >= 80 && b.percentage < 100;
            const isExceeded = b.percentage >= 100;

            return (
              <GlassCard
                key={b.id}
                style={[
                  styles.catBudgetCard,
                  isExceeded && { borderColor: theme.semantic.expenseBorder },
                ]}
              >
                <View style={styles.catBudgetTop}>
                  <View>
                    <Text style={[styles.catName, { color: theme.text }]}>
                      {b.category}
                    </Text>
                    <Text style={[styles.catSub, { color: theme.textSecondary }]}>
                      Spent: {formatINR(b.spent_paise)} / Limit: {formatINR(b.budget_limit_paise)}
                    </Text>
                  </View>

                  <View style={styles.statusBadgeCol}>
                    {isExceeded ? (
                      <View style={[styles.badge, { backgroundColor: theme.semantic.expenseBg }]}>
                        <Text style={[styles.badgeText, { color: theme.semantic.expense }]}>
                          ⚠️ Exceeded ({b.percentage}%)
                        </Text>
                      </View>
                    ) : isWarning ? (
                      <View style={[styles.badge, { backgroundColor: theme.semantic.warningBg }]}>
                        <Text style={[styles.badgeText, { color: theme.semantic.warning }]}>
                          ⚡ 80% Warning ({b.percentage}%)
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.normalPct, { color: theme.accent }]}>
                        {b.percentage}%
                      </Text>
                    )}
                  </View>
                </View>

                {/* Progress bar */}
                <View style={[styles.progressTrack, { backgroundColor: theme.glassBorder, marginTop: 10 }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(100, b.percentage)}%`,
                        backgroundColor: isExceeded
                          ? theme.semantic.expense
                          : isWarning
                          ? theme.semantic.warning
                          : theme.accent,
                      },
                    ]}
                  />
                </View>

                <View style={styles.bottomRow}>
                  <Text style={[styles.remainingText, { color: theme.textMuted }]}>
                    Remaining: {formatINR(b.remaining_paise)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedCat(b.category);
                      setLimitAmount(String(b.budget_limit_paise / 100));
                      setModalVisible(true);
                    }}
                  >
                    <Text style={[styles.editLimit, { color: theme.accent }]}>
                      Edit Limit
                    </Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            );
          })
        )}
      </View>

      {/* Set Budget Modal */}
      <GlassModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Category Budget Limit"
        subtitle={`Set monthly threshold for ${currentMonth}`}
      >
        <Text style={[styles.pickerLabel, { color: theme.textSecondary }]}>
          Select Expense Category:
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catPickerScroll}
        >
          {EXPENSE_CATEGORIES.map((cat) => {
            const isSelected = selectedCat === cat.name;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: isSelected ? theme.accentGlow : theme.glassCard,
                    borderColor: isSelected ? theme.accent : theme.glassBorder,
                  },
                ]}
                onPress={() => setSelectedCat(cat.name)}
              >
                <Text style={styles.catEmoji}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.catChipText,
                    { color: isSelected ? theme.accent : theme.text },
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <GlassInput
          label="Budget Limit (₹)"
          placeholder="e.g. 3000"
          value={limitAmount}
          onChangeText={setLimitAmount}
          keyboardType="numeric"
          icon="₹"
        />

        <GlassButton
          title="Save Budget Limit"
          onPress={handleSaveBudget}
          loading={saving}
          variant="primary"
          size="lg"
          style={{ marginTop: 14 }}
        />
      </GlassModal>
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
  summaryCard: {
    padding: 20,
    marginBottom: 14,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  budgetTotal: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  setBtn: {
    marginVertical: 10,
  },
  listSection: {
    marginTop: 8,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 38,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
  },
  catBudgetCard: {
    padding: 16,
    marginVertical: 6,
  },
  catBudgetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catName: {
    fontSize: 15,
    fontWeight: '800',
  },
  catSub: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadgeCol: {
    alignItems: 'flex-end',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  normalPct: {
    fontSize: 15,
    fontWeight: '800',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  remainingText: {
    fontSize: 12,
  },
  editLimit: {
    fontSize: 12,
    fontWeight: '700',
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  catPickerScroll: {
    marginBottom: 14,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  catEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

