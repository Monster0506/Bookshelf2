import React, { useRef } from 'react';
import { useActiveReading } from '../ActiveReading/ActiveReadingProvider';
import FocusOverlay from '../ActiveReading/FocusOverlay';

const ArticleContent = ({ content }) => {
  const { 
    isFocusMode,
    focusOnParagraph,
    isHighlighting,
    handleTextSelection 
  } = useActiveReading();

  const contentRef = useRef(null);

  const handleParagraphClick = (e) => {
    if (!isFocusMode) return;
    const paragraph = e.target.closest('p, h1, h2, h3, h4, h5, h6');
    if (paragraph) {
      focusOnParagraph(paragraph);
    }
  };

  return (
    <div className="relative">
      {/* Article Content */}
      <div 
        ref={contentRef}
        className="prose max-w-none markdown-content"
        onClick={handleParagraphClick}
        onMouseUp={isHighlighting ? handleTextSelection : undefined}
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {/* Focus Mode Overlay */}
      <FocusOverlay />
    </div>
  );
};

export default ArticleContent;
