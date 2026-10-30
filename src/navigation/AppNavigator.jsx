import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import DashboardScreen from '../screens/DashboardScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import BudgetScreen from '../screens/BudgetScreen';
import DebtsScreen from '../screens/DebtsScreen';
import SavingsScreen from '../screens/SavingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PersonalizationScreen from '../screens/PersonalizationScreen';
import AddTransactionModal from '../screens/AddTransactionModal';

export default function AppNavigator() {
  const { theme, isDark } = useTheme();
  const { isAuthenticated, loading } = useAuth();
  const insets = useSafeAreaInsets();

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  );
  const bottomInset = Math.max(insets.bottom, 10);

  // Navigation state
  const [showSplash, setShowSplash] = useState(true);
  const [authRoute, setAuthRoute] = useState('welcome'); // 'welcome', 'login', 'register', 'forgot'
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'transactions', 'savings', 'debts', 'budget', 'profile'
  const [showPersonalization, setShowPersonalization] = useState(false);

  // Global Transaction Modal
  const [addTxModalVisible, setAddTxModalVisible] = useState(false);
  const [addTxInitialType, setAddTxInitialType] = useState('expense');

  // Handle splash complete
  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  if (loading || showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  // --- UNAUTHENTICATED FLOW ---
  if (!isAuthenticated) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        {authRoute === 'welcome' && (
          <WelcomeScreen
            onNavigateLogin={() => setAuthRoute('login')}
            onNavigateRegister={() => setAuthRoute('register')}
          />
        )}

        {authRoute === 'login' && (
          <LoginScreen
            onNavigateRegister={() => setAuthRoute('register')}
            onNavigateForgotPassword={() => setAuthRoute('forgot')}
          />
        )}

        {authRoute === 'register' && (
          <RegisterScreen
            onNavigateLogin={() => setAuthRoute('login')}
            onRegisterSuccess={() => {}}
          />
        )}

        {authRoute === 'forgot' && (
          <ForgotPasswordScreen
            onNavigateLogin={() => setAuthRoute('login')}
          />
        )}
      </View>
    );
  }

  // --- AUTHENTICATED FLOW ---
  if (showPersonalization) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <PersonalizationScreen onBack={() => setShowPersonalization(false)} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <View
        style={[
          styles.topHeader,
          {
            borderBottomColor: theme.glassBorder,
            paddingTop: topInset + 10,
          },
        ]}
      >
        <Text style={[styles.appBrandTitle, { color: theme.text }]}>
          AURORA<Text style={{ color: theme.accent }}> FINANCE</Text>
        </Text>
        <TouchableOpacity
          onPress={() => setShowPersonalization(true)}
          style={[styles.headerIconBtn, { backgroundColor: theme.glassCard, borderColor: theme.glassBorder }]}
        >
          <Text style={styles.headerIconText}>🎨</Text>
        </TouchableOpacity>
      </View>

      {/* Screen Views */}
      <View style={styles.screenContainer}>
        {activeTab === 'home' && (
          <DashboardScreen
            onOpenAddTransaction={(type = 'expense') => {
              setAddTxInitialType(type);
              setAddTxModalVisible(true);
            }}
            onOpenSavingsModal={() => setActiveTab('savings')}
            onOpenDebtModal={() => setActiveTab('debts')}
            onNavigateTransactions={() => setActiveTab('transactions')}
            onNavigateBudget={() => setActiveTab('budget')}
            onNavigateSavings={() => setActiveTab('savings')}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsScreen
            onOpenAddTransaction={(type = 'expense') => {
              setAddTxInitialType(type);
              setAddTxModalVisible(true);
            }}
          />
        )}

        {activeTab === 'savings' && <SavingsScreen />}

        {activeTab === 'debts' && <DebtsScreen />}

        {activeTab === 'budget' && <BudgetScreen />}

        {activeTab === 'profile' && (
          <ProfileScreen
            onNavigatePersonalization={() => setShowPersonalization(true)}
          />
        )}
      </View>

      {/* Bottom Glass Navigation Bar */}
      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: theme.glassNav,
            borderColor: theme.glassBorder,
            paddingBottom: bottomInset,
          },
        ]}
      >
        {[
          { id: 'home', label: 'Home', icon: '🏠' },
          { id: 'transactions', label: 'Activity', icon: '📝' },
          { id: 'savings', label: 'Savings', icon: '🏦' },
          { id: 'debts', label: 'Friends', icon: '🤝' },
          { id: 'budget', label: 'Budget', icon: '📊' },
          { id: 'profile', label: 'Profile', icon: '👤' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.navTab,
                isActive && {
                  backgroundColor: theme.accentGlow,
                  borderColor: theme.accent,
                },
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={styles.navIcon}>{tab.icon}</Text>
              <Text
                style={[
                  styles.navLabel,
                  {
                    color: isActive ? theme.accent : theme.textSecondary,
                    fontWeight: isActive ? '800' : '500',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Global Add Transaction Modal */}
      <AddTransactionModal
        visible={addTxModalVisible}
        onClose={() => setAddTxModalVisible(false)}
        initialType={addTxInitialType}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  appBrandTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: {
    fontSize: 18,
  },
  screenContainer: {
    flex: 1,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderTopWidth: 1.2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 12,
  },
  navTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  navIcon: {
    fontSize: 18,
  },
  navLabel: {
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.2,
  },
});
