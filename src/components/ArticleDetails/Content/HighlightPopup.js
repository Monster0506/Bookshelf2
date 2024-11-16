import React from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';

const HighlightPopup = ({ position, onRemove, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="fixed z-50 bg-white shadow-lg rounded-lg p-2 flex items-center space-x-2"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <button
        onClick={onRemove}
        className="text-gray-600 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
        title="Remove highlight"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
      <button
        onClick={onClose}
        className="text-gray-600 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100 transition-colors"
        title="Close"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default HighlightPopup;
