/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // MediaMonkey-style dark theme with orange accents
        'app-bg': '#1e1e1e',
        'app-surface': '#2d2d30',
        'app-surface-light': '#3e3e42',
        'app-surface-dark': '#252526',
        'app-accent': '#e87f00',
        'app-accent-hover': '#ff9420',
        'app-accent-light': '#3d3020',
        'app-text': '#ffffff',
        'app-text-muted': '#a0a0a0',
        'app-text-light': '#707070',
        'app-border': '#3e3e42',
        'app-border-dark': '#2d2d30',

        // Player bar
        'player-bg': '#1a1a1a',
        'player-text': '#ffffff',
        'player-muted': '#888888',

        // Selection/highlight
        'app-selected': '#3d3d20',
        'app-hover': '#3a3a3a',
      },
      fontFamily: {
        'sans': ['Segoe UI', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.3)',
        'medium': '0 4px 12px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}
