/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./**/*.html",
    "./js/**/*.js",
    "./css/**/*.css"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a2b6d',     // azul institucional
        secondary: '#0ea5e9',   // celeste
        accent: '#d81b60',      // magenta
        dark: '#1e293b',
        light: '#f8fafc'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        lg: '10px'
      }
    },
  },
  plugins: [],
}
