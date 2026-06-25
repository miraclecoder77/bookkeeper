module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9ff",
          500: "#0084ff",
          600: "#0070cc",
          700: "#005aa3",
        },
      },
    },
  },
  plugins: [],
}
