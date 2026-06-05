/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  'rgba(124, 58, 237, 0.08)',
          100: 'rgba(124, 58, 237, 0.14)',
          200: 'rgba(124, 58, 237, 0.22)',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        art: {
          purple: '#7c3aed',
          pink:   '#ec4899',
          orange: '#f97316',
        },
        dark: {
          base:    '#0a0a0a',
          surface: '#111111',
          card:    '#1a1a1a',
          hover:   '#222222',
          active:  '#2a2a2a',
          border:  '#2d2d2d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(124, 58, 237, 0.3)',
        'glow-sm': '0 0 10px rgba(124, 58, 237, 0.2)',
      },
    },
  },
  plugins: [],
};
