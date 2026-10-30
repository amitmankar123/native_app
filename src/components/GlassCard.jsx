import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function GlassCard({
  children,
  style,
  variant = 'default', // 'default', 'elevated', 'accent', 'danger', 'success'
  glow = false,
  ...props
}) {
  const { theme, isDark } = useTheme();

  const getBackgroundColor = () => {
    if (!theme.isGlass) {
      return variant === 'elevated' ? theme.cardElevated : theme.card;
    }

    switch (variant) {
      case 'accent':
        return theme.accentGlow;
      case 'danger':
        return theme.semantic.expenseBg;
      case 'success':
        return theme.semantic.incomeBg;
      case 'elevated':
        return isDark ? 'rgba(31, 41, 61, 0.65)' : 'rgba(255, 255, 255, 0.88)';
      default:
        return theme.glassCard;
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'accent':
        return theme.accent;
      case 'danger':
        return theme.semantic.expenseBorder;
      case 'success':
        return theme.semantic.incomeBorder;
      default:
        return theme.glassBorder;
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          shadowColor: glow ? theme.accent : theme.shadowColor,
          shadowOpacity: isDark ? 0.35 : 0.08,
          shadowRadius: glow ? 14 : 8,
          elevation: isDark ? 4 : 2,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginVertical: 6,
    shadowOffset: { width: 0, height: 4 },
  },
});

