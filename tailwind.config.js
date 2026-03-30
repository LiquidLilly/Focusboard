/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"IBM Plex Mono"', '"Courier Prime"', 'Courier New', 'monospace'],
      },
      colors: {
        // Retro palette
        parchment: '#faf9f6',
        'warm-gray': '#c8c4bb',
        charcoal: '#2c2a26',
        'muted-blue': '#7b97b0',
        'sage-green': '#8aab8a',
        'warm-amber': '#c49a4a',
        'blush-pink': '#c4897a',
        'dusty-lavender': '#9b8fb0',
      },
    },
  },
  plugins: [],
}
