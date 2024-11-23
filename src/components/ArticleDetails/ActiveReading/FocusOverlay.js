import React, { useEffect, useState } from 'react';
import { useActiveReading } from './ActiveReadingProvider';

const ACCENT_COLORS = {
  purple: 'rgb(147, 112, 219)',
  blue: 'rgb(100, 149, 237)',
  green: 'rgb(72, 209, 204)',
  gold: 'rgb(255, 215, 0)',
  coral: 'rgb(255, 127, 80)'
};

const FocusOverlay = () => {
  const { isFocusMode, focusedParagraph, focusOnParagraph, toggleFocusMode } = useActiveReading();
  const [spotlightIntensity, setSpotlightIntensity] = useState(0.1); // 0.1 to 0.9
  const [accentColor, setAccentColor] = useState('purple');
  const [isTypewriterMode, setTypewriterMode] = useState(false);
  const [extraZoom, setExtraZoom] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    if (!isFocusMode) {
      // Reset all paragraphs and images when exiting focus mode
      const elements = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, img, p img'));
      elements.forEach(el => {
        el.style.opacity = '';
        el.style.filter = '';
        el.style.transform = '';
        el.style.margin = '';
        el.style.padding = '';
        el.style.borderLeft = '';
        el.style.cursor = '';
        el.style.transition = '';
        el.style.textShadow = '';
      });
      return;
    }

    const paragraphs = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6'));
    const images = Array.from(document.querySelectorAll('img, p img'));
    
    // Handle keyboard navigation
    const handleKeyDown = (e) => {
      if (!isFocusMode) return;
      
      let nextIndex = -1;
      const currentIndex = focusedParagraph ? focusedParagraph.index : -1;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          toggleFocusMode();
          break;
        case 'ArrowDown':
        case 'j':
        case ' ':  // Space bar for next paragraph
          e.preventDefault();
          nextIndex = currentIndex < paragraphs.length - 1 ? currentIndex + 1 : currentIndex;
          break;
        case 'ArrowUp':
        case 'k':
          e.preventDefault();
          nextIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = paragraphs.length - 1;
          break;
        case 't':
          // Toggle typewriter mode
          e.preventDefault();
          setTypewriterMode(prev => !prev);
          break;
        case 'z':
          // Toggle extra zoom on focused paragraph
          e.preventDefault();
          if (focusedParagraph) {
            setExtraZoom(prev => !prev);
          }
          break;
        case 'b':
          // Add/remove bookmark
          e.preventDefault();
          if (focusedParagraph) {
            setBookmarks(prev => {
              const index = prev.findIndex(b => b === focusedParagraph.index);
              if (index !== -1) {
                // Remove bookmark
                return prev.filter(b => b !== focusedParagraph.index);
              } else {
                // Add bookmark
                return [...prev, focusedParagraph.index].sort((a, b) => a - b);
              }
            });
          }
          break;
        case 'v':
          // Jump to previous bookmark
          e.preventDefault();
          if (bookmarks.length > 0) {
            const prevBookmark = bookmarks.reverse().find(b => b < currentIndex);
            if (prevBookmark !== undefined) {
              nextIndex = prevBookmark;
            } else {
              nextIndex = bookmarks[bookmarks.length - 1]; // Loop to last bookmark
            }
          }
          break;
        case 'n':
          // Jump to next bookmark
          e.preventDefault();
          if (bookmarks.length > 0) {
            const nextBookmark = bookmarks.find(b => b > currentIndex);
            if (nextBookmark !== undefined) {
              nextIndex = nextBookmark;
            } else {
              nextIndex = bookmarks[0]; // Loop to first bookmark
            }
          }
          break;
        case '[':
          e.preventDefault();
          setSpotlightIntensity(prev => Math.max(0.1, prev - 0.1));
          break;
        case ']':
          e.preventDefault();
          setSpotlightIntensity(prev => Math.min(0.9, prev + 0.1));
          break;
        case 'c':
          // Cycle through accent colors
          e.preventDefault();
          setAccentColor(prev => {
            const colors = Object.keys(ACCENT_COLORS);
            const nextIndex = (colors.indexOf(prev) + 1) % colors.length;
            return colors[nextIndex];
          });
          break;
        default:
          return;
      }

      if (nextIndex !== -1 && nextIndex !== currentIndex) {
        const targetParagraph = paragraphs[nextIndex];
        // Scroll behavior based on typewriter mode
        targetParagraph.scrollIntoView({
          behavior: 'smooth',
          block: isTypewriterMode ? 'center' : 'nearest'
        });
        focusOnParagraph(targetParagraph);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Handle images
    images.forEach(img => {
      img.style.transition = `
        opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1),
        transform 0.5s cubic-bezier(0.4, 0, 0.2, 1),
        filter 0.4s cubic-bezier(0.4, 0, 0.2, 1)
      `;
      img.style.opacity = spotlightIntensity;
      img.style.cursor = 'pointer';
      img.style.transform = 'scale(1)';
      img.style.filter = 'blur(1px)';

      img.addEventListener('mouseenter', () => {
        if (isFocusMode) {
          img.style.opacity = '1';
          img.style.transform = 'scale(1.05)';
          img.style.zIndex = '10';
          img.style.filter = 'none';
        }
      });

      img.addEventListener('mouseleave', () => {
        if (isFocusMode) {
          img.style.opacity = spotlightIntensity;
          img.style.transform = 'scale(1)';
          img.style.zIndex = 'auto';
          img.style.filter = 'blur(1px)';
        }
      });
    });
    
    // Handle paragraphs
    paragraphs.forEach((p, index) => {
      p.style.cursor = 'pointer';
      p.style.borderRadius = '4px';
      p.style.position = 'relative';
      
      // Add bookmark indicator if paragraph is bookmarked
      const isBookmarked = bookmarks.includes(index);
      let bookmarkIndicator = p.querySelector('.bookmark-indicator');
      
      if (isBookmarked && !bookmarkIndicator) {
        bookmarkIndicator = document.createElement('div');
        bookmarkIndicator.className = 'bookmark-indicator';
        bookmarkIndicator.style.cssText = `
          position: absolute;
          left: -1rem;
          top: 50%;
          transform: translateY(-50%);
          width: 0.5rem;
          height: 0.5rem;
          background-color: ${ACCENT_COLORS[accentColor]};
          border-radius: 50%;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        `;
        p.appendChild(bookmarkIndicator);
      } else if (!isBookmarked && bookmarkIndicator) {
        bookmarkIndicator.remove();
      }
      
      p.style.transition = `
        opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1),
        transform 0.6s cubic-bezier(0.4, 0, 0.2, 1),
        margin 0.4s cubic-bezier(0.4, 0, 0.2, 1),
        padding 0.4s cubic-bezier(0.4, 0, 0.2, 1),
        border-left-color 0.4s cubic-bezier(0.4, 0, 0.2, 1),
        font-size 0.4s cubic-bezier(0.4, 0, 0.2, 1),
        filter 0.4s cubic-bezier(0.4, 0, 0.2, 1),
        text-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1)
      `;

      p.style.padding = '0.5rem';
      p.style.margin = '0.5rem 0';
      p.style.borderLeft = '3px solid transparent';
      p.style.transform = 'translateX(0)';
      p.style.fontSize = 'inherit';
      p.style.filter = 'blur(1px)';
      p.style.textShadow = 'none';

      if (focusedParagraph && index === focusedParagraph.index) {
        requestAnimationFrame(() => {
          p.style.opacity = '1';
          p.style.backgroundColor = 'transparent';
          p.style.padding = '1rem 1rem 1rem 2rem';
          p.style.margin = '1.5rem 0';
          p.style.borderLeft = `3px solid ${ACCENT_COLORS[accentColor]}`;
          p.style.fontSize = extraZoom ? '1.2em' : '1.1em';
          p.style.filter = 'none';
          p.style.textShadow = '0 1px 2px rgba(0,0,0,0.1)';
          
          const paragraphImages = p.querySelectorAll('img');
          paragraphImages.forEach(img => {
            img.style.opacity = '1';
            img.style.filter = 'none';
          });
          
          setTimeout(() => {
            p.style.transform = `translateX(1rem) scale(${extraZoom ? 1.1 : 1})`;
          }, 50);
        });
      } else {
        p.style.opacity = spotlightIntensity;
        p.style.backgroundColor = 'transparent';
        p.style.transform = 'translateX(0)';
        p.style.borderLeft = '3px solid transparent';
        p.style.fontSize = 'inherit';

        p.addEventListener('mouseenter', () => {
          if (isFocusMode && (!focusedParagraph || index !== focusedParagraph.index)) {
            p.style.opacity = '0.3';
            p.style.transform = 'translateX(0.2rem)';
            p.style.filter = 'blur(0.5px)';
          }
        });

        p.addEventListener('mouseleave', () => {
          if (isFocusMode && (!focusedParagraph || index !== focusedParagraph.index)) {
            p.style.opacity = spotlightIntensity;
            p.style.transform = 'translateX(0)';
            p.style.filter = 'blur(1px)';
          }
        });
      }
    });

    // Add click handler for paragraph switching and outside clicks
    const handleClick = (e) => {
      const clickedParagraph = e.target.closest('p, h1, h2, h3, h4, h5, h6');
      
      if (clickedParagraph) {
        if (!focusedParagraph || clickedParagraph !== focusedParagraph.element) {
          focusOnParagraph(clickedParagraph);
        }
      } else if (!e.target.matches('img')) {
        toggleFocusMode();
      }
    };

    document.addEventListener('click', handleClick);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      [...paragraphs, ...images].forEach(el => {
        // Remove bookmark indicators
        const bookmarkIndicator = el.querySelector('.bookmark-indicator');
        if (bookmarkIndicator) {
          bookmarkIndicator.remove();
        }
        
        // Reset all styles
        el.style.cssText = '';
        
        // Remove any event listeners by replacing with clone
        const clone = el.cloneNode(true);
        el.parentNode.replaceChild(clone, el);
      });
    };
  }, [isFocusMode, focusedParagraph, focusOnParagraph, toggleFocusMode, spotlightIntensity, accentColor, isTypewriterMode, extraZoom, bookmarks]);

  return null;
};

export default FocusOverlay;
