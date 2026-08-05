export const daisyuiThemeImport = (variant = 'js') => {
    return `import tailwindConfig from './tailwind.config.${variant}';
window.tailwind = window.tailwind || {};
window.tailwind.config = tailwindConfig;
import './daisyui.min.css';
// Color conversion function
function convertColor(color) {
  // Helper functions
  const sRGBtoLinear = x => x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    return t < 1/6 ? p + (q - p) * 6 * t : t < 1/2 ? q : t < 2/3 ? p + (q - p) * (2/3 - t) * 6 : p;
  };

  // Parse input
  let rgb;
  color = color.toLowerCase().trim();
  
  if (color.startsWith('oklch')) {
    // Extract values from OKLCH
    const values = color.match(/[\\d.]+/g);
    return \`\${values[0]}% \${values[1]} \${values[2]}\`;
  }
  
  if (color.startsWith('#')) {
    // Handle HEX
    if (color.length === 4) {
      rgb = [
        parseInt(color[1] + color[1], 16) / 255,
        parseInt(color[2] + color[2], 16) / 255,
        parseInt(color[3] + color[3], 16) / 255
      ];
    } else {
      rgb = [
        parseInt(color.slice(1, 3), 16) / 255,
        parseInt(color.slice(3, 5), 16) / 255,
        parseInt(color.slice(5, 7), 16) / 255
      ];
    }
  } else if (color.startsWith('rgb')) {
    // Handle RGB
    rgb = color.match(/\\d+(\\.\\d+)?/g).map(v => parseFloat(v) / 255);
  } else if (color.startsWith('hsl')) {
    // Handle HSL
    const [h, s, l] = color.match(/\\d+(\\.\\d+)?/g).map((v, i) => i === 0 ? parseFloat(v) : parseFloat(v) / 100);
    if (s === 0) {
      rgb = [l, l, l];
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      rgb = [
        hue2rgb(p, q, (h / 360 + 1/3)),
        hue2rgb(p, q, h / 360),
        hue2rgb(p, q, (h / 360 - 1/3))
      ];
    }
  }

  // Convert to linear RGB
  const [r, g, b] = rgb.map(sRGBtoLinear);

  // Convert to XYZ
  const x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
  const y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
  const z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b;

  // Convert to LMS
  const l = 0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z;
  const m = 0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z;
  const s = 0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z;

  // Convert to LAB
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a1 = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const b1 = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  // Convert to LCH
  const C = Math.sqrt(a1 * a1 + b1 * b1);
  let H = Math.atan2(b1, a1) * 180 / Math.PI;
  if (H < 0) H += 360;

  return \`\${(L * 100).toFixed(2)}% \${C.toFixed(6)} \${H.toFixed(4)}\`;
}

const THEME_STYLE_ID = 'daisyui-theme-variables';
let styleEl = document.getElementById(THEME_STYLE_ID);
if (!styleEl) {
  styleEl = document.createElement('style');
  styleEl.id = THEME_STYLE_ID;
  styleEl.setAttribute('data-type', 'daisyui-theme');
  document.head.appendChild(styleEl);
}

const colorMappings = {
  'primary': '--p',
  'secondary': '--s',
  'accent': '--a',
  'neutral': '--n',
  'base-100': '--b1',
  'info': '--in',
  'success': '--su',
  'warning': '--wa',
  'error': '--er',
  'primary-content': '--pc',
  'secondary-content': '--sc',
  'accent-content': '--ac',
  'neutral-content': '--nc',
  'base-200': '--b2',
  'base-300': '--b3',
  'base-content': '--bc',
  'info-content': '--inc',
  'success-content': '--suc',
  'warning-content': '--wac',
  'error-content': '--erc'
};

const theme = window.tailwind.config.daisyui?.themes?.[0];
const themeName = Object.keys(theme)[0];
const values = theme[themeName];
if (theme && themeName && values && typeof values === 'object') {
let css = \`[data-theme=\${themeName}] {\\n\`;

Object?.entries(values)?.forEach(([key, value]) => {
  // If the value is a color (not a CSS variable) and needs conversion
  if (colorMappings[key] && !value.includes('var(--')) {
    value = convertColor(value);
  }
  
  if (colorMappings[key]) {
    css += \`  \${colorMappings[key]}: \${value};\\n\`;
  }
  if (key.startsWith('--')) {
    css += \`  \${key}: \${value};\\n\`;
  }
});

css += '}';
styleEl.textContent = css;
}`;
};
