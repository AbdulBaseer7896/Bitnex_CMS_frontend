/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bitnex: {
          teal:   '#4BBFBF',
          teal2:  '#38A8A8',
          dark:   '#2D3142',
          mid:    '#3A4060',
          light:  '#E8F8F8',
          bg:     '#0e1420',
        },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['Plus Jakarta Sans', 'sans-serif'],
      },
      animation: {
        'float':       'float 6s ease-in-out infinite',
        'pulse-slow':  'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up':    'slideUp 0.45s ease-out',
        'fade-in':     'fadeIn 0.35s ease-out',
      },
    },
  },
  plugins: [],
}
