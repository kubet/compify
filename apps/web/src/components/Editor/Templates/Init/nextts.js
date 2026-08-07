const nextTsInit = (name) => ({
    [`/${name}.tsx`]: {
        code: `'use client'
  
export default function ${name}() {
      return (
          <div>
              <h1 style={{ color: 'white' }}>Hello from ${name}</h1>
          </div>
      )
}`,
        main: true
    }
});

export default nextTsInit;