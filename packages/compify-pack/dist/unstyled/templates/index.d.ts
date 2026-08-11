export { ANGULAR_TEMPLATE } from "./runtime/angular";
export { REACT_TEMPLATE } from "./runtime/react";
export { REACT_TYPESCRIPT_TEMPLATE } from "./runtime/react-typescript";
export { SOLID_TEMPLATE } from "./runtime/solid";
export { SVELTE_TEMPLATE } from "./runtime/svelte";
export { TEST_TYPESCRIPT_TEMPLATE } from "./runtime/tests-ts";
export { VANILLA_TEMPLATE } from "./runtime/vanilla";
export { VANILLA_TYPESCRIPT_TEMPLATE } from "./runtime/vanilla-typescript";
export { VUE_TEMPLATE } from "./runtime/vue";
export declare const SANDBOX_TEMPLATES: {
    static: {
        files: {
            "/index.html": {
                code: string;
            };
            "/package.json": {
                code: string;
            };
            "/styles.css": {
                code: string;
            };
        };
        main: string;
        environment: string;
    };
    angular: {
        files: {
            "/src/app/app.component.css": {
                code: string;
            };
            "/src/app/app.component.html": {
                code: string;
            };
            "/src/app/app.component.ts": {
                code: string;
            };
            "/src/app/app.module.ts": {
                code: string;
            };
            "/src/index.html": {
                code: string;
            };
            "/src/main.ts": {
                code: string;
            };
            "/src/polyfills.ts": {
                code: string;
            };
            "/package.json": {
                code: string;
            };
        };
        main: string;
        environment: string;
    };
    react: {
        files: {
            "/App.js": {
                code: string;
            };
            "/index.js": {
                code: string;
            };
            "/public/index.html": {
                code: string;
            };
            "/package.json": {
                code: string;
            };
            "/styles.css": {
                code: string;
            };
        };
        main: string;
        environment: string;
    };
    "react-ts": {
        files: {
            "tsconfig.json": {
                code: string;
            };
            "/App.tsx": {
                code: string;
            };
            "/index.tsx": {
                code: string;
            };
            "/public/index.html": {
                code: string;
            };
            "/package.json": {
                code: string;
            };
            "/styles.css": {
                code: string;
            };
        };
        main: string;
        environment: string;
    };
    solid: {
        files: {
            "/App.tsx": {
                code: string;
            };
            "/index.tsx": {
                code: string;
            };
            "/index.html": {
                code: string;
            };
            "/package.json": {
                code: string;
            };
            "/styles.css": {
                code: string;
            };
        };
        main: string;
        environment: string;
    };
    svelte: {
        files: {
            "/App.svelte": {
                code: string;
            };
            "/index.js": {
                code: string;
            };
            "/public/index.html": {
                code: string;
            };
            "/package.json": {
                code: string;
            };
            "/styles.css": {
                code: string;
            };
        };
        main: string;
        environment: string;
    };
    "test-ts": {
        files: {
            "tsconfig.json": {
                code: string;
            };
            "/add.ts": {
                code: string;
            };
            "/add.test.ts": {
                code: string;
            };
            "package.json": {
                code: string;
            };
        };
        main: string;
        environment: string;
        mode: string;
    };
    "vanilla-ts": {
        files: {
            "tsconfig.json": {
                code: string;
            };
            "/index.ts": {
                code: string;
            };
            "/index.html": {
                code: string;
            };
            "/package.json": {
                code: string;
            };
            "/styles.css": {
                code: string;
            };
        };
        main: string;
        environment: string;
    };
    vanilla: {
        files: {
            "/index.js": {
                code: string;
            };
            "/index.html": {
                code: string;
            };
            "/package.json": {
                code: string;
            };
            "/styles.css": {
                code: string;
            };
        };
        main: string;
        environment: string;
    };
    vue: {
        files: {
            "/src/styles.css": {
                code: string;
            };
            "/src/App.vue": {
                code: string;
            };
            "/src/main.js": {
                code: string;
            };
            "/public/index.html": {
                code: string;
            };
            "/package.json": {
                code: string;
            };
        };
        main: string;
        environment: string;
    };
    "vue-ts": {
        files: {
            "/src/styles.css": {
                code: string;
            };
            "/src/App.vue": {
                code: string;
            };
            "/src/main.ts": {
                code: string;
            };
            "/src/shims-vue.d.ts": string;
            "/public/index.html": {
                code: string;
            };
            "/package.json": {
                code: string;
            };
            "/tsconfig.json": {
                code: string;
            };
        };
        main: string;
        environment: string;
    };
};
export declare const isUnsupportedServerTemplate: (template: string) => boolean;
