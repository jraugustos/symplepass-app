import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          // Extended palette matching HTML colors
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FFB347',
          400: '#FF8C1A',
          500: '#FF7A00',
          600: '#E56D00',
          700: '#C25E00',
          800: '#994A00',
          900: '#7A3B00',
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Exact colors from HTML
        orange: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
        },
        // Semantic colors
        success: {
          DEFAULT: '#34C759',
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#34C759',
          600: '#16A34A',
          700: '#15803D',
        },
        error: {
          DEFAULT: '#FF3B30',
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#FF3B30',
          600: '#DC2626',
          700: '#B91C1C',
        },
        info: {
          DEFAULT: '#007AFF',
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#007AFF',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        warning: {
          DEFAULT: '#F59E0B',
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        // Matching HTML neutral colors
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#eaeaea',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        // Additional colors from HTML
        emerald: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        amber: {
          50: '#fffbeb',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        sky: {
          400: '#38bdf8',
          700: '#0369a1',
        },
        gray: {
          50: '#f9fafb',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Geist', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', "Segoe UI", 'Roboto', 'sans-serif'],
        geist: ['var(--font-geist-sans)', 'Geist', 'sans-serif'],
      },
      fontSize: {
        // Custom sizes from HTML
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        // Small custom size
        '2xs': ['0.6875rem', { lineHeight: '1rem' }], // 11px
      },
      backgroundImage: {
        // Primary gradients from HTML
        'gradient-primary': 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)',
        'gradient-primary-hover': 'linear-gradient(135deg, #E56D00 0%, #FF8C1A 100%)',
        'gradient-success': 'linear-gradient(135deg, #34C759 0%, #10b981 100%)',
        // Overlay gradients from HTML
        'gradient-overlay': 'linear-gradient(to top, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.2), transparent)',
        'gradient-overlay-light': 'linear-gradient(to bottom, rgba(255, 255, 255, 0.85), transparent)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Custom values from HTML
        '2xs': '0.25rem', // 4px
        '3xl': '1.5rem',   // 24px
      },
      spacing: {
        // Custom spacing from HTML
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      opacity: {
        '95': '0.95',
        '85': '0.85',
        '15': '0.15',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          '0%': {
            backgroundPosition: '-1000px 0',
          },
          '100%': {
            backgroundPosition: '1000px 0',
          },
        },
        fadeSlideIn: {
          '0%': {
            opacity: '0',
            transform: 'translateY(30px)',
            filter: 'blur(8px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
            filter: 'blur(0px)',
          },
        },
        fadeInUp: {
          from: {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideInBlur: {
          from: {
            opacity: '0',
            transform: 'translateX(-30px)',
            filter: 'blur(8px)',
          },
          to: {
            opacity: '1',
            transform: 'translateX(0)',
            filter: 'blur(0px)',
          },
        },
        fadeInScale: {
          from: {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          to: {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "shimmer": "shimmer 2s infinite linear",
        "fade-slide-in": "fadeSlideIn 1s ease-out",
        "fade-in-up": "fadeInUp 0.5s ease-out",
        "slide-in-blur": "slideInBlur 0.5s ease-out",
        "fade-in-scale": "fadeInScale 0.5s ease-out",
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '450': '450ms',
      },
      letterSpacing: {
        tighter: '-0.025em',
        tight: '-0.01em',
      },
      boxShadow: {
        'custom-sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'custom-md': '0 4px 12px 0 rgb(0 0 0 / 0.1)',
        'custom-lg': '0 8px 24px 0 rgb(0 0 0 / 0.12)',
        'custom-xl': '0 12px 32px 0 rgb(0 0 0 / 0.15)',
      },
      width: {
        '18': '4.5rem',
        '88': '22rem',
      },
      height: {
        '18': '4.5rem',
        '88': '22rem',
        'screen-90': '90vh',
      },
      minHeight: {
        'screen-90': '90vh',
      },
      maxWidth: {
        '8xl': '88rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      aspectRatio: {
        'video': '16 / 9',
        'square': '1 / 1',
        'portrait': '4 / 5',
      },
      backgroundSize: {
        'auto': 'auto',
        'cover': 'cover',
        'contain': 'contain',
        '200%': '200%',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
