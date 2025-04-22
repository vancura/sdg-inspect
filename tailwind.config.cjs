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
                background: '#3B3B3B',
                'text-editor-bg': 'rgba(255, 255, 255, 0.8)',
                'text-editor-text': 'rgba(0, 0, 0, 1)',
                'primary-sep': 'rgba(255, 255, 255, 0.6)',
                'secondary-sep': 'rgba(255, 255, 255, 0.2)',
                'primary-text': 'rgba(255, 255, 255, 1)',
                'secondary-text': 'rgba(255, 255, 255, 0.45)',
                'button-stroke': 'rgba(255, 255, 255, 1)',
                'button-label': 'rgba(255, 255, 255, 1)',
                'button-hover-bg': 'rgba(255, 255, 255, 1)',
                'button-hover-text': 'rgba(0, 0, 0, 1)'
            }
        }
    },

    plugins: [
        function ({ addVariant }) {
            addVariant('preview-block-highlight', '.preview-block-highlight &');
        }
    ]
};

module.exports = config;
