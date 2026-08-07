export const shadcnStarterTokens = {
  factors: [
    {
      key: 'hue',
      max: 360,
      min: 0,
      type: 'hue',
      value: 159,
    },
    {
      key: 'saturation',
      max: 100,
      min: 0,
      type: 'saturation',
      value: 52,
    },
    {
      key: 'radius',
      type: 'value',
      value: '0.8',
    },
  ],
  groups: {
    mode: {
      type: 'values',
      options: [
        {
          key: 'light',
          value: 'light',
        },
        {
          key: 'dark',
          value: 'dark',
        },
      ],
      isPublic: false,
    },
    'palette-dark': {
      type: 'palette',
      options: [
        {
          key: 'background',
          value: '--hue --saturation% 3.9%',
        },
        {
          key: 'foreground',
          value: '--hue --saturation% 98%',
        },
        {
          key: 'card',
          value: '--hue --saturation% 3.9%',
        },
        {
          key: 'card-foreground',
          value: '--hue --saturation% 98%',
        },
        {
          key: 'popover',
          value: '--hue --saturation% 3.9%',
        },
        {
          key: 'popover-foreground',
          value: '--hue --saturation% 98%',
        },
        {
          key: 'primary',
          value: '--hue --saturation% 60%',
        },
        {
          key: 'primary-foreground',
          value: '--hue --saturation% 97.3%',
        },
        {
          key: 'secondary',
          value: 'calc(--hue + 120) --saturation% 55%',
        },
        {
          key: 'secondary-foreground',
          value: '--hue 0% 98%',
        },
        {
          key: 'muted',
          value: '--hue 0% 14.9%',
        },
        {
          key: 'muted-foreground',
          value: '--hue 0% 63.9%\t',
        },
        {
          key: 'accent',
          value: 'calc(--hue + 240) --saturation% 65%',
        },
        {
          key: 'accent-foreground',
          value: '--hue 0% 98%',
        },
        {
          key: 'destructive',
          value: '0 --saturation% 30.6%',
        },
        {
          key: 'destructive-foreground',
          value: '--hue 0% 98%',
        },
        {
          key: 'border',
          value: '--hue 0% 30.6%',
        },
        {
          key: 'input',
          value: '--hue 0% 14.9%',
        },
        {
          key: 'ring',
          value: '--hue --saturation% 89.8%',
        },
        {
          key: 'chart-1',
          value: '220 --saturation% 50%',
        },
        {
          key: 'chart-2',
          value: '160 --saturation% 45%',
        },
        {
          key: 'chart-3',
          value: '30 --saturation% 55%',
        },
        {
          key: 'chart-4',
          value: '280 --saturation% 60%',
        },
        {
          key: 'chart-5',
          value: '340 --saturation% 55%',
        },
      ],
      isPublic: false,
    },
    'palette-light': {
      type: 'palette',
      options: [
        {
          key: 'background',
          value: '--hue --saturation% 100%',
        },
        {
          key: 'foreground',
          value: '--hue --saturation% 3.9%',
        },
        {
          key: 'card',
          value: '--hue --saturation% 100%',
        },
        {
          key: 'card-foreground',
          value: '--hue --saturation% 3.9%',
        },
        {
          key: 'popover',
          value: '--hue --saturation% 100%',
        },
        {
          key: 'popover-foreground',
          value: '--hue --saturation% 3.9%',
        },
        {
          key: 'primary',
          value: '--hue --saturation% 45%',
        },
        {
          key: 'primary-foreground',
          value: '--hue --saturation% 97.3%',
        },
        {
          key: 'secondary',
          value: 'calc(--hue + 120) --saturation% 40%',
        },
        {
          key: 'secondary-foreground',
          value: '--hue 0% 9%',
        },
        {
          key: 'muted',
          value: '--hue 0% 96.1%',
        },
        {
          key: 'muted-foreground',
          value: '--hue 0% 45.1%',
        },
        {
          key: 'accent',
          value: 'calc(--hue + 240) --saturation% 50%',
        },
        {
          key: 'accent-foreground',
          value: '--hue 0% 9%',
        },
        {
          key: 'destructive',
          value: '0 --saturation% 60.2%',
        },
        {
          key: 'destructive-foreground',
          value: '--hue 0% 98%',
        },
        {
          key: 'border',
          value: '--hue 0% 89.8%',
        },
        {
          key: 'input',
          value: '--hue 0% 89.8%',
        },
        {
          key: 'ring',
          value: '--hue --saturation% 89.8%',
        },
        {
          key: 'chart-1',
          value: '12 --saturation% 61%',
        },
        {
          key: 'chart-2',
          value: '173 --saturation% 39%',
        },
        {
          key: 'chart-3',
          value: '197 --saturation% 24%',
        },
        {
          key: 'chart-4',
          value: '43 --saturation% 66%',
        },
        {
          key: 'chart-5',
          value: '27 --saturation% 67%',
        },
      ],
      isPublic: false,
    },
  },
  values: [
    {
      key: 'theme',
      value: '--mode-dark',
    },
    {
      key: 'background',
      value: '--palette-${--theme}-background',
    },
    {
      key: 'foreground',
      value: '--palette-${--theme}-foreground',
    },
    {
      key: 'card',
      value: '--palette-${--theme}-card',
    },
    {
      key: 'card-foreground',
      value: '--palette-${--theme}-card-foreground',
    },
    {
      key: 'popover',
      value: '--palette-${--theme}-popover',
    },
    {
      key: 'popover-foreground',
      value: '--palette-${--theme}-popover-foreground',
    },
    {
      key: 'primary',
      value: '--palette-${--theme}-primary',
    },
    {
      key: 'primary-foreground',
      value: '--palette-${--theme}-primary-foreground',
    },
    {
      key: 'secondary',
      value: '--palette-${--theme}-secondary',
    },
    {
      key: 'secondary-foreground',
      value: '--palette-${--theme}-secondary-foreground',
    },
    {
      key: 'muted',
      value: '--palette-${--theme}-muted',
    },
    {
      key: 'muted-foreground',
      value: '--palette-${--theme}-muted-foreground',
    },
    {
      key: 'accent',
      value: '--palette-${--theme}-accent',
    },
    {
      key: 'accent-foreground',
      value: '--palette-${--theme}-accent-foreground',
    },
    {
      key: 'destructive',
      value: '--palette-${--theme}-destructive',
    },
    {
      key: 'destructive-foreground',
      value: '--palette-${--theme}-destructive-foreground',
    },
    {
      key: 'border',
      value: '--palette-${--theme}-border',
    },
    {
      key: 'input',
      value: '--palette-${--theme}-input',
    },
    {
      key: 'ring',
      value: '--palette-${--theme}-ring',
    },
    {
      key: 'chart-1',
      value: '--palette-${--theme}-chart-1',
    },
    {
      key: 'chart-2',
      value: '--palette-${--theme}-chart-2',
    },
    {
      key: 'chart-3',
      value: '--palette-${--theme}-chart-3',
    },
    {
      key: 'chart-4',
      value: '--palette-${--theme}-chart-4',
    },
    {
      key: 'chart-5',
      value: '--palette-${--theme}-chart-5',
    },
    {
      key: 'radius',
      value: '${--radius}rem',
    },
  ],
};
export const tailwind4StarterTokens = {
  factors: [
    {
      key: 'hue',
      max: 360,
      min: 0,
      type: 'hue',
      value: 215,
    },
    {
      key: 'saturation',
      max: 100,
      min: 0,
      type: 'saturation',
      value: 50,
    },
    {
      key: 'lightness',
      max: 100,
      min: 0,
      type: 'lightness',
      value: 50,
    },
    {
      key: 'radius',
      type: 'value',
      value: '0.5',
    },
    {
      key: 'spacing',
      type: 'value',
      value: '1',
    },
  ],
  groups: {
    mode: {
      type: 'values',
      isPublic: false,
      options: [
        {
          key: 'light',
          value: 'light',
        },
        {
          key: 'dark',
          value: 'dark',
        },
      ],
    },
    'palette-dark': {
      type: 'palette',
      isPublic: false,
      options: [
        {
          key: 'primary',
          value: '--hue --saturation% 60%',
        },
        {
          key: 'secondary',
          value: 'calc(--hue + 120) --saturation% 55%',
        },
        {
          key: 'accent',
          value: 'calc(--hue + 240) --saturation% 65%',
        },
        {
          key: 'surface',
          value: '--hue 15% 10%',
        },
        {
          key: 'text',
          value: '--hue 10% 90%',
        },
      ],
    },
    'palette-light': {
      type: 'palette',
      isPublic: false,
      options: [
        {
          key: 'primary',
          value: '--hue --saturation% 45%',
        },
        {
          key: 'secondary',
          value: 'calc(--hue + 120) --saturation% 40%',
        },
        {
          key: 'accent',
          value: 'calc(--hue + 240) --saturation% 50%',
        },
        {
          key: 'surface',
          value: '--hue 15% 98%',
        },
        {
          key: 'text',
          value: '--hue 10% 10%',
        },
      ],
    },
  },
  values: [
    {
      key: 'theme',
      value: '--mode-light',
    },
    {
      key: 'color-primary',
      value: 'hsl(--palette-${--theme}-primary)',
    },
    {
      key: 'color-secondary',
      value: 'hsl(--palette-${--theme}-secondary)',
    },
    {
      key: 'color-accent',
      value: 'hsl(--palette-${--theme}-accent)',
    },
    {
      key: 'color-surface',
      value: 'hsl(--palette-${--theme}-surface)',
    },
    {
      key: 'color-text',
      value: 'hsl(--palette-${--theme}-text)',
    },
    {
      key: 'radius-small',
      value: 'calc(--radius * 0.5)rem',
    },
    {
      key: 'radius-medium',
      value: 'calc(--radius * 1)rem',
    },
    {
      key: 'radius-large',
      value: 'calc(--radius * 1.5)rem',
    },
    {
      key: 'spacing',
      value: 'calc(--spacing)rem',
    },
  ],
};
export const tailwindStarterTokens = {
  factors: [
    {
      key: 'hue',
      max: 360,
      min: 0,
      type: 'hue',
      value: 215,
    },
    {
      key: 'saturation',
      max: 100,
      min: 0,
      type: 'saturation',
      value: 50,
    },
    {
      key: 'lightness',
      max: 100,
      min: 0,
      type: 'lightness',
      value: 50,
    },
    {
      key: 'radius',
      type: 'value',
      value: '0.5',
    },
    {
      key: 'spacing',
      type: 'value',
      value: '1',
    },
  ],
  groups: {
    mode: {
      type: 'values',
      isPublic: false,
      options: [
        {
          key: 'light',
          value: 'light',
        },
        {
          key: 'dark',
          value: 'dark',
        },
      ],
    },
    'palette-dark': {
      type: 'palette',
      isPublic: false,
      options: [
        {
          key: 'primary',
          value: '--hue --saturation% 60%',
        },
        {
          key: 'secondary',
          value: 'calc(--hue + 120) --saturation% 55%',
        },
        {
          key: 'accent',
          value: 'calc(--hue + 240) --saturation% 65%',
        },
        {
          key: 'surface',
          value: '--hue 15% 10%',
        },
        {
          key: 'text',
          value: '--hue 10% 90%',
        },
      ],
    },
    'palette-light': {
      type: 'palette',
      isPublic: false,
      options: [
        {
          key: 'primary',
          value: '--hue --saturation% 45%',
        },
        {
          key: 'secondary',
          value: 'calc(--hue + 120) --saturation% 40%',
        },
        {
          key: 'accent',
          value: 'calc(--hue + 240) --saturation% 50%',
        },
        {
          key: 'surface',
          value: '--hue 15% 98%',
        },
        {
          key: 'text',
          value: '--hue 10% 10%',
        },
      ],
    },
  },
  values: [
    {
      key: 'theme',
      value: '--mode-light',
    },
    {
      key: 'color-primary',
      value: '--palette-${--theme}-primary',
    },
    {
      key: 'color-secondary',
      value: '--palette-${--theme}-secondary',
    },
    {
      key: 'color-accent',
      value: '--palette-${--theme}-accent',
    },
    {
      key: 'color-surface',
      value: '--palette-${--theme}-surface',
    },
    {
      key: 'color-text',
      value: '--palette-${--theme}-text',
    },
    {
      key: 'border-radius-small',
      value: 'calc(--radius * 0.5)rem',
    },
    {
      key: 'border-radius-medium',
      value: 'calc(--radius * 1)rem',
    },
    {
      key: 'border-radius-large',
      value: 'calc(--radius * 1.5)rem',
    },
    {
      key: 'spacing-small',
      value: 'calc(--spacing * 0.5)rem',
    },
    {
      key: 'spacing-medium',
      value: 'calc(--spacing * 1)rem',
    },
    {
      key: 'spacing-large',
      value: 'calc(--spacing * 1.5)rem',
    },
  ],
};
export const daisyuiStarterTokens = {
  factors: [
    {
      key: 'hue',
      max: 360,
      min: 0,
      type: 'hue',
      value: 159,
    },
    {
      key: 'saturation',
      max: 100,
      min: 0,
      type: 'saturation',
      value: 52,
    },
    {
      key: 'lightness',
      max: 100,
      min: 0,
      type: 'lightness',
      value: 52,
    },
    {
      key: 'radius',
      type: 'value',
      value: '0.5',
    },
  ],
  values: [
    {
      key: 'primary',
      value: 'hsl(--hue, --saturation%, --lightness%)',
    },
    {
      key: 'primary-focus',
      value: 'hsl(--hue, --saturation%, calc(--lightness - 10)%)',
    },
    {
      key: 'primary-content',
      value: 'hsl(--hue, --saturation%, 95%)',
    },
    {
      key: 'secondary',
      value: 'hsl(--hue + 120, --saturation%, --lightness%)',
    },
    {
      key: 'secondary-focus',
      value: 'hsl(calc(--hue + 120), --saturation%, calc(--lightness - 10)%)',
    },
    {
      key: 'secondary-content',
      value: 'hsl(calc(--hue + 120), --saturation%, 95%)',
    },
    {
      key: 'accent',
      value: 'hsl(calc(--hue + 240), --saturation%, --lightness%)',
    },
    {
      key: 'accent-focus',
      value: 'hsl(calc(--hue + 240), --saturation%, calc(--lightness - 10)%)',
    },
    {
      key: 'accent-content',
      value: 'hsl(calc(--hue + 240), --saturation%, 95%)',
    },
    {
      key: 'neutral',
      value: 'hsl(--hue, 10%, 50%)',
    },
    {
      key: 'neutral-focus',
      value: 'hsl(--hue, 10%, 40%)',
    },
    {
      key: 'neutral-content',
      value: 'hsl(--hue, 10%, 95%)',
    },
    {
      key: 'base-100',
      value: 'hsl(--hue, 0%, 100%)',
    },
    {
      key: 'base-200',
      value: 'hsl(--hue, 0%, 96%)',
    },
    {
      key: 'base-300',
      value: 'hsl(--hue, 0%, 92%)',
    },
    {
      key: 'base-content',
      value: 'hsl(--hue, 0%, 12%)',
    },
    {
      key: 'info',
      value: 'hsl(200, 70%, 50%)',
    },
    {
      key: 'success',
      value: 'hsl(120, 70%, 45%)',
    },
    {
      key: 'warning',
      value: 'hsl(40, 70%, 50%)',
    },
    {
      key: 'error',
      value: 'hsl(0, 70%, 45%)',
    },
    {
      key: 'rounded-box',
      value: 'calc(--radius * 1.5)rem',
    },
    {
      key: 'rounded-btn',
      value: 'calc(--radius * 0.5)rem',
    },
    {
      key: 'rounded-badge',
      value: 'calc(--radius * 0.375)rem',
    },
    {
      key: 'animation-btn',
      value: '0.25s',
    },
    {
      key: 'animation-input',
      value: '0.2s',
    },
    {
      key: 'btn-text-case',
      value: 'uppercase',
    },
    {
      key: 'navbar-padding',
      value: '0.5rem',
    },
    {
      key: 'border-btn',
      value: '1px',
    },
  ],
};

export const muiStarterTokens = {
  factors: [
    {
      key: 'hue',
      max: 360,
      min: 0,
      type: 'hue',
      value: 215,
    },
    {
      key: 'saturation',
      max: 100,
      min: 0,
      type: 'saturation',
      value: 50,
    },
    {
      key: 'lightness',
      max: 100,
      min: 0,
      type: 'lightness',
      value: 50,
    },
    {
      key: 'radius',
      type: 'value',
      value: '0.5',
    },
    {
      key: 'spacing',
      type: 'value',
      value: '1',
    },
  ],
  groups: {
    mode: {
      type: 'values',
      isPublic: false,
      options: [
        {
          key: 'light',
          value: 'light',
        },
        {
          key: 'dark',
          value: 'dark',
        },
      ],
    },
    'palette-dark': {
      type: 'palette',
      isPublic: false,
      options: [
        {
          key: 'primary',
          value: '--hue --saturation% 60%',
        },
        {
          key: 'secondary',
          value: 'calc(--hue + 120) --saturation% 55%',
        },
        {
          key: 'accent',
          value: 'calc(--hue + 240) --saturation% 65%',
        },
        {
          key: 'surface',
          value: '--hue 15% 10%',
        },
        {
          key: 'text',
          value: '--hue 10% 90%',
        },
      ],
    },
    'palette-light': {
      type: 'palette',
      isPublic: false,
      options: [
        {
          key: 'primary',
          value: '--hue --saturation% 45%',
        },
        {
          key: 'secondary',
          value: 'calc(--hue + 120) --saturation% 40%',
        },
        {
          key: 'accent',
          value: 'calc(--hue + 240) --saturation% 50%',
        },
        {
          key: 'surface',
          value: '--hue 15% 98%',
        },
        {
          key: 'text',
          value: '--hue 10% 10%',
        },
      ],
    },
  },
  values: [
    {
      key: 'theme',
      value: '--mode-light',
    },
    {
      key: 'color-primary',
      value: 'hsl(--palette-${--theme}-primary)',
    },
    {
      key: 'color-secondary',
      value: 'hsl(--palette-${--theme}-secondary)',
    },
    {
      key: 'color-accent',
      value: 'hsl(--palette-${--theme}-accent)',
    },
    {
      key: 'color-surface',
      value: 'hsl(--palette-${--theme}-surface)',
    },
    {
      key: 'color-text',
      value: 'hsl(--palette-${--theme}-text)',
    },
    {
      key: 'border-radius-small',
      value: 'calc(--radius * 0.5)rem',
    },
    {
      key: 'border-radius-medium',
      value: 'calc(--radius * 1)rem',
    },
    {
      key: 'border-radius-large',
      value: 'calc(--radius * 1.5)rem',
    },
    {
      key: 'spacing-small',
      value: 'calc(--spacing * 0.5)rem',
    },
    {
      key: 'spacing-medium',
      value: 'calc(--spacing * 1)rem',
    },
    {
      key: 'spacing-large',
      value: 'calc(--spacing * 1.5)rem',
    },
  ],
};

export const getStarterTokens = (uiLibs: string[]) => {
  if (uiLibs.includes('shadcn')) {
    return shadcnStarterTokens;
  }
  if (uiLibs.includes('daisyui') || uiLibs.includes('daisyui-ts')) {
    return daisyuiStarterTokens;
  }
  if (uiLibs.includes('tailwind') || uiLibs.includes('tailwind-ts')) {
    return tailwindStarterTokens;
  }
  if (uiLibs.includes('mui')) {
    return muiStarterTokens;
  }
  if (uiLibs.includes('tailwind-v4') || uiLibs.includes('tailwind-ts-v4')) {
    return tailwind4StarterTokens;
  }
  return {};
};
