const reactTsInit = (name) => ({
    [`/${name}.tsx`]: {
        code: `function ${name}() {
    return (
        <div>
            <h1 style={{ color: 'white' }}>Hello ${name}</h1>
        </div>
    )
}

export default ${name};`,
        main: true
    }
});

export default reactTsInit;