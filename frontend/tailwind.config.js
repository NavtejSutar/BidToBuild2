/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f4f6f5',
          100: '#e4e8e5',
          200: '#cbd4cd',
          300: '#abb5ad',
          400: '#8e9a90',
          500: '#738075',
        },
        coral: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ea4335',
          600: '#d9372a',
        },
        teal: {
          500: '#5a98a8',
          600: '#4a8594',
        },
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
        }
      },
      borderRadius: {
        'md': '0.375rem',
      }
    },
  },
  plugins: [],
}
