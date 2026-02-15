import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { colors, spacing } from '../src/theme';
import { MaslowCard } from '../src/components';
import { useHaptics } from '../src/hooks/useHaptics';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  showChevron?: boolean;
  danger?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  label,
  onPress,
  showChevron = true,
  danger = false,
}) => {
  const haptics = useHaptics();

  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={() => {
        haptics.light();
        onPress();
      }}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <Ionicons
          name={icon}
          size={20}
          color={danger ? colors.error : colors.darkGray}
        />
        <Text style={[styles.menuItemLabel, danger && styles.menuItemDanger]}>
          {label}
        </Text>
      </View>
      {showChevron && (
        <Ionicons name="chevron-forward" size={18} color={colors.darkGray} />
      )}
    </TouchableOpacity>
  );
};

export default function SettingsScreen() {
  const router = useRouter();
  const haptics = useHaptics();

  const handleNavigate = (screen: string) => {
    haptics.light();
    console.log(`Navigate to: ${screen}`);
    // TODO: Implement navigation to respective screens
  };

  const handleSignOut = () => {
    haptics.warning();
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.navy} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <MaslowCard padding="sm">
            <MenuItem
              icon="card-outline"
              label="Payment Methods"
              onPress={() => handleNavigate('payment')}
            />
          </MaslowCard>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <MaslowCard padding="sm">
            <MenuItem
              icon="notifications-outline"
              label="Notifications"
              onPress={() => handleNavigate('notifications')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="shield-outline"
              label="Privacy Settings"
              onPress={() => handleNavigate('privacy-settings')}
            />
          </MaslowCard>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <MaslowCard padding="sm">
            <MenuItem
              icon="help-circle-outline"
              label="Help Center"
              onPress={() => handleNavigate('help')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="chatbubble-outline"
              label="Contact Support"
              onPress={() => handleNavigate('support')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="document-text-outline"
              label="Terms & Conditions"
              onPress={() => router.push('/terms')}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="lock-closed-outline"
              label="Privacy Policy"
              onPress={() => router.push('/privacy')}
            />
          </MaslowCard>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <MaslowCard padding="sm">
            <MenuItem
              icon="log-out-outline"
              label="Sign Out"
              onPress={handleSignOut}
              showChevron={false}
              danger
            />
          </MaslowCard>
        </View>

        {/* Version */}
        <Text style={styles.version}>Maslow v2.1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  backText: {
    fontSize: 16,
    color: colors.navy,
    marginLeft: spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.navy,
  },
  headerSpacer: {
    width: 70, // Balance the back button width
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },

  // Sections
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.darkGray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },

  // Menu Items
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemLabel: {
    fontSize: 16,
    color: colors.navy,
    marginLeft: spacing.md,
  },
  menuItemDanger: {
    color: colors.error,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginHorizontal: spacing.md,
  },

  // Version
  version: {
    fontSize: 12,
    color: colors.darkGray,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
