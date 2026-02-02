
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useState, useEffect } from 'react';

const BLUE = '#2C5F8D';
const CREAM = '#F9F2EC';
const GOLD = '#C5A059';

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
      Alert.alert('UV Cycle Complete', 'Air sanitization finished!');
    }
  }, [uvCountdown, uvCycleActive]);

  // Format session time
  const minutes = Math.floor(sessionSeconds / 60);
  const seconds = sessionSeconds % 60;
  const sessionTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Lighting presets
  const applyLightingPreset = (preset) => {
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

  // UV cycle
  const startUvCycle = () => {
    setUvCycleActive(true);
    setUvCountdown(30);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Restroom Controls</Text>
          <Text style={styles.subtitle}>Customize your experience</Text>
        </View>

        {/* Session Timer */}
        <View style={styles.section}>
          <View style={styles.timerCard}>
            <Text style={styles.timerLabel}>Session Time</Text>
            <Text style={styles.timerDisplay}>{sessionTime}</Text>
            <TouchableOpacity 
              style={styles.endButton}
              onPress={() => Alert.alert('End Session', 'This will unlock the door for the next person.')}
            >
              <Text style={styles.endButtonText}>End Session</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lighting Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Lighting</Text>
          
          <View style={styles.control}>
            <Text style={styles.controlLabel}>Brightness: {brightness}%</Text>
            <Slider
              value={brightness}
              onValueChange={setBrightness}
              minimumValue={0}
              maximumValue={100}
              step={1}
              minimumTrackTintColor={BLUE}
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor={BLUE}
            />
          </View>

          <View style={styles.control}>
            <Text style={styles.controlLabel}>
              Temperature: {temperature < 3000 ? 'Warm' : temperature > 5000 ? 'Cool' : 'Neutral'}
            </Text>
            <Slider
              value={temperature}
              onValueChange={setTemperature}
              minimumValue={2200}
              maximumValue={6500}
              step={100}
              minimumTrackTintColor={GOLD}
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor={GOLD}
            />
          </View>

          <Text style={styles.presetLabel}>Presets:</Text>
          <View style={styles.presetRow}>
            <TouchableOpacity 
              style={[styles.presetButton, lightingPreset === 'relaxing' && styles.presetButtonActive]}
              onPress={() => applyLightingPreset('relaxing')}
            >
              <Text style={[styles.presetText, lightingPreset === 'relaxing' && styles.presetTextActive]}>
                Relaxing
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.presetButton, lightingPreset === 'energizing' && styles.presetButtonActive]}
              onPress={() => applyLightingPreset('energizing')}
            >
              <Text style={[styles.presetText, lightingPreset === 'energizing' && styles.presetTextActive]}>
                Energizing
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.presetRow}>
            <TouchableOpacity 
              style={[styles.presetButton, lightingPreset === 'mirror' && styles.presetButtonActive]}
              onPress={() => applyLightingPreset('mirror')}
            >
              <Text style={[styles.presetText, lightingPreset === 'mirror' && styles.presetTextActive]}>
                Mirror
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.presetButton, lightingPreset === 'night' && styles.presetButtonActive]}
              onPress={() => applyLightingPreset('night')}
            >
              <Text style={[styles.presetText, lightingPreset === 'night' && styles.presetTextActive]}>
                Night
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Audio Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎵 Audio</Text>
          
          <View style={styles.control}>
            <Text style={styles.controlLabel}>Volume: {volume}%</Text>
            <Slider
              value={volume}
              onValueChange={setVolume}
              minimumValue={0}
              maximumValue={100}
              step={1}
              minimumTrackTintColor={BLUE}
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor={BLUE}
            />
          </View>

          <Text style={styles.presetLabel}>Soundscape:</Text>
          {['nature', 'whitenoise', 'lofi', 'silence'].map(option => (
            <TouchableOpacity
              key={option}
              style={styles.radioOption}
              onPress={() => setSoundscape(option)}
            >
              <View style={styles.radio}>
                {soundscape === option && <View style={styles.radioSelected} />}
              </View>
              <Text style={styles.radioText}>
                {option === 'nature' && '🌿 Nature Sounds'}
                {option === 'whitenoise' && '⚪ White Noise'}
                {option === 'lofi' && '🎧 Lo-Fi Beats'}
                {option === 'silence' && '🔇 Silence'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Air Quality Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💨 Air Quality</Text>
          
          <TouchableOpacity 
            style={[styles.uvButton, uvCycleActive && styles.uvButtonActive]}
            onPress={startUvCycle}
            disabled={uvCycleActive}
          >
            <Text style={styles.uvButtonText}>
              {uvCycleActive ? `UV Cycle Running... ${uvCountdown}s` : 'Run UV Sanitization'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.presetLabel}>Ventilation:</Text>
          <View style={styles.presetRow}>
            {[0, 1, 2, 3].map(speed => (
              <TouchableOpacity
                key={speed}
                style={[styles.fanButton, fanSpeed === speed && styles.fanButtonActive]}
                onPress={() => setFanSpeed(speed)}
              >
                <Text style={[styles.fanText, fanSpeed === speed && styles.fanTextActive]}>
                  {speed === 0 ? 'Off' : speed === 1 ? 'Low' : speed === 2 ? 'Med' : 'High'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: BLUE,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#4A5568',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${BLUE}10`,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: BLUE,
    marginBottom: 16,
  },
  control: {
    marginBottom: 20,
  },
  controlLabel: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 8,
    fontWeight: '500',
  },
  presetLabel: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 12,
    fontWeight: '500',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  presetButton: {
    flex: 1,
    backgroundColor: CREAM,
    borderWidth: 2,
    borderColor: BLUE,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  presetButtonActive: {
    backgroundColor: BLUE,
  },
  presetText: {
    color: BLUE,
    fontWeight: '600',
    fontSize: 13,
  },
  presetTextActive: {
    color: CREAM,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: BLUE,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BLUE,
  },
  radioText: {
    fontSize: 15,
    color: '#4A5568',
  },
  uvButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  uvButtonActive: {
    backgroundColor: '#FF9800',
  },
  uvButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  fanButton: {
    flex: 1,
    backgroundColor: CREAM,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  fanButtonActive: {
    backgroundColor: '#4CAF50',
  },
  fanText: {
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 13,
  },
  fanTextActive: {
    color: 'white',
  },
  timerCard: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  timerLabel: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 8,
  },
  timerDisplay: {
    fontSize: 48,
    fontWeight: '700',
    color: BLUE,
    fontFamily: 'monospace',
    marginBottom: 16,
  },
  endButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: BLUE,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  endButtonText: {
    color: BLUE,
    fontWeight: '600',
    fontSize: 14,
  },
});