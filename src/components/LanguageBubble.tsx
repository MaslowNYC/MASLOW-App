import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHaptics } from '../hooks/useHaptics';
import {
  SUPPORTED_LANGUAGES,
  LanguageCode,
  setLanguage,
  saveLanguagePreference,
  t,
} from '../i18n';

const COLORS = {
  blue: '#286ABC',
  cream: '#FAF4ED',
  white: '#FFFFFF',
  navy: '#1A365D',
  gold: '#C5A059',
  darkGray: '#4A5568',
};

const ROTATION_INTERVAL = 1500; // 1.5s dissolve between languages
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LanguageBubbleProps {
  userId?: string | null;
  onLanguageChange?: (code: LanguageCode) => void;
  currentLanguage?: LanguageCode;
}

export function LanguageBubble({
  userId,
  onLanguageChange,
  currentLanguage = 'en',
}: LanguageBubbleProps) {
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(currentLanguage);
  const [rotatingIndex, setRotatingIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Rotating language animation
  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Change language
        setRotatingIndex((prev) => (prev + 1) % SUPPORTED_LANGUAGES.length);
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Update when prop changes
  useEffect(() => {
    setSelectedLanguage(currentLanguage);
  }, [currentLanguage]);

  const handleOpenModal = () => {
    haptics.light();
    setIsModalOpen(true);
  };

  const handleSelectLanguage = async (code: LanguageCode) => {
    haptics.medium();
    setSelectedLanguage(code);
    setLanguage(code);

    // Save to Supabase if logged in
    if (userId) {
      await saveLanguagePreference(userId, code);
    }

    // Notify parent
    onLanguageChange?.(code);

    // Close modal
    setIsModalOpen(false);
  };

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage);
  const rotatingLang = SUPPORTED_LANGUAGES[rotatingIndex];

  return (
    <>
      {/* Floating Bubble */}
      <TouchableOpacity
        style={[styles.bubble, { bottom: insets.bottom + 16 }]}
        onPress={handleOpenModal}
        activeOpacity={0.8}
      >
        <Animated.View style={[styles.bubbleContent, { opacity: fadeAnim }]}>
          <Text style={styles.flag}>{rotatingLang.flag}</Text>
          <Text style={styles.languageNative}>{rotatingLang.native}</Text>
        </Animated.View>
        <View style={styles.chevron}>
          <Ionicons name="chevron-up" size={12} color={COLORS.white} />
        </View>
      </TouchableOpacity>

      {/* Language Selection Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('selectLanguage')}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsModalOpen(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.darkGray} />
            </TouchableOpacity>
          </View>

          {/* Language List */}
          <ScrollView
            style={styles.languageList}
            contentContainerStyle={styles.languageListContent}
            showsVerticalScrollIndicator={false}
          >
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === selectedLanguage;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageItem,
                    isSelected && styles.languageItemSelected,
                  ]}
                  onPress={() => handleSelectLanguage(lang.code)}
                  activeOpacity={0.7}
                >
                  <View style={styles.languageItemLeft}>
                    <Text style={styles.languageFlag}>{lang.flag}</Text>
                    <View>
                      <Text style={[
                        styles.languageName,
                        isSelected && styles.languageNameSelected,
                      ]}>
                        {lang.native}
                      </Text>
                      <Text style={styles.languageEnglishName}>{lang.name}</Text>
                    </View>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.blue} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    right: 16,
    backgroundColor: COLORS.blue,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  bubbleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flag: {
    fontSize: 18,
  },
  languageNative: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  chevron: {
    marginLeft: 6,
    opacity: 0.8,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: COLORS.white,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.navy,
  },
  closeButton: {
    padding: 4,
  },

  // Language List
  languageList: {
    flex: 1,
  },
  languageListContent: {
    padding: 16,
    gap: 8,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageItemSelected: {
    borderColor: COLORS.blue,
    backgroundColor: `${COLORS.blue}08`,
  },
  languageItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  languageFlag: {
    fontSize: 28,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.navy,
  },
  languageNameSelected: {
    color: COLORS.blue,
  },
  languageEnglishName: {
    fontSize: 13,
    color: COLORS.darkGray,
    marginTop: 2,
  },
});
