/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: '#070B14',
        panel: '#0D1424',
        panel2: '#151E30',
        line: '#1E2A42',
        accent: '#36D6FF',
        ai: '#9166FF',
        mastery: '#5BE7A9',
        warn: '#FFB86B',
        danger: '#FF6B81',
        ink: '#E8EDF7',
        muted: '#8B97AD',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(54,214,255,0.18), 0 0 32px -8px rgba(54,214,255,0.35)',
        panel: '0 24px 60px -24px rgba(0,0,0,0.8)',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseSoft: {
          '0%,100%': { opacity: '0.45' },
          '50%': { opacity: '1' },
        },
        dash: { to: { strokeDashoffset: '-1000' } },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        pulseSoft: 'pulseSoft 3s ease-in-out infinite',
        dash: 'dash 18s linear infinite',
        shimmer: 'shimmer 2.2s linear infinite',
      },
    },
  },
  plugins: [],
};
