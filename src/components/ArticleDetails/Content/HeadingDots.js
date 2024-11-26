import React, { useState, useEffect, useMemo, useRef } from 'react';

const HeadingDots = ({ contentRef }) => {
  const [headings, setHeadings] = useState([]);
  const [activeHeading, setActiveHeading] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lineHeight, setLineHeight] = useState(20);
  const [containerHeight, setContainerHeight] = useState(0);
  const containerRef = useRef(null);

  // Initialize headings and set up intersection observer
  useEffect(() => {
    if (!contentRef.current) return;

    // Find all headings and store their info
    const headingElements = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const headingsData = Array.from(headingElements).map((heading) => ({
      id: heading.id,
      text: heading.textContent,
      level: parseInt(heading.tagName[1]),
      element: heading,
    }));
    setHeadings(headingsData);

    // Set up intersection observer for active heading detection
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Find the highest visible heading
            const visibleHeadings = entries
              .filter((e) => e.isIntersecting)
              .map((e) => e.target.id);
            if (visibleHeadings.length > 0) {
              setActiveHeading(visibleHeadings[0]);
            }
          }
        });
      },
      {
        rootMargin: '-80px 0px -80% 0px', // Adjust margins to better detect current section
        threshold: [0, 0.5, 1], // Multiple thresholds for better detection
      }
    );

    headingElements.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [contentRef]);

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

  // Calculate available space and adjust line height
  useEffect(() => {
    const calculateHeights = () => {
      if (!containerRef.current || headings.length === 0) return;

      const topOffset = 120; // Top position of our container
      const bottomPadding = 150; // Bottom padding
      const dotContainerHeight = headings.length <= 5 ? 24 : 16; // Height of dot container
      const windowHeight = window.innerHeight;
      const availableHeight = windowHeight - topOffset - bottomPadding;
      
      // Set container height to exactly fill available space
      setContainerHeight(availableHeight);
      
      // Calculate line height to evenly distribute dots, accounting for dot containers
      const totalGapSpace = availableHeight - (dotContainerHeight * headings.length);
      const calculatedLineHeight = Math.floor(totalGapSpace / (headings.length - 1));
      
      // Use larger spacing for fewer headings, but ensure it fits
      const baseLineHeight = headings.length <= 5 ? Math.min(80, calculatedLineHeight) : calculatedLineHeight;
      setLineHeight(Math.max(16, baseLineHeight)); // Ensure minimum spacing
    };

    calculateHeights();
    window.addEventListener('resize', calculateHeights);
    return () => window.removeEventListener('resize', calculateHeights);
  }, [headings.length]);

  const scrollToHeading = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Offset to account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const getSubsectionHeight = (startIndex, currentLevel) => {
    let height = 0;
    for (let i = startIndex + 1; i < headings.length; i++) {
      if (headings[i].level <= currentLevel) break;
      height += 32; // Height of each heading item
    }
    return height;
  };

  if (headings.length === 0) return null;

  return (
    <div 
      ref={containerRef}
      className="fixed right-[calc(50%-45rem)] top-[120px] flex group"
      style={{
        height: `${containerHeight}px`,
        overflow: 'hidden'
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Expanded sidebar */}
      <div 
        className={`bg-white/95 backdrop-blur-sm shadow-lg rounded-xl mr-4 py-4 px-3 transition-all duration-300 
                   border border-gray-100 overflow-hidden ${
          isExpanded ? 'w-72 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-4'
        }`}
      >
        <div className="space-y-2 relative" style={{ height: `${containerHeight - 32}px`, overflowY: 'auto' }}>
          {headings.map((heading, index) => {
            const styles = getHeadingStyles[heading.id];
            const isActive = heading.id === activeHeading;
            const fontSize = Math.max(0.875, 1.1 - (heading.level - 1) * 0.1);
            const indentLevel = (heading.level - 1) * 0.75;

            // Calculate if this heading starts a new section at its level
            const nextHeading = headings[index + 1];
            const prevHeading = headings[index - 1];
            const isStartOfSection = !prevHeading || prevHeading.level >= heading.level;
            const isEndOfSection = !nextHeading || nextHeading.level >= heading.level;
            const hasChildren = nextHeading && nextHeading.level > heading.level;
            
            return (
              <div key={heading.id} className="relative">
                {/* Bracket lines */}
                {isStartOfSection && hasChildren && (
                  <div 
                    className="absolute left-0 border-l-2 border-gray-200 transition-all duration-300 rounded-bl"
                    style={{ 
                      top: '1.25rem',
                      left: `${indentLevel + 0.25}rem`,
                      height: `${getSubsectionHeight(index, heading.level)}px`,
                      borderBottomLeftRadius: '0.375rem',
                      borderColor: isActive ? 'rgb(59 130 246 / 0.3)' : 'rgb(229 231 235 / 0.5)'
                    }}
                  />
                )}
                <button
                  onClick={() => scrollToHeading(heading.id)}
                  className={`w-full text-left transition-all duration-300 hover:text-blue-500 rounded-lg
                            ${isActive ? 'text-blue-500 font-medium bg-blue-50/50' : 'text-gray-600'}
                            ${isExpanded ? 'opacity-100' : 'opacity-0'}`}
                  style={{
                    paddingLeft: `${indentLevel}rem`,
                    paddingRight: '0.75rem',
                    paddingTop: '0.375rem',
                    paddingBottom: '0.375rem',
                    opacity: styles.opacity,
                    fontSize: `${fontSize}rem`,
                    transform: isActive ? 'translateX(4px)' : 'none'
                  }}
                >
                  {heading.text}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dots navigation */}
      <div className="flex flex-col items-start relative" style={{ height: `${containerHeight}px` }}>
        {headings.map((heading, index) => {
          const styles = getHeadingStyles[heading.id];
          const indentLevel = (heading.level - 1) * 12;
          const isActive = heading.id === activeHeading;
          
          // Base sizes are larger, vary by heading level
          const dotSizes = {
            1: 'w-4 h-4',
            2: 'w-3.5 h-3.5',
            3: 'w-3 h-3',
            4: 'w-2.5 h-2.5',
            5: 'w-2 h-2',
            6: 'w-1.5 h-1.5'
          }[heading.level] || 'w-3 h-3';
          
          const containerSizes = {
            1: 'w-8 h-8',
            2: 'w-7 h-7',
            3: 'w-6 h-6',
            4: 'w-5 h-5',
            5: 'w-4 h-4',
            6: 'w-3 h-3'
          }[heading.level] || 'w-6 h-6';
          
          return (
            <div key={heading.id} className="flex flex-col items-center w-full">
              <div className="flex items-center w-full">
                <div style={{ width: `${indentLevel}px` }} />
                <div className="flex-1 flex flex-col items-center">
                  <button
                    onClick={() => scrollToHeading(heading.id)}
                    className={`group/dot relative ${containerSizes} flex items-center justify-center
                              transition-all duration-300 ${isActive ? 'scale-110' : 'hover:scale-105'}`}
                    title={heading.text}
                  >
                    {/* Outer ring */}
                    {isActive && (
                      <div 
                        className={`absolute ${dotSizes} rounded-full bg-blue-100/50 animate-ping`}
                        style={{ 
                          transform: `scale(1.6)`,
                          opacity: 0.3
                        }}
                      />
                    )}
                    {/* Inner dot */}
                    <div 
                      className={`${dotSizes} rounded-full transition-all duration-300
                        ${isActive 
                          ? 'bg-blue-500 ring-4 ring-blue-100' 
                          : 'bg-gray-300 hover:bg-gray-400 hover:ring-2 hover:ring-gray-200'
                        }`}
                      style={{
                        transform: `scale(${styles.scale})`,
                        opacity: styles.opacity
                      }}
                    />
                  </button>
                  {/* Connecting line */}
                  {index < headings.length - 1 && (
                    <div 
                      className={`w-[2px] transition-all duration-300`}
                      style={{
                        height: `${lineHeight - (heading.level <= 2 ? 32 : 24)}px`,
                        opacity: (styles.opacity + getHeadingStyles[headings[index + 1].id].opacity) / 2,
                        marginLeft: (headings[index + 1].level - heading.level) * 12 / 2,
                        background: isActive 
                          ? 'linear-gradient(180deg, rgb(59 130 246 / 0.3), rgb(209 213 219 / 0.2))'
                          : 'linear-gradient(180deg, rgb(209 213 219 / 0.5), rgb(209 213 219 / 0.2))'
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HeadingDots;
