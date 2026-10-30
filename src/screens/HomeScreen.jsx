import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import CustomButton from '../components/CustomButton';
import { COLORS } from '../constants/colors';
import { checkHealth } from '../api/authApi';
import { BASE_URL } from '../api/apiClient';

export default function HomeScreen({ user, onLogout }) {
  const [backendStatus, setBackendStatus] = useState(null);
  const [checking, setChecking] = useState(false);

  const testBackendConnection = async () => {
    setChecking(true);
    setBackendStatus(null);
    try {
      const res = await checkHealth();
      setBackendStatus({ success: true, message: res.message || 'Connected!' });
    } catch (err) {
      setBackendStatus({
        success: false,
        message: `Failed to connect to ${BASE_URL}/health. Make sure the Node server is running on port 5001.`,
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.greeting}>Welcome, {user?.name || 'User'}! 👋</Text>
        <Text style={styles.emailText}>{user?.email}</Text>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Backend Connection Test</Text>
        <Text style={styles.targetUrlText}>Target: {BASE_URL}/health</Text>
        <CustomButton
          title={checking ? 'Checking...' : 'Test Backend Connection'}
          onPress={testBackendConnection}
          loading={checking}
          variant="secondary"
        />

        {backendStatus && (
          <View
            style={[
              styles.statusBox,
              backendStatus.success ? styles.statusSuccess : styles.statusError,
            ]}
          >
            <Text
              style={
                backendStatus.success ? styles.successText : styles.errorText
              }
            >
              {backendStatus.message}
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        <CustomButton
          title="Sign Out"
          onPress={onLogout}
          variant="primary"
          style={styles.logoutBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  emailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  targetUrlText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statusBox: {
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  statusSuccess: {
    backgroundColor: '#E8F5E9',
  },
  statusError: {
    backgroundColor: '#FFEBEE',
  },
  successText: {
    color: '#2E7D32',
    fontSize: 13,
  },
  errorText: {
    color: '#C62828',
    fontSize: 13,
  },
  logoutBtn: {
    backgroundColor: COLORS.error,
  },
});

