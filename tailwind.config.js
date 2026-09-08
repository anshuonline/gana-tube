/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/components/managegt-*/**/*.{html,ts}",
    "./src/app/components/admin-*/**/*.{html,ts}",
    "./src/app/components/analytics-page/**/*.{html,ts}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  }
}

