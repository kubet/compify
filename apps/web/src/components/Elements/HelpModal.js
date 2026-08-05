import React from 'react'
import Modal from './Modal'

function HelpModal({ isOpen, onClose, title, children }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} color="hsl(220, 80%, 75%)" backdropColor="#000000">
            <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
                <div className="border-b border-white/10 pb-4">
                    <h2 className="text-xl font-semibold text-white">{title}</h2>
                </div>
                <div>
                    {children}
                </div>
            </div>
        </Modal>
    )
}

export default HelpModal