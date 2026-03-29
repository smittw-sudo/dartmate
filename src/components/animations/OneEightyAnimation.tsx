import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OneEightyAnimationProps {
  visible: boolean;
  playerName: string;
  onDone: () => void;
}

export function OneEightyAnimation({ visible, playerName, onDone }: OneEightyAnimationProps) {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onDone, 2500);
      return () => clearTimeout(t);
    }
  }, [visible, onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="text-9xl font-black text-accent drop-shadow-2xl"
            initial={{ scale: 0.3, rotate: -10 }}
            animate={{ scale: [0.3, 1.3, 1.0], rotate: [-10, 5, 0] }}
            transition={{ duration: 0.5, times: [0, 0.6, 1] }}
          >
            180!
          </motion.div>
          <motion.div
            className="text-2xl text-white mt-4 font-bold"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {playerName}
          </motion.div>

          {/* Confetti dots */}
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                backgroundColor: i % 3 === 0 ? '#00C853' : i % 3 === 1 ? '#FFD700' : '#FF3B30',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
                y: [0, -80 - Math.random() * 60],
                x: [(Math.random() - 0.5) * 100],
              }}
              transition={{ delay: Math.random() * 0.3, duration: 1.5 }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
