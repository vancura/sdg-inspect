module.exports = {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['monospace']
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
