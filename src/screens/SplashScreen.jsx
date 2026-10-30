import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function SplashScreen({ onFinish }) {
  const { theme } = useTheme();
  const { isAuthenticated, loading } = useAuth();

  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.8)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance animation
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 900,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, {
          toValue: 1.25,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(glowScale, {
          toValue: 0.8,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [logoScale, logoOpacity, glowScale, textOpacity]);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        if (onFinish) onFinish(isAuthenticated);
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [loading, isAuthenticated, onFinish]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View
        style={[
          styles.glowCircle,
          {
            backgroundColor: theme.accentGlow,
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.logoCard,
          {
            backgroundColor: theme.isGlass ? 'rgba(255, 255, 255, 0.08)' : theme.card,
            borderColor: theme.accent,
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Text style={styles.logoIcon}>💎</Text>
      </Animated.View>

      <Animated.View style={[styles.brandingContainer, { opacity: textOpacity }]}>
        <Text style={[styles.appTitle, { color: theme.text }]}>
          AURORA<Text style={{ color: theme.accent }}> FINANCE</Text>
        </Text>
        <Text style={[styles.appSubtitle, { color: theme.textSecondary }]}>
          Premium Native Wealth & Expense Manager
        </Text>
      </Animated.View>

      <View style={styles.footer}>
        <Text style={[styles.currencyTag, { color: theme.textMuted }]}>
          Target: INR (₹) • Glassmorphism Edition
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  glowCircle: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.5,
  },
  logoCard: {
    width: 110,
    height: 110,
    borderRadius: 36,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 50,
  },
  brandingContainer: {
    alignItems: 'center',
    marginTop: 28,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  appSubtitle: {
    fontSize: 14,
    marginTop: 8,
    letterSpacing: 0.4,
  },
  footer: {
    position: 'absolute',
    bottom: 36,
  },
  currencyTag: {
    fontSize: 12,
    letterSpacing: 0.8,
  },
});

