/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        palette: {
          azul: "#28374A",
          azulDark: "#1C2735",
          azulLight: "#394B62",
          terra: "#B8502E",
          terraDark: "#5E362C",
          terraLight: "#8E5547",
          verde: "#6B6751",
          verdeDark: "#54513F",
          verdeLight: "#847F65",
          areia: "#D3C7AD",
          areiaLight: "#E8E1D1",
          areiaDark: "#B8AA8E",
          bg: "#F2ECE3",
          bgLight: "#FAF7F2",
          card: "#FFFFFF",
          border: "#D3C7AD",
          text: "#28374A",
          textMuted: "#6B6751",
        }
      }
    },
  },
  plugins: [],
}
