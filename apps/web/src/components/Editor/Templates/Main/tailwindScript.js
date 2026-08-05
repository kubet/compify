export default function tailwindScript() {
    return {
        '/tailwind.config.js': {
            code: `export default {
    content: [],
    theme: {
        extend: {},
    },
    plugins: [],
}`
        },
        '/globals.css': {
            code: ''
        }
    }
}