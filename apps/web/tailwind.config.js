/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundColor: {
        'custom-black': '#040404',
      },
      animation: {
        'blob-move': 'blobMove 20s infinite',
      },
      keyframes: {
        blobMove: {
          '0%, 100%': {
            transform: 'translate(0px, 0px) scale(1)',
            backgroundColor: 'hsl(240, 100%, 50%)',
          },
          '25%': {
            transform: 'translate(50px, -70px) scale(1.3)',
            backgroundColor: 'hsl(300, 100%, 50%)',
          },
          '50%': {
            transform: 'translate(-30px, 50px) scale(0.9)',
            backgroundColor: 'hsl(360, 100%, 50%)',
          },
          '75%': {
            transform: 'translate(70px, 30px) scale(1.1)',
            backgroundColor: 'hsl(180, 100%, 50%)',
          },
        },
      },
    },
  },
  plugins: [],
};
