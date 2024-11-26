import React, { useEffect, useRef, useCallback } from 'react';
import { useActiveReading } from '../ActiveReading/ActiveReadingProvider';
import FocusOverlay from '../ActiveReading/FocusOverlay';
import HeadingDots from './HeadingDots';

const ArticleContent = ({ content, contentRef, onHighlightsRendered }) => {
  const { 
    isFocusMode,
    focusOnParagraph,
    isHighlighting,
    handleTextSelection 
  } = useActiveReading();

  const handleParagraphClick = (e) => {
    if (!isFocusMode) return;
    const paragraph = e.target.closest('p, h1, h2, h3, h4, h5, h6, th');
    if (paragraph) {
      focusOnParagraph(paragraph);
    }
  };

  const handleMouseUp = useCallback(() => {
    if (isHighlighting && contentRef.current) {
      handleTextSelection(contentRef);
    }
  }, [isHighlighting, handleTextSelection, contentRef]);

  useEffect(() => {
    if (contentRef.current) {
      console.log("Content mounted:", contentRef.current);
      onHighlightsRendered?.();
    }
  }, [contentRef, onHighlightsRendered]);

  return (
    <div className="relative">
      <HeadingDots contentRef={contentRef} />

      {/* Article Content */}
      <div 
        ref={contentRef}
        className="prose max-w-none markdown-content"
        onClick={handleParagraphClick}
        onMouseUp={handleMouseUp}
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {/* Focus Mode Overlay */}
      <FocusOverlay />
    </div>
  );
};

export default ArticleContent;
