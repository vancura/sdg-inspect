// @ts-check

/** @type {import('tailwindcss').Config} */
const config = {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],

    theme: {
        extend: {
            fontFamily: {
                sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
                mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace']
            },

            colors: {
                debug: '#f0f',
                background: '#eee',
                'primary-text': 'rgba(0, 0, 0, 0.87)'
            }
        }
    },

    plugins: []
};

module.exports = config;
