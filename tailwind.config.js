/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        whatsapp: { DEFAULT: '#25D366', dark: '#1a9e4c', light: '#e8fdf1' },
        naija: { gold: '#F5A623', dark: '#854F0B', light: '#fff8ec' }
      }
    }
  },
  plugins: []
}
