import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHighlighter, FaTimes, FaEdit, FaStickyNote } from 'react-icons/fa';

const HIGHLIGHT_COLORS = {
  yellow: { bg: 'bg-yellow-200', text: 'text-yellow-800', border: 'border-yellow-300' },
  green: { bg: 'bg-green-200', text: 'text-green-800', border: 'border-green-300' },
  blue: { bg: 'bg-blue-200', text: 'text-blue-800', border: 'border-blue-300' },
  purple: { bg: 'bg-purple-200', text: 'text-purple-800', border: 'border-purple-300' },
  red: { bg: 'bg-red-200', text: 'text-red-800', border: 'border-red-300' },
};

const HighlightManager = ({ 
  activeHighlightColor, 
  setActiveHighlightColor,
  isHighlighting,
  setIsHighlighting,
  onAddNote,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleColorSelect = useCallback((color) => {
    setActiveHighlightColor(color);
    setShowColorPicker(false);
    setIsHighlighting(true);
  }, [setActiveHighlightColor, setIsHighlighting]);

  return (
    <motion.div 
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-lg border border-gray-200 p-2 z-50"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
    >
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${
            isHighlighting ? `${HIGHLIGHT_COLORS[activeHighlightColor].bg} ${HIGHLIGHT_COLORS[activeHighlightColor].text}` : ''
          }`}
          title="Highlight Text"
        >
          <FaHighlighter />
        </button>

        <AnimatePresence>
          {showColorPicker && (
            <motion.div 
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 p-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="flex space-x-2">
                {Object.entries(HIGHLIGHT_COLORS).map(([color, styles]) => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    className={`w-6 h-6 rounded-full ${styles.bg} ${styles.border} border-2 hover:scale-110 transition-transform`}
                    title={`${color.charAt(0).toUpperCase() + color.slice(1)} Highlight`}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={onAddNote}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          title="Add Note"
        >
          <FaStickyNote />
        </button>

        {isHighlighting && (
          <button
            onClick={() => setIsHighlighting(false)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
            title="Cancel Highlighting"
          >
            <FaTimes />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default HighlightManager;
