import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import AD_BANNER_SRC from '../assets/Banner Iklan fix.webp';

const AdBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the ad in this session
    const hasDismissed = sessionStorage.getItem('gulaWise_ad_dismissed');
    if (!hasDismissed) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('gulaWise_ad_dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Ad Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-white rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            {/* Image Content */}
            <div className="relative w-full overflow-hidden bg-white">
              <img 
                src={AD_BANNER_SRC} 
                alt="Iklan GulaWise" 
                className="w-full h-auto display-block"
              />
            </div>

            {/* Close Button Area */}
            <div className="p-4 bg-white flex justify-center border-t border-[#f0f0f0]">
              <button
                onClick={handleClose}
                className="flex items-center gap-2 px-6 py-2.5 hover:bg-[#f8faf7] rounded-full transition-all text-[#5c5c5c] font-bold text-sm group"
              >
                <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                <span>Tutup Iklan</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AdBanner;
