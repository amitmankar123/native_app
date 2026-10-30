import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useFinance } from '../context/FinanceContext';
import GlassModal from '../components/GlassModal';
import GlassInput from '../components/GlassInput';
import GlassButton from '../components/GlassButton';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '../constants/categories';
import { rupeesToPaise } from '../utils/formatters';

export default function AddTransactionModal({
  visible,
  onClose,
  initialType = 'expense',
}) {
  const { theme } = useTheme();
  const { addTransaction } = useFinance();

  const [type, setType] = useState(initialType);
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(
    initialType === 'expense' ? EXPENSE_CATEGORIES[0].name : INCOME_CATEGORIES[0].name
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const currentCategoryObj = categories.find((c) => c.name === selectedCategory);
  const subcategories = currentCategoryObj?.subcategories || [];

  const handleTypeChange = (newType) => {
    setType(newType);
    if (newType === 'expense') {
      setSelectedCategory(EXPENSE_CATEGORIES[0].name);
      setSelectedSubcategory('');
    } else {
      setSelectedCategory(INCOME_CATEGORIES[0].name);
      setSelectedSubcategory('');
    }
  };

  const handleSubmit = async () => {
    const paise = rupeesToPaise(amount);
    if (paise <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount greater than 0');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please enter a brief description');
      return;
    }

    setLoading(true);
    try {
      await addTransaction({
        type,
        amount_paise: paise,
        category: selectedCategory,
        subcategory: selectedSubcategory,
        payment_method: paymentMethod,
        description: description.trim(),
        notes: notes.trim(),
        date: new Date().toISOString().split('T')[0],
      });

      // Reset
      setAmount('');
      setDescription('');
      setNotes('');
      onClose();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to record transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassModal
      visible={visible}
      onClose={onClose}
      title={type === 'expense' ? 'Record Expense' : 'Record Income'}
      subtitle="Currency: Indian Rupee (₹)"
    >
      {/* Type Selector (Expense vs Income) */}
      <View style={styles.typeSelectorRow}>
        <TouchableOpacity
          style={[
            styles.typeTab,
            type === 'expense' && {
              backgroundColor: theme.semantic.expenseBg,
              borderColor: theme.semantic.expense,
            },
          ]}
          onPress={() => handleTypeChange('expense')}
        >
          <Text
            style={[
              styles.typeTabText,
              { color: type === 'expense' ? theme.semantic.expense : theme.textSecondary },
            ]}
          >
            💸 Expense
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeTab,
            type === 'income' && {
              backgroundColor: theme.semantic.incomeBg,
              borderColor: theme.semantic.income,
            },
          ]}
          onPress={() => handleTypeChange('income')}
        >
          <Text
            style={[
              styles.typeTabText,
              { color: type === 'income' ? theme.semantic.income : theme.textSecondary },
            ]}
          >
            💰 Income
          </Text>
        </TouchableOpacity>
      </View>

      {/* Amount Input with ₹ Prefix */}
      <GlassInput
        label="Amount (₹)"
        placeholder="e.g. 450"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        icon="₹"
        style={styles.inputField}
      />

      {/* Description */}
      <GlassInput
        label="Description / Title"
        placeholder={type === 'expense' ? 'e.g. Petrol refill at Shell' : 'e.g. Monthly Freelance payment'}
        value={description}
        onChangeText={setDescription}
        icon="📝"
        style={styles.inputField}
      />

      {/* Category Horizontal Selector */}
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        Category
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: isSelected ? theme.accentGlow : theme.glassCard,
                  borderColor: isSelected ? theme.accent : theme.glassBorder,
                },
              ]}
              onPress={() => {
                setSelectedCategory(cat.name);
                setSelectedSubcategory('');
              }}
            >
              <Text style={styles.chipIcon}>{cat.icon}</Text>
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? theme.accent : theme.text },
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Subcategories (if available) */}
      {subcategories.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Subcategory
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}
          >
            {subcategories.map((sub) => {
              const isSelected = selectedSubcategory === sub;
              return (
                <TouchableOpacity
                  key={sub}
                  style={[
                    styles.subChip,
                    {
                      backgroundColor: isSelected ? theme.accent : theme.glassCard,
                      borderColor: isSelected ? theme.accent : theme.glassBorder,
                    },
                  ]}
                  onPress={() => setSelectedSubcategory(sub)}
                >
                  <Text
                    style={[
                      styles.subChipText,
                      { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    {sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      )}

      {/* Payment Method */}
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        Payment Method
      </Text>
      <View style={styles.paymentMethodsRow}>
        {PAYMENT_METHODS.map((pm) => {
          const isSelected = paymentMethod === pm.id;
          return (
            <TouchableOpacity
              key={pm.id}
              style={[
                styles.paymentChip,
                {
                  backgroundColor: isSelected ? theme.accentGlow : theme.glassCard,
                  borderColor: isSelected ? theme.accent : theme.glassBorder,
                },
              ]}
              onPress={() => setPaymentMethod(pm.id)}
            >
              <Text style={styles.chipIcon}>{pm.icon}</Text>
              <Text
                style={[
                  styles.paymentChipText,
                  { color: isSelected ? theme.accent : theme.text },
                ]}
              >
                {pm.id}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Notes */}
      <GlassInput
        label="Optional Notes"
        placeholder="Additional reference, invoice number or comments"
        value={notes}
        onChangeText={setNotes}
        multiline
        style={styles.inputField}
      />

      <GlassButton
        title={type === 'expense' ? 'Save Expense' : 'Save Income'}
        onPress={handleSubmit}
        loading={loading}
        variant="primary"
        size="lg"
        style={styles.submitBtn}
      />
    </GlassModal>
  );
}

const styles = StyleSheet.create({
  typeSelectorRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  typeTabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  inputField: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsScroll: {
    paddingBottom: 6,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  chipIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  subChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 6,
  },
  subChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  paymentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  paymentChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: 18,
    marginBottom: 20,
  },
});

