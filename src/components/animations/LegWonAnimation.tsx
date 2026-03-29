import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface LegWonAnimationProps {
  visible: boolean;
  playerName: string;
  onDone: () => void;
}

export function LegWonAnimation({ visible, playerName, onDone }: LegWonAnimationProps) {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onDone, 1500);
      return () => clearTimeout(t);
    }
  }, [visible, onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="flex flex-col items-center gap-3 bg-surface/90 backdrop-blur-sm rounded-3xl px-10 py-8 border border-accent/50"
            initial={{ scale: 0.7, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.4 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <CheckCircle2 size={64} className="text-accent" />
            </motion.div>
            <div className="text-2xl font-bold text-text-primary">{playerName}</div>
            <div className="text-accent font-semibold">Wint deze leg!</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
