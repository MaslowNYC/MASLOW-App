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

export default function TermsScreen() {
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
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
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
          Welcome to Maslow. By creating an account and using our services, you agree to these Terms & Conditions.
        </Text>

        {/* 1. ACCEPTANCE OF TERMS */}
        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By creating a Maslow account, you confirm that:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• You have read and agree to these Terms & Conditions</Text>
          <Text style={styles.bullet}>• You are at least 18 years of age</Text>
          <Text style={styles.bullet}>• You will comply with all applicable laws and regulations</Text>
          <Text style={styles.bullet}>• You provide accurate and complete information</Text>
        </View>
        <Text style={styles.paragraph}>
          We may update these terms from time to time. We'll notify you of material changes via email. Continued use of Maslow after changes constitutes acceptance of the updated terms.
        </Text>

        {/* 2. AGE RESTRICTIONS */}
        <Text style={styles.sectionTitle}>2. Age Restrictions & Minor Access</Text>
        <View style={styles.legalNotice}>
          <Text style={styles.legalNoticeText}>[TO BE FINALIZED WITH LEGAL COUNSEL]</Text>
        </View>
        <Text style={styles.subTitle}>Current Policy:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Members must be 18 years or older</Text>
        </View>
        <Text style={styles.subTitle}>Under Consideration:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Members ages 16-17 may use Maslow with explicit parental authorization</Text>
          <Text style={styles.bullet}>• Parent/guardian whose payment method is on file accepts full financial responsibility</Text>
          <Text style={styles.bullet}>• This policy is under legal review and subject to change</Text>
        </View>

        {/* 3. MEMBERSHIP & CREDITS */}
        <Text style={styles.sectionTitle}>3. Membership & Credits</Text>
        <Text style={styles.subTitle}>Membership Tiers:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Different tiers offer different levels of access and benefits</Text>
          <Text style={styles.bullet}>• Tier benefits are subject to change with 30 days notice</Text>
        </View>
        <Text style={styles.subTitle}>Credits:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Credits are pre-paid access to Maslow services</Text>
          <Text style={styles.bullet}>• Credits are non-refundable once purchased</Text>
          <Text style={styles.bullet}>• Credits expire 12 months from purchase date</Text>
          <Text style={styles.bullet}>• Credits cannot be transferred or gifted to other members</Text>
          <Text style={styles.bullet}>• Unused credits are forfeited upon account termination</Text>
        </View>

        {/* 4. LIABILITY FOR DAMAGES */}
        <Text style={styles.sectionTitle}>4. Liability for Damages</Text>
        <Text style={styles.paragraph}>
          You are responsible for the suite during your session. This includes:
        </Text>
        <Text style={styles.subTitle}>Examples of Chargeable Damages:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Broken fixtures, mirrors, or equipment</Text>
          <Text style={styles.bullet}>• Stains on walls, floors, or fixtures</Text>
          <Text style={styles.bullet}>• Burns or melted surfaces (from smoking, candles, etc.)</Text>
          <Text style={styles.bullet}>• Graffiti or permanent markings</Text>
          <Text style={styles.bullet}>• Missing items or accessories</Text>
        </View>
        <Text style={styles.subTitle}>Damage Process:</Text>
        <View style={styles.numberedList}>
          <Text style={styles.numbered}>1. We document damage with photos immediately after your session</Text>
          <Text style={styles.numbered}>2. You receive itemized damage report via email within 24 hours</Text>
          <Text style={styles.numbered}>3. Charges appear on your card on file within 48 hours</Text>
          <Text style={styles.numbered}>4. You have 48 hours to dispute charges with photo evidence</Text>
          <Text style={styles.numbered}>5. Disputes are reviewed by management within 72 hours</Text>
        </View>
        <Text style={styles.subTitle}>Normal Wear & Tear:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Minor scuffs, typical usage marks are not chargeable</Text>
          <Text style={styles.bullet}>• We maintain our facilities regularly at no cost to you</Text>
        </View>

        {/* 5. ACCEPTABLE USE */}
        <Text style={styles.sectionTitle}>5. Acceptable Use Policy</Text>
        <Text style={styles.paragraph}>
          To maintain a safe, clean environment for all members:
        </Text>
        <Text style={styles.allowedTitle}>ALLOWED:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletAllowed}>• Personal hygiene and grooming</Text>
          <Text style={styles.bulletAllowed}>• Privacy for phone calls, video chats, meditation</Text>
          <Text style={styles.bulletAllowed}>• Reasonable use of provided amenities</Text>
          <Text style={styles.bulletAllowed}>• Playing music at reasonable volume</Text>
          <Text style={styles.bulletAllowed}>• Using the space as intended</Text>
        </View>
        <Text style={styles.notAllowedTitle}>NOT ALLOWED:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletNotAllowed}>• Smoking, vaping, or use of tobacco products</Text>
          <Text style={styles.bulletNotAllowed}>• Bringing more guests than your tier permits</Text>
          <Text style={styles.bulletNotAllowed}>• Exceeding your reserved time without authorization</Text>
          <Text style={styles.bulletNotAllowed}>• Illegal activities of any kind</Text>
          <Text style={styles.bulletNotAllowed}>• Commercial photography/videography without written permission</Text>
          <Text style={styles.bulletNotAllowed}>• Damaging or removing property</Text>
          <Text style={styles.bulletNotAllowed}>• Harassment of other members or staff</Text>
          <Text style={styles.bulletNotAllowed}>• Leaving excessive mess requiring deep cleaning</Text>
        </View>
        <Text style={styles.paragraphWarning}>
          Violations may result in immediate session termination, charges to your card, and/or membership suspension.
        </Text>

        {/* 6. FEES & CHARGING */}
        <Text style={styles.sectionTitle}>6. Fees & Charging Authorization</Text>
        <Text style={styles.paragraph}>
          By providing payment information, you authorize Maslow to charge your card on file for:
        </Text>
        <Text style={styles.subTitle}>Automatic Charges:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Membership fees (if applicable)</Text>
          <Text style={styles.bullet}>• Session bookings and credit purchases</Text>
          <Text style={styles.bullet}>• Damage fees (with photo documentation)</Text>
          <Text style={styles.bullet}>• Deep cleaning fees (excessive mess beyond normal use)</Text>
          <Text style={styles.bullet}>• Overtime fees (overstaying reserved time)</Text>
          <Text style={styles.bullet}>• Lost or unreturned access cards ($25)</Text>
          <Text style={styles.bullet}>• Late cancellation fees (within 2 hours of booking)</Text>
        </View>
        <Text style={styles.subTitle}>Receipts & Documentation:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• You receive email receipts for all charges</Text>
          <Text style={styles.bullet}>• Damage charges include photo evidence</Text>
          <Text style={styles.bullet}>• You may dispute charges within 48 hours</Text>
          <Text style={styles.bullet}>• Refunds processed within 5-7 business days if dispute approved</Text>
        </View>

        {/* 7. BOOKING & CANCELLATION */}
        <Text style={styles.sectionTitle}>7. Booking & Cancellation Policy</Text>
        <Text style={styles.subTitle}>Reservations:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Subject to availability</Text>
          <Text style={styles.bullet}>• Confirmed via email and app notification</Text>
          <Text style={styles.bullet}>• Check-in time tolerance: 15 minutes grace period</Text>
          <Text style={styles.bullet}>• No-shows forfeit credit (no refund)</Text>
        </View>
        <Text style={styles.subTitle}>Cancellations:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Free cancellation: 2+ hours before booking</Text>
          <Text style={styles.bullet}>• Late cancellation (under 2 hours): forfeit 50% of credit</Text>
          <Text style={styles.bullet}>• No-show: forfeit 100% of credit</Text>
          <Text style={styles.bullet}>• Emergency exceptions reviewed case-by-case</Text>
        </View>

        {/* 8. SUSPENSION & TERMINATION */}
        <Text style={styles.sectionTitle}>8. Suspension & Termination</Text>
        <Text style={styles.paragraph}>
          We may suspend or terminate your membership for:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Violations of these Terms</Text>
          <Text style={styles.bullet}>• Repeated damages or excessive cleaning needs</Text>
          <Text style={styles.bullet}>• Harassment or threatening behavior</Text>
          <Text style={styles.bullet}>• Fraudulent payment activity</Text>
          <Text style={styles.bullet}>• Illegal activity on premises</Text>
        </View>
        <Text style={styles.subTitle}>Suspension Process:</Text>
        <View style={styles.numberedList}>
          <Text style={styles.numbered}>1. First violation: Warning + explanation</Text>
          <Text style={styles.numbered}>2. Second violation: 30-day suspension</Text>
          <Text style={styles.numbered}>3. Third violation: Permanent termination</Text>
        </View>
        <Text style={styles.subTitle}>Immediate Termination:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Illegal activity</Text>
          <Text style={styles.bullet}>• Violence or threats</Text>
          <Text style={styles.bullet}>• Severe property damage</Text>
          <Text style={styles.bullet}>• Fraud or payment disputes</Text>
        </View>
        <Text style={styles.subTitle}>Upon Termination:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Unused credits are forfeited (no refund)</Text>
          <Text style={styles.bullet}>• Access immediately revoked</Text>
          <Text style={styles.bullet}>• Outstanding charges remain due</Text>
          <Text style={styles.bullet}>• You may appeal termination within 7 days</Text>
        </View>

        {/* 9. PRIVACY & SURVEILLANCE */}
        <Text style={styles.sectionTitle}>9. Privacy & Surveillance</Text>
        <Text style={styles.subTitle}>Your Privacy:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• See our separate Privacy Policy for data handling</Text>
          <Text style={styles.bullet}>• We collect: account info, payment info, usage data, preferences</Text>
        </View>
        <Text style={styles.subTitle}>Video Surveillance:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Common areas and hallways are monitored 24/7</Text>
          <Text style={styles.bulletHighlight}>• Suite interiors are NOT monitored (your privacy is protected)</Text>
          <Text style={styles.bullet}>• Footage retained for 30 days for security purposes</Text>
          <Text style={styles.bullet}>• Footage only reviewed in case of incidents or disputes</Text>
        </View>

        {/* 10. DISCLAIMERS */}
        <Text style={styles.sectionTitle}>10. Disclaimers & Assumption of Risk</Text>
        <Text style={styles.subTitle}>Service "As Is":</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• We provide services in their current state</Text>
          <Text style={styles.bullet}>• We don't guarantee 100% availability (maintenance happens)</Text>
          <Text style={styles.bullet}>• We're not liable for service interruptions</Text>
          <Text style={styles.bullet}>• Features and amenities subject to change</Text>
        </View>
        <Text style={styles.subTitle}>Your Assumption of Risk:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• You use Maslow facilities at your own risk</Text>
          <Text style={styles.bullet}>• We're not liable for slips, falls, or accidents</Text>
          <Text style={styles.bullet}>• We're not liable for lost, stolen, or damaged personal items</Text>
          <Text style={styles.bullet}>• You're responsible for your own safety and belongings</Text>
        </View>
        <Text style={styles.subTitle}>Medical Disclaimer:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Consult your doctor about hot water, steam, or spa features</Text>
          <Text style={styles.bullet}>• We're not liable for medical conditions or reactions</Text>
          <Text style={styles.bullet}>• Notify us of accessibility needs in advance</Text>
        </View>

        {/* 11. INDEMNIFICATION */}
        <Text style={styles.sectionTitle}>11. Indemnification</Text>
        <Text style={styles.paragraph}>
          You agree to defend and hold harmless Maslow, its owners, employees, and contractors from any claims, damages, or expenses (including legal fees) arising from:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Your use of our facilities</Text>
          <Text style={styles.bullet}>• Your violations of these Terms</Text>
          <Text style={styles.bullet}>• Your violations of any laws or regulations</Text>
          <Text style={styles.bullet}>• Damage you cause to property or injury to persons</Text>
          <Text style={styles.bullet}>• Third-party claims related to your conduct</Text>
        </View>

        {/* 12. DISPUTE RESOLUTION */}
        <Text style={styles.sectionTitle}>12. Dispute Resolution</Text>
        <Text style={styles.subTitle}>Mandatory Arbitration:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Disputes must be resolved through binding arbitration</Text>
          <Text style={styles.bullet}>• No class action lawsuits permitted</Text>
          <Text style={styles.bullet}>• Individual arbitration only (American Arbitration Association)</Text>
          <Text style={styles.bullet}>• Arbitration conducted in New York, NY</Text>
          <Text style={styles.bullet}>• Each party pays own legal fees unless arbitrator decides otherwise</Text>
        </View>
        <Text style={styles.subTitle}>Exceptions:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• Small claims court (under $10,000)</Text>
          <Text style={styles.bullet}>• Injunctive relief for urgent matters</Text>
        </View>
        <Text style={styles.subTitle}>Governing Law:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• New York State law governs these Terms</Text>
          <Text style={styles.bullet}>• Venue: New York County, New York</Text>
        </View>

        {/* 13. MISCELLANEOUS */}
        <Text style={styles.sectionTitle}>13. Miscellaneous</Text>
        <Text style={styles.subTitle}>Entire Agreement:</Text>
        <Text style={styles.paragraph}>
          These Terms, Privacy Policy, and any posted policies constitute the complete agreement.
        </Text>
        <Text style={styles.subTitle}>Severability:</Text>
        <Text style={styles.paragraph}>
          If any provision is invalid, the rest remains in effect.
        </Text>
        <Text style={styles.subTitle}>Waiver:</Text>
        <Text style={styles.paragraph}>
          Our failure to enforce any right doesn't waive that right.
        </Text>
        <Text style={styles.subTitle}>Assignment:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bullet}>• You cannot transfer your membership</Text>
          <Text style={styles.bullet}>• We may assign these Terms to a successor company</Text>
        </View>

        {/* CONTACT */}
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Text style={styles.contactInfo}>Questions: support@maslownyc.com</Text>
        <Text style={styles.contactInfo}>Legal: patrick@maslownyc.com</Text>
        <Text style={styles.contactInfo}>Address: 456 7th Ave #2, Brooklyn, NY 11215</Text>

        {/* Draft Notice - Bottom */}
        <View style={styles.draftNotice}>
          <Text style={styles.draftText}>[DRAFT - To be reviewed by legal counsel]</Text>
        </View>

        <Text style={styles.acknowledgment}>
          By creating an account, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.
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
  paragraphWarning: {
    fontSize: 14,
    color: '#B45309',
    lineHeight: 22,
    marginTop: spacing.sm,
    fontWeight: '500',
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
  numberedList: {
    marginLeft: spacing.sm,
    marginBottom: spacing.sm,
  },
  numbered: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 24,
    marginBottom: 4,
  },
  allowedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  bulletAllowed: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 24,
    marginBottom: 4,
  },
  notAllowedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  bulletNotAllowed: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 24,
    marginBottom: 4,
  },
  legalNotice: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  legalNoticeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
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
