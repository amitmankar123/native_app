import React, { useRef } from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Pressable,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function GlassButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary', // 'primary', 'secondary', 'outline', 'danger', 'ghost'
  size = 'md', // 'sm', 'md', 'lg'
  icon = null,
  style,
  textStyle,
}) {
  const { theme, isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const getButtonStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.accent,
          borderColor: theme.accentLight,
          borderWidth: 1,
          shadowColor: theme.accent,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
          elevation: 4,
        };
      case 'secondary':
        return {
          backgroundColor: theme.isGlass
            ? isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.85)'
            : theme.card,
          borderColor: theme.glassBorder,
          borderWidth: 1,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: theme.accent,
          borderWidth: 1.5,
        };
      case 'danger':
        return {
          backgroundColor: theme.semantic.expense,
          borderColor: '#DC2626',
          borderWidth: 1,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
      default:
        return {};
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
      case 'danger':
        return '#FFFFFF';
      case 'secondary':
        return theme.text;
      case 'outline':
      case 'ghost':
        return theme.accent;
      default:
        return theme.text;
    }
  };

  const getHeight = () => {
    if (size === 'sm') return 38;
    if (size === 'lg') return 54;
    return 48;
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.button,
          getButtonStyles(),
          { height: getHeight() },
          (disabled || loading) && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : theme.accent}
          />
        ) : (
          <>
            {icon && <Text style={styles.icon}>{icon}</Text>}
            <Text
              style={[
                styles.text,
                { color: getTextColor(), fontSize: size === 'sm' ? 14 : 16 },
                textStyle,
              ]}
            >
              {title}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  icon: {
    marginRight: 8,
    fontSize: 16,
  },
  disabled: {
    opacity: 0.55,
  },
});

