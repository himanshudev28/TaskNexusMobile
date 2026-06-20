/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4f46e5',
        secondary: '#8b5cf6',
        accent: '#ec4899',
        surface: '#ffffff',
        'surface-2': '#f5f5f5',
        'surface-3': '#ececec',
        text: '#000000',
        'text-2': '#595959',
        'text-3': '#8a8a8a',
        'text-4': '#b3b3b3',
        border: '#e5e5e5',
        danger: '#dc2626',
        success: '#10b981',
        warning: '#f59e0b',
      },
      fontFamily: {
        sans: ['System', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
};
