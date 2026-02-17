module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  safelist: [
    // Ensure common utilities are always included
    {
      pattern: /(bg|text|border)-(red|blue|green|yellow|purple|pink|indigo|gray|white|black)-(100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern: /(flex|grid|hidden|block|inline|absolute|relative|fixed)/,
    },
    {
      pattern: /p(x|y|t|b|l|r)?-(0|1|2|3|4|5|6|8|10|12|16|20|24)/,
    },
    {
      pattern: /m(x|y|t|b|l|r)?-(0|1|2|3|4|5|6|8|10|12|16|20|24)/,
    },
  ],
  theme: {
    extend: {
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'progress-bar': {
          '0%': { width: '0%' },
          '50%': { width: '70%' },
          '100%': { width: '100%' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        'fade-in-up': 'fade-in-up 0.4s ease-out forwards',
        'progress-bar': 'progress-bar 1.2s ease-in-out',
      },
    },
  },
  plugins: [],
}; 