/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: {
          base:     '#0d1117',
          surface:  '#161b22',
          elevated: '#1f2937',
          overlay:  '#273244',
        },
        accent: {
          primary: '#48b9c7',
          orange:  '#e9a84c',
          red:     '#e05c5c',
          green:   '#4caf82',
          purple:  '#9d7fe8',
        },
        text: {
          primary:   '#e6edf3',
          secondary: '#8b949e',
          muted:     '#484f58',
        },
        border: {
          subtle:  '#21262d',
          default: '#30363d',
          accent:  '#48b9c7',
        },
      },
    },
  },
  plugins: [],
}
