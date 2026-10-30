import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useKeyboardBottomInset } from '../hooks/useKeyboardBottomInset';

export default function GlassModal({
  visible,
  onClose,
  title,
  subtitle,
  children,
}) {
  const { theme, isDark } = useTheme();
  const keyboardHeight = useKeyboardBottomInset();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.isGlass
                ? isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.98)'
                : theme.card,
              borderColor: theme.glassBorderHighlight,
            },
          ]}
        >
          <View style={styles.indicatorBar}>
            <View
              style={[
                styles.dragIndicator,
                { backgroundColor: theme.textMuted },
              ]}
            />
          </View>

          <View style={styles.header}>
            <View style={styles.headerTextWrapper}>
              <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
              {subtitle && (
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  {subtitle}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: theme.glassBorder }]}
              onPress={onClose}
            >
              <Text style={[styles.closeText, { color: theme.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={[
              styles.contentContainer,
              { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 24 : 30 },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  indicatorBar: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 6,
  },
  dragIndicator: {
    width: 38,
    height: 4,
    borderRadius: 2,
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
  },
  headerTextWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  closeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    maxHeight: 520,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
});

