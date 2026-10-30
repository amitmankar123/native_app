import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';

export default function WelcomeScreen({ onNavigateLogin, onNavigateRegister }) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topInset + 16,
          paddingBottom: Math.max(insets.bottom, 24),
        },
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.badge,
            { backgroundColor: theme.accentGlow, borderColor: theme.accent },
          ]}
        >
          <Text style={[styles.badgeText, { color: theme.accent }]}>
            ✨ Intelligent Financial Architecture
          </Text>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>
          Master Your Wealth with Precision
        </Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          Elevate your daily finances with double-entry accounting, real-time savings goals, friend debts management, and intelligent analytics.
        </Text>
      </View>

      <View style={styles.features}>
        <GlassCard style={styles.featureCard}>
          <Text style={styles.featureIcon}>💳</Text>
          <View style={styles.featureTextWrapper}>
            <Text style={[styles.featureTitle, { color: theme.text }]}>
              Ledger-Grade Balance
            </Text>
            <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>
              Exact integer-paise tracking for salary, income streams, and everyday expenses.
            </Text>
          </View>
        </GlassCard>

        <GlassCard style={styles.featureCard}>
          <Text style={styles.featureIcon}>🎯</Text>
          <View style={styles.featureTextWrapper}>
            <Text style={[styles.featureTitle, { color: theme.text }]}>
              Targeted Savings & Goals
            </Text>
            <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>
              Non-expense savings vault allocations with emergency fund monitoring.
            </Text>
          </View>
        </GlassCard>

        <GlassCard style={styles.featureCard}>
          <Text style={styles.featureIcon}>🤝</Text>
          <View style={styles.featureTextWrapper}>
            <Text style={[styles.featureTitle, { color: theme.text }]}>
              Friends Lending & Liabilities
            </Text>
            <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>
              Separate receivables from expenses. Never lose track of borrowed or lent money.
            </Text>
          </View>
        </GlassCard>
      </View>

      <View style={styles.actionContainer}>
        <GlassButton
          title="Create New Account"
          onPress={onNavigateRegister}
          variant="primary"
          size="lg"
          style={styles.primaryBtn}
        />
        <GlassButton
          title="I already have an account"
          onPress={onNavigateLogin}
          variant="secondary"
          size="lg"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 48,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  features: {
    marginVertical: 12,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 6,
  },
  featureIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  featureTextWrapper: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionContainer: {
    marginTop: 24,
  },
  primaryBtn: {
    marginBottom: 12,
  },
});

