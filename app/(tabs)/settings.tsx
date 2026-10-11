import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';
import { useSyncStore } from '../../src/store/sync.store';
import { syncService } from '../../src/services/sync.service';
import { API_BASE_URL } from '../../src/api/client';
import { Colors, Spacing, Typography, BorderRadius } from '../../src/constants/theme';
import { Card } from '../../src/components/common/Card';
import { Button } from '../../src/components/common/Button';
import {
  User,
  Building,
  Server,
  ShieldCheck,
  LogOut,
  Info,
  Database,
  RefreshCw,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const { isOnline, isSyncing, pendingCount, lastSyncTime, syncError } = useSyncStore();

  const handleManualSync = async () => {
    const res = await syncService.syncNow();
    if (res.success) {
      Alert.alert('Sync Completed', `Synced ${res.pushed} pending changes and fetched ${res.pulled} updates.`);
    } else {
      Alert.alert('Sync Status', res.error || 'Sync could not complete.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out? Locally queued offline changes will be safely retained on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const formatLastSync = (iso: string | null) => {
    if (!iso) return 'Never synced';
    const date = new Date(iso);
    return date.toLocaleString();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: Math.max(insets.top, 12) + Spacing.sm },
      ]}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Owner Settings</Text>
        <Text style={styles.headerSubtitle}>Personal pharmacy profile & offline sync</Text>
      </View>

      {/* Offline Synchronization Card */}
      <Text style={styles.sectionHeader}>Offline & Synchronization</Text>
      <Card style={styles.card}>
        <View style={styles.infoRow}>
          <Database size={16} color={Colors.primary} />
          <Text style={styles.infoLabel}>Local Database:</Text>
          <Text style={styles.infoValue}>Expo SQLite (WAL Mode)</Text>
        </View>

        <View style={styles.infoRow}>
          <View style={[styles.statusDot, isOnline ? styles.dotOnline : styles.dotOffline]} />
          <Text style={styles.infoLabel}>Connection:</Text>
          <Text style={styles.infoValue}>{isOnline ? 'Online (Connected)' : 'Offline (Local Only)'}</Text>
        </View>

        <View style={styles.infoRow}>
          <RefreshCw size={16} color={Colors.warning} />
          <Text style={styles.infoLabel}>Pending Changes:</Text>
          <Text style={[styles.infoValue, pendingCount > 0 && { color: Colors.warning, fontWeight: '700' }]}>
            {pendingCount} operations in outbox
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Info size={16} color={Colors.textMuted} />
          <Text style={styles.infoLabel}>Last Sync:</Text>
          <Text style={styles.infoValue}>{formatLastSync(lastSyncTime)}</Text>
        </View>

        {syncError && (
          <Text style={styles.errorText}>Last Error: {syncError}</Text>
        )}

        <Button
          title={isSyncing ? 'Synchronizing...' : 'Sync Now'}
          onPress={handleManualSync}
          variant="secondary"
          disabled={isSyncing || !isOnline}
          icon={isSyncing ? <ActivityIndicator size="small" color={Colors.primary} /> : <RefreshCw size={16} color={Colors.primary} />}
          style={{ marginTop: Spacing.sm }}
        />
      </Card>

      {/* Profile Card */}
      <Text style={styles.sectionHeader}>Pharmacy Profile</Text>
      <Card style={styles.card}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <User size={28} color="#FFFFFF" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'Owner'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'admin@pharmacy.com'}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Building size={16} color={Colors.textMuted} />
          <Text style={styles.infoLabel}>Pharmacy Name:</Text>
          <Text style={styles.infoValue}>{user?.pharmacyName || 'Personal Pharmacy'}</Text>
        </View>

        <View style={styles.infoRow}>
          <ShieldCheck size={16} color={Colors.textMuted} />
          <Text style={styles.infoLabel}>Role:</Text>
          <Text style={styles.infoValue}>Single Owner (Admin)</Text>
        </View>
      </Card>

      {/* Backend & Environment Card */}
      <Text style={styles.sectionHeader}>System Connection</Text>
      <Card style={styles.card}>
        <View style={styles.infoRow}>
          <Server size={16} color={Colors.primary} />
          <Text style={styles.infoLabel}>API Server:</Text>
        </View>
        <Text style={styles.apiUrlText}>{API_BASE_URL}</Text>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Info size={16} color={Colors.accent} />
          <Text style={styles.infoLabel}>Architecture:</Text>
          <Text style={styles.infoValue}>NestJS + Prisma + MongoDB</Text>
        </View>
      </Card>

      {/* App Notice */}
      <Card style={styles.infoCard}>
        <Text style={styles.noticeTitle}>Personal Inventory Rules</Text>
        <Text style={styles.noticeBody}>
          • Only 3 fields are mandatory: Name, Selling Price, Quantity.{'\n'}
          • Cart is strictly a price calculator and never modifies stock.{'\n'}
          • Offline changes persist locally and auto-sync when online.
        </Text>
      </Card>

      {/* Sign Out Button */}
      <Button
        title="Sign Out"
        onPress={handleLogout}
        variant="danger"
        icon={<LogOut size={16} color="#FFFFFF" />}
        style={styles.logoutButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  card: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  profileEmail: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.sm,
  },
  sectionHeader: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    marginVertical: Spacing.xs,
  },
  infoLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginLeft: 'auto',
  },
  apiUrlText: {
    fontSize: Typography.xs - 1,
    color: Colors.primaryDark,
    backgroundColor: Colors.primaryLight,
    padding: Spacing.xs + 2,
    borderRadius: BorderRadius.sm,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  noticeTitle: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  noticeBody: {
    fontSize: Typography.xs - 1,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  logoutButton: {
    width: '100%',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOnline: {
    backgroundColor: '#10B981',
  },
  dotOffline: {
    backgroundColor: '#F59E0B',
  },
  errorText: {
    fontSize: Typography.xs - 1,
    color: Colors.danger,
    marginTop: 4,
  },
});
