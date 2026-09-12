/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f7ff",
          100: "#e0eefe",
          500: "#3b7dd8",
          600: "#2f66b3",
          700: "#28558f",
        },
      },
    },
  },
  plugins: [],
};
