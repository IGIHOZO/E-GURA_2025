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
    extend: {},
  },
  plugins: [],
}; 