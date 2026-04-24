import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { quotaState } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';

export default function QuotaWarning() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);

  useEffect(() => {
    // Check periodically or specifically when errors happen
    const interval = setInterval(() => {
      if (quotaState.isExceeded && !hasDismissed) {
        setIsVisible(true);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [hasDismissed]);

  const handleDismiss = () => {
    setIsVisible(false);
    setHasDismissed(true);
    // Silent for this session (page reload will show again if still exceeded)
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-4 left-4 right-4 z-[999] bg-white border border-gray-100 rounded-3xl p-3 shadow-2xl md:max-w-md md:mx-auto ring-1 ring-black/5"
      >
        <div className="flex items-center gap-3">
          <div className="bg-amber-50 p-2.5 rounded-2xl shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <h4 className="text-[11px] font-bold text-gray-900 leading-none">Database Limit Met</h4>
            <p className="text-[9px] text-gray-500 mt-1.5 leading-relaxed">
              We've hit the community database limit for today. You can still browse, but actions like listing or buying may be paused.
            </p>
          </div>
          <button 
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-50 rounded-xl transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
