/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: { DEFAULT: '#F5F1E8', deep: '#EDE7DA' },
        charcoal: { DEFAULT: '#262723', soft: '#4A4B45' },
        terracotta: { DEFAULT: '#B66A4A', dark: '#94533A', light: '#E7CBBB' },
        olive: { DEFAULT: '#858B70', light: '#CFD2C2' },
        stone: { DEFAULT: '#D8D3C9', dark: '#B9B3A6' },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: { label: '0.16em' },
    },
  },
  plugins: [],
};
