/**
 * Design Tokens for the Light-Only Finance Application.
 * Colors are solid, modern, clean, with zero gradients, and high-readability contrast.
 */

export const colors = {
  // General Backgrounds
  background: '#F8FAFC',        // Slate 50 (Very light gray-blue for app background)
  surface: '#FFFFFF',           // White for cards, inputs, and containers
  cardShadowColor: '#0F172A',   // Slate 900 for drop shadows

  // Primary Branding & UI Colors
  primary: '#2563EB',           // Blue 600 (Clean, strong primary brand color)
  primaryLight: '#EFF6FF',      // Blue 50 (Subtle background highlight for active states)
  border: '#E2E8F0',            // Slate 200 (Clean, thin border color)
  placeholder: '#94A3B8',       // Slate 400 (For placeholder text)

  // Typography Colors
  textPrimary: '#0F172A',       // Slate 900 (Main text, very high contrast)
  textSecondary: '#64748B',     // Slate 500 (Subtle, secondary text for subtitles/metadata)
  textLight: '#94A3B8',         // Slate 400 (Muted labels)

  // Financial Status Colors
  income: '#059669',            // Emerald 600 (Subtle, professional green for Incomes)
  incomeBackground: '#ECFDF5',   // Emerald 50 (Clean background highlight for income items)
  expense: '#DC2626',           // Red 600 (Subtle, professional red for Expenses)
  expenseBackground: '#FEF2F2',  // Red 50 (Clean background highlight for expense items)
  
  // Utility/Neutral Alert Colors
  warning: '#D97706',           // Amber 600
  warningBackground: '#FFFBEB',  // Amber 50
};

export const theme = {
  colors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 24,
    round: 9999,
  },
  typography: {
    fontFamily: 'System',        // Default Native system font stack (Roboto/San Francisco)
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 28,
      xxxl: 36,
    },
    weights: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },
  shadows: {
    light: {
      shadowColor: colors.cardShadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2, // Native Android elevation
    },
    medium: {
      shadowColor: colors.cardShadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 4, // Native Android elevation
    },
  },
};
