import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors, spacing, shadows } from '../theme';

interface QRCodeCardProps {
  userName: string;
  memberSince?: string;
  memberTier: 'guest' | 'founding' | 'architect' | 'sovereign';
  qrValue: string;
  credits?: number;
  visits?: number;
  isActive?: boolean;
}

const tierLabels: Record<string, string> = {
  guest: 'GUEST',
  founding: 'FOUNDING MEMBER',
  architect: 'ARCHITECT',
  sovereign: 'SOVEREIGN',
};

export const QRCodeCard: React.FC<QRCodeCardProps> = ({
  userName,
  memberSince = 'Jan 2026',
  memberTier,
  qrValue,
  credits = 10,
  visits = 3,
  isActive = false,
}) => {
  return (
    <View style={styles.card}>
      {/* Tier Badge */}
      <View style={styles.tierBadge}>
        <Text style={styles.tierText}>{tierLabels[memberTier]}</Text>
      </View>

      {/* Member Name */}
      <Text style={styles.userName}>{userName}</Text>
      <Text style={styles.memberSince}>Member since {memberSince}</Text>

      {/* QR Code */}
      <View style={styles.qrWrapper}>
        <View style={styles.qrContainer}>
          <QRCode
            value={qrValue}
            size={160}
            backgroundColor={colors.white}
            color={colors.navy}
          />
        </View>
        <Text style={styles.qrCaption}>Scan to enter</Text>
      </View>

      {/* Active indicator */}
      {isActive && (
        <View style={styles.activeIndicator}>
          <View style={styles.activeDot} />
          <Text style={styles.activeText}>SESSION ACTIVE</Text>
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{credits}</Text>
          <Text style={styles.statLabel}>CREDITS</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{visits}</Text>
          <Text style={styles.statLabel}>VISITS</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.card,
  },
  tierBadge: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 16,
    marginBottom: spacing.md,
  },
  tierText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.white,
    letterSpacing: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.black,
    marginBottom: spacing.xs,
  },
  memberSince: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: spacing.lg,
  },
  qrWrapper: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  qrContainer: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
    marginBottom: spacing.sm,
  },
  qrCaption: {
    fontSize: 13,
    color: colors.darkGray,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success}15`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    marginBottom: spacing.md,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: spacing.sm,
  },
  activeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success,
    letterSpacing: 0.5,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.lightGray,
    marginVertical: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.darkGray,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.lightGray,
  },
});
