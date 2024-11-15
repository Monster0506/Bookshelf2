import React from 'react';
import { motion } from 'framer-motion';
import { FaBan } from 'react-icons/fa';

const HighlightPopup = ({ position, onRemove, onClose }) => {
  return (
    <motion.div
      className="fixed bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50 transform -translate-x-1/2 -translate-y-full"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
      }}
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
    >
      <div className="flex items-center space-x-2">
        <button
          onClick={onRemove}
          className="p-2 rounded-full hover:bg-red-100 transition-colors text-red-600"
          title="Remove Highlight"
        >
          <FaBan className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default HighlightPopup;
