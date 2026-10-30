import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import GlassCard from '../components/GlassCard';
import GlassInput from '../components/GlassInput';
import GlassButton from '../components/GlassButton';
import { formatINR, formatDisplayDate } from '../utils/formatters';

const AVATARS = ['👑', '🦁', '🚀', '⚡', '💎', '🦊', '🦉', '💼'];

export default function ProfileScreen({ onNavigatePersonalization }) {
  const { theme, isDark } = useTheme();
  const { user, updateProfile, logout } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [monthlySalary, setMonthlySalary] = useState(user?.monthly_salary ? String(user.monthly_salary / 100) : '15000');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.profile_image || '👑');
  const [saving, setSaving] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoadingSessions(true);
      const data = await authService.getSessions();
      setSessions(data || []);
    } catch (e) {
      console.log('Sessions load error:', e.message);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty');
      return;
    }

    const parsedSalary = parseFloat(monthlySalary);
    if (isNaN(parsedSalary) || parsedSalary < 0) {
      Alert.alert('Validation Error', 'Please enter a valid monthly salary');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        mobile: mobile.trim() || null,
        monthly_salary: Math.round(parsedSalary * 100),
        profile_image: selectedAvatar,
      });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    Alert.alert('Revoke Session', 'Terminate this session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: async () => {
          try {
            await authService.revokeSession(sessionId);
            loadSessions();
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const handleLogoutAll = () => {
    Alert.alert('Terminate All Sessions', 'This will log you out from all devices.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout All',
        style: 'destructive',
        onPress: async () => {
          try {
            await authService.logoutAll();
          } catch (e) {
            logout();
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Profile Header Card */}
      <GlassCard style={styles.profileCard}>
        <View style={styles.avatarRow}>
          <View
            style={[
              styles.avatarContainer,
              { backgroundColor: theme.accentGlow, borderColor: theme.accent },
            ]}
          >
            <Text style={styles.avatarEmoji}>{selectedAvatar}</Text>
          </View>

          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.text }]}>
              {user?.name || 'User'}
            </Text>
            <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
              {user?.email}
            </Text>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.currencyBadge,
                  { backgroundColor: theme.semantic.incomeBg, borderColor: theme.semantic.incomeBorder },
                ]}
              >
                <Text style={[styles.currencyBadgeText, { color: theme.semantic.income }]}>
                  {user?.currency || 'INR'} (₹)
                </Text>
              </View>
              <Text style={[styles.dateBadge, { color: theme.textMuted }]}>
                Joined {formatDisplayDate(user?.created_at, 'short')}
              </Text>
            </View>
          </View>
        </View>

        {isEditing && (
          <View style={styles.avatarPickerRow}>
            <Text style={[styles.pickerLabel, { color: theme.textSecondary }]}>
              Select Avatar:
            </Text>
            <View style={styles.avatarsList}>
              {AVATARS.map((av) => (
                <TouchableOpacity
                  key={av}
                  style={[
                    styles.avatarChoice,
                    selectedAvatar === av && { borderColor: theme.accent, backgroundColor: theme.accentGlow },
                  ]}
                  onPress={() => setSelectedAvatar(av)}
                >
                  <Text style={styles.choiceEmoji}>{av}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </GlassCard>

      {/* Edit Profile Form or Overview */}
      <GlassCard style={styles.detailsCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Financial Identity
          </Text>
          <TouchableOpacity
            onPress={() => {
              if (isEditing) handleSaveProfile();
              else setIsEditing(true);
            }}
          >
            <Text style={[styles.editBtnText, { color: theme.accent }]}>
              {isEditing ? (saving ? 'Saving...' : 'Done') : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        {isEditing ? (
          <View style={styles.form}>
            <GlassInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              icon="👤"
            />
            <GlassInput
              label="Mobile Number"
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
              icon="📱"
            />
            <GlassInput
              label="Base Monthly Salary (₹)"
              value={monthlySalary}
              onChangeText={setMonthlySalary}
              keyboardType="numeric"
              icon="💼"
            />
          </View>
        ) : (
          <View style={styles.overview}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Full Name</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{user?.name}</Text>
            </View>
            <View style={[styles.infoRow, styles.dividerRow]}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Mobile Number</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{user?.mobile || 'Not set'}</Text>
            </View>
            <View style={[styles.infoRow, styles.dividerRow]}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Configured Salary</Text>
              <Text style={[styles.infoValue, { color: theme.semantic.income, fontWeight: '700' }]}>
                {formatINR(user?.monthly_salary || 1500000)} / mo
              </Text>
            </View>
          </View>
        )}
      </GlassCard>

      {/* Quick Access to Appearance & Personalization */}
      <TouchableOpacity onPress={onNavigatePersonalization}>
        <GlassCard style={styles.navRowCard}>
          <View style={styles.navRowLeft}>
            <Text style={styles.navIcon}>🎨</Text>
            <View>
              <Text style={[styles.navTitle, { color: theme.text }]}>
                Appearance & UI Customization
              </Text>
              <Text style={[styles.navSubtitle, { color: theme.textSecondary }]}>
                Theme, accent palette, glassmorphism, widget order
              </Text>
            </View>
          </View>
          <Text style={[styles.arrow, { color: theme.accent }]}>→</Text>
        </GlassCard>
      </TouchableOpacity>

      {/* Active Sessions */}
      <GlassCard style={styles.sessionsCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Active Sessions ({sessions.filter((s) => !s.is_revoked).length})
          </Text>
          <TouchableOpacity onPress={loadSessions}>
            <Text style={[styles.refreshText, { color: theme.accent }]}>↻</Text>
          </TouchableOpacity>
        </View>

        {sessions.map((ses) => (
          <View
            key={ses.id}
            style={[
              styles.sessionItem,
              { borderBottomColor: theme.glassBorder },
            ]}
          >
            <View style={styles.sessionLeft}>
              <Text style={styles.sessionDeviceIcon}>📱</Text>
              <View>
                <Text style={[styles.sessionDevice, { color: theme.text }]}>
                  {ses.device_info || 'Mobile Client'}
                </Text>
                <Text style={[styles.sessionIp, { color: theme.textMuted }]}>
                  IP: {ses.ip_address} • {ses.is_revoked ? 'Revoked' : 'Active'}
                </Text>
              </View>
            </View>
            {!ses.is_revoked && (
              <TouchableOpacity
                onPress={() => handleRevokeSession(ses.id)}
                style={styles.revokeBtn}
              >
                <Text style={[styles.revokeBtnText, { color: theme.semantic.expense }]}>
                  Revoke
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </GlassCard>

      {/* Action Buttons */}
      <GlassButton
        title="Sign Out"
        onPress={logout}
        variant="secondary"
        size="lg"
        style={styles.logoutBtn}
      />

      <GlassButton
        title="Terminate All Other Sessions"
        onPress={handleLogoutAll}
        variant="outline"
        size="md"
        style={styles.logoutAllBtn}
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
  profileCard: {
    padding: 20,
    marginBottom: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarEmoji: {
    fontSize: 34,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  currencyBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  currencyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dateBadge: {
    fontSize: 11,
  },
  avatarPickerRow: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  avatarsList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  avatarChoice: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceEmoji: {
    fontSize: 18,
  },
  detailsCard: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  overview: {
    paddingVertical: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  dividerRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    paddingTop: 4,
  },
  navRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 16,
  },
  navRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  navIcon: {
    fontSize: 24,
    marginRight: 14,
  },
  navTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  navSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  arrow: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  sessionsCard: {
    marginBottom: 24,
  },
  refreshText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sessionDeviceIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  sessionDevice: {
    fontSize: 14,
    fontWeight: '600',
  },
  sessionIp: {
    fontSize: 11,
    marginTop: 2,
  },
  revokeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  revokeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  logoutBtn: {
    marginBottom: 12,
  },
  logoutAllBtn: {
    marginBottom: 30,
  },
});

