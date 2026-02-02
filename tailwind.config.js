/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'cyber-bg': '#0a0a0f',
        'cyber-card': '#12121a',
        'cyber-border': '#1e1e2e',
        'cyber-blue': '#00d4ff',
        'cyber-purple': '#a855f7',
        'cyber-pink': '#ec4899',
        'cyber-green': '#22c55e'
      }
    }
  },
  plugins: []
}
