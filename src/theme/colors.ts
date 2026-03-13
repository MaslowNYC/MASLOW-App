export const colors = {
  // === CANONICAL DESIGN TOKENS (March 2026 Redesign) ===

  // PRIMARY PALETTE
  cream: '#FAF4ED',           // Primary background
  cream2: '#F2E8DC',          // Secondary background
  charcoal: '#2A2724',        // Primary text
  gold: '#C49F58',            // Accent
  moss: '#4A5C3A',            // Secondary accent
  water: '#7AABCC',           // Links/info
  brandBlue: '#286BCD',       // Logo only
  white: '#FFFFFF',

  // GOLD VARIANTS
  goldLight: '#D4B676',
  goldDark: '#B38E47',

  // MOSS GRADIENT (for dark hero sections)
  mossDark: '#1a2318',        // Gradient start
  mossLight: '#2d3b28',       // Gradient end

  // TEXT OPACITIES
  charcoal50: 'rgba(42,39,36,0.5)',   // 50% charcoal
  charcoal30: 'rgba(42,39,36,0.3)',   // 30% charcoal
  charcoal15: 'rgba(42,39,36,0.15)',  // 15% charcoal (borders)
  charcoal10: 'rgba(42,39,36,0.1)',   // 10% charcoal (subtle borders)

  // SURFACES
  bgPrimary: '#FAF4ED',       // Cream background
  bgSecondary: '#F2E8DC',     // Cream 2 background
  bgTertiary: '#FFFFFF',      // White cards

  // FEEDBACK
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',

  // OVERLAYS
  overlay: 'rgba(0, 0, 0, 0.5)',
  shimmer: 'rgba(196, 159, 88, 0.1)',
  goldOverlay: 'rgba(196,159,88,0.06)',  // Selected card bg

  // AUTH SCREEN (warm cream theme - keep existing)
  authGradientStart: '#fdf8f0',
  authGradientMid: '#f5ede0',
  authGradientEnd: '#ede4d4',
  textPrimary: '#2a2218',
  textMid: '#9a8e80',
  textLight: '#b8ad9e',
  inputBgLight: 'rgba(255,255,255,0.72)',
  inputBorderLight: 'rgba(196,159,88,0.2)',
  cardGlass: 'rgba(255,255,255,0.52)',
  cardBorderGlass: 'rgba(255,255,255,0.75)',

  // LEGACY ALIASES (for backward compatibility during migration)
  navy: '#286BCD',
  navyDark: '#1E5299',
  navyLight: '#4080D9',
  black: '#2A2724',
  slate: '#64748B',
  darkGray: '#64748B',
  mediumGray: '#94A3B8',
  lightGray: '#E2E8F0',
};

// === TYPOGRAPHY ===
export const fonts = {
  // Serif headlines
  serifLight: 'CormorantGaramond_300Light',
  serifRegular: 'CormorantGaramond_400Regular',

  // Sans body/labels
  sansRegular: 'Jost_400Regular',
  sansSemiBold: 'Jost_600SemiBold',

  // Fallbacks
  serifFallback: 'serif',
  sansFallback: 'sans-serif',
};

// === SHAPE LANGUAGE ===
export const shape = {
  borderRadius: 2,  // All buttons, cards, inputs
};

// === SHADOWS ===
export const shadows = {
  card: {
    shadowColor: '#2A2724',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
};
