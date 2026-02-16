/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme inspired by MediaMonkey
        'app-bg': '#0a0a0a',
        'app-surface': '#121212',
        'app-surface-dark': '#0d0d0d',
        'app-surface-light': '#1a1a1a',
        'app-hover': '#252525',
        'app-border': '#2a2a2a',
        'app-text': '#e0e0e0',
        'app-text-muted': '#9e9e9e',
        'app-text-light': '#757575',
        'app-accent': '#ff6b35',
        'app-accent-hover': '#ff8555',
        'player-bg': '#0d0d0d',
        'player-text': '#ffffff',
        'player-muted': '#808080',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.3)',
        'medium': '0 4px 12px rgba(0, 0, 0, 0.4)',
        'hard': '0 8px 24px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
}