/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'obsidian': '#0d0b08',
        'parchment': '#e6d5b8',
        'leather-dark': '#1a160f',
        'paladin-gold': '#d8ae31',
        'arcane-purple': '#8b5cf6',
        'wax-red': '#991b1b',
        'ink': '#2c241a',
        'faded-ink': '#6b5e4c',
      },
      fontFamily: {
        'blackletter': ['Cinzel', 'serif'],
        'display': ['Newsreader', 'serif'],
        'handwritten': ['Crimson Text', 'serif'],
        'garamond': ['EB Garamond', 'serif'],
      },
    },
  },
  plugins: [
      require('tailwind-scrollbar'),
      require('tailwind-scrollbar-hide')
  ],
}