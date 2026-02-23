import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../src/theme';
import { MaslowButton } from '../../src/components';
import { useHaptics } from '../../src/hooks/useHaptics';
import { supabase } from '../../lib/supabase';

interface Recipient {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  member_number: number;
}

export default function TransferCreditsScreen() {
  const router = useRouter();
  const haptics = useHaptics();

  const [recipientInput, setRecipientInput] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);

  useEffect(() => {
    fetchUserAndBalance();
  }, []);

  // Refresh balance when screen comes into focus (e.g., returning from Buy Credits)
  useFocusEffect(
    useCallback(() => {
      fetchUserAndBalance();
    }, [])
  );

  const fetchUserAndBalance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.back();
        return;
      }
      setUserId(user.id);

      // Get user's credit balance from profiles.credits column
      const { data: profileData } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      const totalCredits = profileData?.credits || 0;
      setUserBalance(totalCredits);
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setLoadingBalance(false);
    }
  };

  const findRecipient = async (input: string): Promise<Recipient | null> => {
    const trimmedInput = input.trim().toLowerCase();

    // Try to find by email first
    let { data } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, member_number')
      .eq('email', trimmedInput)
      .single();

    // If not found by email, try member number (remove # if present)
    if (!data) {
      const memberNum = trimmedInput.replace('#', '');
      if (!isNaN(Number(memberNum))) {
        const result = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name, member_number')
          .eq('member_number', Number(memberNum))
          .single();
        data = result.data;
      }
    }

    return data;
  };

  const handleTransfer = async () => {
    if (!recipientInput.trim()) {
      haptics.error();
      Alert.alert('Missing Recipient', 'Please enter an email or member number');
      return;
    }

    if (!amount.trim()) {
      haptics.error();
      Alert.alert('Missing Amount', 'Please enter the number of credits to transfer');
      return;
    }

    const transferAmount = Number(amount);

    if (isNaN(transferAmount) || transferAmount <= 0) {
      haptics.error();
      Alert.alert('Invalid Amount', 'Please enter a valid number greater than 0');
      return;
    }

    if (!Number.isInteger(transferAmount)) {
      haptics.error();
      Alert.alert('Invalid Amount', 'Credits must be a whole number');
      return;
    }

    if (transferAmount > userBalance) {
      haptics.error();
      Alert.alert(
        'Insufficient Credits',
        `You only have ${userBalance} credits available. Please enter a smaller amount.`
      );
      return;
    }

    setLoading(true);
    haptics.light();

    try {
      // Find recipient
      const recipient = await findRecipient(recipientInput);

      if (!recipient) {
        haptics.error();
        Alert.alert(
          'Member Not Found',
          'Could not find a member with that email or member number. Please check and try again.'
        );
        setLoading(false);
        return;
      }

      if (recipient.id === userId) {
        haptics.error();
        Alert.alert('Invalid Transfer', 'You cannot transfer credits to yourself');
        setLoading(false);
        return;
      }

      // Confirm transfer
      Alert.alert(
        'Confirm Transfer',
        `Transfer ${transferAmount} credit${transferAmount > 1 ? 's' : ''} to ${recipient.first_name} ${recipient.last_name}?\n\nThis action cannot be undone.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setLoading(false)
          },
          {
            text: 'Transfer',
            style: 'default',
            onPress: () => executeTransfer(recipient, transferAmount),
          },
        ]
      );
    } catch (error) {
      console.error('Transfer error:', error);
      haptics.error();
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const executeTransfer = async (recipient: Recipient, transferAmount: number) => {
    try {
      // Create a credit transfer record and update balances
      // For now, we'll insert a transfer record - the actual balance update
      // would typically be handled by a database function or edge function

      const { error: transferError } = await supabase
        .from('credit_transfers')
        .insert({
          from_user_id: userId,
          to_user_id: recipient.id,
          amount: transferAmount,
          message: message.trim() || null,
          status: 'completed',
        });

      if (transferError) {
        // If table doesn't exist, show coming soon message
        if (transferError.code === '42P01') {
          haptics.warning();
          Alert.alert(
            'Coming Soon',
            'Credit transfers will be available in a future update.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
          return;
        }
        throw transferError;
      }

      // Update local balance
      setUserBalance(prev => prev - transferAmount);

      haptics.success();
      Alert.alert(
        'Transfer Complete!',
        `${transferAmount} credit${transferAmount > 1 ? 's' : ''} sent to ${recipient.first_name} ${recipient.last_name}`,
        [{ text: 'Done', onPress: () => router.back() }]
      );

    } catch (error) {
      console.error('Execute transfer error:', error);
      haptics.error();
      Alert.alert(
        'Transfer Failed',
        'Failed to complete the transfer. Your credits have not been deducted. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (text: string) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, '');
    setAmount(numericText);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                haptics.light();
                router.back();
              }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={colors.navy} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Transfer Credits</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Balance Display */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Your Balance</Text>
            {loadingBalance ? (
              <ActivityIndicator size="small" color={colors.navy} />
            ) : (
              <Text style={styles.balanceAmount}>
                {userBalance} <Text style={styles.balanceUnit}>credits</Text>
              </Text>
            )}
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Recipient Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>SEND TO</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={colors.darkGray} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email or Member Number (e.g. #00042)"
                  placeholderTextColor={colors.lightGray}
                  value={recipientInput}
                  onChangeText={setRecipientInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>AMOUNT</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="wallet-outline" size={20} color={colors.darkGray} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Number of credits"
                  placeholderTextColor={colors.lightGray}
                  value={amount}
                  onChangeText={handleAmountChange}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
              {amount && Number(amount) > userBalance && (
                <Text style={styles.errorText}>
                  Exceeds your balance of {userBalance} credits
                </Text>
              )}
            </View>

            {/* Message Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MESSAGE (OPTIONAL)</Text>
              <View style={[styles.inputContainer, styles.messageContainer]}>
                <TextInput
                  style={[styles.input, styles.messageInput]}
                  placeholder="Add a note..."
                  placeholderTextColor={colors.lightGray}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  maxLength={200}
                />
              </View>
              <Text style={styles.charCount}>{message.length}/200</Text>
            </View>
          </View>

          {/* Transfer Button */}
          <View style={styles.buttonContainer}>
            <MaslowButton
              onPress={handleTransfer}
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading || !recipientInput.trim() || !amount.trim() || Number(amount) > userBalance}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="send" size={20} color={colors.cream} style={styles.buttonIcon} />
                <Text style={styles.buttonText}>
                  {loading ? 'Transferring...' : 'Transfer Credits'}
                </Text>
              </View>
            </MaslowButton>
          </View>

          {/* Security Note */}
          <View style={styles.securityNote}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.darkGray} />
            <Text style={styles.securityText}>
              Transfers are instant and cannot be reversed. Please verify the recipient before confirming.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.navy,
  },
  headerSpacer: {
    width: 40,
  },

  // Balance Card
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.darkGray,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.navy,
  },
  balanceUnit: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.darkGray,
  },

  // Form
  form: {
    marginBottom: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.darkGray,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.navy,
    paddingVertical: 16,
  },
  messageContainer: {
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  messageInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: spacing.sm,
  },
  charCount: {
    fontSize: 12,
    color: colors.lightGray,
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    marginTop: 6,
  },

  // Button
  buttonContainer: {
    marginBottom: spacing.lg,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.cream,
  },

  // Security Note
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${colors.navy}08`,
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    color: colors.darkGray,
    lineHeight: 18,
  },
});
