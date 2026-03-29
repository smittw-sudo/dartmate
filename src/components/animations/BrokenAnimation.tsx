import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BrokenAnimationProps {
  visible: boolean;
  playerName: string;
  onDone: () => void;
}

export function BrokenAnimation({ visible, playerName, onDone }: BrokenAnimationProps) {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onDone, 3000);
      return () => clearTimeout(t);
    }
  }, [visible, onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="text-center"
            animate={{ x: [-8, 8, -8, 8, -4, 4, 0] }}
            transition={{ duration: 0.5, repeat: 2, repeatType: 'loop' }}
          >
            <motion.div
              className="text-danger text-6xl font-black uppercase tracking-widest"
              initial={{ scale: 0.5, y: -50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
              {playerName}
            </motion.div>
            <motion.div
              className="text-danger text-5xl font-black uppercase mt-2"
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
            >
              IS GEBROKEN!
            </motion.div>
          </motion.div>
          <motion.div
            className="mt-8 text-text-secondary text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Eerste speler verliest het potje
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
