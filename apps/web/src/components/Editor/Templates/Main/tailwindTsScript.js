export default function tailwindTsScript() {
    return {
        '/tailwind.config.ts': {
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