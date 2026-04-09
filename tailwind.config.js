/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          masters: '#06402B',
          mid:     '#0A5C3E',
          light:   '#0F7A52',
        },
        cream: {
          DEFAULT: '#F5EFE0',
          dark:    '#EDE4CF',
        },
        gold: {
          DEFAULT: '#C9A24A',
          light:   '#E2C47A',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans:    ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
