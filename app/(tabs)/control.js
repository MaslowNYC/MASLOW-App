
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useState, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';

const BLUE = '#2C5F8D';
const CREAM = '#F9F2EC';
const GOLD = '#C5A059';
const DARK = '#1A202C';

export default function ControlScreen() {
  // Lighting state
  const [brightness, setBrightness] = useState(75);
  const [temperature, setTemperature] = useState(3500);
  const [lightingPreset, setLightingPreset] = useState(null);

  // Audio state
  const [volume, setVolume] = useState(50);
  const [soundscape, setSoundscape] = useState('nature');

  // Air quality state
  const [fanSpeed, setFanSpeed] = useState(1);
  const [uvCycleActive, setUvCycleActive] = useState(false);
  const [uvCountdown, setUvCountdown] = useState(0);

  // Session timer
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fade in on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Session timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // UV countdown effect
  useEffect(() => {
    if (uvCountdown > 0) {
      const timer = setTimeout(() => {
        setUvCountdown(uvCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (uvCountdown === 0 && uvCycleActive) {
      setUvCycleActive(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✨ UV Cycle Complete', 'Air sanitization finished!');
    }
  }, [uvCountdown, uvCycleActive]);

  // Format session time
  const minutes = Math.floor(sessionSeconds / 60);
  const seconds = sessionSeconds % 60;
  const sessionTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Lighting presets with haptics
  const applyLightingPreset = (preset) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLightingPreset(preset);
    switch(preset) {
      case 'relaxing':
        setBrightness(60);
        setTemperature(2700);
        break;
      case 'energizing':
        setBrightness(100);
        setTemperature(5000);
        break;
      case 'mirror':
        setBrightness(90);
        setTemperature(4500);
        break;
      case 'night':
        setBrightness(30);
        setTemperature(2200);
        break;
    }
  };

  // UV cycle with haptics
  const startUvCycle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setUvCycleActive(true);
    setUvCountdown(30);
  };

  // Soundscape change with haptics
  const changeSoundscape = (option) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSoundscape(option);
  };

  // Fan speed with haptics
  const changeFanSpeed = (speed) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFanSpeed(speed);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View style={[styles.fadeContainer, { opacity: fadeAnim }]}>
        <ScrollView 
          style={styles.scroll} 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Restroom Controls</Text>
            <Text style={styles.subtitle}>Customize your experience</Text>
          </View>

          {/* Session Timer - Larger, more prominent */}
          <View style={styles.timerSection}>
            <View style={styles.timerCard}>
              <Text style={styles.timerLabel}>Session Time</Text>
              <Text style={styles.timerDisplay}>{sessionTime}</Text>
              <TouchableOpacity 
                style={styles.endButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  Alert.alert('End Session', 'This will unlock the door for the next person.');
                }}
              >
                <Text style={styles.endButtonText}>End Session</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Lighting Controls */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>💡</Text>
              <Text style={styles.sectionTitle}>Lighting</Text>
            </View>
            
            <View style={styles.control}>
              <View style={styles.controlHeader}>
                <Text style={styles.controlLabel}>Brightness</Text>
                <Text style={styles.controlValue}>{brightness}%</Text>
              </View>
              <Slider
                value={brightness}
                onValueChange={setBrightness}
                onSlidingComplete={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                minimumValue={0}
                maximumValue={100}
                step={1}
                minimumTrackTintColor={BLUE}
                maximumTrackTintColor="#E5E7EB"
                thumbTintColor={BLUE}
                style={styles.slider}
              />
            </View>

            <View style={styles.control}>
              <View style={styles.controlHeader}>
                <Text style={styles.controlLabel}>Temperature</Text>
                <Text style={styles.controlValue}>
                  {temperature < 3000 ? '🔥 Warm' : temperature > 5000 ? '❄️ Cool' : '☀️ Neutral'}
                </Text>
              </View>
              <Slider
                value={temperature}
                onValueChange={setTemperature}
                onSlidingComplete={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                minimumValue={2200}
                maximumValue={6500}
                step={100}
                minimumTrackTintColor={GOLD}
                maximumTrackTintColor="#E5E7EB"
                thumbTintColor={GOLD}
                style={styles.slider}
              />
            </View>

            <Text style={styles.presetLabel}>Quick Presets</Text>
            <View style={styles.presetGrid}>
              {[
                { id: 'relaxing', label: '🌙 Relaxing', color: '#7C3AED' },
                { id: 'energizing', label: '⚡ Energizing', color: '#F59E0B' },
                { id: 'mirror', label: '💄 Mirror', color: '#EC4899' },
                { id: 'night', label: '🌃 Night', color: '#3B82F6' },
              ].map(preset => (
                <TouchableOpacity 
                  key={preset.id}
                  style={[
                    styles.presetButton, 
                    lightingPreset === preset.id && { 
                      backgroundColor: preset.color,
                      transform: [{ scale: 1.05 }]
                    }
                  ]}
                  onPress={() => applyLightingPreset(preset.id)}
                >
                  <Text style={[
                    styles.presetText, 
                    lightingPreset === preset.id && styles.presetTextActive
                  ]}>
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Audio Controls */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🎵</Text>
              <Text style={styles.sectionTitle}>Audio</Text>
            </View>
            
            <View style={styles.control}>
              <View style={styles.controlHeader}>
                <Text style={styles.controlLabel}>Volume</Text>
                <Text style={styles.controlValue}>{volume}%</Text>
              </View>
              <Slider
                value={volume}
                onValueChange={setVolume}
                onSlidingComplete={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                minimumValue={0}
                maximumValue={100}
                step={1}
                minimumTrackTintColor={BLUE}
                maximumTrackTintColor="#E5E7EB"
                thumbTintColor={BLUE}
                style={styles.slider}
              />
            </View>

            <Text style={styles.presetLabel}>Soundscape</Text>
            {[
              { id: 'nature', label: '🌿 Nature Sounds', desc: 'Forest ambience' },
              { id: 'whitenoise', label: '⚪ White Noise', desc: 'Focus & calm' },
              { id: 'lofi', label: '🎧 Lo-Fi Beats', desc: 'Chill vibes' },
              { id: 'silence', label: '🔇 Silence', desc: 'Peace & quiet' },
            ].map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.radioOption,
                  soundscape === option.id && styles.radioOptionActive
                ]}
                onPress={() => changeSoundscape(option.id)}
              >
                <View style={styles.radio}>
                  {soundscape === option.id && <View style={styles.radioSelected} />}
                </View>
                <View style={styles.radioTextContainer}>
                  <Text style={styles.radioText}>{option.label}</Text>
                  <Text style={styles.radioDesc}>{option.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Air Quality Controls */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>💨</Text>
              <Text style={styles.sectionTitle}>Air Quality</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.uvButton, uvCycleActive && styles.uvButtonActive]}
              onPress={startUvCycle}
              disabled={uvCycleActive}
            >
              <Text style={styles.uvButtonIcon}>{uvCycleActive ? '⏳' : '✨'}</Text>
              <Text style={styles.uvButtonText}>
                {uvCycleActive ? `UV Cycle Running... ${uvCountdown}s` : 'Run UV Sanitization (30s)'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.presetLabel}>Ventilation</Text>
            <View style={styles.fanGrid}>
              {[
                { speed: 0, label: 'Off', icon: '⭕' },
                { speed: 1, label: 'Low', icon: '💨' },
                { speed: 2, label: 'Med', icon: '🌬️' },
                { speed: 3, label: 'High', icon: '🌪️' },
              ].map(option => (
                <TouchableOpacity
                  key={option.speed}
                  style={[
                    styles.fanButton, 
                    fanSpeed === option.speed && styles.fanButtonActive
                  ]}
                  onPress={() => changeFanSpeed(option.speed)}
                >
                  <Text style={styles.fanIcon}>{option.icon}</Text>
                  <Text style={[
                    styles.fanText, 
                    fanSpeed === option.speed && styles.fanTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bottom padding */}
          <View style={{ height: 40 }} />

        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
  },
  fadeContainer: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: BLUE,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  timerSection: {
    marginBottom: 20,
  },
  timerCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: BLUE,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timerLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timerDisplay: {
    fontSize: 64,
    fontWeight: '700',
    color: BLUE,
    fontFamily: 'monospace',
    marginBottom: 20,
  },
  endButton: {
    backgroundColor: BLUE,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  endButtonText: {
    color: CREAM,
    fontWeight: '700',
    fontSize: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DARK,
  },
  control: {
    marginBottom: 24,
  },
  controlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  controlLabel: {
    fontSize: 16,
    color: DARK,
    fontWeight: '600',
  },
  controlValue: {
    fontSize: 16,
    color: BLUE,
    fontWeight: '700',
  },
  slider: {
    height: 40,
  },
  presetLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  presetText: {
    color: DARK,
    fontWeight: '600',
    fontSize: 14,
  },
  presetTextActive: {
    color: 'white',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  radioOptionActive: {
    backgroundColor: '#EBF5FF',
    borderWidth: 2,
    borderColor: BLUE,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: BLUE,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: BLUE,
  },
  radioTextContainer: {
    flex: 1,
  },
  radioText: {
    fontSize: 16,
    color: DARK,
    fontWeight: '600',
    marginBottom: 2,
  },
  radioDesc: {
    fontSize: 13,
    color: '#6B7280',
  },
  uvButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  uvButtonActive: {
    backgroundColor: '#F59E0B',
  },
  uvButtonIcon: {
    fontSize: 24,
  },
  uvButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  fanGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  fanButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  fanButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  fanIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  fanText: {
    color: DARK,
    fontWeight: '600',
    fontSize: 13,
  },
  fanTextActive: {
    color: 'white',
  },
});