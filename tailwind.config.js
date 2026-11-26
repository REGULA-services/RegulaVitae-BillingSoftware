/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/index.html",
    "./src/renderer/src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bakery: {
          50: '#fff8f3',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c25222',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407'
        },
        clinic: {
          50: '#fff8f3',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c25222',
          800: '#9a3412',
          900: '#7c2d12'
        },
        terminal: {
          bg: '#fffbf7',
          card: '#ffffff',
          input: '#fff7ed',
          text: '#0f172a',
          accent: '#c25222',
          success: '#059669',
          danger: '#e11d48',
          highlight: '#ea580c'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace']
      }
    }
  },
  plugins: []
}
