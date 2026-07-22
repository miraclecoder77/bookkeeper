module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand — indigo/violet
        indigo: {
          50:  '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },
        violet: {
          50:  '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        // Canvas / surface tokens (map CSS vars)
        canvas:    { DEFAULT: '#F8FAFC', dark: '#080B14' },
        surface:   { DEFAULT: '#FFFFFF', dark: '#0F1320', 2: '#F1F5F9', '2-dark': '#151A2B', 3: '#F8FAFC', '3-dark': '#181E31' },

        // Semantic
        income:      { DEFAULT: '#16A34A', dark: '#34D399' },
        outstanding: { DEFAULT: '#CA8A04', dark: '#FACC15' },
        expense:     { DEFAULT: '#DC2626', dark: '#F87171' },
        paid:        { DEFAULT: '#2563EB', dark: '#60A5FA' },

        // Slate (body text, borders, etc.)
        slate: {
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          850: '#162032',
          900: '#0F172A',
          925: '#080F1A',
          950: '#080B14',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans:    ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono:    ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
        'hero-sm': ['2.625rem', { lineHeight: '1.02', letterSpacing: '-0.055em' }],
        'hero-lg': ['3.75rem',  { lineHeight: '1.02', letterSpacing: '-0.055em' }],
      },
      borderRadius: {
        'sm': '0.75rem',   /* 12px */
        'DEFAULT': '1rem', /* 16px */
        'lg': '1.5rem',    /* 24px */
        'xl': '2rem',      /* 32px */
        '2xl': '2.5rem',
      },
      boxShadow: {
        'card':          'var(--shadow-card)',
        'elevated':      'var(--shadow-elevated)',
        'sheet':         'var(--shadow-sheet)',
        'brand':         '0 4px 20px rgba(99,102,241,0.35)',
        'brand-lg':      '0 8px 32px rgba(99,102,241,0.45)',
        'glow-income':   '0 0 0 3px rgba(22,163,74,0.25)',
        'glow-brand':    '0 0 0 3px rgba(99,102,241,0.25)',
      },
      backgroundImage: {
        'brand-gradient':   'linear-gradient(135deg, #4F46E5 0%, #8B5CF6 100%)',
        'brand-gradient-dk':'linear-gradient(135deg, #6366F1 0%, #A78BFA 100%)',
        'hero-glow':        'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.25) 0%, transparent 70%)',
        'grid':             "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.03' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-in':      'fade-in 400ms cubic-bezier(0.16,1,0.3,1) both',
        'slide-up':     'slide-up 500ms cubic-bezier(0.16,1,0.3,1) both',
        'slide-down':   'slide-down 300ms cubic-bezier(0.16,1,0.3,1) both',
        'scale-in':     'scale-in 350ms cubic-bezier(0.16,1,0.3,1) both',
        'sheet-up':     'sheet-up 420ms cubic-bezier(0.34,1.56,0.64,1) both',
        'float':        'float 5s ease-in-out infinite',
        'spin-slow':    'spin 8s linear infinite',
        'fab-pulse':    'fab-pulse 2.5s ease-in-out infinite',
        'skeleton':     'skeleton-shimmer 1.6s ease-in-out infinite',
        'scan-line':    'scan-line 1.8s ease-in-out infinite alternate',
      },
      keyframes: {
        'fade-in':   { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up':  { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'slide-down':{ from: { opacity: '0', transform: 'translateY(-10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'scale-in':  { from: { opacity: '0', transform: 'scale(0.94)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'sheet-up':  { from: { transform: 'translateY(100%)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        'float':     { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        'fab-pulse': {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(99,102,241,0.4), 0 4px 20px rgba(99,102,241,0.3)' },
          '50%':     { boxShadow: '0 0 0 8px rgba(99,102,241,0), 0 4px 24px rgba(99,102,241,0.4)' },
        },
        'skeleton-shimmer': {
          '0%':   { backgroundPosition: '100% 0' },
          '100%': { backgroundPosition: '-100% 0' },
        },
        'scan-line': {
          '0%':   { top: '8px' },
          '100%': { top: 'calc(100% - 8px)' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'out':    'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
