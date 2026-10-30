/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        resq: {
          dark: '#070D18',
          navy: '#0B1528',
          card: '#0F1E36',
          cardLight: '#152542',
          border: '#1E3256',
          borderLight: '#2D4A77',
          blue: '#1D63FF',
          blueHover: '#1552DB',
          cyan: '#06B6D4',
          danger: '#EF4444',
          dangerDark: '#991B1B',
          warning: '#F59E0B',
          warningDark: '#92400E',
          success: '#10B981',
          successDark: '#065F46',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-red': '0 0 25px -5px rgba(239, 68, 68, 0.4)',
        'glow-blue': '0 0 25px -5px rgba(29, 99, 255, 0.35)',
        'glow-amber': '0 0 25px -5px rgba(245, 158, 11, 0.35)',
      }
    },
  },
  plugins: [],
}
