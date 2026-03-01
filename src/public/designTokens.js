/**
 * 5ATTH | خته — Design System Tokens
 * Dark Mode Only — Premium GCC Travel Platform
 * Used across Web + App
 */

export const designTokens = {
  colors: {
    bg: '#0E0E12',
    surface: '#15151B',
    card: '#1E1E27',
    cardHover: '#252532',
    accent_gold: '#C9A227',
    accent_gold_light: '#D4B84A',
    accent_gold_dark: '#A8871E',
    text_primary: '#F5F5F7',
    text_secondary: '#D1D1D6',
    text_muted: '#9AA0A6',
    success: '#00C853',
    danger: '#FF5252',
    warning: '#FFB300',
    info: '#00B0FF',
    border: '#2A2A35',
    border_gold: 'rgba(201, 162, 39, 0.3)',
    overlay: 'rgba(14, 14, 18, 0.8)',
    glass: 'rgba(21, 21, 27, 0.7)',
  },
  gradients: {
    gold: 'linear-gradient(135deg, #C9A227 0%, #D4B84A 50%, #A8871E 100%)',
    hero: 'radial-gradient(ellipse at center, #15151B 0%, #0E0E12 100%)',
    card: 'linear-gradient(180deg, #1E1E27 0%, #15151B 100%)',
    surface: 'linear-gradient(135deg, #15151B 0%, #1E1E27 100%)',
  },
  shadows: {
    card: '0 4px 24px rgba(0, 0, 0, 0.3)',
    gold: '0 0 20px rgba(201, 162, 39, 0.15)',
    goldStrong: '0 0 40px rgba(201, 162, 39, 0.25)',
    elevated: '0 8px 32px rgba(0, 0, 0, 0.4)',
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  spacing: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64],
  typography: {
    fontFamily: "'Noto Kufi Arabic', 'Cairo', sans-serif",
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
      hero: 64,
    },
    weights: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },
  breakpoints: {
    mobile: 480,
    tablet: 768,
    desktop: 1024,
    wide: 1280,
  },
  animation: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  countries: {
    SA: { name: 'السعودية', currency: 'SAR', flag: '🇸🇦' },
    AE: { name: 'الإمارات', currency: 'AED', flag: '🇦🇪' },
    KW: { name: 'الكويت', currency: 'KWD', flag: '🇰🇼' },
    QA: { name: 'قطر', currency: 'QAR', flag: '🇶🇦' },
    BH: { name: 'البحرين', currency: 'BHD', flag: '🇧🇭' },
  },
};
