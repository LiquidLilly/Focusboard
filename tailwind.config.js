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
        // Dark Cyber palette
        cyber: {
          bg:        '#0d0d0d',
          cyan:      '#00fff7',
          magenta:   '#ff00ff',
          amber:     '#ffb000',
          red:       '#ff2020',
          dim:       '#1a1a2e',
          text:      '#e0e0e0',
          'text-dim':'#444466',
          border:    '#1e1e3a',
        },
      },
    },
  },
  plugins: [],
}
