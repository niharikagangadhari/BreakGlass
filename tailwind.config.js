/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#070C1E',
          800: '#0B132B',
          700: '#1C2541',
          600: '#283556',
          500: '#3A506B',
        },
        emergency: {
          DEFAULT: '#DC2626',
          hover: '#B91C1C',
          light: '#FEE2E2',
          border: '#FCA5A5',
        },
        security: {
          active: '#059669',
          activeBg: '#ECFDF5',
          pending: '#D97706',
          pendingBg: '#FFFBEB',
          rejected: '#DC2626',
          rejectedBg: '#FEF2F2',
          expired: '#4B5563',
          expiredBg: '#F3F4F6',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
