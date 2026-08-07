export function daisyuiTailwindScript() {
    return {
        '/tailwind.config.js': {
            code: `export default {
    content: [],
    theme: {
        extend: {},
    },
    daisyui: {
        themes: [{ }]
    }
}`
        },
        '/globals.css': {
            code: ''
        },
        'daisyui.js': {
            code: `export default function() {
  return {};
}

module.exports = exports.default`,
            hidden: true
        }
    }
}
export function daisyuiTsTailwindScript() {
    return {
        '/tailwind.config.ts': {
            code: `export default {
    content: [],
    theme: {
        extend: {},
    },
      daisyui: {
    themes: [{ }]}
}`
        },
        '/globals.css': {
            code: ''
        },
        'daisyui.ts': {
            code: `export default function() {
  return {};
}

module.exports = exports.default`,
            hidden: true
        }
    }
}