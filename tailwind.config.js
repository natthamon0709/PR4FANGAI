/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#800000', // Fang Vocational Maroon (สีเลือดหมู วิทยาลัยการอาชีพฝาง)
          dark: '#520000',
          light: '#a01a1a',
          container: '#fdf2f2',
          onContainer: '#3d0000',
        },
        secondary: {
          DEFAULT: '#d97706', // College Gold (สีทอง)
          dark: '#b45309',
          light: '#f59e0b',
          container: '#fef3c7',
          onContainer: '#451a03',
        },
        surface: {
          DEFAULT: '#F8F9FA', // Clean crisp off-white for modern enterprise SaaS look
          variant: '#F1F3F5',
          card: '#FFFFFF',
        },
        onSurface: {
          DEFAULT: '#1C1B1A',
          variant: '#4A4844',
          muted: '#7A7670',
        },
        outline: {
          DEFAULT: '#E5E7EB', // Clean modern border
          light: '#F3F4F6',
          brand: '#E2D5D5', // Subtle warm accent border
        },
        error: {
          DEFAULT: '#B3261E',
          container: '#F9DEDC',
        },
        success: {
          DEFAULT: '#2E7D32',
          container: '#D4EDDA',
        }
      },
      fontFamily: {
        sans: ['"Noto Sans Thai"', 'system-ui', 'sans-serif'],
        heading: ['"IBM Plex Sans Thai"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 4px 14px -2px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 10px 25px -4px rgba(128, 0, 0, 0.08), 0 4px 10px -2px rgba(0, 0, 0, 0.04)',
        level1: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        level2: '0 4px 16px -2px rgba(0, 0, 0, 0.06), 0 2px 6px -2px rgba(0, 0, 0, 0.03)',
        level3: '0 16px 36px -4px rgba(0, 0, 0, 0.1), 0 6px 14px -2px rgba(0, 0, 0, 0.05)',
        'glow-maroon': '0 0 24px -4px rgba(128, 0, 0, 0.25)',
        'glow-gold': '0 0 20px -3px rgba(217, 119, 6, 0.3)',
      }
    },
  },
  plugins: [],
}
