import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHaptics } from '../hooks/useHaptics';
import {
  sendMessage,
  loadConversationHistory,
  ChatMessage,
  ConciergeResponse,
} from '../services/conciergeAI';
import { checkRateLimit, RateLimitStatus } from '../utils/rateLimiter';

const COLORS = {
  blue: '#286ABC',
  cream: '#FAF4ED',
  white: '#FFFFFF',
  gold: '#C5A059',
  darkGray: '#4A5568',
  lightGray: '#E2E8F0',
  red: '#E53E3E',
  navy: '#1A365D',
};

const MAX_CHARS = 500;
const DAILY_LIMIT = 10;

interface ConciergeChatProps {
  userId: string;
  onClose: () => void;
}

export function ConciergeChat({ userId, onClose }: ConciergeChatProps) {
  const haptics = useHaptics();
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [budgetExceeded, setBudgetExceeded] = useState(false);

  // Load conversation history and check rate limits on mount
  useEffect(() => {
    loadInitialData();
  }, [userId]);

  const loadInitialData = async () => {
    try {
      const [history, rateStatus] = await Promise.all([
        loadConversationHistory(userId),
        checkRateLimit(userId),
      ]);
      setMessages(history);
      setRateLimitStatus(rateStatus);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isTyping]);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || inputText.length > MAX_CHARS || isLoading) {
      return;
    }

    if (rateLimitStatus && !rateLimitStatus.canSend) {
      haptics.error();
      return;
    }

    haptics.medium();
    Keyboard.dismiss();

    const userMessageText = inputText.trim();
    setInputText('');

    // Add user message optimistically
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessageText,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await sendMessage(userId, userMessageText, messages);

      if (response.success && response.assistantMessage) {
        setMessages((prev) => [...prev, response.assistantMessage!]);
      } else if (response.error) {
        // Check if budget exceeded
        if (response.budgetExceeded) {
          setBudgetExceeded(true);
        }

        // Show error as system message
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: response.error,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }

      if (response.rateLimitStatus) {
        setRateLimitStatus(response.rateLimitStatus);
      }
    } catch (error) {
      console.error('Send error:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [inputText, messages, rateLimitStatus, isLoading, userId, haptics]);

  const charCount = inputText.length;
  const isOverLimit = charCount > MAX_CHARS;
  const canSend = inputText.trim().length > 0 && !isOverLimit && !isLoading && rateLimitStatus?.canSend && !budgetExceeded;

  const remainingMessages = rateLimitStatus?.dailyRemaining ?? DAILY_LIMIT;

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.blue} />
          <Text style={styles.loadingText}>Loading Concierge...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerLogo}>
            <Text style={styles.headerLogoText}>M</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Maslow Concierge</Text>
            <Text style={styles.headerSubtitle}>Your NYC expert</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={COLORS.darkGray} />
        </TouchableOpacity>
      </View>

      {/* Rate Limit Banner */}
      {rateLimitStatus && (
        <View style={[
          styles.rateLimitBanner,
          !rateLimitStatus.canSend && styles.rateLimitBannerError,
        ]}>
          {rateLimitStatus.canSend ? (
            <Text style={styles.rateLimitText}>
              {remainingMessages} of {DAILY_LIMIT} chats remaining today
            </Text>
          ) : (
            <Text style={styles.rateLimitTextError}>
              {rateLimitStatus.message}
            </Text>
          )}
        </View>
      )}

      {/* Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Welcome Message */}
          {messages.length === 0 && (
            <View style={styles.welcomeContainer}>
              <View style={styles.welcomeLogo}>
                <Text style={styles.welcomeLogoText}>M</Text>
              </View>
              <Text style={styles.welcomeTitle}>Hello! I'm your Maslow Concierge</Text>
              <Text style={styles.welcomeText}>
                I can help you with NYC recommendations, your Maslow membership, or tell you about Abraham Maslow's philosophy. What would you like to know?
              </Text>
              <View style={styles.suggestionsContainer}>
                <TouchableOpacity
                  style={styles.suggestionChip}
                  onPress={() => setInputText('What are the best restaurants in SoHo?')}
                >
                  <Text style={styles.suggestionText}>NYC dining tips</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.suggestionChip}
                  onPress={() => setInputText('How do Maslow credits work?')}
                >
                  <Text style={styles.suggestionText}>About credits</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.suggestionChip}
                  onPress={() => setInputText("Who was Abraham Maslow?")}
                >
                  <Text style={styles.suggestionText}>Abraham Maslow</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Chat Messages */}
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.role === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.role === 'user' ? styles.userText : styles.assistantText,
                ]}
              >
                {message.content}
              </Text>
              <Text
                style={[
                  styles.messageTime,
                  message.role === 'user' ? styles.userTime : styles.assistantTime,
                ]}
              >
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <View style={[styles.messageBubble, styles.assistantBubble, styles.typingBubble]}>
              <View style={styles.typingDots}>
                <View style={[styles.dot, styles.dot1]} />
                <View style={[styles.dot, styles.dot2]} />
                <View style={[styles.dot, styles.dot3]} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={[styles.input, isOverLimit && styles.inputError]}
              placeholder={
                budgetExceeded
                  ? "Concierge unavailable until next month"
                  : rateLimitStatus?.canSend
                    ? "Ask me anything about NYC or Maslow..."
                    : "Daily limit reached"
              }
              placeholderTextColor={COLORS.darkGray}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={MAX_CHARS + 50} // Allow typing over limit to show error
              editable={rateLimitStatus?.canSend && !isLoading && !budgetExceeded}
              returnKeyType="default"
            />
            <View style={styles.inputFooter}>
              <Text style={[styles.charCount, isOverLimit && styles.charCountError]}>
                {charCount}/{MAX_CHARS}
              </Text>
              <TouchableOpacity
                style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!canSend}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Ionicons name="send" size={18} color={COLORS.white} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.darkGray,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogoText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.cream,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.navy,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  closeButton: {
    padding: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
  },

  // Rate Limit Banner
  rateLimitBanner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
  },
  rateLimitBannerError: {
    backgroundColor: '#FED7D7',
  },
  rateLimitText: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  rateLimitTextError: {
    fontSize: 12,
    color: COLORS.red,
    textAlign: 'center',
  },

  // Chat
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },

  // Welcome
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  welcomeLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.blue,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeLogoText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.cream,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.navy,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.blue,
  },
  suggestionText: {
    fontSize: 13,
    color: COLORS.blue,
    fontWeight: '500',
  },

  // Message Bubbles
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.blue,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: COLORS.white,
  },
  assistantText: {
    color: COLORS.navy,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  userTime: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  assistantTime: {
    color: COLORS.darkGray,
  },

  // Typing Indicator
  typingBubble: {
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.darkGray,
    opacity: 0.4,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 0.8,
  },

  // Input
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  inputWrapper: {
    backgroundColor: COLORS.cream,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  input: {
    fontSize: 15,
    color: COLORS.navy,
    maxHeight: 100,
    minHeight: 24,
  },
  inputError: {
    color: COLORS.red,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  charCount: {
    fontSize: 11,
    color: COLORS.darkGray,
  },
  charCountError: {
    color: COLORS.red,
    fontWeight: '600',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.lightGray,
  },
});
