/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary brand palette — forest green
        // To change the brand color, update these values
        forest: {
          50:  '#f0f7f4',
          100: '#d9ede5',
          200: '#b3dbcb',
          300: '#7ec2a8',
          400: '#4fa384',
          500: '#2d7a4f',
          600: '#1a5c38',
          700: '#144730',
          800: '#113828',
          900: '#0d2e21',
        },
        // Accent color — warm amber (bear-inspired)
        amber: {
          50:  '#fdf8ee',
          100: '#faefd0',
          200: '#f5d99a',
          300: '#efbb5c',
          400: '#e8a12e',
          500: '#c17f24',
          600: '#9e631a',
          700: '#7d4c15',
          800: '#633c13',
          900: '#4e3011',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.08)',
      },
    },
  },
  plugins: [],
}
