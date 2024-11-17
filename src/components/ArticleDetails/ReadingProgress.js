import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

const ReadingProgress = ({ articleId }) => {
  const [progress, setProgress] = useState(0);
  const [maxProgress, setMaxProgress] = useState(0);
  const storageKey = `reading-progress-${articleId}`;

  // Calculate rainbow color based on progress
  const progressColor = useMemo(() => {
    // Define rainbow colors (red, orange, yellow, green, blue, indigo, violet)
    const colors = [
      { r: 255, g: 0, b: 0 },     // Red
      { r: 255, g: 127, b: 0 },   // Orange
      { r: 255, g: 255, b: 0 },   // Yellow
      { r: 0, g: 255, b: 0 },     // Green
      { r: 0, g: 0, b: 255 },     // Blue
      { r: 75, g: 0, b: 130 },    // Indigo
      { r: 148, g: 0, b: 211 }    // Violet
    ];
    
    // Calculate which color segment we're in
    const numColors = colors.length;
    const segment = (progress / 100) * (numColors - 1);
    const index = Math.floor(segment);
    const fraction = segment - index;

    // If we're at the last color, return it
    if (index >= numColors - 1) return `rgb(${colors[numColors - 1].r}, ${colors[numColors - 1].g}, ${colors[numColors - 1].b})`;

    // Interpolate between two colors
    const color1 = colors[index];
    const color2 = colors[index + 1];

    const r = Math.round(color1.r + (color2.r - color1.r) * fraction);
    const g = Math.round(color1.g + (color2.g - color1.g) * fraction);
    const b = Math.round(color1.b + (color2.b - color1.b) * fraction);

    return `rgb(${r}, ${g}, ${b})`;
  }, [progress]);

  // Load progress from localStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem(storageKey);
    if (savedProgress !== null) {
      const parsedProgress = parseFloat(savedProgress);
      setProgress(parsedProgress);
      setMaxProgress(parsedProgress);
    }
  }, [articleId, storageKey]);

  // Calculate and update progress as user scrolls
  useEffect(() => {
    const calculateProgress = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrollTop = window.scrollY;
      const currentProgress = Math.min(Math.max((scrollTop / documentHeight) * 100, 0), 100);
      
      setProgress(currentProgress);

      // Update max progress and save to localStorage only when we reach a new maximum
      if (currentProgress > maxProgress) {
        setMaxProgress(currentProgress);
        localStorage.setItem(storageKey, currentProgress.toString());
      }
    };

    window.addEventListener('scroll', calculateProgress);
    // Calculate initial progress
    calculateProgress();
    return () => window.removeEventListener('scroll', calculateProgress);
  }, [maxProgress, storageKey]);

  return (
    <div className="relative w-full h-1.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
      {/* Max progress indicator */}
      <div
        className="absolute left-0 top-0 h-full bg-gray-200 transition-all duration-200"
        style={{ width: `${maxProgress}%` }}
      />
      {/* Current progress indicator */}
      <motion.div
        className="absolute left-0 top-0 h-full"
        style={{ backgroundColor: progressColor }}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.1 }}
      />
      <div 
        className="absolute right-2 -top-6 text-xs font-medium flex items-center gap-2"
      >
        <span className="text-gray-400">Max: {Math.round(maxProgress)}%</span>
        <span style={{ color: progressColor }}>{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

export default ReadingProgress;
