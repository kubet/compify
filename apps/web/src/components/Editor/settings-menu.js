import React from 'react'
import { Sun, Moon, Monitor, Smartphone, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal, AlignStartVertical, AlignCenterVertical, AlignEndVertical, StretchHorizontal, StretchVertical, BoxIcon, ScanIcon } from 'lucide-react';
import Menu from '../Elements/Menu';
import Chip from '../Elements/Chip';
import { motion, AnimatePresence } from 'framer-motion';

function SettingsMenu({ isMenuOpen, handleCloseMenu, anchorEl, previewSettings, setPreviewSettings }) {
    const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);

    const handleAlignmentChange = (justifyContent, alignItems) => {
        setPreviewSettings({
            ...previewSettings,
            justifyContent,
            alignItems
        });
    };

    const settingsConfig = {
        background: {
            title: 'Background',
            options: [
                {
                    label: 'Light',
                    icon: Sun,
                    value: '#ffffff',
                    isSelected: previewSettings.backgroundColor === '#ffffff',
                    onChange: () => setPreviewSettings({ ...previewSettings, backgroundColor: '#ffffff' })
                },
                {
                    label: 'Dark',
                    icon: Moon,
                    value: '#0a0a0a',
                    isSelected: previewSettings.backgroundColor === '#0a0a0a',
                    onChange: () => setPreviewSettings({ ...previewSettings, backgroundColor: '#0a0a0a' })
                }
            ]
        },
        size: {
            title: 'Size',
            options: [
                {
                    label: 'Full',
                    icon: Monitor,
                    isSelected: previewSettings.width === '100%' && previewSettings.height === '100%',
                    onChange: () => setPreviewSettings({ ...previewSettings, width: '100%', height: '100%' })
                },
                {
                    label: 'Screen',
                    icon: Smartphone,
                    isSelected: previewSettings.width === '100vw' && previewSettings.height === '100vh',
                    onChange: () => setPreviewSettings({ ...previewSettings, width: '100vw', height: '100vh' })
                }
            ]
        },
        alignment: {
            title: "Alignment",
            options: [
                {
                    label: 'Component',
                    icon: BoxIcon,
                    value: 'component',
                    isSelected: previewSettings.justifyContent === 'center' && previewSettings.alignItems === 'center',
                    onChange: () => setPreviewSettings({ ...previewSettings, justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' })
                },
                {
                    label: 'Page',
                    icon: ScanIcon,
                    value: 'page',
                    isSelected: previewSettings.justifyContent === 'space-between' && previewSettings.alignItems === 'stretch',
                    onChange: () => setPreviewSettings({ ...previewSettings, justifyContent: 'space-between', alignItems: 'stretch', width: '100%', height: '100%' })
                }
            ]
        },
        horizontalAlignment: {
            title: 'Horizontal Alignment',
            options: [
                {
                    icon: AlignStartHorizontal,
                    value: 'flex-start',
                    isSelected: previewSettings.justifyContent === 'flex-start',
                    onChange: () => handleAlignmentChange('flex-start', previewSettings.alignItems)
                },
                {
                    icon: AlignCenterHorizontal,
                    value: 'center',
                    isSelected: previewSettings.justifyContent === 'center',
                    onChange: () => handleAlignmentChange('center', previewSettings.alignItems)
                },
                {
                    icon: AlignEndHorizontal,
                    value: 'flex-end',
                    isSelected: previewSettings.justifyContent === 'flex-end',
                    onChange: () => handleAlignmentChange('flex-end', previewSettings.alignItems)
                },
                {
                    icon: StretchHorizontal,
                    value: 'space-between',
                    isSelected: previewSettings.justifyContent === 'space-between',
                    onChange: () => handleAlignmentChange('space-between', previewSettings.alignItems)
                }
            ]
        },
        verticalAlignment: {
            title: 'Vertical Alignment',
            options: [
                {
                    icon: AlignStartVertical,
                    value: 'flex-start',
                    isSelected: previewSettings.alignItems === 'flex-start',
                    onChange: () => handleAlignmentChange(previewSettings.justifyContent, 'flex-start')
                },
                {
                    icon: AlignCenterVertical,
                    value: 'center',
                    isSelected: previewSettings.alignItems === 'center',
                    onChange: () => handleAlignmentChange(previewSettings.justifyContent, 'center')
                },
                {
                    icon: AlignEndVertical,
                    value: 'flex-end',
                    isSelected: previewSettings.alignItems === 'flex-end',
                    onChange: () => handleAlignmentChange(previewSettings.justifyContent, 'flex-end')
                },
                {
                    icon: StretchVertical,
                    value: 'stretch',
                    isSelected: previewSettings.alignItems === 'stretch',
                    onChange: () => handleAlignmentChange(previewSettings.justifyContent, 'stretch')
                }
            ]
        },
        padding: {
            title: 'Padding',
            options: [
                {
                    label: 'None',
                    value: '0px',
                    isSelected: previewSettings.padding === '0px',
                    onChange: () => setPreviewSettings({ ...previewSettings, padding: '0px' })
                },
                {
                    label: 'Small',
                    value: '20px',
                    isSelected: previewSettings.padding === '20px',
                    onChange: () => setPreviewSettings({ ...previewSettings, padding: '20px' })
                }
            ]
        },
        zoom: {
            title: 'Zoom',
            options: [
                {
                    label: 'Default',
                    value: '1',
                    isSelected: previewSettings.zoomLevel === '1',
                    onChange: () => setPreviewSettings({
                        ...previewSettings,
                        zoomLevel: '1',
                    })
                },
                {
                    label: '80%',
                    value: '0.8',
                    isSelected: previewSettings.zoomLevel === '0.8',
                    onChange: () => setPreviewSettings({
                        ...previewSettings,
                        zoomLevel: '0.8',
                    })
                },
                {
                    label: '50%',
                    value: '0.5',
                    isSelected: previewSettings.zoomLevel === '0.5',
                    onChange: () => setPreviewSettings({
                        ...previewSettings,
                        zoomLevel: '0.5',
                    })
                }
            ]
        }
    };

    return (
        <Menu isOpen={isMenuOpen} offset={{ x: -4, y: 12 }} showBorder={true} onClose={handleCloseMenu} className='z-50 mt-0 p-2' colors={['#5555ff']} anchorEl={anchorEl}>
            <div className="relative w-[240px] h-[380px] overflow-hidden">
                <h3 className="text-lg font-semibold mb-1 text-gray-300 w-full mt-2 text-center">Preview Page Settings</h3>
                <AnimatePresence mode="wait" initial={false}>
                    {!isAdvancedOpen ? (
                        <motion.div
                            key="basic"
                            initial={{
                                x: -20,
                                opacity: 0,
                            }}
                            animate={{
                                x: 0,
                                opacity: 1,
                            }}
                            exit={{
                                x: 20,
                                opacity: 0,
                                transition: {
                                    duration: 0.15
                                }
                            }}
                            transition={{
                                duration: 0.2,
                                ease: [0.32, 0.72, 0, 1]
                            }}
                            className="absolute top-10 left-0 right-0 px-3 py-3 space-y-3"
                        >

                            {/* Basic Settings */}
                            <div className="space-y-3">
                                {['background', 'alignment', 'padding', 'zoom'].map(key => (
                                    <div key={key} className="space-y-2">
                                        <span className="text-sm font-medium text-gray-300">{settingsConfig[key].title}</span>
                                        <div className="flex flex-wrap gap-2">
                                            {settingsConfig[key].options.map((option, index) => (
                                                <Chip
                                                    key={index}
                                                    label={option.label}
                                                    icon={option.icon}
                                                    isSelected={option.isSelected}
                                                    onSelect={option.onChange}
                                                    color="blue"
                                                    size="small"
                                                    showX={false}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="advanced"
                            initial={{
                                x: 20,
                                opacity: 0,
                            }}
                            animate={{
                                x: 0,
                                opacity: 1,
                            }}
                            exit={{
                                x: -20,
                                opacity: 0,
                                transition: {
                                    duration: 0.15
                                }
                            }}
                            transition={{
                                duration: 0.2,
                                ease: [0.32, 0.72, 0, 1]
                            }}
                            className="absolute top-10 left-0 right-0 px-3 py-3 space-y-3"
                        >
                            {/* Advanced Settings Content */}
                            <div className="space-y-3">
                                {['size', 'horizontalAlignment', 'verticalAlignment'].map(key => (
                                    <div key={key} className="space-y-2">
                                        <span className="text-sm font-medium text-gray-300">{settingsConfig[key].title}</span>
                                        <div className="flex flex-wrap gap-2">
                                            {settingsConfig[key].options.map((option, index) => (
                                                <Chip
                                                    key={index}
                                                    label={option.label}
                                                    icon={option.icon}
                                                    isSelected={option.isSelected}
                                                    onSelect={option.onChange}
                                                    color="blue"
                                                    size="small"
                                                    showX={false}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Move toggle button outside of AnimatePresence */}
                <div className="absolute bottom-0 px-3 pb-3 w-[240px]">
                    <button
                        onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                        className="w-full px-3 py-2 text-sm font-medium rounded-lg
                            bg-[#171717] text-gray-300 hover:bg-[#191919]
                            transition-colors duration-200 flex items-center justify-between"
                    >
                        {isAdvancedOpen ? 'Open Basic Settings' : 'Open Advanced Settings'}
                        <svg
                            className={`w-4 h-4 transition-transform duration-200 rotate-180 ${isAdvancedOpen ? '-rotate-90' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            </div>
        </Menu>
    );
}

export default SettingsMenu