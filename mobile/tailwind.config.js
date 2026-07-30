/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.js', './screens/**/*.{js,jsx}', './components/**/*.{js,jsx}', './navigation/**/*.{js,jsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Match the indigo accent used across the original StyleSheet build
        brand: '#4F46E5',
        brandSky: '#0EA5E9',
        brandAmber: '#F59E0B',
        tierTopBg: '#DCFCE7', tierTopFg: '#15803D',
        tierMidBg: '#DBEAFE', tierMidFg: '#2757db',
        tierLowBg: '#FEE2E2', tierLowFg: '#B91C1C',
      },
    },
  },
  plugins: [],
};
