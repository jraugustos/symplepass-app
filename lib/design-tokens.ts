/**
 * Symplepass Design Tokens
 * Centralized design values for consistency
 */

export interface ColorPalette {
  [key: string]: string
}

export interface TypographyConfig {
  fontFamily: {
    sans: string
    heading: string
  }
  fontSize: { [key: string]: string }
  fontWeight: { [key: string]: string }
  lineHeight: { [key: string]: string }
  letterSpacing: { [key: string]: string }
}

export interface SpacingConfig {
  [key: string]: string
}

export interface DesignTokens {
  colors: {
    primary: ColorPalette & { gradient: string; gradientHover: string }
    neutral: ColorPalette
    success: ColorPalette & { bg: string; border: string }
    error: ColorPalette & { bg: string; border: string }
    warning: ColorPalette & { bg: string; border: string }
    info: ColorPalette & { bg: string; border: string }
    emerald: ColorPalette
    amber: ColorPalette
    sky: ColorPalette
    overlay: ColorPalette
  }
  typography: TypographyConfig
  spacing: SpacingConfig
  borderRadius: { [key: string]: string }
  boxShadow: { [key: string]: string }
  zIndex: { [key: string]: string }
  transition: {
    duration: { [key: string]: string }
    timing: { [key: string]: string }
  }
  breakpoints: { [key: string]: string }
  container: {
    maxWidth: string
    padding: {
      mobile: string
      desktop: string
    }
  }
  animations: {
    [key: string]: {
      keyframes?: string
      class: string
    }
  }
}

const designTokens: DesignTokens = {
  // ===== COLORS =====
  colors: {
    // Primary Orange Gradient
    primary: {
      gradient: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)',
      gradientHover: 'linear-gradient(135deg, #E56D00 0%, #FF8C1A 100%)',
      '50': '#FFF7ED',
      '100': '#FFEDD5',
      '200': '#FED7AA',
      '300': '#FFB347',
      '400': '#FF8C1A',
      '500': '#FF7A00', // Base
      '600': '#E56D00',
      '700': '#C25E00',
      '800': '#994A00',
      '900': '#7A3B00',
    },

    // Neutral Gray Scale
    neutral: {
      '50': '#FAFAFA',
      '100': '#F5F5F5',
      '200': '#EAEAEA',
      '300': '#D4D4D4',
      '400': '#A3A3A3',
      '500': '#737373',
      '600': '#525252',
      '700': '#404040',
      '800': '#262626',
      '900': '#171717',
    },

    // Semantic Colors
    success: {
      light: '#ECFDF5',
      DEFAULT: '#34C759',
      dark: '#15803D',
      bg: 'rgba(52, 199, 89, 0.1)',
      border: 'rgba(52, 199, 89, 0.2)',
    },

    error: {
      light: '#FEF2F2',
      DEFAULT: '#FF3B30',
      dark: '#B91C1C',
      bg: 'rgba(255, 59, 48, 0.1)',
      border: 'rgba(255, 59, 48, 0.2)',
    },

    warning: {
      light: '#FFFBEB',
      DEFAULT: '#F59E0B',
      dark: '#B45309',
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.3)',
    },

    info: {
      light: '#EFF6FF',
      DEFAULT: '#007AFF',
      dark: '#1D4ED8',
      bg: 'rgba(0, 122, 255, 0.1)',
      border: 'rgba(0, 122, 255, 0.3)',
    },

    // Special colors from HTML
    emerald: {
      '400': '#34d399',
      '500': '#10b981',
      '600': '#059669',
    },

    amber: {
      '50': '#fffbeb',
      '300': '#fcd34d',
      '700': '#b45309',
    },

    sky: {
      '400': '#38bdf8',
      '700': '#0369a1',
    },

    // Overlays
    overlay: {
      white90: 'rgba(255, 255, 255, 0.9)',
      white80: 'rgba(255, 255, 255, 0.8)',
      white20: 'rgba(255, 255, 255, 0.2)',
      white10: 'rgba(255, 255, 255, 0.1)',
      black60: 'rgba(0, 0, 0, 0.6)',
      black40: 'rgba(0, 0, 0, 0.4)',
      black20: 'rgba(0, 0, 0, 0.2)',
      black95: 'rgba(0, 0, 0, 0.95)',
    },
  },

  // ===== TYPOGRAPHY =====
  typography: {
    fontFamily: {
      sans: "'Geist', ui-sans-serif, system-ui, -apple-system, sans-serif",
      heading: "'Geist', sans-serif",
    },

    fontSize: {
      '2xs': '0.6875rem', // 11px
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
      '5xl': '3rem',      // 48px
      '6xl': '3.75rem',   // 60px
      '7xl': '4.5rem',    // 72px
      '8xl': '6rem',      // 96px
    },

    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },

    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.625',
    },

    letterSpacing: {
      tighter: '-0.025em',
      tight: '-0.01em',
      normal: '0',
      wide: '0.05em',
      widest: '0.1em',
    },
  },

  // ===== SPACING =====
  spacing: {
    '0': '0',
    px: '1px',
    '0.5': '0.125rem',  // 2px
    '1': '0.25rem',     // 4px
    '1.5': '0.375rem',  // 6px
    '2': '0.5rem',      // 8px
    '2.5': '0.625rem',  // 10px
    '3': '0.75rem',     // 12px
    '3.5': '0.875rem',  // 14px
    '4': '1rem',        // 16px
    '5': '1.25rem',     // 20px
    '6': '1.5rem',      // 24px
    '7': '1.75rem',     // 28px
    '8': '2rem',        // 32px
    '9': '2.25rem',     // 36px
    '10': '2.5rem',     // 40px
    '11': '2.75rem',    // 44px
    '12': '3rem',       // 48px
    '14': '3.5rem',     // 56px
    '16': '4rem',       // 64px
    '20': '5rem',       // 80px
    '24': '6rem',       // 96px
    '28': '7rem',       // 112px
    '32': '8rem',       // 128px
  },

  // ===== BORDER RADIUS =====
  borderRadius: {
    none: '0',
    sm: '0.25rem',    // 4px
    DEFAULT: '0.5rem', // 8px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.25rem', // 20px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // ===== SHADOWS =====
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 2px 8px 0 rgb(0 0 0 / 0.08)',
    md: '0 4px 12px 0 rgb(0 0 0 / 0.1)',
    lg: '0 8px 24px 0 rgb(0 0 0 / 0.12)',
    xl: '0 12px 32px 0 rgb(0 0 0 / 0.15)',
    '2xl': '0 20px 40px 0 rgb(0 0 0 / 0.2)',
  },

  // ===== Z-INDEX =====
  zIndex: {
    '0': '0',
    '10': '10',
    '20': '20', // Sections
    '30': '30', // Sticky tabs
    '40': '40', // Sticky CTA
    '50': '50', // Mobile menu overlay
    '60': '60', // Modal
    '70': '70',
    '80': '80',
    '90': '90',
    '100': '100',
  },

  // ===== TRANSITIONS =====
  transition: {
    duration: {
      fast: '150ms',
      base: '250ms',
      slow: '350ms',
      slower: '500ms',
    },
    timing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      linear: 'linear',
    },
  },

  // ===== BREAKPOINTS =====
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // ===== CONTAINER =====
  container: {
    maxWidth: '1280px',
    padding: {
      mobile: '1.5rem', // 24px
      desktop: '2rem',  // 32px
    },
  },

  // ===== ANIMATIONS =====
  animations: {
    fadeSlideIn: {
      keyframes: `
        @keyframes fadeSlideIn {
          0% {
            opacity: 0;
            transform: translateY(30px);
            filter: blur(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0px);
          }
        }
      `,
      class: 'animation: fadeSlideIn 1s ease-out',
    },
    fadeInUp: {
      keyframes: `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `,
      class: 'animation: fadeInUp 0.5s ease-out',
    },
    scaleHover: {
      class: 'transition-transform duration-500 hover:scale-105',
    },
  },
}

export default designTokens
