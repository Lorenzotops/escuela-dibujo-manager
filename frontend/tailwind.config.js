/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7dc9fc',
          400: '#38aef8',
          500: '#0e94e9',
          600: '#0275c7',
          700: '#035ea1',
          800: '#075085',
          900: '#0b436e',
        },
        art: {
          purple: '#7c3aed',
          pink:   '#ec4899',
          orange: '#f97316',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
