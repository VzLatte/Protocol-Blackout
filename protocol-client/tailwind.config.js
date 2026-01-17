/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Fixed: This now scans App.tsx and index.tsx
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/hooks/**/*.{js,ts,jsx,tsx}",
    "../shared/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#020617',
        }
      },
      keyframes: {
      shake: {
        '0%, 100%': { transform: 'translateX(0)' },
        '25%': { transform: 'translateX(-2px)' },
        '75%': { transform: 'translateX(2px)' },
      },
      draw: {
        from: { strokeDashoffset: '100' },
        to: { strokeDashoffset: '0' },
      }
    },
    
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake-hit': 'shake 0.2s ease-in-out infinite',
      'draw-line': 'draw 0.5s ease-out forwards',
      }
    },
  },
  plugins: [],
}