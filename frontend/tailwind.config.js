/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          bg: '#F8FAFF',
          card: '#FFFFFF',
          primary: '#5278E8',
          primaryHover: '#4365D0',
          lavender: '#A5B4FC',
          lavenderLight: '#EEF2FF',
          sky: '#38BDF8',
          skyLight: '#F0F9FF',
          success: '#22C55E',
          successLight: '#F0FDF4',
          warning: '#F59E0B',
          warningLight: '#FFFBEB',
          danger: '#EF4444',
          dangerLight: '#FEF2F2',
          text: '#1E293B',
          muted: '#64748B',
          lightMuted: '#94A3B8',
          border: '#E8ECF5',
          borderHover: '#D1D9EB',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(82, 120, 232, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 30px -4px rgba(82, 120, 232, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.05)',
        'card': '0 2px 12px rgba(148, 163, 184, 0.12)',
        'glow-primary': '0 0 24px -4px rgba(82, 120, 232, 0.35)',
        'glow-danger': '0 0 24px -4px rgba(239, 68, 68, 0.35)',
        'glow-warning': '0 0 24px -4px rgba(245, 158, 11, 0.35)',
      }
    },
  },
  plugins: [],
}
