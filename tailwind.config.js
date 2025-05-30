/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: '#121212',
        primary: '#6366f1', // Indigo
        blue: {
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}
