/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/components/managegt-*/**/*.{html,ts}",
    "./src/app/components/admin-*/**/*.{html,ts}",
    "./src/app/components/analytics-page/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          soft: 'var(--color-primary-soft)',
        },
        background: {
          main: 'var(--color-bg-main)',
          card: 'var(--color-bg-card)',
          hover: 'var(--color-bg-hover)',
          player: 'var(--color-bg-player)',
        }
      }
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  }
}

