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
import { isValidEmail, isValidMobile, evaluatePasswordStrength } from '../utils/validators';

export default function RegisterScreen({ onNavigateLogin, onRegisterSuccess }) {
  const { theme } = useTheme();
  const { register } = useAuth();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardBottomInset();

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  );

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [success, setSuccess] = useState(false);

  const passwordStrength = evaluatePasswordStrength(password);

  const handleRegister = async () => {
    setServerError(null);
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (mobile.trim() && !isValidMobile(mobile)) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const data = await register({
        name,
        email,
        password,
        mobile: mobile.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        if (onRegisterSuccess) onRegisterSuccess(data.user);
      }, 1200);
    } catch (err) {
      setServerError(err.message || 'Registration failed');
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
          <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Start your premium personal wealth journey
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

        {success && (
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
              🎉 Account created successfully! Launching dashboard...
            </Text>
          </View>
        )}

        <GlassCard style={styles.formCard}>
          <GlassInput
            label="Full Name"
            placeholder="Amit Kumar"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors({ ...errors, name: null });
            }}
            autoCorrect={false}
            returnKeyType="next"
            icon="👤"
            error={errors.name}
          />

          <GlassInput
            label="Email Address"
            placeholder="amit@example.com"
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
            label="Mobile Number (Optional)"
            placeholder="+91 9876543210"
            value={mobile}
            onChangeText={(text) => {
              setMobile(text);
              if (errors.mobile) setErrors({ ...errors, mobile: null });
            }}
            keyboardType="phone-pad"
            autoCorrect={false}
            returnKeyType="next"
            icon="📱"
            error={errors.mobile}
          />

          <GlassInput
            label="Password"
            placeholder="Minimum 6 characters"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({ ...errors, password: null });
            }}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            icon="🔑"
            error={errors.password}
          />

          {password.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBars}>
                {[1, 2, 3, 4].map((step) => (
                  <View
                    key={step}
                    style={[
                      styles.strengthBar,
                      {
                        backgroundColor:
                          step <= passwordStrength.score
                            ? passwordStrength.color
                            : theme.glassBorder,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text
                style={[
                  styles.strengthLabel,
                  { color: passwordStrength.color },
                ]}
              >
                Strength: {passwordStrength.label}
              </Text>
            </View>
          )}

          <GlassInput
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
            }}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleRegister}
            icon="🔒"
            error={errors.confirmPassword}
          />

          <GlassButton
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            variant="primary"
            size="lg"
            style={styles.submitBtn}
          />
        </GlassCard>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={onNavigateLogin}>
            <Text style={[styles.loginLink, { color: theme.accent }]}>
              Sign In
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
    paddingTop: 36,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
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
    padding: 14,
    marginBottom: 16,
  },
  successBannerText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  formCard: {
    padding: 20,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -2,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  strengthBars: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: 14,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
