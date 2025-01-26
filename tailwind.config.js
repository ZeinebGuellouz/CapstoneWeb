/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0632a1',
          light: '#0743d4',
          dark: '#042171'
        }
      }
    },
  },
  plugins: [],
};