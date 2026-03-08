import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'harbor-deep':    '#1B2A3B',
        'harbor-slate':   '#2E4057',
        'harbor-water':   '#4A7FA5',
        'harbor-seafoam': '#72B8A0',
        'harbor-sand':    '#F0E6D3',
        'harbor-mist':    '#F7F4EF',
        'harbor-fog':     '#E8E2D9',
      },
      fontFamily: {
        sans:  ['var(--font-inter)', 'Inter', 'sans-serif'],
        serif: ['var(--font-lora)', 'Lora', 'serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '18px',
        xl: '24px',
      },
    },
  },
  plugins: [],
}

export default config
