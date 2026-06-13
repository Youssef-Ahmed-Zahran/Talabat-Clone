/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF5A00',
          light: '#FF7A2E',
          dark: '#E04E00',
          soft: '#FFF0E6',
        },
        secondary: {
          DEFAULT: '#1A1A2E',
          light: '#2D2D44',
        },
        textPrimary: '#1A1A2E',
        textSecondary: '#6B7280',
        textTertiary: '#9CA3AF',
        surface: '#FFFFFF',
        surfaceAlt: '#FAFAFA',
        border: '#E8E8E8',
      },
      borderRadius: {
        'xl': '20px',
        '2xl': '24px',
      }
    },
  },
  plugins: [],
};
