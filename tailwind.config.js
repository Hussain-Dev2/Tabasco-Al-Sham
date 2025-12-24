export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'banana-yellow': '#FFD700', // Gold/Yellow
        'banana-black': '#111111',  // Deep Black
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'], // Or any other nice font
      }
    },
  },
  plugins: [],
}

