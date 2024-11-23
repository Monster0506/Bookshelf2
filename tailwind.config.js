module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        highlight: {
          yellow: '#FEF3C7',
          green: '#D1FAE5',
          blue: '#DBEAFE',
          pink: '#FCE7F3',
          purple: '#EDE9FE',
        }
      }
    },
  },
  plugins: [
    require('tailwindcss-highlights'),
  ],
};
