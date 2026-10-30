import React, { createContext, useContext, useState, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { THEMES, ACCENT_PALETTES, SEMANTIC_COLORS } from '../constants/theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children, initialPreferences = {} }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState(initialPreferences.theme_mode || 'system');
  const [accentColor, setAccentColor] = useState(initialPreferences.accent_color || '#2563EB');
  const [interfaceStyle, setInterfaceStyle] = useState(initialPreferences.interface_style || 'glassmorphism');

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemScheme]);

  const activeTheme = useMemo(() => {
    const base = isDark ? THEMES.dark : THEMES.light;
    const accentObj = ACCENT_PALETTES.find((p) => p.color.toLowerCase() === accentColor.toLowerCase()) || {
      color: accentColor,
      light: accentColor,
      dark: accentColor,
      glow: `${accentColor}33`,
    };

    return {
      ...base,
      accent: accentColor,
      accentLight: accentObj.light || accentColor,
      accentDark: accentObj.dark || accentColor,
      accentGlow: accentObj.glow || `${accentColor}40`,
      semantic: SEMANTIC_COLORS,
      isGlass: interfaceStyle === 'glassmorphism',
      interfaceStyle,
      themeMode,
    };
  }, [isDark, accentColor, interfaceStyle, themeMode]);

  const value = useMemo(
    () => ({
      isDark,
      theme: activeTheme,
      themeMode,
      setThemeMode,
      accentColor,
      setAccentColor,
      interfaceStyle,
      setInterfaceStyle,
    }),
    [isDark, activeTheme, themeMode, accentColor, interfaceStyle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

