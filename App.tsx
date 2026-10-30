import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { FinanceProvider } from './src/context/FinanceContext';
import AppNavigator from './src/navigation/AppNavigator';

function ThemedApp() {
  const { theme, isDark } = useTheme();

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      <AppNavigator />
    </>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <FinanceProvider>
            <ThemedApp />
          </FinanceProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
