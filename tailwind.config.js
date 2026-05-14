/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bitnex: {
          orange:  '#f97316',
          orange2: '#ea580c',
          dark:    '#0d0f14',
          surface: '#141720',
          surface2:'#1a1f2e',
          border:  'rgba(255,255,255,0.07)',
        },
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
      },
      animation: {
        'float':       'float 5s ease-in-out infinite',
        'pulse-slow':  'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up':    'slideUp 0.40s ease-out',
        'fade-in':     'fadeIn 0.30s ease-out',
      },
    },
  },
  plugins: [],
}
