/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:    '#000154',  // main background
          slate: '#333476',  // pastel/alt background
          blue:  '#1A58D3',
          sky:   '#52D5FF',
          psky:  '#97E6FF',  // pastel sky
          green: '#31EE88',
          pgreen:'#83F5B8',
        },
      },
      boxShadow: {
        soft: '0 8px 30px rgba(0,0,0,.25)',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      }
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
