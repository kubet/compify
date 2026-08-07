import React from 'react'
import { motion } from 'framer-motion'
import MiniButton from '@/components/Elements/MiniButton'
import { Settings } from 'lucide-react'



function FontIcon() {
    return <div className="text-orange-500">Aa</div>
}

function ChangeFont({ fonts, selectFont, openMenu }) {
    return (
        <>
            <div className="flex flex-col gap-1 pb-1">
                <span className="text-xs">Fonts</span>
                <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                    <div className="flex gap-1.5 pb-2">
                        {fonts.map((font) => (
                            <MiniButton
                                key={font.n}
                                text={font.n}
                                Icon={FontIcon}
                                onClick={() => selectFont(font)}
                                className="shrink-0 min-w-fit"
                            />
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="text-sm px-3 py-1 rounded-lg hover:text-white bg-white/10 hover:bg-white/15 transition-colors"
                    onClick={() => openMenu()}
                >
                    <span className="hidden md:block">Open Settings</span>
                    <Settings className="w-5 h-5 md:hidden" />
                </motion.button>
            </div>
        </>
    )
}

export default ChangeFont