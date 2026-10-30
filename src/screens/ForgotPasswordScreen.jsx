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
import { authService } from '../services/authService';
import { useKeyboardBottomInset } from '../hooks/useKeyboardBottomInset';
import GlassCard from '../components/GlassCard';
import GlassInput from '../components/GlassInput';
import GlassButton from '../components/GlassButton';
import { isValidEmail } from '../utils/validators';

export default function ForgotPasswordScreen({ onNavigateLogin }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardBottomInset();

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  );

  const [step, setStep] = useState(1); // 1 = Request, 2 = Set New Password
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [serverError, setServerError] = useState(null);

  const handleRequestReset = async () => {
    setServerError(null);
    setMessage(null);

    if (!email.trim() || !isValidEmail(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await authService.forgotPassword(email);
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
      setMessage('Password reset code generated. Enter your new password below.');
      setStep(2);
    } catch (err) {
      setServerError(err.message || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async () => {
    setServerError(null);
    const newErrors = {};

    if (!resetToken.trim()) {
      newErrors.token = 'Reset token is required';
    }

    if (!newPassword || newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await authService.resetPassword({
        token: resetToken.trim(),
        newPassword,
      });
      setMessage('Password reset successful! Please log in with your new credentials.');
      setTimeout(() => {
        onNavigateLogin();
      }, 1500);
    } catch (err) {
      setServerError(err.message || 'Failed to reset password');
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
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onNavigateLogin}
        >
          <Text style={[styles.backText, { color: theme.accent }]}>
            ← Back to Sign In
          </Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            {step === 1 ? 'Password Recovery' : 'Create New Password'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {step === 1
              ? 'Enter your registered email to receive a secure password reset token.'
              : 'Enter your reset token and your new strong password.'}
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

        {message && (
          <View
            style={[
              styles.successBanner,
              {
                backgroundColor: theme.semantic.incomeBg,
                borderColor: theme.semantic.incomeBorder,
              },
            ]}
          >
            <Text style={[styles.successBannerText, { color: theme.semantic.income }]}>
              {message}
            </Text>
          </View>
        )}

        <GlassCard style={styles.formCard}>
          {step === 1 ? (
            <>
              <GlassInput
                label="Registered Email"
                placeholder="name@example.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: null });
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                icon="✉️"
                error={errors.email}
              />

              <GlassButton
                title="Send Reset Instructions"
                onPress={handleRequestReset}
                loading={loading}
                variant="primary"
                size="lg"
                style={styles.actionBtn}
              />
            </>
          ) : (
            <>
              <GlassInput
                label="Security Reset Token"
                placeholder="Paste reset token here"
                value={resetToken}
                onChangeText={(text) => {
                  setResetToken(text);
                  if (errors.token) setErrors({ ...errors, token: null });
                }}
                icon="🔐"
                error={errors.token}
              />

              <GlassInput
                label="New Password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  if (errors.newPassword) setErrors({ ...errors, newPassword: null });
                }}
                secureTextEntry
                icon="🔑"
                error={errors.newPassword}
              />

              <GlassInput
                label="Confirm New Password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
                }}
                secureTextEntry
                icon="🔒"
                error={errors.confirmPassword}
              />

              <GlassButton
                title="Update Password"
                onPress={handleConfirmReset}
                loading={loading}
                variant="primary"
                size="lg"
                style={styles.actionBtn}
              />
            </>
          )}
        </GlassCard>
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
    paddingTop: 40,
  },
  backBtn: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
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
  successBanner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successBannerText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  formCard: {
    padding: 20,
  },
  actionBtn: {
    marginTop: 14,
  },
});

