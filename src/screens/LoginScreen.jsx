import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useKeyboardBottomInset } from '../hooks/useKeyboardBottomInset';
import GlassCard from '../components/GlassCard';
import GlassInput from '../components/GlassInput';
import GlassButton from '../components/GlassButton';
import { isValidEmail } from '../utils/validators';

export default function LoginScreen({
  onNavigateRegister,
  onNavigateForgotPassword,
  onLoginSuccess,
}) {
  const { theme } = useTheme();
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardBottomInset();

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);

  const handleLogin = async () => {
    setServerError(null);
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const data = await login(email, password);
      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setServerError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      enabled={Platform.OS === 'ios'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topInset + 16,
            paddingBottom: keyboardHeight > 0 ? keyboardHeight + 40 : 40,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View
            style={[
              styles.logoBadge,
              { backgroundColor: theme.accentGlow, borderColor: theme.accent },
            ]}
          >
            <Text style={styles.logoIcon}>💎</Text>
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Sign in to manage your wealth & expenses
          </Text>
        </View>

        {serverError && (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: theme.semantic.expenseBg,
                borderColor: theme.semantic.expenseBorder,
              },
            ]}
          >
            <Text style={[styles.errorBannerText, { color: theme.semantic.expense }]}>
              {serverError}
            </Text>
          </View>
        )}

        <GlassCard style={styles.formCard}>
          <GlassInput
            label="Email Address"
            placeholder="name@example.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: null });
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            icon="✉️"
            error={errors.email}
          />

          <GlassInput
            label="Password"
            placeholder="Enter your account password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({ ...errors, password: null });
            }}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            icon="🔑"
            error={errors.password}
          />

          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: rememberMe ? theme.accent : theme.glassBorder,
                    backgroundColor: rememberMe ? theme.accent : 'transparent',
                  },
                ]}
              >
                {rememberMe && <Text style={styles.checkIcon}>✓</Text>}
              </View>
              <Text style={[styles.rememberText, { color: theme.textSecondary }]}>
                Remember session
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onNavigateForgotPassword}>
              <Text style={[styles.forgotText, { color: theme.accent }]}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          </View>

          <GlassButton
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            variant="primary"
            size="lg"
            style={styles.submitBtn}
          />
        </GlassCard>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={onNavigateRegister}>
            <Text style={[styles.signUpLink, { color: theme.accent }]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 48,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorBanner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  formCard: {
    padding: 20,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 20,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rememberText: {
    fontSize: 13,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
