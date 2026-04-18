import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#EBF5FB', 100: '#D6EAF8', 200: '#AED6F1', 500: '#2E86C1', 600: '#2471A3', 700: '#1A5276', 900: '#0B2F4A' },
        danger: { 50: '#FDEDEC', 100: '#FADBD8', 500: '#E74C3C', 600: '#CB4335' },
        warning: { 50: '#FEF9E7', 100: '#FCF3CF', 500: '#F39C12', 600: '#D68910' },
        success: { 50: '#EAFAF1', 100: '#D5F5E3', 500: '#27AE60', 600: '#229954' },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'recording': 'recording 1.5s ease-in-out infinite',
      },
      keyframes: {
        recording: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.1)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
