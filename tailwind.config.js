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
          DEFAULT: '#FCF9F9',
          variant: '#F6ECEC',
          card: '#FFFFFF',
        },
        onSurface: {
          DEFAULT: '#1C1B1A',
          variant: '#4A4844',
          muted: '#7A7670',
        },
        outline: {
          DEFAULT: '#E2D5D5',
          light: '#F0E6E6',
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
        level1: '0 1px 3px rgba(0,0,0,0.08)',
        level2: '0 2px 6px rgba(0,0,0,0.12)',
        level3: '0 4px 16px rgba(0,0,0,0.16)',
      }
    },
  },
  plugins: [],
}
