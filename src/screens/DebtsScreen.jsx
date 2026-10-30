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

export default function DebtsScreen() {
  const { theme } = useTheme();
  const { refreshAll } = useFinance();

  const [activeTab, setActiveTab] = useState('lent'); // 'lent' (Receivable) or 'borrowed' (Liability)
  const [debtsData, setDebtsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Add Debt Modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [savingDebt, setSavingDebt] = useState(false);

  // Repayment Modal
  const [repayModalVisible, setRepayModalVisible] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayNotes, setRepayNotes] = useState('');
  const [savingRepay, setSavingRepay] = useState(false);

  const loadDebts = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await financeService.getDebts();
      setDebtsData(data);
    } catch (err) {
      console.log('Debts load error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDebts();
  }, [loadDebts]);

  const handleCreateDebt = async () => {
    const paise = rupeesToPaise(amount);
    if (!personName.trim()) {
      Alert.alert('Validation Error', "Please enter the friend/person's name");
      return;
    }
    if (paise <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid positive amount');
      return;
    }

    setSavingDebt(true);
    try {
      await financeService.addDebt({
        type: activeTab,
        person_name: personName.trim(),
        original_amount_paise: paise,
        description: description.trim(),
        due_date: dueDate.trim() || null,
      });

      setAddModalVisible(false);
      setPersonName('');
      setAmount('');
      setDescription('');
      setDueDate('');
      loadDebts();
      refreshAll();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to record entry');
    } finally {
      setSavingDebt(false);
    }
  };

  const handleRecordRepayment = async () => {
    if (!selectedDebt) return;
    const paise = rupeesToPaise(repayAmount);

    if (paise <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid repayment amount');
      return;
    }

    if (paise > selectedDebt.remaining_amount_paise) {
      Alert.alert(
        'Invalid Amount',
        `Repayment cannot exceed the remaining balance of ₹${(selectedDebt.remaining_amount_paise / 100).toFixed(0)}`
      );
      return;
    }

    setSavingRepay(true);
    try {
      await financeService.recordRepayment(selectedDebt.id, {
        amount_paise: paise,
        notes: repayNotes.trim(),
        date: new Date().toISOString().split('T')[0],
      });

      setRepayModalVisible(false);
      setSelectedDebt(null);
      setRepayAmount('');
      setRepayNotes('');
      loadDebts();
      refreshAll();
      Alert.alert('Success', 'Repayment updated successfully!');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to record repayment');
    } finally {
      setSavingRepay(false);
    }
  };

  const summary = debtsData?.summary || {
    totalLentReceivablePaise: 0,
    totalBorrowedLiabilityPaise: 0,
    netDebtPositionPaise: 0,
  };

  const allDebts = debtsData?.debts || [];
  const currentList = allDebts.filter((d) => d.type === activeTab);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadDebts(true)}
          tintColor={theme.accent}
          colors={[theme.accent]}
        />
      }
    >
      {/* Financial Summary Card */}
      <GlassCard style={styles.summaryCard} glow>
        <Text style={[styles.summaryTitle, { color: theme.textSecondary }]}>
          Net Debt Position (Receivables - Liabilities)
        </Text>
        <AnimatedCounter
          value={summary.netDebtPositionPaise}
          style={[
            styles.netAmount,
            {
              color:
                summary.netDebtPositionPaise >= 0
                  ? theme.semantic.income
                  : theme.semantic.liability,
            },
          ]}
        />

        <View style={styles.breakdownRow}>
          <View style={styles.col}>
            <Text style={[styles.subLabel, { color: theme.textMuted }]}>
              Total Lent (Receivables)
            </Text>
            <Text style={[styles.subVal, { color: theme.semantic.income }]}>
              {formatINR(summary.totalLentReceivablePaise)}
            </Text>
          </View>

          <View style={styles.col}>
            <Text style={[styles.subLabel, { color: theme.textMuted }]}>
              Total Borrowed (Liabilities)
            </Text>
            <Text style={[styles.subVal, { color: theme.semantic.liability }]}>
              {formatINR(summary.totalBorrowedLiabilityPaise)}
            </Text>
          </View>
        </View>

        <Text style={[styles.ruleNotice, { color: theme.textMuted }]}>
          ⚖️ Ledger Principle: Money lent is an asset receivable, not an expense. Money borrowed is a liability, not income.
        </Text>
      </GlassCard>

      {/* Tabs: Lent vs Borrowed */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'lent' && {
              backgroundColor: theme.semantic.incomeBg,
              borderColor: theme.semantic.income,
            },
          ]}
          onPress={() => setActiveTab('lent')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'lent' ? theme.semantic.income : theme.textSecondary },
            ]}
          >
            🤝 Money Lent ({allDebts.filter((d) => d.type === 'lent').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'borrowed' && {
              backgroundColor: 'rgba(244, 63, 94, 0.12)',
              borderColor: theme.semantic.liability,
            },
          ]}
          onPress={() => setActiveTab('borrowed')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'borrowed' ? theme.semantic.liability : theme.textSecondary },
            ]}
          >
            🤲 Money Borrowed ({allDebts.filter((d) => d.type === 'borrowed').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add New Debt Entry Button */}
      <GlassButton
        title={activeTab === 'lent' ? '+ Record Money Given to Friend' : '+ Record Money Borrowed'}
        onPress={() => setAddModalVisible(true)}
        variant="primary"
        size="md"
        style={styles.addBtn}
      />

      {/* Debts List */}
      {currentList.length === 0 ? (
        <GlassCard style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🤝</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No {activeTab === 'lent' ? 'Receivables' : 'Liabilities'} Found
          </Text>
          <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
            Keep track of friendly loans and repayments accurately.
          </Text>
        </GlassCard>
      ) : (
        currentList.map((item) => {
          const isLent = item.type === 'lent';
          const isSettled = item.status === 'repaid';
          const repaidAmount = item.original_amount_paise - item.remaining_amount_paise;
          const progressPct = Math.round((repaidAmount / item.original_amount_paise) * 100);

          return (
            <GlassCard key={item.id} style={styles.debtCard}>
              <View style={styles.debtTop}>
                <View>
                  <Text style={[styles.personName, { color: theme.text }]}>
                    {item.person_name}
                  </Text>
                  {item.description ? (
                    <Text style={[styles.debtDesc, { color: theme.textSecondary }]}>
                      {item.description}
                    </Text>
                  ) : null}
                  <Text style={[styles.debtDate, { color: theme.textMuted }]}>
                    Recorded: {formatDisplayDate(item.created_at, 'short')}
                    {item.due_date ? ` • Due: ${formatDisplayDate(item.due_date, 'short')}` : ''}
                  </Text>
                </View>

                <View style={styles.amountCol}>
                  <Text
                    style={[
                      styles.remainingAmount,
                      { color: isLent ? theme.semantic.income : theme.semantic.liability },
                    ]}
                  >
                    {formatINR(item.remaining_amount_paise)}
                  </Text>
                  <Text style={[styles.originalAmount, { color: theme.textMuted }]}>
                    of {formatINR(item.original_amount_paise)}
                  </Text>
                </View>
              </View>

              {/* Status & Progress */}
              <View style={styles.progressRow}>
                <View style={[styles.track, { backgroundColor: theme.glassBorder }]}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${progressPct}%`,
                        backgroundColor: isSettled ? theme.semantic.income : theme.accent,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.statusTag, { color: isSettled ? theme.semantic.income : theme.textSecondary }]}>
                  {isSettled ? 'Settled ✓' : `${progressPct}% Repaid`}
                </Text>
              </View>

              {/* Repayments History Sub-list */}
              {item.repayments && item.repayments.length > 0 && (
                <View style={styles.repaymentHistory}>
                  <Text style={[styles.repaymentHistoryTitle, { color: theme.textMuted }]}>
                    Repayment History:
                  </Text>
                  {item.repayments.map((rep) => (
                    <Text key={rep.id} style={[styles.repEntry, { color: theme.textSecondary }]}>
                      • {formatINR(rep.amount_paise)} on {formatDisplayDate(rep.date, 'short')}
                      {rep.notes ? ` (${rep.notes})` : ''}
                    </Text>
                  ))}
                </View>
              )}

              {/* Repayment Trigger */}
              {!isSettled && (
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.repayBtn, { borderColor: theme.accent }]}
                    onPress={() => {
                      setSelectedDebt(item);
                      setRepayModalVisible(true);
                    }}
                  >
                    <Text style={[styles.repayBtnText, { color: theme.accent }]}>
                      + Record Partial / Full Repayment
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </GlassCard>
          );
        })
      )}

      {/* Add Debt Modal */}
      <GlassModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        title={activeTab === 'lent' ? 'Money Lent to Friend' : 'Money Borrowed'}
        subtitle="Double-entry receivable / liability entry"
      >
        <GlassInput
          label={activeTab === 'lent' ? "Friend's Name" : "Person's Name"}
          placeholder="e.g. Rahul Sharma"
          value={personName}
          onChangeText={setPersonName}
          icon="👤"
        />

        <GlassInput
          label="Amount (₹)"
          placeholder="e.g. 1500"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          icon="₹"
        />

        <GlassInput
          label="Description / Purpose"
          placeholder="e.g. Emergency bike servicing loan"
          value={description}
          onChangeText={setDescription}
          icon="📝"
        />

        <GlassInput
          label="Expected Repayment Date (Optional)"
          placeholder="YYYY-MM-DD"
          value={dueDate}
          onChangeText={setDueDate}
          icon="📅"
        />

        <GlassButton
          title={activeTab === 'lent' ? 'Save Receivable' : 'Save Liability'}
          onPress={handleCreateDebt}
          loading={savingDebt}
          variant="primary"
          size="lg"
          style={{ marginTop: 14 }}
        />
      </GlassModal>

      {/* Record Repayment Modal */}
      <GlassModal
        visible={repayModalVisible}
        onClose={() => setRepayModalVisible(false)}
        title="Record Repayment"
        subtitle={`Remaining Balance: ₹${((selectedDebt?.remaining_amount_paise || 0) / 100).toFixed(0)}`}
      >
        <GlassInput
          label="Repayment Amount (₹)"
          placeholder={`Up to ${((selectedDebt?.remaining_amount_paise || 0) / 100).toFixed(0)}`}
          value={repayAmount}
          onChangeText={setRepayAmount}
          keyboardType="numeric"
          icon="₹"
        />

        <GlassInput
          label="Notes (Optional)"
          placeholder="e.g. Sent via UPI"
          value={repayNotes}
          onChangeText={setRepayNotes}
        />

        <GlassButton
          title="Confirm Repayment"
          onPress={handleRecordRepayment}
          loading={savingRepay}
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
    padding: 22,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  netAmount: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginVertical: 12,
    paddingVertical: 2,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  col: {
    flex: 1,
  },
  subLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  subVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  ruleNotice: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 12,
  },
  tabBar: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  addBtn: {
    marginVertical: 10,
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyEmoji: {
    fontSize: 40,
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
  debtCard: {
    padding: 18,
    marginVertical: 6,
  },
  debtTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  personName: {
    fontSize: 16,
    fontWeight: '800',
  },
  debtDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  debtDate: {
    fontSize: 11,
    marginTop: 3,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  remainingAmount: {
    fontSize: 18,
    fontWeight: '900',
  },
  originalAmount: {
    fontSize: 11,
    marginTop: 2,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 10,
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  statusTag: {
    fontSize: 11,
    fontWeight: '700',
  },
  repaymentHistory: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.12)',
  },
  repaymentHistoryTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  repEntry: {
    fontSize: 12,
    marginVertical: 1,
  },
  cardActions: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  repayBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  repayBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

