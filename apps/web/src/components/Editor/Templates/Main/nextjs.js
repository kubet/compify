export const nextjsMain = (code, initSettings, imports = '') => `
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
${imports}
window.ComponentCapture = ${JSON.stringify(initSettings)};

const originalFetch = window.fetch;
function isReactDomVersionCheck(url) {
  if (typeof url !== 'string') return false;
  return (
    (url.includes('jsdelivr.com') && url.includes('react-dom')) ||
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
function updateLoadingBar(isLoading) {
  const bar = document.getElementById('progress-bar');
  if (!bar) return;
  
  if (isLoading) {
    bar.style.visibility = 'visible';
    bar.style.width = '70%';
  } else {
    bar.style.width = '100%';
    setTimeout(() => {
      bar.style.visibility = 'hidden';
      bar.style.width = '0%';
    }, 300);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupLoadingBar);
} else {
  setupLoadingBar();
}

// Enhanced fetch override
window.fetch = function(url, options) {
  if (isReactDomVersionCheck(url)) {
    const fakeResponse = {
      tags: { latest: '18.3.1' },
      name: 'react-dom',
      version: '18.3.1',
      dependencies: {
        'loose-envify': '^1.1.0',
        'scheduler': '^0.23.0'
      }
    };

    return Promise.resolve(new Response(JSON.stringify(fakeResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));
  }
  
  // Start loading animation
  pendingRequests++;
  updateLoadingBar(true);
  
  return originalFetch.apply(this, arguments)
    .finally(() => {
      // Complete loading animation if this is the last request
      pendingRequests--;
      if (pendingRequests === 0) {
        updateLoadingBar(false);
      }
    });
};
const rootElement = document.getElementById('root');
createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`
export const nextjsAdditionalFiles = () => {
  return {
    'next/image.js': {
      code: `
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
}) => {
  return (
    <img
      src={src}
      alt={alt}
      fetchpriority={priority ? "high" : undefined}
      decoding="async"
      data-nimg={layout}
      className={className}
      sizes="100vw"
      style={{
        position: 'absolute',
        height: height,
        width: width,
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        maxWidth: 'unset',
        maxHeight: 'unset',
        color: 'transparent',
        ...style
      }}
      onLoad={(e) => onLoadingComplete?.({
        naturalWidth: e.currentTarget.naturalWidth,
        naturalHeight: e.currentTarget.naturalHeight
      })}
      onError={onError}
      {...rest}
    />
  );
};

Image.displayName = 'Image';

export default Image;`,
      hidden: true
    },
    'jsconfig.json': {
      code: `{
    "include": [
        "./**/*"
    ],
    "compilerOptions": {
        "strict": true,
        "esModuleInterop": true,
        "lib": [
            "dom",
            "es2015"
        ],
        "jsx": "react-jsx",
        "baseUrl": ".",
        "paths": {
            "next/image": ["./next/image.js"],
            "next/link": ["./next/link.js"],
            "next/navigation": ["./next/navigation.js"]
        }
    }
}`,
      hidden: true
    },
    'next/link.js': {
      code: `import { forwardRef } from 'react';

const Link = forwardRef(({ 
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
  const handleClick = (e) => {
    if (onClick) onClick(e);
    if (!e.defaultPrevented && href) {
      e.preventDefault();
      // In a real Next.js app, this would trigger router navigation
      window.location.href = href;
    }
  };

  return (
    <a
      {...rest}
      ref={ref}
      href={href}
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
    'next/navigation.js': {
      code: `
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

// Navigation context
const NavigationContext = createContext({
  push: () => {},
  replace: () => {},
  back: () => {},
  forward: () => {},
  refresh: () => {},
  pathname: '',
  query: {},
});

// Provider component
export function NavigationProvider({ children }) {
  const [pathname, setPathname] = useState(window.location.pathname);
  
  // Update pathname on popstate
  useEffect(() => {
    const handleLocationChange = () => {
      setPathname(window.location.pathname);
    };
    
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const push = useCallback((href) => {
    window.history.pushState({}, '', href);
    setPathname(window.location.pathname);
  }, []);

  const replace = useCallback((href) => {
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

// Hooks
export function useRouter() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useRouter must be used within a NavigationProvider');
  }
  return context;
}

export function usePathname() {
  const { pathname } = useRouter();
  return pathname;
}

export function useSearchParams() {
  return new URLSearchParams(window.location.search);
}

export function useParams() {
  // This is a simplified version - in real Next.js this would be more sophisticated
  const { pathname } = useRouter();
  const segments = pathname.split('/').filter(Boolean);
  return segments.reduce((params, segment, index) => {
    if (segment.startsWith('[') && segment.endsWith(']')) {
      const key = segment.slice(1, -1);
      params[key] = segments[index];
    }
    return params;
  }, {});
}

// Redirect function
export function redirect(href) {
  window.location.href = href;
}`,
      hidden: true
    },
    'next/form.js': {
      code: `
import { forwardRef } from 'react';
import { useRouter } from './navigation';

const Form = forwardRef(({
  action,
  replace = false,
  scroll = true,
  prefetch = true,
  children,
  ...props
}, ref) => {
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (typeof action === 'function') {
      // Handle Server Action case
      action(new FormData(e.target));
      return;
    }

    // Handle string action case (URL navigation)
    const formData = new FormData(e.target);
    const searchParams = new URLSearchParams();
    
    for (const [key, value] of formData.entries()) {
      searchParams.append(key, value);
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
