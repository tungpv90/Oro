/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ee',
          100: '#fdedd6',
          200: '#fad7ad',
          300: '#f6ba78',
          400: '#f19341',
          500: '#ee781c',
          600: '#df5e12',
          700: '#b94712',
          800: '#933916',
          900: '#773115',
        },
      },
    },
  },
  plugins: [],
};
