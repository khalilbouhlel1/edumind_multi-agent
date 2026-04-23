/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ez: {
          bg: 'rgb(var(--ez-bg) / <alpha-value>)',
          card: 'rgb(var(--ez-card) / <alpha-value>)',
          border: 'rgb(var(--ez-border) / <alpha-value>)',
          muted: 'rgb(var(--ez-muted) / <alpha-value>)',
          soft: 'rgb(var(--ez-soft) / <alpha-value>)',
        },
        brand: {
          50: '#f2f7ff',
          100: '#dbe8ff',
          200: '#b7d0ff',
          300: '#86afff',
          400: '#5e8cff',
          500: '#3a67f7',
          600: '#244cd1',
          700: '#1d3ba1',
          800: '#1b357c',
          900: '#1b315f',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 18px 40px -24px rgba(17, 24, 39, 0.35)',
        'card-lg': '0 28px 70px -30px rgba(17, 24, 39, 0.45)',
      },
      keyframes: {
        'fade-slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.85)' },
        },
      },
      animation: {
        'fade-slide-up': 'fade-slide-up 0.5s ease-out forwards',
        'slide-in': 'slide-in 0.4s ease-out forwards',
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        'pulse-dot': 'pulse-dot 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
