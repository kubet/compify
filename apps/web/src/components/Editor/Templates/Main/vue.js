export const vueMain = (code, initSettings, imports = '') => `
import { createApp } from 'vue';
import App from './App.vue';
${imports}

window.ComponentCapture = ${JSON.stringify(initSettings)};

const rootElement = document.getElementById('app');

createApp(App).mount('#app');
`