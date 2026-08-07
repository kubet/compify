import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { upvote } from '@/lib/api';

function UpvoteButtons({ id, status, changeStatus }) {
    const [showConfetti, setShowConfetti] = useState(false);

    const createConfettiParticles = () => {
        return Array.from({ length: 12 }).map((_, index) => (
            <motion.div
                key={index}
                className="absolute w-2 h-2 bg-green-400 rounded-full"
                initial={{ scale: 0 }}
                animate={{
                    scale: [0, 1, 0],
                    x: [0, (Math.random() - 0.5) * 100],
                    y: [0, (Math.random() - 0.5) * 100],
                    opacity: [1, 1, 0],
                }}
                transition={{
                    duration: 0.6,
                    ease: "easeOut",
                }}
            />
        ));
    };

    const handleUpdateStatus = async (e, status) => {
        e.stopPropagation();
        e.preventDefault();
        const res = await upvote({ id, status });
        if (res.status === 201) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 700);
            changeStatus(status);
        }
    }

    return (
        <motion.div className="flex justify-end items-end gap-2 relative">
            <motion.button
                className={`${status === 'upvote' ? 'bg-green-500/30' : 'bg-white/10 group-hover:bg-black/20'
                    } text-white rounded-full p-2 focus:outline-none backdrop-blur-sm relative`}
                onClick={(e) => handleUpdateStatus(e, 'upvote')}
                whileHover={{ scale: 1.4 }}
                whileTap={{ scale: 0.9 }}
            >
                <ArrowUp size={18} />
                {showConfetti && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        {createConfettiParticles()}
                    </div>
                )}
            </motion.button>
            <motion.button
                className={`${status === 'downvote' ? 'bg-red-500/30' : 'bg-white/10 group-hover:bg-black/20'
                    } text-white rounded-full p-2 focus:outline-none backdrop-blur-sm`}
                onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateStatus(e, 'downvote');
                }}
                whileHover={{ scale: 1.4 }}
                whileTap={{ scale: 0.9 }}
            >
                <ArrowDown size={18} />
            </motion.button>
        </motion.div>
    )
}

export default UpvoteButtons