import { useRef, useState } from "react";
import { GradientSpot } from "../Common";
import { motion } from "framer-motion";
import { Folder, Code } from "lucide-react";

function QuickStartCard({ name, onClick, color, Icon, iconClassName }) {
    const [isHovered, setIsHovered] = useState(false);
    const cardRef = useRef(null);

    return (
        <div className="relative [transform:translateZ(0)]">
            <motion.div
                ref={cardRef}
                className="relative cursor-pointer rounded-xl shadow-md overflow-hidden border border-[rgba(255,255,255,0.18)] h-12 flex items-center px-4"
                style={{
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    transformStyle: 'preserve-3d',
                    backfaceVisibility: 'hidden',
                    WebkitTransformStyle: 'preserve-3d',
                    WebkitBackfaceVisibility: 'hidden',
                    perspective: '1000px',
                    WebkitPerspective: '1000px',
                    WebkitTransform: 'translate3d(0, 0, 0)'
                }}
                whileHover={{
                    y: -2,
                    boxShadow: '0 8px 32px -1px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(255,255,255,0.3)',
                    border: '1px solid rgba(255,255,255,0.3)',
                }}
                onClick={onClick}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
            >
                <div className="absolute inset-0 rounded-xl overflow-hidden">
                    <GradientSpot color={color} size={100} position={{ x: '-10%', y: '-50%' }} />
                </div>
                <motion.div
                    className="flex items-center justify-between w-full relative z-10"
                >
                    <motion.span
                        className="text-gray-200 font-medium truncate"
                        initial={{ y: 0, x: 0 }}
                        whileHover={{ y: -2, x: 2 }}
                        transition={{ type: "spring", stiffness: 300, damping: 10 }}
                    >
                        {name}
                    </motion.span>
                    <motion.div
                        initial={{ x: 0, opacity: 0.7, rotate: 0 }}
                        whileHover={{ x: 5, opacity: 1, rotate: 360 }}
                        transition={{ duration: 0.5 }}
                    >
                        {/* {type === 'project' ? (
                            <Folder size={18} className="text-blue-400" />
                        ) : (
                            <Code size={18} className="text-yellow-400" />
                        )} */}
                        {Icon && <Icon size={18} className={iconClassName} />}
                    </motion.div>
                </motion.div>
                <motion.div
                    className="absolute inset-0 bg-white/5 rounded-md"
                    style={{
                        transformStyle: 'preserve-3d',
                    }}
                />
            </motion.div>
        </div>
    );
}
export default QuickStartCard;