module.exports = {
  content: [
    './index.html',
    './index-lanyard-photo (1).html',
    './js/**/*.js'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      colors: {
        navy: {
          DEFAULT: '#050309',
          950: '#030206',
          900: '#080612',
          800: '#140518'
        },
        vlsi: {
          50: 'rgba(255, 31, 90, 0.12)',
          100: 'rgba(255, 31, 90, 0.22)',
          300: '#ff7098',
          400: '#ff3366',
          500: '#ff1f5a',
          600: '#c01245',
          700: '#8c1040'
        },
        lead: {
          50: 'rgba(255, 51, 102, 0.12)',
          100: 'rgba(255, 51, 102, 0.22)',
          300: '#ff8da1',
          400: '#ff5277',
          500: '#ff1f5a',
          600: '#c01245',
          700: '#8c1040'
        },
        vid: {
          50: '#fef3fb',
          100: '#fce3f7',
          300: '#f3a6e3',
          400: '#e35fc9',
          500: '#C026D3',
          600: '#A21CAF',
          700: '#86198F'
        }
      }
    }
  },
  plugins: []
};
