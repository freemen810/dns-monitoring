/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Apple-inspired neutral palette
        accent: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        success: '#34c759', // Apple green
        warning: '#ff9500', // Apple orange
        error: '#ff3b30',   // Apple red
        neutral: {
          0: '#ffffff',
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
          '"Apple Color Emoji"',
        ],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px', letterSpacing: '0.3px' }],
        sm: ['13px', { lineHeight: '18px', letterSpacing: '0.2px' }],
        base: ['15px', { lineHeight: '22px', letterSpacing: '0.15px' }],
        lg: ['17px', { lineHeight: '24px', letterSpacing: '0.1px' }],
        xl: ['19px', { lineHeight: '28px', letterSpacing: '0px' }],
        '2xl': ['22px', { lineHeight: '32px', letterSpacing: '-0.3px' }],
      },
      boxShadow: {
        xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
        sm: '0 2px 4px rgba(0, 0, 0, 0.05)',
        base: '0 4px 6px rgba(0, 0, 0, 0.07)',
        md: '0 8px 12px rgba(0, 0, 0, 0.08)',
        lg: '0 12px 24px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        base: '8px',
        md: '10px',
        lg: '12px',
        xl: '16px',
      },
    },
  },
  plugins: [],
}
