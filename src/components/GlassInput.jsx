import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function GlassInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  error,
  icon,
  rightElement,
  style,
  inputStyle,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit,
  ...props
}) {
  const { theme, isDark } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  const isSecured = secureTextEntry && !showPassword;

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.isGlass
              ? isDark
                ? 'rgba(255, 255, 255, 0.06)'
                : 'rgba(255, 255, 255, 0.85)'
              : theme.card,
            borderColor: error ? theme.semantic.expense : theme.glassBorder,
          },
        ]}
      >
        {icon && <Text style={styles.leadingIcon}>{icon}</Text>}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          secureTextEntry={isSecured}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={blurOnSubmit}
          underlineColorAndroid="transparent"
          style={[
            styles.input,
            {
              color: theme.text,
              minHeight: multiline ? 80 : 48,
              textAlignVertical: multiline ? 'top' : 'center',
            },
            inputStyle,
          ]}
          {...props}
        />

        {secureTextEntry && (
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Text style={styles.eyeText}>{showPassword ? '👁️' : '🔒'}</Text>
          </TouchableOpacity>
        )}

        {rightElement}
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: theme.semantic.expense }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.2,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
  },
  leadingIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  eyeBtn: {
    padding: 6,
  },
  eyeText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
