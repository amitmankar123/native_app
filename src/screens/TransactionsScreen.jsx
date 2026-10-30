import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useFinance } from '../context/FinanceContext';
import { financeService } from '../services/financeService';
import GlassCard from '../components/GlassCard';
import GlassInput from '../components/GlassInput';
import GlassButton from '../components/GlassButton';
import GlassModal from '../components/GlassModal';
import SkeletonLoader from '../components/SkeletonLoader';
import { formatINR, formatDisplayDate, rupeesToPaise } from '../utils/formatters';

export default function TransactionsScreen({ onOpenAddTransaction }) {
  const { theme } = useTheme();
  const { deleteTransaction, refreshAll } = useFinance();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'expense', 'income', 'lent'
  const [sortBy, setSortBy] = useState('date_desc'); // 'date_desc', 'date_asc', 'amount_desc', 'amount_asc'

  // Repayment Modal State for Lent Records
  const [repayModalVisible, setRepayModalVisible] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayNotes, setRepayNotes] = useState('');
  const [savingRepay, setSavingRepay] = useState(false);

  const handleOpenRepayModal = (item) => {
    if (item.status === 'repaid') {
      Alert.alert(
        'Settled',
        `This loan of ${formatINR(item.amount_paise)} to ${item.person_name || 'friend'} is already fully settled.`
      );
      return;
    }
    setSelectedDebt(item);
    const rem = item.remaining_amount_paise ?? item.amount_paise;
    setRepayAmount(String(rem / 100));
    setRepayNotes('');
    setRepayModalVisible(true);
  };

  const handleRecordRepayment = async () => {
    if (!selectedDebt) return;
    const paise = rupeesToPaise(repayAmount);

    if (paise <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid repayment amount');
      return;
    }

    const maxRem = selectedDebt.remaining_amount_paise ?? selectedDebt.amount_paise;
    if (paise > maxRem) {
      Alert.alert(
        'Invalid Amount',
        `Repayment cannot exceed the remaining balance of ₹${(maxRem / 100).toFixed(0)}`
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
      refreshAll();
      loadTransactions();
      Alert.alert('Success', 'Repayment recorded! Cash has returned to your spending balance.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to record repayment');
    } finally {
      setSavingRepay(false);
    }
  };

  const loadTransactions = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const params = {
        search: search.trim() || undefined,
        type: filterType === 'all' ? undefined : filterType,
        sortBy,
        limit: 100,
      };

      const data = await financeService.getTransactions(params);
      setTransactions(data?.transactions || []);
    } catch (err) {
      console.log('Load transactions error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, filterType, sortBy]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleDelete = (item) => {
    const isLent = item.is_debt || item.type === 'lent';
    Alert.alert(
      isLent ? 'Delete Lending Record' : 'Delete Transaction',
      `Are you sure you want to delete "${item.description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isLent) {
                await financeService.deleteDebt(item.id);
                refreshAll();
              } else {
                await deleteTransaction(item.id);
              }
              loadTransactions();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete record');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const isIncome = item.type === 'income';
    const isLent = item.type === 'lent' || item.is_debt;

    let iconBg = theme.semantic.expenseBg;
    let iconBorder = theme.semantic.expenseBorder;
    let iconEmoji = '🛍️';
    let amountColor = theme.semantic.expense;
    let prefix = '-';

    if (isIncome) {
      iconBg = theme.semantic.incomeBg;
      iconBorder = theme.semantic.incomeBorder;
      iconEmoji = '💰';
      amountColor = theme.semantic.income;
      prefix = '+';
    } else if (isLent) {
      iconBg = 'rgba(245, 158, 11, 0.15)';
      iconBorder = 'rgba(245, 158, 11, 0.4)';
      iconEmoji = '🤝';
      amountColor = '#f59e0b';
      prefix = '-';
    }

    return (
      <GlassCard style={styles.card}>
        <View style={styles.cardContent}>
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: iconBg,
                borderColor: iconBorder,
              },
            ]}
          >
            <Text style={styles.icon}>{iconEmoji}</Text>
          </View>

          <View style={styles.details}>
            <Text style={[styles.desc, { color: theme.text }]} numberOfLines={1}>
              {item.description}
            </Text>
            <View style={styles.subInfoRow}>
              <Text style={[styles.cat, { color: theme.textSecondary }]}>
                {item.category}
                {item.subcategory ? ` • ${item.subcategory}` : ''}
              </Text>
              {isLent ? (
                <TouchableOpacity
                  style={[
                    styles.statusPillBtn,
                    {
                      backgroundColor:
                        item.status === 'repaid'
                          ? theme.semantic.incomeBg
                          : 'rgba(245, 158, 11, 0.18)',
                      borderColor:
                        item.status === 'repaid'
                          ? theme.semantic.incomeBorder
                          : 'rgba(245, 158, 11, 0.45)',
                    },
                  ]}
                  onPress={() => handleOpenRepayModal(item)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      {
                        color:
                          item.status === 'repaid'
                            ? theme.semantic.income
                            : '#F59E0B',
                      },
                    ]}
                  >
                    {item.status === 'repaid' ? 'Settled ✓' : '🟢 Active • Settle'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={[styles.paymentMethodTag, { color: theme.accent }]}>
                  {item.payment_method}
                </Text>
              )}
            </View>
            <Text style={[styles.date, { color: theme.textMuted }]}>
              {formatDisplayDate(item.date, 'readable')}
            </Text>
          </View>

          <View style={styles.amountCol}>
            <Text
              style={[
                styles.amount,
                { color: amountColor },
              ]}
            >
              {prefix} {formatINR(item.amount_paise)}
            </Text>

            <TouchableOpacity
              onPress={() => handleDelete(item)}
              style={styles.deleteBtn}
            >
              <Text style={[styles.deleteText, { color: theme.semantic.expense }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Search & Filters */}
      <View style={styles.header}>
        <GlassInput
          placeholder="Search by description, notes or category..."
          value={search}
          onChangeText={setSearch}
          icon="🔍"
          style={styles.searchInput}
        />

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {[
            { id: 'all', label: 'All' },
            { id: 'expense', label: '💸 Expense' },
            { id: 'income', label: '💰 Income' },
            { id: 'lent', label: '🤝 Lent' },
          ].map((f) => {
            const isActive = filterType === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? theme.accent : theme.glassCard,
                    borderColor: isActive ? theme.accent : theme.glassBorder,
                  },
                ]}
                onPress={() => setFilterType(f.id)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: isActive ? '#FFFFFF' : theme.textSecondary,
                      fontWeight: isActive ? '800' : '600',
                    },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Sort Toggle */}
          <TouchableOpacity
            style={[styles.sortChip, { backgroundColor: theme.glassCard, borderColor: theme.glassBorder }]}
            onPress={() => {
              const nextSort =
                sortBy === 'date_desc'
                  ? 'amount_desc'
                  : sortBy === 'amount_desc'
                  ? 'amount_asc'
                  : 'date_desc';
              setSortBy(nextSort);
            }}
          >
            <Text style={[styles.sortText, { color: theme.accent }]}>
              {sortBy === 'date_desc' ? '📅 Newest' : sortBy === 'amount_desc' ? '⬆️ Highest' : '⬇️ Lowest'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Transactions List */}
      {loading && !refreshing && transactions.length === 0 ? (
        <View style={styles.loadingContainer}>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonLoader key={i} height={70} borderRadius={18} style={{ marginVertical: 6 }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadTransactions(true)}
              tintColor={theme.accent}
              colors={[theme.accent]}
            />
          }
          ListEmptyComponent={
            <GlassCard style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🔎</Text>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No Transactions Found</Text>
              <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
                {search ? 'Try adjusting your search criteria.' : 'Start tracking by tapping below.'}
              </Text>
              <GlassButton
                title="Add New Transaction"
                onPress={() => onOpenAddTransaction('expense')}
                variant="primary"
                size="md"
                style={{ marginTop: 14 }}
              />
            </GlassCard>
          }
        />
      )}

      {/* Repay Modal for Lent Record */}
      <GlassModal
        visible={repayModalVisible}
        onClose={() => setRepayModalVisible(false)}
        title="Record Loan Repayment"
        subtitle={
          selectedDebt
            ? `Friend: ${selectedDebt.person_name || 'Friend'} • Remaining: ${formatINR(
                selectedDebt.remaining_amount_paise ?? selectedDebt.amount_paise
              )}`
            : ''
        }
      >
        <GlassInput
          label="Repayment Received (₹)"
          placeholder="e.g. 500"
          value={repayAmount}
          onChangeText={setRepayAmount}
          keyboardType="numeric"
          icon="₹"
        />

        <GlassInput
          label="Notes / Settlement Remarks (Optional)"
          placeholder="e.g. Paid via UPI"
          value={repayNotes}
          onChangeText={setRepayNotes}
          icon="📝"
        />

        <GlassButton
          title={
            selectedDebt &&
            rupeesToPaise(repayAmount) >=
              (selectedDebt.remaining_amount_paise ?? selectedDebt.amount_paise)
              ? 'Mark Fully Settled ✓'
              : 'Save Repayment & Add to Balance'
          }
          onPress={handleRecordRepayment}
          loading={savingRepay}
          variant="primary"
          size="lg"
          style={{ marginTop: 14 }}
        />
      </GlassModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInput: {
    marginVertical: 4,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  sortText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 90,
    paddingTop: 8,
  },
  loadingContainer: {
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  card: {
    padding: 14,
    marginVertical: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  details: {
    flex: 1,
  },
  desc: {
    fontSize: 15,
    fontWeight: '700',
  },
  subInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  cat: {
    fontSize: 12,
  },
  paymentMethodTag: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 8,
  },
  statusPillBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  date: {
    fontSize: 11,
    marginTop: 3,
  },
  amountCol: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
  },
  deleteBtn: {
    paddingTop: 6,
  },
  deleteText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyEmoji: {
    fontSize: 42,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
  },
});

