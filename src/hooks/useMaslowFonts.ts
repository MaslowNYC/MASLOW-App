import { useFonts } from 'expo-font';
import {
  CormorantGaramond_300Light,
  CormorantGaramond_400Regular,
  CormorantGaramond_300Light_Italic,
} from '@expo-google-fonts/cormorant-garamond';
import {
  Jost_300Light,
  Jost_400Regular,
} from '@expo-google-fonts/jost';

/**
 * Hook to load Maslow brand fonts.
 * - Cormorant Garamond: Display/logo/headlines (serif, elegant)
 * - Jost: UI/body text (geometric sans-serif)
 */
export function useMaslowFonts(): boolean {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_300Light,
    CormorantGaramond_400Regular,
    CormorantGaramond_300Light_Italic,
    Jost_300Light,
    Jost_400Regular,
  });

  return fontsLoaded;
}

// Font family constants for StyleSheet use
export const fonts = {
  // Display fonts (Cormorant Garamond)
  displayLight: 'CormorantGaramond_300Light',
  display: 'CormorantGaramond_400Regular',
  displayItalic: 'CormorantGaramond_300Light_Italic',
  // UI fonts (Jost)
  uiLight: 'Jost_300Light',
  ui: 'Jost_400Regular',
} as const;
