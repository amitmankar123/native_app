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
import { formatINR, rupeesToPaise, formatDisplayDate } from '../utils/formatters';

export default function SavingsScreen() {
  const { theme } = useTheme();
  const { currentMonth, refreshAll } = useFinance();

  const [savingsData, setSavingsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [transferType, setTransferType] = useState('deposit'); // 'deposit' or 'withdrawal'
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [savingTransfer, setSavingTransfer] = useState(false);

  // Goal edit modal
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [newTarget, setNewTarget] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);

  const loadSavings = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await financeService.getSavings(currentMonth);
      setSavingsData(data);
    } catch (err) {
      console.log('Savings load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    loadSavings();
  }, [loadSavings]);

  const handleTransfer = async () => {
    const paise = rupeesToPaise(transferAmount);
    if (paise <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount');
      return;
    }

    setSavingTransfer(true);
    try {
      await financeService.recordSavingsTransfer({
        amount_paise: paise,
        transfer_type: transferType,
        notes: transferNotes.trim(),
        date: new Date().toISOString().split('T')[0],
      });

      setTransferModalVisible(false);
      setTransferAmount('');
      setTransferNotes('');
      loadSavings();
      refreshAll();
      Alert.alert(
        'Success',
        `Successfully transferred ₹${(paise / 100).toFixed(0)} ${
          transferType === 'deposit' ? 'into savings' : 'to spending balance'
        }`
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to process savings transfer');
    } finally {
      setSavingTransfer(false);
    }
  };

  const handleUpdateGoal = async () => {
    const paise = rupeesToPaise(newTarget);
    if (paise <= 0) {
      Alert.alert('Validation Error', 'Please enter a positive savings target');
      return;
    }

    setSavingGoal(true);
    try {
      await financeService.setSavingsGoal({
        month: currentMonth,
        target_paise: paise,
      });
      setGoalModalVisible(false);
      setNewTarget('');
      loadSavings();
      refreshAll();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update savings goal');
    } finally {
      setSavingGoal(false);
    }
  };

  const goal = savingsData?.goal || { target_paise: 500000 };
  const totalSavings = savingsData?.totalSavingsPaise || 0;
  const progressPct = goal.target_paise > 0
    ? Math.min(100, Math.round((totalSavings / goal.target_paise) * 100))
    : 0;
  const history = savingsData?.history || [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadSavings(true)}
          tintColor={theme.accent}
          colors={[theme.accent]}
        />
      }
    >
      {/* Total Savings Vault Card */}
      <GlassCard style={styles.vaultCard} glow>
        <Text style={[styles.vaultLabel, { color: theme.textSecondary }]}>
          Total Savings Vault Balance
        </Text>
        <AnimatedCounter
          value={totalSavings}
          style={[styles.vaultAmount, { color: theme.semantic.savings }]}
        />
        <Text style={[styles.accountingRuleNote, { color: theme.textMuted }]}>
          ℹ️ Non-expense asset vault: Transfers here preserve capital without reducing net worth.
        </Text>

        <View style={styles.actionRow}>
          <GlassButton
            title="+ Deposit to Savings"
            onPress={() => {
              setTransferType('deposit');
              setTransferModalVisible(true);
            }}
            variant="primary"
            size="md"
            style={styles.actionBtn}
          />
          <GlassButton
            title="Withdraw to Balance"
            onPress={() => {
              setTransferType('withdrawal');
              setTransferModalVisible(true);
            }}
            variant="secondary"
            size="md"
            style={styles.actionBtn}
          />
        </View>
      </GlassCard>

      {/* Target & Progress Card */}
      <GlassCard style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View>
            <Text style={[styles.goalTitle, { color: theme.text }]}>
              Monthly Target ({currentMonth})
            </Text>
            <Text style={[styles.goalTarget, { color: theme.accent }]}>
              Target: {formatINR(goal.target_paise)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setNewTarget(String(goal.target_paise / 100));
              setGoalModalVisible(true);
            }}
            style={[styles.editGoalBtn, { borderColor: theme.accent }]}
          >
            <Text style={[styles.editGoalText, { color: theme.accent }]}>
              Change Goal
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <Text style={[styles.savedText, { color: theme.textSecondary }]}>
              Current: {formatINR(totalSavings)}
            </Text>
            <Text style={[styles.pctText, { color: theme.accent }]}>
              {progressPct}% achieved
            </Text>
          </View>

          <View style={[styles.progressTrack, { backgroundColor: theme.glassBorder }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPct}%`,
                  backgroundColor: theme.accent,
                },
              ]}
            />
          </View>
        </View>
      </GlassCard>

      {/* Transfer History */}
      <View style={styles.historySection}>
        <Text style={[styles.sectionHeading, { color: theme.text }]}>
          Savings Movement History
        </Text>

        {history.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🏦</Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No savings transfers yet. Deposit funds to start building your wealth vault.
            </Text>
          </GlassCard>
        ) : (
          history.map((t) => {
            const isDeposit = t.transfer_type === 'deposit';
            return (
              <GlassCard key={t.id} style={styles.historyCard}>
                <View style={styles.historyLeft}>
                  <View
                    style={[
                      styles.historyIcon,
                      {
                        backgroundColor: isDeposit
                          ? theme.semantic.savingsBg
                          : 'rgba(244, 63, 94, 0.12)',
                      },
                    ]}
                  >
                    <Text style={styles.emoji}>{isDeposit ? '📥' : '📤'}</Text>
                  </View>
                  <View>
                    <Text style={[styles.historyTitle, { color: theme.text }]}>
                      {isDeposit ? 'Deposit to Savings Vault' : 'Withdrawal to Spending'}
                    </Text>
                    {t.notes ? (
                      <Text style={[styles.historyNotes, { color: theme.textSecondary }]}>
                        {t.notes}
                      </Text>
                    ) : null}
                    <Text style={[styles.historyDate, { color: theme.textMuted }]}>
                      {formatDisplayDate(t.date, 'readable')}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.historyAmount,
                    { color: isDeposit ? theme.semantic.savings : theme.semantic.liability },
                  ]}
                >
                  {isDeposit ? '+' : '-'} {formatINR(t.amount_paise)}
                </Text>
              </GlassCard>
            );
          })
        )}
      </View>

      {/* Transfer Modal */}
      <GlassModal
        visible={transferModalVisible}
        onClose={() => setTransferModalVisible(false)}
        title={transferType === 'deposit' ? 'Deposit into Savings' : 'Withdraw to Spending Balance'}
        subtitle="Internal capital movement (No double counting)"
      >
        <GlassInput
          label="Amount (₹)"
          placeholder="e.g. 2000"
          value={transferAmount}
          onChangeText={setTransferAmount}
          keyboardType="numeric"
          icon="₹"
        />

        <GlassInput
          label="Notes / Goal Allocation"
          placeholder="e.g. Emergency Fund or Bike Servicing reserve"
          value={transferNotes}
          onChangeText={setTransferNotes}
        />

        <GlassButton
          title={transferType === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdrawal'}
          onPress={handleTransfer}
          loading={savingTransfer}
          variant="primary"
          size="lg"
          style={{ marginTop: 14 }}
        />
      </GlassModal>

      {/* Goal Edit Modal */}
      <GlassModal
        visible={goalModalVisible}
        onClose={() => setGoalModalVisible(false)}
        title="Set Monthly Savings Target"
        subtitle={`Goal for ${currentMonth}`}
      >
        <GlassInput
          label="Target Amount (₹)"
          placeholder="e.g. 5000"
          value={newTarget}
          onChangeText={setNewTarget}
          keyboardType="numeric"
          icon="🎯"
        />

        <GlassButton
          title="Save Goal"
          onPress={handleUpdateGoal}
          loading={savingGoal}
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
    paddingTop: 14,
    paddingBottom: 90,
  },
  vaultCard: {
    padding: 22,
    marginBottom: 16,
  },
  vaultLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  vaultAmount: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginVertical: 10,
    paddingVertical: 2,
  },
  accountingRuleNote: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flex: 1,
    marginHorizontal: 4,
  },
  goalCard: {
    padding: 20,
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  goalTarget: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  editGoalBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  editGoalText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressSection: {
    marginTop: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  savedText: {
    fontSize: 12,
  },
  pctText: {
    fontSize: 13,
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
  historySection: {
    marginTop: 8,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    marginVertical: 4,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emoji: {
    fontSize: 18,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  historyNotes: {
    fontSize: 12,
    marginTop: 1,
  },
  historyDate: {
    fontSize: 11,
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
});

