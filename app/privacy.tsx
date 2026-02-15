import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../src/theme';

export default function PrivacyScreen() {
  const router = useRouter();

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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Draft Notice - Top */}
        <View style={styles.draftNotice}>
          <Text style={styles.draftText}>[DRAFT - To be reviewed by legal counsel]</Text>
        </View>

        <Text style={styles.lastUpdated}>Last Updated: February 14, 2026</Text>

        <Text style={styles.intro}>
          Maslow respects your privacy. This Privacy Policy explains how we collect, use, protect, and share your personal information.
        </Text>

        {/* 1. INFORMATION WE COLLECT */}
        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          We collect information you provide directly and information about how you use Maslow:
        </Text>

        <Text style={styles.subTitle}>Account Information:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Name (first and last)</Text>
          <Text style={styles.bullet}>• Email address</Text>
          <Text style={styles.bullet}>• Phone number</Text>
          <Text style={styles.bullet}>• Date of birth</Text>
          <Text style={styles.bullet}>• Profile photo (optional)</Text>
          <Text style={styles.bullet}>• Bio/notes (optional)</Text>
          <Text style={styles.bullet}>• Member number</Text>
        </View>

        <Text style={styles.subTitle}>Payment Information:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Credit card details (stored securely by Stripe)</Text>
          <Text style={styles.bullet}>• Billing address</Text>
          <Text style={styles.bullet}>• Payment history</Text>
          <Text style={styles.bullet}>• Credit balance and transactions</Text>
        </View>

        <Text style={styles.subTitle}>Usage Information:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Booking history (which locations, when, how long)</Text>
          <Text style={styles.bullet}>• Suite preferences (temperature, lighting, amenities)</Text>
          <Text style={styles.bullet}>• Product preferences</Text>
          <Text style={styles.bullet}>• Check-in and check-out times</Text>
          <Text style={styles.bullet}>• Credits purchased and used</Text>
        </View>

        <Text style={styles.subTitle}>Technical Information:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• IP address</Text>
          <Text style={styles.bullet}>• Device type and operating system</Text>
          <Text style={styles.bullet}>• App version</Text>
          <Text style={styles.bullet}>• Browser type (for web)</Text>
          <Text style={styles.bullet}>• Usage analytics (pages viewed, features used)</Text>
        </View>

        <Text style={styles.subTitle}>Location Information:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Which Maslow location you visit</Text>
          <Text style={styles.bulletHighlight}>• We do NOT track your GPS location outside our facilities</Text>
        </View>

        {/* 2. HOW WE USE YOUR INFORMATION */}
        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          We use your information to:
        </Text>

        <Text style={styles.subTitle}>Provide Services:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Process your bookings and payments</Text>
          <Text style={styles.bullet}>• Manage your membership and credits</Text>
          <Text style={styles.bullet}>• Remember your preferences for a personalized experience</Text>
          <Text style={styles.bullet}>• Send booking confirmations and receipts</Text>
          <Text style={styles.bullet}>• Communicate about your account</Text>
        </View>

        <Text style={styles.subTitle}>Improve Services:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Analyze usage patterns to improve features</Text>
          <Text style={styles.bullet}>• Understand which amenities are most popular</Text>
          <Text style={styles.bullet}>• Optimize suite availability and scheduling</Text>
          <Text style={styles.bullet}>• Fix bugs and technical issues</Text>
        </View>

        <Text style={styles.subTitle}>Communication:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Send important account updates</Text>
          <Text style={styles.bullet}>• Notify you of new features or locations</Text>
          <Text style={styles.bullet}>• Send promotional offers (you can opt out)</Text>
          <Text style={styles.bullet}>• Respond to your support requests</Text>
        </View>

        <Text style={styles.subTitle}>Safety & Security:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Prevent fraud and unauthorized access</Text>
          <Text style={styles.bullet}>• Investigate incidents or policy violations</Text>
          <Text style={styles.bullet}>• Monitor common areas via surveillance (not suite interiors)</Text>
          <Text style={styles.bullet}>• Comply with legal obligations</Text>
        </View>

        {/* 3. HOW WE SHARE YOUR INFORMATION */}
        <Text style={styles.sectionTitle}>3. How We Share Your Information</Text>
        <View style={styles.importantNotice}>
          <Text style={styles.importantText}>We Do NOT Sell Your Data.</Text>
        </View>
        <Text style={styles.paragraph}>
          We share your information only in these limited situations:
        </Text>

        <Text style={styles.subTitle}>Service Providers:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Payment processing: Stripe (credit card processing)</Text>
          <Text style={styles.bullet}>• Cloud hosting: Supabase (database), Vercel (website/app hosting)</Text>
          <Text style={styles.bullet}>• Email service: SendGrid or similar (transactional emails)</Text>
          <Text style={styles.bullet}>• Analytics: Basic usage analytics</Text>
        </View>
        <Text style={styles.paragraphSmall}>
          These providers are contractually required to protect your data and use it only for providing services to us.
        </Text>

        <Text style={styles.subTitle}>Legal Requirements:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• To comply with valid legal requests (subpoenas, court orders)</Text>
          <Text style={styles.bullet}>• To protect our rights and property</Text>
          <Text style={styles.bullet}>• To prevent fraud or illegal activity</Text>
          <Text style={styles.bullet}>• In connection with a business sale or merger</Text>
        </View>

        <Text style={styles.subTitle}>With Your Consent:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• When you explicitly authorize us to share information</Text>
          <Text style={styles.bullet}>• When you connect third-party services</Text>
        </View>

        <Text style={styles.subTitle}>We do NOT share your information with:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletNotShared}>• Advertisers</Text>
          <Text style={styles.bulletNotShared}>• Data brokers</Text>
          <Text style={styles.bulletNotShared}>• Marketing companies</Text>
          <Text style={styles.bulletNotShared}>• Social media platforms (unless you explicitly connect them)</Text>
        </View>

        {/* 4. DATA SECURITY */}
        <Text style={styles.sectionTitle}>4. Data Security</Text>
        <Text style={styles.paragraph}>
          We take security seriously:
        </Text>

        <Text style={styles.subTitle}>Encryption:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• All data transmitted via HTTPS (encrypted in transit)</Text>
          <Text style={styles.bullet}>• Passwords are hashed and never stored in plain text</Text>
          <Text style={styles.bullet}>• Payment info encrypted by Stripe (PCI-DSS compliant)</Text>
          <Text style={styles.bullet}>• Database secured with encryption at rest</Text>
        </View>

        <Text style={styles.subTitle}>Access Controls:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Only authorized personnel can access your data</Text>
          <Text style={styles.bullet}>• Role-based access (staff only see what they need)</Text>
          <Text style={styles.bullet}>• Regular security audits and updates</Text>
          <Text style={styles.bullet}>• Two-factor authentication for admin accounts</Text>
        </View>

        <Text style={styles.subTitle}>Physical Security:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Surveillance in common areas (not suite interiors)</Text>
          <Text style={styles.bullet}>• Secure facilities with controlled access</Text>
          <Text style={styles.bullet}>• Regular security patrols</Text>
        </View>

        <Text style={styles.paragraphSmall}>
          However, no system is 100% secure. We cannot guarantee absolute security, but we use industry-standard practices to protect your information.
        </Text>

        {/* 5. YOUR PRIVACY RIGHTS */}
        <Text style={styles.sectionTitle}>5. Your Privacy Rights</Text>
        <Text style={styles.paragraph}>
          You have the following rights regarding your data:
        </Text>

        <Text style={styles.subTitle}>Access Your Data:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Request a copy of all data we have about you</Text>
          <Text style={styles.bullet}>• Review your account information anytime in the app</Text>
        </View>

        <Text style={styles.subTitle}>Correct Your Data:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Update your profile information in Edit Profile</Text>
          <Text style={styles.bullet}>• Contact us to correct inaccurate data</Text>
        </View>

        <Text style={styles.subTitle}>Delete Your Data:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Delete your account via Settings</Text>
          <Text style={styles.bullet}>• We permanently delete your data within 30 days</Text>
          <Text style={styles.bullet}>• Some data retained for legal/financial compliance (7 years for tax records)</Text>
        </View>

        <Text style={styles.subTitle}>Export Your Data:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Request a machine-readable export of your data</Text>
          <Text style={styles.bullet}>• Receive it via email within 7 business days</Text>
        </View>

        <Text style={styles.subTitle}>Opt Out:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Unsubscribe from marketing emails (link in every email)</Text>
          <Text style={styles.bullet}>• Disable push notifications in your phone settings</Text>
          <Text style={styles.bullet}>• You cannot opt out of transactional emails (booking confirmations, receipts)</Text>
        </View>

        <Text style={styles.subTitle}>To Exercise Your Rights:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Email: support@maslownyc.com</Text>
          <Text style={styles.bullet}>• Subject: "Privacy Request - [Your Request]"</Text>
          <Text style={styles.bullet}>• We respond within 10 business days</Text>
        </View>

        {/* 6. COOKIES & TRACKING */}
        <Text style={styles.sectionTitle}>6. Cookies & Tracking</Text>
        <Text style={styles.paragraph}>
          What we use:
        </Text>

        <Text style={styles.subTitle}>Essential Cookies:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Session management (keep you logged in)</Text>
          <Text style={styles.bullet}>• Security and fraud prevention</Text>
          <Text style={styles.bullet}>• Remember your language and preferences</Text>
        </View>

        <Text style={styles.subTitle}>Analytics Cookies:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Basic usage statistics (pages viewed, features used)</Text>
          <Text style={styles.bullet}>• Help us understand how to improve the app</Text>
          <Text style={styles.bullet}>• No personal identification in analytics</Text>
        </View>

        <Text style={styles.subTitle}>We Do NOT Use:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletNotShared}>• Third-party advertising cookies</Text>
          <Text style={styles.bulletNotShared}>• Cross-site tracking</Text>
          <Text style={styles.bulletNotShared}>• Social media tracking pixels</Text>
        </View>

        <Text style={styles.subTitle}>Your Control:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• You can disable cookies in browser settings</Text>
          <Text style={styles.bullet}>• Disabling cookies may break some functionality</Text>
          <Text style={styles.bullet}>• Mobile app uses device identifiers (can reset in phone settings)</Text>
        </View>

        {/* 7. CHILDREN'S PRIVACY */}
        <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
        <Text style={styles.paragraph}>
          Maslow is not for children:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Service is 18+ years only (or 16+ with parental consent - under review)</Text>
          <Text style={styles.bullet}>• We do not knowingly collect data from children under 13</Text>
          <Text style={styles.bullet}>• If we discover we have data from a child under 13, we delete it immediately</Text>
          <Text style={styles.bullet}>• Parents: contact us if you believe your child provided information</Text>
        </View>

        {/* 8. DATA RETENTION */}
        <Text style={styles.sectionTitle}>8. Data Retention</Text>
        <Text style={styles.paragraph}>
          How long we keep your data:
        </Text>

        <Text style={styles.subTitle}>Active Members:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• We keep your data while your account is active</Text>
          <Text style={styles.bullet}>• You can delete your account anytime</Text>
        </View>

        <Text style={styles.subTitle}>After Account Deletion:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Personal data deleted within 30 days</Text>
          <Text style={styles.bullet}>• Some data retained for legal compliance:</Text>
        </View>
        <View style={styles.indentedList}>
          <Text style={styles.bulletIndented}>- Financial records: 7 years (tax/IRS requirements)</Text>
          <Text style={styles.bulletIndented}>- Fraud/dispute records: 3 years</Text>
          <Text style={styles.bulletIndented}>- Anonymized analytics: indefinitely (no personal identifiers)</Text>
        </View>

        <Text style={styles.subTitle}>Backup Retention:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Backups may retain data for up to 90 days</Text>
          <Text style={styles.bullet}>• Then permanently deleted from all systems</Text>
        </View>

        {/* 9. THIRD-PARTY SERVICES */}
        <Text style={styles.sectionTitle}>9. Third-Party Services</Text>
        <Text style={styles.paragraph}>
          Our App Includes:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Stripe (payment processing) - see Stripe's Privacy Policy</Text>
          <Text style={styles.bullet}>• Supabase (database hosting) - see Supabase's Privacy Policy</Text>
          <Text style={styles.bullet}>• Expo (app platform) - see Expo's Privacy Policy</Text>
        </View>
        <Text style={styles.paragraphSmall}>
          We're not responsible for third-party privacy practices. Review their policies independently.
        </Text>

        <Text style={styles.subTitle}>External Links:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Our app may link to third-party websites</Text>
          <Text style={styles.bullet}>• We're not responsible for their privacy practices</Text>
          <Text style={styles.bullet}>• Their policies apply when you visit them</Text>
        </View>

        {/* 10. INTERNATIONAL USERS */}
        <Text style={styles.sectionTitle}>10. International Users</Text>
        <Text style={styles.paragraph}>
          Maslow operates in the United States:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Your data is stored on U.S. servers</Text>
          <Text style={styles.bullet}>• U.S. privacy laws apply</Text>
          <Text style={styles.bullet}>• If you're outside the U.S., your data is transferred to the U.S.</Text>
          <Text style={styles.bullet}>• By using Maslow, you consent to this transfer</Text>
        </View>

        <Text style={styles.subTitle}>For EU/UK Users:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• We comply with GDPR where applicable</Text>
          <Text style={styles.bullet}>• You have additional rights under GDPR</Text>
          <Text style={styles.bullet}>• Contact us for GDPR-specific requests</Text>
        </View>

        {/* 11. CHANGES TO THIS POLICY */}
        <Text style={styles.sectionTitle}>11. Changes to This Policy</Text>
        <Text style={styles.paragraph}>
          We may update this Privacy Policy:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• We'll notify you of material changes via email</Text>
          <Text style={styles.bullet}>• "Last Updated" date will change at the top</Text>
          <Text style={styles.bullet}>• Continued use after changes = acceptance</Text>
          <Text style={styles.bullet}>• You can always review the current policy in the app</Text>
        </View>

        {/* 12. CONTACT US */}
        <Text style={styles.sectionTitle}>12. Contact Us</Text>
        <Text style={styles.paragraph}>
          Questions about privacy?
        </Text>
        <Text style={styles.contactInfo}>Email: support@maslownyc.com</Text>
        <Text style={styles.contactInfo}>Privacy concerns: patrick@maslownyc.com</Text>
        <Text style={styles.contactInfo}>Mail: Maslow LLC, 456 7th Ave #2, Brooklyn, NY 11215</Text>
        <Text style={styles.paragraphSmall}>
          We respond to privacy inquiries within 10 business days.
        </Text>

        {/* Draft Notice - Bottom */}
        <View style={styles.draftNotice}>
          <Text style={styles.draftText}>[DRAFT - To be reviewed by legal counsel]</Text>
        </View>

        <Text style={styles.acknowledgment}>
          By using Maslow, you acknowledge that you have read and understood this Privacy Policy.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.navy,
  },
  headerSpacer: {
    width: 60,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  lastUpdated: {
    fontSize: 13,
    color: colors.darkGray,
    marginBottom: spacing.md,
  },
  intro: {
    fontSize: 15,
    color: '#1A1A1A',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navy,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  subTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.navy,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  paragraph: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  paragraphSmall: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  bulletList: {
    marginLeft: spacing.sm,
    marginBottom: spacing.sm,
  },
  bullet: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 24,
    marginBottom: 4,
  },
  bulletHighlight: {
    fontSize: 14,
    color: colors.navy,
    lineHeight: 24,
    marginBottom: 4,
    fontWeight: '600',
  },
  bulletNotShared: {
    fontSize: 14,
    color: '#DC2626',
    lineHeight: 24,
    marginBottom: 4,
  },
  indentedList: {
    marginLeft: spacing.lg,
    marginBottom: spacing.sm,
  },
  bulletIndented: {
    fontSize: 13,
    color: '#1A1A1A',
    lineHeight: 22,
    marginBottom: 4,
  },
  importantNotice: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  importantText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#059669',
  },
  contactInfo: {
    fontSize: 14,
    color: colors.navy,
    marginBottom: 6,
  },
  draftNotice: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    alignItems: 'center',
  },
  draftText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
  acknowledgment: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 22,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
});
