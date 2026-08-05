import React, { useState } from 'react';
import Modal from '../Elements/Modal';
import { Button, InputField } from '../Elements';

function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText,
    cancelText = "Cancel",
    variant = "red",
    backdropColor = "hsl(0deg 49.75% 41.13%)",
    confirmationString,
}) {
    const [confirmInput, setConfirmInput] = useState('');
    const isConfirmEnabled = !confirmationString || confirmInput === confirmationString;

    const handleConfirm = () => {
        if (isConfirmEnabled) {
            onConfirm();
            setConfirmInput('');
        }
    };

    const handleClose = () => {
        setConfirmInput('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} backdropColor={backdropColor}>
            <div className="w-full max-w-sm bg-black rounded-xl px-2 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-gray-200 text-lg font-semibold">
                        {title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        {description}
                    </p>
                </div>

                {/* Confirmation Input */}
                {confirmationString && (
                    <div className="flex flex-col gap-2">
                        <p className="text-sm text-gray-400">
                            Please type <span className="font-mono text-gray-300">{confirmationString}</span> to confirm
                        </p>
                        <InputField
                            type="text"
                            value={confirmInput}
                            onChange={(e) => setConfirmInput(e.target.value)}
                            placeholder={`Type ${confirmationString} to confirm`}
                        />
                    </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 mt-2 w-full">
                    <Button
                        text={cancelText}
                        onClick={handleClose}
                        showIcon={false}
                        fullWidth={true}
                    />

                    <Button
                        text={confirmText}
                        onClick={handleConfirm}
                        showIcon={false}
                        color={variant}
                        fullWidth={true}
                        disabled={!isConfirmEnabled}
                    />
                </div>
            </div>
        </Modal>
    );
}

export default ConfirmationModal;