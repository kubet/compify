import { motion } from "framer-motion";

const Shimmer = () => (
    <div className="absolute inset-0 overflow-hidden">
        <motion.div
            className="absolute inset-0"
            style={{
                background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.03), transparent)',
                width: '50%',
                skewX: -20,
            }}
            animate={{
                x: ['-100%', '200%'],
            }}
            transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'linear',
                repeatDelay: 1
            }}
        />
        <motion.div
            className="absolute inset-0"
            style={{
                background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.02), transparent)',
                width: '30%',
                skewX: -15,
            }}
            animate={{
                x: ['-100%', '200%'],
            }}
            transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
                delay: 0.5,
                repeatDelay: 0.5
            }}
        />
    </div>
);

export default Shimmer;