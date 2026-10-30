import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import GlassButton from '../components/GlassButton';
import { ACCENT_PALETTES } from '../constants/theme';

export default function PersonalizationScreen({ onBack }) {
  const { theme, isDark, themeMode, setThemeMode, accentColor, setAccentColor, interfaceStyle, setInterfaceStyle } = useTheme();
  const { preferences, updatePreferences } = useAuth();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0
  );

  const [saving, setSaving] = useState(false);
  const [haptic, setHaptic] = useState(preferences?.haptic_feedback ?? true);
  const [animations, setAnimations] = useState(preferences?.animations_enabled ?? true);
  const [dateFormat, setDateFormat] = useState(preferences?.date_format || 'DD/MM/YYYY');
  const [widgets, setWidgets] = useState(
    preferences?.dashboard_widgets || [
      { id: 'balance', title: 'Total Balance Card', visible: true },
      { id: 'income_expense', title: 'Income & Expense Cards', visible: true },
      { id: 'savings_progress', title: 'Monthly Savings Progress', visible: true },
      { id: 'quick_actions', title: 'Quick Action Buttons', visible: true },
      { id: 'expense_chart', title: 'Expense Distribution Chart', visible: true },
      { id: 'recent_transactions', title: 'Recent Transactions', visible: true },
    ]
  );

  const toggleWidget = (id) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePreferences({
        theme_mode: themeMode,
        accent_color: accentColor,
        interface_style: interfaceStyle,
        haptic_feedback: haptic,
        animations_enabled: animations,
        date_format: dateFormat,
        dashboard_widgets: widgets,
      });
      Alert.alert('Success', 'Personalization settings saved & synced successfully!');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topInset + 16,
          paddingBottom: Math.max(insets.bottom, 40),
        },
      ]}
    >
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={[styles.backText, { color: theme.accent }]}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.title, { color: theme.text }]}>
          Appearance & Personalization
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Tailor your visual theme, glass aesthetics, and layout
        </Text>
      </View>

      {/* 1. Theme Appearance */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance Mode</Text>
      <View style={styles.modeRow}>
        {[
          { id: 'system', title: 'System Default', icon: '⚙️' },
          { id: 'dark', title: 'Dark Theme', icon: '🌙' },
          { id: 'light', title: 'Light Theme', icon: '☀️' },
        ].map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.modeCard,
              {
                backgroundColor: themeMode === item.id ? theme.accentGlow : theme.glassCard,
                borderColor: themeMode === item.id ? theme.accent : theme.glassBorder,
              },
            ]}
            onPress={() => setThemeMode(item.id)}
          >
            <Text style={styles.modeIcon}>{item.icon}</Text>
            <Text
              style={[
                styles.modeText,
                { color: themeMode === item.id ? theme.accent : theme.text },
              ]}
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 2. Accent Color Palette */}
      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>
        Accent Color Palette
      </Text>
      <GlassCard style={styles.paletteCard}>
        <View style={styles.colorsGrid}>
          {ACCENT_PALETTES.map((item) => {
            const isSelected = accentColor.toLowerCase() === item.color.toLowerCase();
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: item.color },
                  isSelected && styles.colorSwatchSelected,
                ]}
                onPress={() => setAccentColor(item.color)}
              >
                {isSelected && <Text style={styles.checkIcon}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassCard>

      {/* 3. Interface Style */}
      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>
        Interface Styling
      </Text>
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[
            styles.modeCard,
            {
              backgroundColor: interfaceStyle === 'glassmorphism' ? theme.accentGlow : theme.glassCard,
              borderColor: interfaceStyle === 'glassmorphism' ? theme.accent : theme.glassBorder,
            },
          ]}
          onPress={() => setInterfaceStyle('glassmorphism')}
        >
          <Text style={styles.modeIcon}>🧊</Text>
          <Text
            style={[
              styles.modeText,
              { color: interfaceStyle === 'glassmorphism' ? theme.accent : theme.text },
            ]}
          >
            Glassmorphism
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeCard,
            {
              backgroundColor: interfaceStyle === 'minimal' ? theme.accentGlow : theme.glassCard,
              borderColor: interfaceStyle === 'minimal' ? theme.accent : theme.glassBorder,
            },
          ]}
          onPress={() => setInterfaceStyle('minimal')}
        >
          <Text style={styles.modeIcon}>📐</Text>
          <Text
            style={[
              styles.modeText,
              { color: interfaceStyle === 'minimal' ? theme.accent : theme.text },
            ]}
          >
            Minimal Solid
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. Dashboard Widgets Customization */}
      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>
        Dashboard Widgets Visibility
      </Text>
      <GlassCard>
        {widgets.map((widget, index) => (
          <View
            key={widget.id}
            style={[
              styles.widgetRow,
              index < widgets.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.glassBorder },
            ]}
          >
            <Text style={[styles.widgetText, { color: theme.text }]}>
              {widget.title}
            </Text>
            <Switch
              value={widget.visible}
              onValueChange={() => toggleWidget(widget.id)}
              trackColor={{ false: theme.border, true: theme.accentLight }}
              thumbColor={widget.visible ? theme.accent : '#F3F4F6'}
            />
          </View>
        ))}
      </GlassCard>

      {/* 5. Currency & Region */}
      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>
        Format & Motion
      </Text>
      <GlassCard>
        <View style={styles.widgetRow}>
          <Text style={[styles.widgetText, { color: theme.text }]}>Base Currency</Text>
          <Text style={[styles.staticVal, { color: theme.accent }]}>INR (₹)</Text>
        </View>

        <View style={[styles.widgetRow, { borderTopWidth: 1, borderTopColor: theme.glassBorder }]}>
          <Text style={[styles.widgetText, { color: theme.text }]}>Date Format</Text>
          <TouchableOpacity
            onPress={() => setDateFormat(dateFormat === 'DD/MM/YYYY' ? 'MM/DD/YYYY' : 'DD/MM/YYYY')}
          >
            <Text style={[styles.staticVal, { color: theme.accent }]}>{dateFormat} ⇄</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.widgetRow, { borderTopWidth: 1, borderTopColor: theme.glassBorder }]}>
          <Text style={[styles.widgetText, { color: theme.text }]}>Smooth Animations</Text>
          <Switch
            value={animations}
            onValueChange={setAnimations}
            trackColor={{ false: theme.border, true: theme.accentLight }}
            thumbColor={animations ? theme.accent : '#F3F4F6'}
          />
        </View>
      </GlassCard>

      <GlassButton
        title="Save Preferences & Sync"
        onPress={handleSave}
        loading={saving}
        variant="primary"
        size="lg"
        style={styles.saveBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 36,
    paddingBottom: 60,
  },
  header: {
    marginBottom: 20,
  },
  backBtn: {
    marginBottom: 12,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modeCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  modeIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  modeText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  paletteCard: {
    padding: 16,
  },
  colorsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
  },
  checkIcon: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 18,
  },
  widgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  widgetText: {
    fontSize: 14,
    fontWeight: '600',
  },
  staticVal: {
    fontSize: 14,
    fontWeight: '700',
  },
  saveBtn: {
    marginTop: 28,
  },
});

