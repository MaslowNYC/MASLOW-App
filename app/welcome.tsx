import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useHaptics } from '../src/hooks/useHaptics';
import i18n from '../src/i18n';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// "Get In Line" variations from around the world (80+ languages)
// Each one "corrects" the previous - a celebration of how humans wait
interface LineVariation {
  text: string;
  region: string;
  isEnglish?: boolean;
}

const LINE_VARIATIONS: LineVariation[] = [
  // Top 10 American English variations (sprinkled every 3rd rotation)
  { text: 'Get In Line', region: 'American English', isEnglish: true },
  { text: 'Get ON Line', region: 'New York City', isEnglish: true },
  { text: 'Line Up', region: 'American English', isEnglish: true },
  { text: 'Hop In Line', region: 'Casual American', isEnglish: true },
  { text: 'Wait in Line', region: 'Midwestern US', isEnglish: true },
  { text: 'Stand in Line', region: 'Southern US', isEnglish: true },
  { text: 'Fall In', region: 'Military English', isEnglish: true },
  { text: 'Take Your Place', region: 'Formal American', isEnglish: true },
  { text: 'Step Right Up', region: 'Classic American', isEnglish: true },
  { text: 'Join the Line', region: 'American English', isEnglish: true },

  // British/Commonwealth variations
  { text: 'Join the Queue', region: 'British English' },
  { text: 'Queue Up', region: 'UK / Australia' },
  { text: 'Form a Queue', region: 'New Zealand' },

  // Spanish variations
  { text: 'Hacer Cola', region: 'España' },
  { text: 'Ponerse en la Fila', region: 'México' },
  { text: 'Hacer Fila', region: 'América Latina' },
  { text: 'Meterse en la Cola', region: 'Argentina' },
  { text: 'Formar Fila', region: 'Colombia' },
  { text: 'Colocarse en la Fila', region: 'Venezuela' },

  // Portuguese variations
  { text: 'Entrar na Fila', region: 'Brasil' },
  { text: 'Pegar a Fila', region: 'Brasil (coloquial)' },
  { text: 'Fazer Fila', region: 'Portugal' },
  { text: 'Entrar na Bicha', region: 'Portugal (coloquial)' },

  // French variations
  { text: 'Faire la Queue', region: 'France' },
  { text: 'Se Mettre en File', region: 'Québec' },
  { text: 'Prendre la File', region: 'Belgique' },
  { text: 'Faire la File', region: 'Suisse' },

  // German variations
  { text: 'Anstellen', region: 'Deutschland' },
  { text: 'In die Schlange Stellen', region: 'Österreich' },
  { text: 'Einreihen', region: 'Schweiz' },
  { text: 'Sich Anstellen', region: 'Formal Deutsch' },

  // Italian variations
  { text: 'Fare la Fila', region: 'Italia' },
  { text: 'Mettersi in Coda', region: 'Italia (Nord)' },
  { text: 'Fare la Coda', region: 'Italia (Sud)' },

  // Chinese variations
  { text: '排队', region: '中国大陆' },
  { text: '排隊', region: '台灣' },
  { text: '排隊等候', region: '香港' },
  { text: '轮候', region: '新加坡' },

  // Japanese variations
  { text: '列に並ぶ', region: '日本' },
  { text: '並んで待つ', region: '日本 (丁寧)' },
  { text: '順番を待つ', region: '日本 (フォーマル)' },

  // Korean variations
  { text: '줄서기', region: '한국' },
  { text: '줄을 서다', region: '한국 (정중)' },
  { text: '대기하다', region: '한국 (공식)' },

  // Arabic variations
  { text: 'انضم للطابور', region: 'الفصحى' },
  { text: 'قف في الصف', region: 'مصر' },
  { text: 'خذ دورك', region: 'الخليج' },
  { text: 'استنى دورك', region: 'لبنان' },
  { text: 'وقّف بالصف', region: 'الأردن' },
  { text: 'ادخل الطابور', region: 'السعودية' },
  { text: 'قيّد في الطابور', region: 'اليمن' },
  { text: 'خش الطابور', region: 'السودان' },

  // Russian variations
  { text: 'Встать в Очередь', region: 'Россия' },
  { text: 'Занять Очередь', region: 'Россия (разг.)' },
  { text: 'Стати в Чергу', region: 'Україна' },

  // Hindi variations
  { text: 'लाइन में लगें', region: 'भारत' },
  { text: 'कतार में लगें', region: 'भारत (औपचारिक)' },
  { text: 'क़तार में आएं', region: 'उर्दू' },

  // Hebrew variations
  { text: 'הצטרף לתור', region: 'ישראל' },
  { text: 'עמוד בתור', region: 'ישראל (רשמי)' },
  { text: 'קח תור', region: 'ישראל (דיבור)' },

  // Dutch variations
  { text: 'In de Rij Gaan Staan', region: 'Nederland' },
  { text: 'Aanschuiven', region: 'België' },

  // Polish variations
  { text: 'Ustawić się w Kolejce', region: 'Polska' },
  { text: 'Stanąć w Kolejce', region: 'Polska (potoczny)' },

  // Turkish variations
  { text: 'Sıraya Gir', region: 'Türkiye' },
  { text: 'Kuyruğa Gir', region: 'Türkiye (günlük)' },

  // Greek variations
  { text: 'Μπες στην Ουρά', region: 'Ελλάδα' },
  { text: 'Πάρε Σειρά', region: 'Κύπρος' },

  // Swedish variations
  { text: 'Ställ Dig i Kön', region: 'Sverige' },
  { text: 'Köa', region: 'Sverige (vardagligt)' },

  // Norwegian variations
  { text: 'Stå i Kø', region: 'Norge' },
  { text: 'Still Deg i Køen', region: 'Norge (formelt)' },

  // Danish variations
  { text: 'Stå i Kø', region: 'Danmark' },
  { text: 'Stil Dig i Køen', region: 'Danmark (formelt)' },

  // Finnish variations
  { text: 'Jonoon', region: 'Suomi' },
  { text: 'Mene Jonoon', region: 'Suomi (virallinen)' },

  // Thai variations
  { text: 'ต่อแถว', region: 'ไทย' },
  { text: 'เข้าแถว', region: 'ไทย (ทางการ)' },

  // Vietnamese variations
  { text: 'Xếp Hàng', region: 'Việt Nam' },
  { text: 'Vào Hàng', region: 'Việt Nam (miền Nam)' },

  // Indonesian variations
  { text: 'Antre', region: 'Indonesia' },
  { text: 'Mengantri', region: 'Indonesia (formal)' },

  // Malay variations
  { text: 'Beratur', region: 'Malaysia' },
  { text: 'Berbaris', region: 'Malaysia (formal)' },

  // Tagalog/Filipino variations
  { text: 'Pumila', region: 'Pilipinas' },
  { text: 'Sumali sa Pila', region: 'Pilipinas (pormal)' },

  // Swahili variations
  { text: 'Simama Kwenye Foleni', region: 'Kenya / Tanzania' },
  { text: 'Ingia Foleni', region: 'Afrika Mashariki' },

  // Yoruba (Nigeria)
  { text: 'Dúró Ní Ìlà', region: 'Nigeria (Yorùbá)' },

  // Zulu (South Africa)
  { text: 'Yima Emgqeni', region: 'South Africa (isiZulu)' },

  // Haitian Creole
  { text: 'Fè Liy', region: 'Ayiti' },

  // Hawaiian
  { text: 'E Kū i ka Laina', region: 'Hawaiʻi' },

  // Irish Gaelic
  { text: 'Seas sa Scuaine', region: 'Éire' },

  // Scottish Gaelic
  { text: 'Seas san t-Sreath', region: 'Alba' },

  // Welsh
  { text: 'Sefwch yn y Ciw', region: 'Cymru' },

  // Catalan
  { text: 'Fer Cua', region: 'Catalunya' },

  // Basque
  { text: 'Ilaran Jarri', region: 'Euskadi' },
];

// Shuffle array helper
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Create interleaved array with English every 3 options (NYC-based app)
const createInterleavedVariations = (): LineVariation[] => {
  const english = shuffleArray(LINE_VARIATIONS.filter(v => v.isEnglish));
  const nonEnglish = shuffleArray(LINE_VARIATIONS.filter(v => !v.isEnglish));

  const result: LineVariation[] = [];
  let engIndex = 0;
  let nonEngIndex = 0;

  // Pattern: English, non-English, non-English, English, non-English, non-English...
  while (engIndex < english.length || nonEngIndex < nonEnglish.length) {
    // Add English variation at positions 0, 3, 6, 9...
    if (engIndex < english.length) {
      result.push(english[engIndex++]);
    }
    // Add 2 non-English variations
    for (let i = 0; i < 2 && nonEngIndex < nonEnglish.length; i++) {
      result.push(nonEnglish[nonEngIndex++]);
    }
  }

  return result;
};

const COLORS = {
  background: '#0a1628',
  backgroundDark: '#050d1a',
  primary: '#3C5999',
  accent: '#C49F58',
  accentLight: '#d4b77a',
  cream: '#FAF4ED',
  white: '#FFFFFF',
  gray: '#6b7280',
  grayLight: '#9ca3af',
};

const ROTATION_INTERVAL = 2500;

export default function WelcomeScreen() {
  const router = useRouter();
  const haptics = useHaptics();

  // Rotating "Get In Line" button state
  const [lineVariations] = useState(() => createInterleavedVariations());
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isButtonPressed, setIsButtonPressed] = useState(false);

  // Animations
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // Button text animations
  const buttonTextOpacity = useRef(new Animated.Value(1)).current;
  const regionOpacity = useRef(new Animated.Value(1)).current;

  // Entrance animations
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Rotating "Get In Line" button - pauses on press
  useEffect(() => {
    if (isButtonPressed) return;

    const interval = setInterval(() => {
      // Animate out (text only - button stays fixed size)
      Animated.parallel([
        Animated.timing(buttonTextOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(regionOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Update text
        setCurrentLineIndex((prev) => (prev + 1) % lineVariations.length);

        // Animate in
        Animated.parallel([
          Animated.timing(buttonTextOpacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(regionOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, [isButtonPressed, lineVariations.length]);

  const currentLine = lineVariations[currentLineIndex];

  const handleGetInLine = () => {
    haptics.medium();
    router.push('/(auth)/login?mode=signup');
  };

  const handleMemberAccess = () => {
    haptics.light();
    router.push('/(auth)/login?mode=signin');
  };

  return (
    <View style={styles.container}>
      {/* Dark gradient background */}
      <LinearGradient
        colors={[COLORS.backgroundDark, COLORS.background, COLORS.backgroundDark]}
        locations={[0, 0.5, 1]}
        style={styles.gradientBackground}
      />

      {/* Subtle radial glow behind logo */}
      <View style={styles.glowContainer}>
        <LinearGradient
          colors={['rgba(60, 89, 153, 0.15)', 'transparent']}
          style={styles.glow}
        />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Logo Section */}
          <Animated.View
            style={[
              styles.logoSection,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            {/* Square Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/Maslow.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            {/* Tagline */}
            <Text style={styles.tagline}>{i18n.t('sanctuaryAwaits')}</Text>

            {/* Gold divider */}
            <View style={styles.divider} />

            {/* Waitlist Section */}
            <Text style={styles.waitlistLabel}>{i18n.t('waitlistLabel')}</Text>
            <Text style={styles.waitlistNumber}>#263</Text>
          </Animated.View>

          {/* Buttons Section */}
          <Animated.View
            style={[
              styles.buttonsSection,
              { opacity: contentOpacity },
            ]}
          >
            {/* Rotating "Get In Line" Button */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleGetInLine}
              onPressIn={() => setIsButtonPressed(true)}
              onPressOut={() => setIsButtonPressed(false)}
              activeOpacity={0.85}
            >
              <Animated.Text
                style={[
                  styles.primaryButtonText,
                  { opacity: buttonTextOpacity },
                ]}
                numberOfLines={1}
              >
                {currentLine.text}
              </Animated.Text>
            </TouchableOpacity>

            {/* Region indicator - fades with button text */}
            <Animated.Text
              style={[
                styles.regionIndicator,
                { opacity: regionOpacity },
              ]}
            >
              {currentLine.region}
            </Animated.Text>

            {/* Member Access */}
            <TouchableOpacity
              style={styles.memberAccessButton}
              onPress={handleMemberAccess}
              activeOpacity={0.7}
            >
              <Ionicons name="lock-closed-outline" size={14} color={COLORS.grayLight} />
              <Text style={styles.memberAccessText}>{i18n.t('memberAccess')}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  glowContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.15,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  glow: {
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  safeArea: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },

  // Logo Section
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  logoImage: {
    width: 160,
    height: 160,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '300',
    color: COLORS.cream,
    letterSpacing: 6,
    textAlign: 'center',
    lineHeight: 28,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.accent,
    marginVertical: 28,
    opacity: 0.8,
  },
  waitlistLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.grayLight,
    letterSpacing: 3,
    marginBottom: 8,
  },
  waitlistNumber: {
    fontSize: 48,
    fontWeight: '300',
    color: COLORS.cream,
    fontStyle: 'italic',
    letterSpacing: 2,
  },

  // Buttons Section
  buttonsSection: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
    marginTop: 20,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.accent,
    backgroundColor: 'transparent',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.accent,
    letterSpacing: 3,
  },
  regionIndicator: {
    fontSize: 9,
    fontWeight: '400',
    color: COLORS.grayLight,
    opacity: 0.4,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: -12,
    marginBottom: 4,
  },
  memberAccessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  memberAccessText: {
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.grayLight,
    letterSpacing: 2,
  },
});
