/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/renderer/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // PLC-themed colors
        'power-on': '#00E676',
        'power-off': '#BDBDBD',
        'plc-blue': '#2196F3',
        'plc-green': '#4CAF50',
        'plc-red': '#F44336',
        'plc-orange': '#FF9800',
      },
    },
  },
  plugins: [],
};
