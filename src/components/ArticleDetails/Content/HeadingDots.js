import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { throttle } from 'lodash';

const HeadingDots = ({ contentRef }) => {
  const [headings, setHeadings] = useState([]);
  const [activeHeading, setActiveHeading] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lineHeight, setLineHeight] = useState(20);
  const [containerHeight, setContainerHeight] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [lastVisibleHeading, setLastVisibleHeading] = useState(null);
  const [viewportProgress, setViewportProgress] = useState({ top: 0, size: 0 });
  const containerRef = useRef(null);
  const sidebarRef = useRef(null);
  const dotsRef = useRef(null);
  const observerRef = useRef(null);
  const debugRef = useRef({
    lastUpdate: Date.now(),
    updateCount: 0,
    visibleHeadings: new Set(),
  });

  // Debug logging function
  const logDebug = (message, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[HeadingDots] ${message}`, {
        timestamp: new Date().toISOString(),
        activeHeading,
        visibleHeadings: Array.from(debugRef.current.visibleHeadings),
        updateCount: debugRef.current.updateCount,
        timeSinceLastUpdate: Date.now() - debugRef.current.lastUpdate,
        ...data
      });
    }
  };

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize headings and set up intersection observer
  useEffect(() => {
    if (!contentRef.current) {
      logDebug('Content ref is not available');
      return;
    }

    // Find all headings and store their info
    const headingElements = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
    logDebug('Found headings', { count: headingElements.length });

    const headingsData = Array.from(headingElements).map((heading, index) => {
      const rect = heading.getBoundingClientRect();
      const data = {
        id: heading.id || `heading-${index}`,
        text: heading.textContent,
        level: parseInt(heading.tagName[1]),
        element: heading,
        position: {
          top: rect.top + window.pageYOffset,
          height: rect.height,
        }
      };
      logDebug('Processed heading', { id: data.id, text: data.text, level: data.level });
      return data;
    });

    // Add IDs to headings that don't have them
    headingsData.forEach(({ id, element }) => {
      if (!element.id) {
        element.id = id;
        logDebug('Added ID to heading', { id });
      }
    });

    setHeadings(headingsData);

    // Improved intersection observer with better tracking
    const handleIntersection = (entries) => {
      debugRef.current.updateCount++;
      const now = Date.now();
      const timeSinceLastUpdate = now - debugRef.current.lastUpdate;
      debugRef.current.lastUpdate = now;

      // Update visible headings set
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          debugRef.current.visibleHeadings.add(entry.target.id);
        } else {
          debugRef.current.visibleHeadings.delete(entry.target.id);
        }
      });

      // Get all currently visible headings
      const visibleHeadings = entries
        .filter(entry => entry.isIntersecting)
        .map(entry => ({
          id: entry.target.id,
          ratio: entry.intersectionRatio,
          top: entry.boundingClientRect.top,
        }))
        .sort((a, b) => {
          // Prioritize headings closer to the top of the viewport
          const aDistance = Math.abs(a.top);
          const bDistance = Math.abs(b.top);
          if (Math.abs(aDistance - bDistance) < 50) { // If they're within 50px
            return b.ratio - a.ratio; // Use intersection ratio as tiebreaker
          }
          return aDistance - bDistance;
        });

      if (visibleHeadings.length > 0) {
        const newActiveHeading = visibleHeadings[0].id;
        if (newActiveHeading !== activeHeading) {
          logDebug('Updating active heading', {
            previous: activeHeading,
            new: newActiveHeading,
            visibleCount: visibleHeadings.length,
            timeSinceLastUpdate,
          });
          setActiveHeading(newActiveHeading);
        }
      } else {
        logDebug('No visible headings');
      }
    };

    // Create and configure the observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin: '-80px 0px -80% 0px',
      threshold: [0, 0.25, 0.5, 0.75, 1],
    });

    // Start observing all headings
    headingElements.forEach(heading => {
      observerRef.current.observe(heading);
      logDebug('Started observing heading', { id: heading.id });
    });

    return () => {
      if (observerRef.current) {
        logDebug('Cleaning up observer');
        observerRef.current.disconnect();
      }
    };
  }, [contentRef]);

  // Track the last visible heading for progress line
  useEffect(() => {
    const visibleHeadings = headings.filter(heading => {
      const element = document.getElementById(heading.id);
      if (!element) return false;
      
      const rect = element.getBoundingClientRect();
      const isVisible = rect.top <= window.innerHeight && rect.bottom >= 0;
      return isVisible;
    });
    
    if (visibleHeadings.length > 0) {
      const lastVisible = visibleHeadings[visibleHeadings.length - 1];
      setLastVisibleHeading(lastVisible.id);
      logDebug('Last visible heading:', lastVisible.id);
    }
  }, [headings, activeHeading]);

  // Track viewport position relative to headings
  useEffect(() => {
    const updateViewportProgress = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      const scrollTop = window.scrollY;

      // Calculate the position of the viewport as a percentage of the scrollable area
      const scrollPercent = (scrollTop / (scrollHeight - viewportHeight)) * 100;
      
      // Calculate the size of the indicator based on viewport height relative to total height
      const indicatorSize = (viewportHeight / scrollHeight) * 100;

      setViewportProgress({
        top: Math.max(0, Math.min(100 - indicatorSize, scrollPercent)),
        size: indicatorSize
      });
      logDebug('Viewport progress:', { scrollPercent, indicatorSize });
    };

    window.addEventListener('scroll', updateViewportProgress);
    window.addEventListener('resize', updateViewportProgress);
    updateViewportProgress();

    return () => {
      window.removeEventListener('scroll', updateViewportProgress);
      window.removeEventListener('resize', updateViewportProgress);
    };
  }, []);

  // Calculate heading styles based on active heading
  const getHeadingStyles = useMemo(() => {
    if (headings.length === 0) return {};

    const activeIndex = headings.findIndex((h) => h.id === activeHeading);
    return headings.reduce((styles, heading, index) => {
      const distance = Math.abs(index - activeIndex);
      
      // Base scale depends on heading level
      const levelScale = {
        1: 1.4,  // h1 largest
        2: 1.2,  // h2 slightly smaller
        3: 1.0,  // h3 base size
        4: 0.9,  // h4 slightly smaller
        5: 0.8,  // h5 smaller
        6: 0.7   // h6 smallest
      }[heading.level] || 1.0;
      
      // Distance affects opacity more than scale
      const distanceScale = Math.max(0.8, 1 - distance * 0.1);
      
      return {
        ...styles,
        [heading.id]: {
          scale: activeHeading ? levelScale * distanceScale : levelScale,
          opacity: Math.max(0.5, 1 - distance * 0.15),
        },
      };
    }, {});
  }, [activeHeading, headings]);

  // Calculate available space and adjust container height
  useEffect(() => {
    const calculateHeights = () => {
      if (!containerRef.current || headings.length === 0) return;

      // Get viewport height and important elements
      const viewportHeight = window.innerHeight;
      const headerHeight = 80; // Fixed header height
      const scrollButtonHeight = 40; // Height of scroll button component
      const topOffset = 120; // Space from top of viewport
      const bottomOffset = 20; // Extra padding at bottom
      
      // Calculate available height
      const availableHeight = viewportHeight - headerHeight - scrollButtonHeight - topOffset - bottomOffset;
      
      logDebug('Height calculations', {
        viewportHeight,
        headerHeight,
        scrollButtonHeight,
        topOffset,
        bottomOffset,
        availableHeight
      });

      setContainerHeight(availableHeight);
    };

    // Calculate on mount and window resize
    calculateHeights();
    window.addEventListener('resize', calculateHeights);
    return () => window.removeEventListener('resize', calculateHeights);
  }, [headings.length]);

  // Improved smooth scroll with better positioning
  const scrollToHeading = useCallback((id) => {
    logDebug('Scrolling to heading', { id });
    const element = document.getElementById(id);
    if (!element) {
      logDebug('Target heading not found', { id });
      return;
    }

    try {
      const header = document.querySelector('header');
      const headerHeight = header ? header.offsetHeight : 0;
      const offset = headerHeight + 24; // Additional padding
      
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      logDebug('Scroll calculations', {
        headerHeight,
        elementPosition,
        offsetPosition,
        windowHeight: window.innerHeight,
      });

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Update active heading immediately for better UX
      setActiveHeading(id);
    } catch (error) {
      logDebug('Error scrolling to heading', { error: error.message });
    }
  }, []);

  const getSubsectionHeight = (startIndex, currentLevel) => {
    let height = 0;
    for (let i = startIndex + 1; i < headings.length; i++) {
      if (headings[i].level <= currentLevel) break;
      height += 32; // Height of each heading item
    }
    return height;
  };

  // Sync scrolling between sidebar and dots
  const handleScroll = useCallback((event) => {
    const newScrollTop = event.target.scrollTop;
    setScrollTop(newScrollTop);
    
    // Sync the other container's scroll position
    if (event.target === sidebarRef.current && dotsRef.current) {
      dotsRef.current.scrollTop = newScrollTop;
    } else if (event.target === dotsRef.current && sidebarRef.current) {
      sidebarRef.current.scrollTop = newScrollTop;
    }
  }, []);

  if (headings.length === 0) return null;

  return (
    <nav 
      ref={containerRef}
      className="fixed right-[calc(50%-45rem)] top-[120px] flex group z-50"
      style={{
        height: `${containerHeight}px`,
      }}
      onMouseEnter={() => {
        setIsExpanded(true);
        logDebug('Navigation expanded');
      }}
      onMouseLeave={() => {
        setIsExpanded(false);
        logDebug('Navigation collapsed');
      }}
      aria-label="Table of contents"
    >
      {/* Expanded sidebar */}
      <div 
        className={`bg-white/95 backdrop-blur-sm shadow-lg rounded-xl mr-4 transition-all duration-300 
                   border border-gray-100 ${
          isExpanded ? 'w-72 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-4'
        }`}
        style={{ height: `${containerHeight}px` }}
      >
        <div 
          ref={sidebarRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300 px-3"
        >
          <div className="space-y-1 py-2">
            {headings.map((heading, index) => {
              const styles = getHeadingStyles[heading.id];
              const isActive = heading.id === activeHeading;
              const fontSize = Math.max(0.875, 1.1 - (heading.level - 1) * 0.1);
              const indentLevel = (heading.level - 1) * 0.75;

              return (
                <button
                  key={heading.id}
                  onClick={() => scrollToHeading(heading.id)}
                  className={`w-full text-left transition-all duration-300 hover:text-indigo-500 rounded-lg px-3
                            flex items-center min-h-[2rem] ${isActive ? 'text-indigo-500 font-medium bg-indigo-50/50' : 'text-gray-600'}`}
                  style={{
                    paddingLeft: `${indentLevel + 0.75}rem`,
                    fontSize: `${fontSize}rem`,
                    transform: isActive ? 'translateX(4px)' : 'none',
                    opacity: styles?.opacity || 1
                  }}
                >
                  {heading.text}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dots navigation */}
      <div 
        ref={dotsRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto scrollbar-none py-2 relative"
        style={{ scrollbarWidth: 'none' }}
      >
        {/* Background line */}
        <div 
          className="absolute left-1/2 top-0 bottom-0 w-1.5 bg-slate-300 -translate-x-1/2 rounded-full"
          style={{ 
            marginTop: '1rem',
            marginBottom: '1rem',
          }}
        />

        {/* Progress line */}
        <div 
          className="absolute left-1/2 w-1.5 bg-indigo-600 -translate-x-1/2 transition-all duration-300 rounded-full"
          style={{ 
            marginTop: '1rem',
            top: `${viewportProgress.top}%`,
            height: `${viewportProgress.size}%`,
          }}
        />
        
        <div className="space-y-1 relative">
          {headings.map((heading, index) => {
            const styles = getHeadingStyles[heading.id];
            const isActive = heading.id === activeHeading;
            
            // Base sizes for dots based on heading level
            const dotSize = {
              1: 'w-3 h-3',
              2: 'w-2.5 h-2.5',
              3: 'w-2 h-2',
              4: 'w-1.5 h-1.5',
              5: 'w-1.5 h-1.5',
              6: 'w-1.5 h-1.5'
            }[heading.level] || 'w-2 h-2';

            return (
              <div key={heading.id} className="relative group/dot min-h-[2rem] flex items-center justify-center">
                <button
                  onClick={() => scrollToHeading(heading.id)}
                  className={`relative flex items-center justify-center w-8 h-8 transition-all duration-300
                            hover:scale-110 ${isActive ? 'scale-110' : ''}`}
                  title={heading.text}
                >
                  {/* Active indicator ring */}
                  {isActive && (
                    <div 
                      className="absolute inset-0 rounded-full bg-indigo-100/50 animate-ping"
                      style={{ 
                        transform: 'scale(0.65)',
                        opacity: 0.8
                      }}
                    />
                  )}
                  {/* Dot */}
                  <div 
                    className={`${dotSize} rounded-full transition-all duration-300 z-10 relative
                      ${isActive 
                        ? 'bg-indigo-500 ring-4 ring-indigo-100' 
                        : 'bg-slate-400 group-hover/dot:bg-indigo-400 group-hover/dot:ring-2 group-hover/dot:ring-indigo-100'
                      }`}
                    style={{
                      transform: `scale(${styles?.scale || 1})`,
                      opacity: styles?.opacity || 0.85
                    }}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default HeadingDots;
