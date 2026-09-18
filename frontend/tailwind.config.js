/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          bg: '#fcfaf6',
          card: '#f4ede2',
          hover: '#ebe1d1',
          border: '#e4d8c5',
          input: '#ffffff',
        },
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
        stone: {
          800: '#292524',
          900: '#1c1917',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'fintech': '0 4px 20px -2px rgba(41, 37, 36, 0.06), 0 2px 6px -1px rgba(41, 37, 36, 0.04)',
        'card': '0 10px 25px -5px rgba(234, 88, 12, 0.08), 0 8px 10px -6px rgba(41, 37, 36, 0.04)',
      }
    },
  },
  plugins: [],
};
