import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { COLORS } from '../constants/colors';

export default function CustomButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
}) {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isPrimary ? styles.primaryBtn : styles.secondaryBtn,
        (disabled || loading) && styles.disabledBtn,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isPrimary ? COLORS.white : COLORS.primary}
        />
      ) : (
        <Text
          style={[
            styles.text,
            isPrimary ? styles.primaryText : styles.secondaryText,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: COLORS.white,
  },
  secondaryText: {
    color: COLORS.primary,
  },
});

