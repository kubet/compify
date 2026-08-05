import React from 'react'

function Wrapper({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-between p-4 mx-auto w-full max-w-7xl overflow-hidden">
            {children}
        </div>
    )
}

export default Wrapper