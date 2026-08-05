export default function tailwindv4Script() {
    return {
        '/globals.css': {
            code: '@import "tailwindcss"; \n@theme {}'
        }
    }
}