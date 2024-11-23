import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BiHighlight, BiPencil } from 'react-icons/bi';
import { BsTextareaT, BsSquare } from 'react-icons/bs';
import { RiDeleteBin6Line, RiPencilLine } from 'react-icons/ri';
import { MdContentCopy } from 'react-icons/md';
import { useActiveReading } from './ActiveReadingProvider';

const COLORS = [
  { name: 'yellow', color: '#FFE082' },
  { name: 'green', color: '#A5D6A7' },
  { name: 'blue', color: '#90CAF9' },
  { name: 'pink', color: '#F48FB1' },
  { name: 'purple', color: '#CE93D8' }
];

const TOOLS = [
  {
    id: 'highlight',
    name: 'Highlight',
    icon: BiHighlight,
    type: 'highlight',
    colors: true
  },
  {
    id: 'underline',
    name: 'Underline',
    icon: BsTextareaT,
    type: 'underline',
    colors: true
  },
  {
    id: 'box',
    name: 'Box',
    icon: BsSquare,
    type: 'box',
    colors: true
  },
  {
    id: 'note',
    name: 'Add Note',
    icon: BiPencil,
    type: 'note',
    colors: false
  }
];

const HighlightPopup = ({ position, highlightId, onRemove, onClose, highlightText }) => {
  const popupRef = useRef(null);
  const [selectedTool, setSelectedTool] = useState('highlight');
  const [selectedColor, setSelectedColor] = useState('yellow');
  const { addNote, updateHighlightColor, updateHighlightStyle } = useActiveReading();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleToolSelect = (toolId) => {
    setSelectedTool(toolId);
    if (toolId === 'note') {
      handleAddNote();
    } else {
      updateHighlightStyle(highlightId, toolId);
    }
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    updateHighlightColor(highlightId, color);
  };

  const handleAddNote = () => {
    addNote(`Note for: "${highlightText}"`, highlightId);
    onClose();
  };

  const handleCopyText = () => {
    if (highlightText) {
      navigator.clipboard.writeText(highlightText);
      onClose();
    }
  };

  const menuVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 10 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  return (
    <motion.div
      ref={popupRef}
      className="fixed z-50"
      style={{
        left: position.x,
        top: position.y + 20,
      }}
      initial="hidden"
      animate="visible"
      variants={menuVariants}
    >
      <div className="relative">
        <motion.div 
          className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/30 p-3"
          layoutId="menu"
        >
          {/* Main Tools */}
          <div className="flex items-center space-x-1 mb-3">
            {TOOLS.map((tool) => (
              <motion.button
                key={tool.id}
                onClick={() => handleToolSelect(tool.id)}
                className={`relative p-3 rounded-xl transition-all
                  ${selectedTool === tool.id 
                    ? 'bg-gray-100 shadow-sm' 
                    : 'hover:bg-gray-50'
                  }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <tool.icon 
                  className={`w-5 h-5 ${
                    selectedTool === tool.id 
                      ? 'text-blue-500' 
                      : 'text-gray-700'
                  }`}
                />
              </motion.button>
            ))}

            <div className="w-px h-8 bg-gray-200 mx-1" />

            {/* Utility Tools */}
            <motion.button
              onClick={handleCopyText}
              className="p-3 rounded-xl hover:bg-gray-50 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MdContentCopy className="w-5 h-5 text-gray-700" />
            </motion.button>

            <motion.button
              onClick={onRemove}
              className="p-3 rounded-xl hover:bg-gray-50 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RiDeleteBin6Line className="w-5 h-5 text-red-500" />
            </motion.button>
          </div>

          {/* Color Palette */}
          {TOOLS.find(t => t.id === selectedTool)?.colors && (
            <motion.div 
              className="flex items-center justify-center space-x-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {COLORS.map((color) => (
                <motion.button
                  key={color.name}
                  onClick={() => handleColorSelect(color.name)}
                  className={`w-8 h-8 rounded-xl transition-transform relative
                    ${selectedColor === color.name ? 'ring-2 ring-gray-400 ring-offset-2' : ''}`}
                  style={{ backgroundColor: color.color }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {selectedColor === color.name && (
                    <motion.div
                      className="absolute inset-0 rounded-xl bg-black/10"
                      layoutId="selectedColor"
                    />
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default HighlightPopup;
