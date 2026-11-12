/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#0c1523",
          800: "#101B2D",
          700: "#192842",
          600: "#243758",
        },
        electric: {
          500: "#2563EB",
          600: "#1D4ED8",
          700: "#1E40AF",
        },
        energy: {
          500: "#16A34A",
          600: "#15803D",
          50: "#F0FDF4",
        },
        surface: {
          bg: "#F5F7FB",
          card: "#FFFFFF",
          border: "#E2E8F0",
          subtle: "#F8FAFC",
        },
        alert: {
          warning: "#F59E0B",
          danger: "#DC2626",
          info: "#0284C7",
          success: "#16A34A",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

