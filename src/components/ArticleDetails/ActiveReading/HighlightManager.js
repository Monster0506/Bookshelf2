import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHighlighter, FaTimes, FaEdit, FaStickyNote, FaBook, FaEye } from 'react-icons/fa';
import { useActiveReading } from './ActiveReadingProvider';

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
  onLookupWord
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const { isFocusMode, toggleFocusMode } = useActiveReading();

  const handleColorSelect = useCallback((color) => {
    setActiveHighlightColor(color);
    setShowColorPicker(false);
    setIsHighlighting(true);
  }, [setActiveHighlightColor, setIsHighlighting]);

  const handleDictionaryClick = useCallback(() => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText && selectedText.split(/\s+/).length === 1) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      onLookupWord(selectedText, {
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY
      });
    }
  }, [onLookupWord]);

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

        <button
          onClick={handleDictionaryClick}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          title="Look up in Dictionary"
        >
          <FaBook />
        </button>

        <button
          onClick={onAddNote}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          title="Add Marginal Note"
        >
          <FaStickyNote />
        </button>

        <motion.button
          className={`p-2 rounded-full hover:bg-gray-100 relative group ${isFocusMode ? 'bg-purple-100' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFocusMode();
            // Force blur to remove focus from the button after clicking
            document.activeElement.blur();
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaEye className={`w-5 h-5 ${isFocusMode ? 'text-purple-600' : 'text-gray-600'}`} />
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Spotlight Mode
            <div className="text-xs text-gray-300 mt-1">
              ↑/k: Previous paragraph<br/>
              ↓/j/Space: Next paragraph<br/>
              b: Toggle bookmark<br/>
              v/n: Previous/Next bookmark<br/>
              z: Toggle zoom<br/>
              t: Toggle typewriter mode<br/>
              [/]: Adjust spotlight<br/>
              c: Change accent color
            </div>
          </div>
        </motion.button>

        {isHighlighting && (
          <button
            onClick={() => setIsHighlighting(false)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
            title="Cancel Highlighting"
          >
            <FaTimes />
          </button>
        )}

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
      </div>
    </motion.div>
  );
};

export default HighlightManager;
