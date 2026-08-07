export const nextTsMain = (code, initSettings, imports = '') => `
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
${imports}
window.ComponentCapture = ${JSON.stringify(initSettings)};

const originalFetch = window.fetch;
function isReactDomVersionCheck(url: string | URL | Request) {
  if (typeof url !== 'string') return false;
  return (
    (url.includes('jsdelivr.net') && url.includes('react-dom')) ||
    (url.includes('unpkg.com') && url.includes('react-dom'))
  );
}

function setupLoadingBar() {
  if (document.getElementById('progress-bar')) return;
  
  const style = document.createElement('style');
  style.textContent = \`
#progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  width: 0%;
  background: linear-gradient(to right, #7b1fa2, #f48fb1);
  z-index: 999999;
  transition: width 0.3s ease-out;
  visibility: hidden;
}
\`;
  document.head.appendChild(style);
  
  const bar = document.createElement('div');
  bar.id = 'progress-bar';
  document.body.appendChild(bar);
}

// Track if we have any pending requests
let pendingRequests = 0;

// Update loading bar state
let loadingBarDone = false;

function finishLoadingBar() {
  if (loadingBarDone) return;
  loadingBarDone = true;
  const bar = document.getElementById('progress-bar');
  if (!bar) return;
  bar.style.width = '100%';
  setTimeout(() => {
    bar.style.visibility = 'hidden';
    bar.style.width = '0%';
  }, 300);
}

function updateLoadingBar(isLoading: boolean) {
  if (loadingBarDone) return;
  const bar = document.getElementById('progress-bar');
  if (!bar) return;

  if (isLoading) {
    bar.style.visibility = 'visible';
    bar.style.width = '70%';
  } else {
    finishLoadingBar();
  }
}

// Failsafe: never leave the bar hanging on long-lived requests.
setTimeout(finishLoadingBar, 8000);
window.addEventListener('load', () => {
  setTimeout(() => { if (pendingRequests <= 0) finishLoadingBar(); }, 1500);
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupLoadingBar);
} else {
  setupLoadingBar();
}

window.fetch = function(url: string | URL | Request, options?: RequestInit) {
  if (isReactDomVersionCheck(url)) {
    const fakeResponse = {
      tags: {
        latest: '18.3.1'
      },
      name: 'react-dom',
      version: '18.3.1',
      dependencies: {
        'loose-envify': '^1.1.0',
        'scheduler': '^0.23.0'
      }
    };

    return Promise.resolve(new Response(JSON.stringify(fakeResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    }));
  }

  // Start loading animation
  pendingRequests++;
  updateLoadingBar(true);
  
  return originalFetch.apply(this, arguments as any)
    .finally(() => {
      // Complete loading animation if this is the last request
      pendingRequests--;
      if (pendingRequests === 0) {
        updateLoadingBar(false);
      }
    });
};

const rootElement = document.getElementById('root')!;
createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`

export const nextTsAdditionalFiles = () => {
  return {
    'next/image.tsx': {
      code: `
import { forwardRef } from 'react';

interface ImageProps {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  layout?: 'fill' | 'fixed' | 'intrinsic' | 'responsive';
  objectFit?: React.CSSProperties['objectFit'];
  objectPosition?: React.CSSProperties['objectPosition'];
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  className?: string;
  style?: React.CSSProperties;
  onLoadingComplete?: (img: { naturalWidth: number; naturalHeight: number }) => void;
  onError?: (error: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

const Image = ({
  src,
  alt = '',
  width,
  height,
  layout = 'fill',
  objectFit,
  objectPosition,
  priority = false,
  loading: loadingProp = 'lazy',
  className,
  style,
  onLoadingComplete,
  onError,
  ...rest
}: ImageProps) => {
  return (
    <img
      src={src}
      alt={alt}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      data-nimg={layout}
      className={className}
      sizes="100vw"
      style={{
        position: 'absolute',
        height,
        width,
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        maxWidth: 'unset',
        maxHeight: 'unset',
        color: 'transparent',
        objectFit,
        objectPosition,
        ...style
      }}
      onLoad={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        onLoadingComplete?.({
          naturalWidth: e.currentTarget.naturalWidth,
          naturalHeight: e.currentTarget.naturalHeight
        });
      }}
      onError={onError}
      {...rest}
    />
  );
};

Image.displayName = 'Image';

export default Image;`,
      hidden: true
    },
    'tsconfig.json': {
      code: `{
                "include": [
                  "./**/*"
                ],
                "compilerOptions": {
                  "strict": true,
                  "esModuleInterop": true,
                  "lib": [ "dom", "es2015" ],
                  "jsx": "react-jsx",
                  "baseUrl": ".",
                  "paths": {
                    "@/*": ["./*"]
                  }
                }
              }`,
      hidden: true
    },
    'next/link.tsx': {
      code: `
import { forwardRef } from 'react';

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string | {
    pathname: string;
    query?: Record<string, string>;
  };
  as?: string;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  prefetch?: boolean;
  className?: string;
  onMouseEnter?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  onTouchStart?: (e: React.TouchEvent<HTMLAnchorElement>) => void;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(({ 
  href,
  as,
  replace,
  scroll = true,
  shallow,
  prefetch = true,
  className,
  children,
  onClick,
  onMouseEnter,
  onTouchStart,
  ...rest
}, ref) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    if (!e.defaultPrevented && href) {
      e.preventDefault();
      window.location.href = typeof href === 'string' ? href : href.pathname;
    }
  };

  return (
    <a
      {...rest}
      ref={ref}
      href={typeof href === 'string' ? href : href.pathname}
      className={className}
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
      onTouchStart={onTouchStart}
    >
      {children}
    </a>
  );
});

Link.displayName = 'Link';

export default Link;`,
      hidden: true
    },
    'next/navigation.tsx': {
      code: `
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface NavigationContextType {
  push: (href: string) => void;
  replace: (href: string) => void;
  back: () => void;
  forward: () => void;
  refresh: () => void;
  pathname: string;
  query: Record<string, string>;
}

const NavigationContext = createContext<NavigationContextType>({
  push: () => {},
  replace: () => {},
  back: () => {},
  forward: () => {},
  refresh: () => {},
  pathname: '',
  query: {},
});

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [pathname, setPathname] = useState(window.location.pathname);
  
  useEffect(() => {
    const handleLocationChange = () => {
      setPathname(window.location.pathname);
    };
    
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const push = useCallback((href: string) => {
    window.history.pushState({}, '', href);
    setPathname(window.location.pathname);
  }, []);

  const replace = useCallback((href: string) => {
    window.history.replaceState({}, '', href);
    setPathname(window.location.pathname);
  }, []);

  const back = useCallback(() => {
    window.history.back();
  }, []);

  const forward = useCallback(() => {
    window.history.forward();
  }, []);

  const refresh = useCallback(() => {
    window.location.reload();
  }, []);

  const query = Object.fromEntries(new URLSearchParams(window.location.search));

  const value = {
    push,
    replace,
    back,
    forward,
    refresh,
    pathname,
    query
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useRouter must be used within a NavigationProvider');
  }
  return context;
}

export function usePathname(): string {
  const { pathname } = useRouter();
  return pathname;
}

export function useSearchParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

export function useParams(): Record<string, string> {
  const { pathname } = useRouter();
  const segments = pathname.split('/').filter(Boolean);
  return segments.reduce<Record<string, string>>((params, segment, index) => {
    if (segment.startsWith('[') && segment.endsWith(']')) {
      const key = segment.slice(1, -1);
      params[key] = segments[index];
    }
    return params;
  }, {});
}

export function redirect(href: string): never {
  window.location.href = href;
  throw new Error('Redirect failed');
}`,
      hidden: true
    },
    'next/form.tsx': {
      code: `
import { forwardRef } from 'react';
import { useRouter } from './navigation';

interface FormProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'action'> {
  action: string | ((formData: FormData) => void | Promise<void>);
  replace?: boolean;
  scroll?: boolean;
  prefetch?: boolean;
}

const Form = forwardRef<HTMLFormElement, FormProps>(({
  action,
  replace = false,
  scroll = true,
  prefetch = true,
  children,
  ...props
}, ref) => {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (typeof action === 'function') {
      action(new FormData(e.currentTarget));
      return;
    }

    const formData = new FormData(e.currentTarget);
    const searchParams = new URLSearchParams();
    
    for (const [key, value] of formData.entries()) {
      searchParams.append(key, String(value));
    }

    const url = action + (action.includes('?') ? '&' : '?') + searchParams.toString();
    
    if (replace) {
      router.replace(url);
    } else {
      router.push(url);
    }
  };

  return (
    <form
      {...props}
      ref={ref}
      onSubmit={handleSubmit}
    >
      {children}
    </form>
  );
});

Form.displayName = 'Form';

export default Form;`,
      hidden: true
    },
  }
}