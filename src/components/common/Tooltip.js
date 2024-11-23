import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Tooltip = ({ children, title, content, placement = 'top', className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const getPlacementStyles = () => {
    switch (placement) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-1.5';
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-1.5';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-1.5';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-1.5';
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-1.5';
    }
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <AnimatePresence>
        {isVisible && (
          <motion.div 
            className={`
              pointer-events-none
              absolute z-50 
              px-2.5 py-1.5
              text-xs
              text-white bg-gray-800/95
              rounded-md
              ${getPlacementStyles()}
              ${className}
            `}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            role="tooltip"
          >
            <div className="font-medium">{title}</div>
            {content && (
              <div className="mt-1 text-gray-300 font-normal">{content}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </div>
  );
};

export default Tooltip;
