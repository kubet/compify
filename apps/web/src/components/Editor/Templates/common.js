import React, { useState } from "react";
import { nextjsAdditionalFiles, nextjsMain } from "./Main/nextjs";
import { reactMain } from "./Main/react";
import { reactTsMain } from "./Main/react-ts";
import tailwindScript from "./Main/tailwindScript";
import tailwindTsScript from "./Main/tailwindTsScript";
import { vueMain } from "./Main/vue";
import { vueTsMain } from "./Main/vue-ts";
import globalsCss from "./Scripts/globals.css";
import tailwindShadcnTsScript from "./Scripts/shadcn-tailwind-ts";
import tailwindv4Script from "./tailwindv4Script";
import { daisyuiTailwindScript, daisyuiTsTailwindScript } from "./Main/daisyUITailwindScript";
import { nextTsAdditionalFiles, nextTsMain } from "./Main/nextts";
import { reactNativeMain } from "./Main/react-native";
import { reactNativeTsAdditionalFiles, reactNativeTsMain } from "./Main/react-native-ts";
import { daisyuiThemeImport } from "./Scripts/daisyui-theme-import";
import { themeInitScript } from "./Main/themeInitScript";

export const fileTemplates = [
  // {
  //   name: 'angular',
  //   files: {
  //     '/src/main.ts': { type: 'main' },
  //     '/src/app/app.component.ts': {
  //       hidden: true,
  //       type: 'code'
  //     }
  //   }
  // },
  // {
  //   name: 'solid',
  //   files: {
  //     '/index.tsx': { code: '', type: 'main' },
  //     '/App.tsx': { code: 'string', type: 'code' }
  //   }
  // },
  // {
  //   name: 'svelte',
  //   files: {
  //     '/index.js': { code: '', type: 'main' },
  //     '/App.svelte': { code: 'string', type: 'code' }
  //   }
  // },
  // {
  //   name: 'astro',
  //   files: {
  //     '/src/pages/index.astro': { code: 'string', type: 'main' }
  //   }
  // },
  // {
  //   name: 'static',
  //   files: {
  //     '/index.html': { code: '', type: 'code' },
  //   }
  // }
  {
    name: 'react',
    files: {
      '/App.js': { type: 'code' },
      '/index.js': {
        hidden: true,
        type: 'main'
      }
    }
  },
  {
    name: 'react-ts',
    files: {
      '/App.tsx': { type: 'code' },
      '/index.tsx': { type: 'main', hidden: true },
    }
  },
  {
    name: 'vue',
    files: {
      '/src/main.js': { code: '', type: 'main' },
      '/src/App.vue': { code: 'string', type: 'code' }
    }
  },
  {
    name: 'vue-ts',
    files: {
      '/src/main.ts': { code: '', type: 'main' },
      '/src/App.vue': { code: 'string', type: 'code' }
    }
  },
  {
    name: 'nextjs',
    files: {
      '/App.js': { type: 'code' },
      '/index.js': {
        hidden: true,
        type: 'main'
      }
    }
  },
  {
    name: 'nextjs-ts',
    files: {
      '/App.tsx': { type: 'code' },
      '/index.tsx': { type: 'main', hidden: true },
    }
  },
  {
    name: 'react-native',
    files: {
      '/App.js': { type: 'code' },
      '/index.js': { type: 'main', hidden: true },
    }
  },
  {
    name: 'react-native-ts',
    files: {
      '/App.tsx': { type: 'code' },
      '/index.tsx': { type: 'main', hidden: true },
    }
  }
]

const templateInitializers = {
  'react': reactMain,
  'react-ts': reactTsMain,
  'vue': vueMain,
  'vue-ts': vueTsMain,
  'nextjs': nextjsMain,
  'nextjs-ts': nextTsMain,
  'react-native': reactNativeMain,
  'react-native-ts': reactNativeTsMain,
};

const uiFrameworkImports = {
  'tailwind': [
    {
      import: "import tailwindConfig from './tailwind.config.js'; \n window.tailwind = window.tailwind || {};\nwindow.tailwind.config = tailwindConfig;",
      file: '/tailwind.config.js'
    },
    {
      import: "import './globals.css';",
      file: '/globals.css'
    }
  ],
  'tailwind-ts': [
    {
      import: "import tailwindConfig from './tailwind.config.ts'; \n window.tailwind = window.tailwind || {};\nwindow.tailwind.config = tailwindConfig;",
      file: '/tailwind.config.ts'
    },
    {
      import: "import './globals.css';",
      file: '/globals.css'
    }
  ],
  'daisyui': [
    {
      import: daisyuiThemeImport('js'),
      file: '/tailwind.config.js'
    },
    {
      import: "import './globals.css';",
      file: '/globals.css'
    }
  ],
  'daisyui-ts': [
    {
      import: daisyuiThemeImport('ts'),
      file: '/tailwind.config.ts'
    },
    {
      import: "import './globals.css';",
      file: '/globals.css'
    }
  ],
  'tailwind-v4': [
    {
      import: "import './globals.css';",
      file: '/globals.css'
    }
  ],
  'tailwind-ts-v4': [
    {
      import: "import './globals.css';",
      file: '/globals.css'
    }
  ],
  'shadcn': [
    {
      import: `import tailwindConfig from './tailwind.config.ts'; \n window.tailwind = window.tailwind || {};\nwindow.tailwind.config = tailwindConfig;
       const style = document.createElement('style');
       style.type = 'text/css';
  style.textContent = \`
        [class] {
        border-color: hsl(var(--border));
} 
    
    html {
  scroll-behavior: smooth
}
    
    body {
  overscroll-behavior: none;
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  font-synthesis-weight: none;
  text-rendering: optimizeLegibility
}
\`;
  document.head.appendChild(style);
      `,
      file: '/tailwind.config.ts'
    },
    {
      import: "import './globals.css';",
      file: '/globals.css'
    },

  ],
  'theme': [
    {
      import: 'import "./theme.css";',
      file: '/theme.css'
    }
  ]
};

const templateAdditionalFiles = {
  'nextjs': nextjsAdditionalFiles(),
  'nextjs-ts': nextTsAdditionalFiles(),
  'react-native-ts': reactNativeTsAdditionalFiles(),
}

const getTemplateAdditionalFiles = (template) => {
  return templateAdditionalFiles[template] || {};
}

const getUiFrameworkImport = (frameworks, files, autoValid = false) => {
  const imports = new Set();

  frameworks.forEach(framework => {
    const frameworkImports = uiFrameworkImports[framework] || [];

    // Filter imports based on whether their required files exist
    if (autoValid) {
      frameworkImports.forEach(imp => imports.add(imp.import));
    } else {
      const validImports = frameworkImports
        .filter(imp => !imp.file || files[imp.file])
        .map(imp => imp.import);
      validImports.forEach(imp => imports.add(imp));
    }
  });
  return Array.from(imports).join('\n');
}

export const fetchShadcnFiles = async () => {
  try {
    // Register service worker once
    if ('serviceWorker' in navigator && !navigator.serviceWorker.controller) {
      await navigator.serviceWorker.register('/service-worker.js');
    }

    const response = await fetch('https://cdn.compify.app/sui-content');
    if (!response.ok) {
      throw new Error(`Failed to fetch Shadcn files: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Shadcn files:', error);
    return {};
  }
}
export const fetchDaisyUIFiles = async () => {
  try {
    const DAISYUI_URL = 'https://cdn.jsdelivr.net/npm/daisyui@4.12.23/dist/full.min.css';

    const response = await fetch(DAISYUI_URL, {
      credentials: 'omit',
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch DaisyUI styles: ${response.status}`);
    }

    const content = await response.text();

    return {
      'daisyui.min.css': {
        code: content,
        hidden: true
      }
    };
  } catch (error) {
    console.error('Error fetching DaisyUI files:', error);
    return {};
  }
}
export const generateTemplateFiles = (template, previewSettings, usedUiFrameworks, files, autoValid = false) => {
  const templateConfig = fileTemplates.find(t => t.name === template);
  if (!templateConfig) {
    throw new Error(`Template "${template}" not found`);
  }

  const mainFile = Object.entries(templateConfig.files).find(([_, value]) => value.type === 'main');
  if (!mainFile) return {};

  const [fileName] = mainFile;
  const initializer = templateInitializers[template];
  return {
    [fileName]: {
      code: initializer ?
        initializer(null, { settings: previewSettings, usedUiFrameworks }, getUiFrameworkImport(usedUiFrameworks, files, autoValid)) :
        '',
      hidden: true
    },
    ...getTemplateAdditionalFiles(template)
  };
};


const initConfigFileFrameworkMap = {
  'shadcn': tailwindShadcnTsScript,
  'tailwind-ts': tailwindTsScript,
  'tailwind': tailwindScript,
  'tailwind-v4': tailwindv4Script,
  'tailwind-ts-v4': tailwindv4Script,
  'daisyui': daisyuiTailwindScript,
  'daisyui-ts': daisyuiTsTailwindScript,
  'theme': themeInitScript,
}

const getInitConfigFileFrameworkMap = (framework, files) => {
  const frameworkConfig = initConfigFileFrameworkMap[framework];
  if (!frameworkConfig) return {};

  // If files is not provided, return the full config
  if (!files) return frameworkConfig;

  // Get the config and filter out files that already exist
  const config = frameworkConfig();
  return Object.entries(config).reduce((acc, [filename, content]) => {
    if (!files[filename]) {
      acc[filename] = content;
    }
    return acc;
  }, {});
}

export const getUIConfigFiles = async (template, previewSettings, usedUiFrameworks, framework, files, autoValid = false) => {
  if (!initConfigFileFrameworkMap[framework]) return {};
  const usedUiFrameworksSet = new Set(usedUiFrameworks);
  usedUiFrameworksSet.add(framework);
  const indexFile = generateTemplateFiles(template, previewSettings, Array.from(usedUiFrameworksSet), files, autoValid);

  if (usedUiFrameworks.includes('shadcn') || framework === 'shadcn') {
    return {
      ...getInitConfigFileFrameworkMap(framework, files),
      ...await fetchShadcnFiles(),
      ...indexFile
    };
  }
  if (usedUiFrameworks.includes('daisyui') || framework === 'daisyui' || usedUiFrameworks.includes('daisyui-ts') || framework === 'daisyui-ts') {
    return {
      ...getInitConfigFileFrameworkMap(framework, files),
      ...await fetchDaisyUIFiles(),
      ...indexFile
    };
  }
  return {
    ...getInitConfigFileFrameworkMap(framework, files),
    ...indexFile
  };
}

export const runtimeList = [
  {
    id: 'nextjs',
    name: "Next.js (beta)",
    displayName: "Next.js",
    description: "Full-stack React framework",
    category: "Next.js",
    language: "JavaScript",
    version: "14.2.5",
    color: "hsl(280, 100%, 60%)"
  },
  {
    id: 'nextjs-ts',
    name: "Next.js TypeScript (beta)",
    displayName: "Next.js",
    description: "Full-stack React framework",
    category: "Next.js",
    language: "TypeScript",
    version: "14.2.5",
    color: "hsl(280, 100%, 60%)"
  },
  {
    id: 'react',
    name: "React",
    displayName: "React",
    description: "Web applications",
    category: "React",
    language: "JavaScript",
    version: "18.2.0",
    color: "hsl(221, 87%, 60%)"  // Bright sky blue
  },
  {
    id: 'react-ts',
    name: "React TypeScript",
    displayName: "React",
    description: "Web applications",
    category: "React",
    language: "TypeScript",
    version: "18.2.0",
    color: "hsl(221, 87%, 40%)"  // Vibrant blue
  },
  // {
  //   id: 'vue',
  //   name: "Vue",
  //   displayName: "Vue",
  //   description: "Progressive web apps",
  //   category: "Vue",
  //   language: "JavaScript",
  //   version: "3.3.4",
  //   color: "hsl(153, 47%, 49%)"  // Softer green
  // },
  // {
  //   id: 'vue-ts',
  //   name: "Vue TypeScript",
  //   displayName: "Vue",
  //   description: "Progressive web apps",
  //   category: "Vue",
  //   language: "TypeScript",
  //   version: "3.3.4",
  //   color: "hsl(153, 47%, 39%)"  // Lighter green
  // },
  {
    id: 'react-native',
    name: "React Native",
    displayName: "React Native",
    description: "Mobile applications",
    category: "React Native",
    language: "JavaScript",
    version: "0.74.3",
    color: "hsl(221, 87%, 30%)"
  },
  {
    id: 'react-native-ts',
    name: "React Native TypeScript",
    displayName: "React Native",
    description: "Mobile applications",
    category: "React Native",
    language: "TypeScript",
    version: "0.74.3",
    color: "hsl(221, 87%, 30%)"
  },

  // {
  //   id: 'static',
  //   name: "HTML",
  //   description: "A static HTML file",
  //   category: "Static",
  //   language: "HTML",
  //   version: "1.0.0",
  //   color: "hsl(0, 0%, 100%)"  // White
  // }
];

export const uiLibraries = [
  {
    id: 'tailwind',
    name: 'Tailwind CSS',
    type: 'Utility-first CSS framework',
    color: 'cyan',
    templates: ['react', 'vue', 'nextjs'],
    configurations: ['tailwind.config.js', "globals.css"],
    versions: ['tailwind', 'tailwind-v4']
  },
  {
    id: 'tailwind-ts',
    name: 'Tailwind CSS',
    type: 'Utility-first CSS framework',
    color: 'cyan',
    templates: ['react-ts', 'vue-ts', 'nextjs-ts'],
    configurations: ['tailwind.config.ts', "globals.css"],
    versions: ['tailwind-ts', 'tailwind-ts-v4']
  },
  {
    id: 'mui',
    name: 'Material UI',
    type: 'React UI library following Material Design',
    color: 'blue',
    templates: ['react', 'react-ts', 'nextjs', 'nextjs-ts'],
    configurations: ['globals.css']
  },
  {
    id: 'shadcn',
    name: 'Shadcn/ui',
    type: 'Re-usable components built with Radix UI and Tailwind',
    color: 'rgba(148, 163, 184, 1)',
    templates: ['react-ts', 'nextjs-ts'],
    configurations: ['globals.css', 'tailwind.config.ts']
  },
  {
    id: 'bootstrap',
    name: 'Bootstrap',
    type: 'Popular responsive CSS framework',
    color: 'purple',
    templates: ['react', 'react-ts', 'vue', 'vue-ts', 'nextjs', 'nextjs-ts'],
    configurations: ['globals.css']
  },
  {
    id: 'styled-components',
    name: 'Styled Components',
    type: 'CSS-in-JS library for React',
    color: '#c21366',
    templates: ['react', 'react-ts', 'nextjs', 'nextjs-ts'],
    configurations: ['globals.css']
  },
  {
    id: 'daisyui',
    name: 'daisyUI',
    type: 'Tailwind CSS component library',
    color: 'purple',
    templates: ['react', 'vue', 'nextjs'],
    configurations: ['globals.css', 'tailwind.config.js']
  },
  {
    id: 'daisyui-ts',
    name: 'daisyUI',
    type: 'Tailwind CSS component library',
    color: 'purple',
    templates: ['react-ts', 'vue-ts', 'nextjs-ts'],
    configurations: ['globals.css', 'tailwind.config.ts']
  }
]

export const uiLibsLabels = {
  'tailwind': 'Tailwind CSS',
  'tailwind-ts': 'Tailwind CSS',
  'tailwind-v4': 'Tailwind CSS v4',
  'tailwind--ts-v4': 'Tailwind CSS v4',
  'mui': 'Material UI',
  'bootstrap': 'Bootstrap',
  'shadcn': 'Shadcn/ui',
  'daisyui': 'daisyUI',
  'daisyui-ts': 'daisyUI'
}

export const runtimeLables = {
  'react': 'React JS',
  'react-ts': 'React TS',
  'nextjs': 'Next JS',
  'nextjs-ts': 'Next TS',
  // 'vue': 'Vue JS',
  // 'vue-ts': 'Vue TS',
  'react-native': 'React Native',
  'react-native-ts': 'React Native TS'
}


export const searchUiLibraries = [
  {
    id: 'tailwind',
    name: 'Tailwind CSS',
    color: 'blue',
    includes: ['tailwind', 'tailwind-ts']
  },
  {
    id: 'tailwind-v4',
    name: 'Tailwind CSS (v4)',
    color: 'blue',
    includes: ['tailwind-v4', 'tailwind-ts-v4']
  },
  {
    id: 'shadcn',
    name: 'Shadcn/ui',
    color: 'red',
    includes: ['shadcn']
  },
  {
    id: 'mui',
    name: 'Material UI',
    color: 'green',
    includes: ['mui']
  },
  {
    id: 'daisyui',
    name: 'DaisyUI',
    color: 'purple',
    includes: ['daisyui', 'daisyui-ts']
  },
  {
    id: 'bootstrap',
    name: 'Bootstrap',
    color: 'purple',
    includes: ['bootstrap']
  },
  {
    id: 'styled-components',
    name: 'Styled Components',
    color: 'yellow',
    includes: ['styled-components']
  },

]

export const uiFrameworkLook = {
  'mui': {
    label: 'Material UI',
    color: '#1241db',
    iconText: <span className='text-white'>MUI</span>,
  },
  'shadcn': {
    label: 'Shadcn/ui',
    color: '#000000',
    iconText: <span className='text-white'>S</span>,
    customCompactibilityError: {
      'tailwind': 'Tailwind CSS is already included in the shadcn/ui framework',
      'tailwind-ts': 'Tailwind CSS is already included in the shadcn/ui framework',
      'tailwind-v4': 'Tailwind CSS is already included in the shadcn/ui framework',
      'tailwind-ts-v4': 'Tailwind CSS is already included in the shadcn/ui framework',
    }
  },
  'tailwind': {
    label: 'Tailwind CSS',
    color: 'rgb(59 130 246)',
    iconText: <span className='text-white text-lg leading-none'>t</span>,
    versions: [
      { label: 'v3', value: 'tailwind' },
      { label: 'v4', value: 'tailwind-v4' }
    ],
    customCompactibilityError: {
      'shadcn': 'Tailwind CSS is already included in the shadcn/ui framework',
    }
  },
  'tailwind-ts': {
    label: 'Tailwind CSS',
    color: 'rgb(59 130 246)',
    iconText: <span className='text-white text-lg leading-none'>t</span>,
    versions: [
      { label: 'v3', value: 'tailwind-ts' },
      { label: 'v4', value: 'tailwind-ts-v4' }
    ],
    customCompactibilityError: {
      'shadcn': 'Tailwind CSS is already included in the shadcn/ui framework',
    }
  },
  'bootstrap': {
    label: 'Bootstrap',
    color: '#5c21b5',
    iconText: <span className='text-white'>B</span>
  },
  'chakra': {
    label: 'Chakra UI',
    color: '#319795',
    iconText: <span className='text-white'>C</span>
  },
  'styled-components': {
    label: 'Styled Components',
    color: '#c21366',
    iconText: <span className='text-white'>S</span>
  },
  'daisyui': {
    label: 'daisyUI',
    color: '#ffbe00',
    iconText: <span className='text-white'>D</span>

  },
  'daisyui-ts': {
    label: 'daisyUI',
    color: '#ffbe00',
    iconText: <span className='text-white'>D</span>
  },
  'default': {
    label: 'Unknown Framework',
    color: '#666666',
    iconText: <span className='text-white'>N/A</span>
  }
}

const templateUsedDeps = {
  'react-native': {
    global: {
      // "react": "18.3.1",
      "react-native": "0.77.0",
      "react-native-web": "0.19.13"
    },
    files: {}
  },
  'react-native-ts': {
    global: {
      // "react": "18.3.1",
      "react-native": "0.77.0",
      "react-native-web": "0.19.13"
    },
    files: {}
  }
}

export const getUsedDepsForTemplate = (template) => {
  return templateUsedDeps?.[template] || {};
}