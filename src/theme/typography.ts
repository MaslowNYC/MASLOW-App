export const typography = {
  // Font families (we'll add custom fonts later)
  fontFamily: {
    serif: 'System', // Will be Playfair Display
    sans: 'System',  // Will be Inter
  },

  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },

  // Font weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Pre-composed text styles (matching website)
  styles: {
    // Headers
    h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
    h2: { fontSize: 24, fontWeight: '600' as const, lineHeight: 32 },
    h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
    h4: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },

    // Body
    bodyLarge: { fontSize: 17, fontWeight: '400' as const, lineHeight: 24 },
    body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
    bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },

    // UI
    button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
    caption: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
    label: { fontSize: 11, fontWeight: '600' as const, lineHeight: 16, letterSpacing: 0.5 },
  },
};
