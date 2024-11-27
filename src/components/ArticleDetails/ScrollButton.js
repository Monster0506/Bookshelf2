import React, { useState, useEffect } from "react";
import { FaArrowDown, FaArrowUp, FaBookmark, FaClock } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

function ScrollButton() {
  const [scrollInfo, setScrollInfo] = useState({
    isVisible: false,
    isBottom: false,
    progress: 0,
    hasBookmarks: false
  });
  const [bookmarks, setBookmarks] = useState([]);
  const [showBookmarkTooltip, setShowBookmarkTooltip] = useState(false);
  const [isHoveringBookmarks, setIsHoveringBookmarks] = useState(false);
  const [showBookmarksPanel, setShowBookmarksPanel] = useState(false);
  const [editingBookmarkId, setEditingBookmarkId] = useState(null);
  const [readingStats, setReadingStats] = useState({
    timeLeft: 0,
    wordsLeft: 0,
    showStats: false,
    percentComplete: 0
  });

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const halfwayPoint = docHeight / 2;
      const scrollPercentage = (scrollPosition / (docHeight - windowHeight)) * 100;
      
      setScrollInfo({
        isVisible: scrollPosition > 200,
        isBottom: (scrollPosition + windowHeight) >= halfwayPoint,
        progress: Math.min(Math.max(scrollPercentage, 0), 100),
        hasBookmarks: bookmarks.length > 0
      });
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [bookmarks.length]);

  // Handle bookmark panel visibility with delay
  useEffect(() => {
    let timeoutId;
    if (isHoveringBookmarks) {
      setShowBookmarksPanel(true);
    } else {
      timeoutId = setTimeout(() => {
        setShowBookmarksPanel(false);
      }, 300); // Small delay before hiding to make interaction smoother
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isHoveringBookmarks]);

  // Calculate reading time and progress
  useEffect(() => {
    const calculateReadingStats = () => {
      // Get all text content from the article
      const articleContent = document.querySelector('.markdown-content');
      if (!articleContent) return;

      const text = articleContent.textContent || '';
      const words = text.trim().split(/\s+/).length;
      const avgReadingSpeed = 200; // words per minute

      // Calculate total reading time
      const totalMinutes = words / avgReadingSpeed;

      // Calculate remaining words based on scroll position
      const scrollPosition = window.scrollY;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(scrollPosition / totalHeight, 1);
      const wordsLeft = Math.round(words * (1 - progress));
      const timeLeft = Math.round((wordsLeft / avgReadingSpeed) * 10) / 10;
      const percentComplete = Math.round(progress * 100);

      setReadingStats(prev => ({
        ...prev,
        timeLeft,
        wordsLeft,
        percentComplete
      }));
    };

    calculateReadingStats();
    window.addEventListener('scroll', calculateReadingStats);
    return () => window.removeEventListener('scroll', calculateReadingStats);
  }, []);

  const scrollToTopOrBottom = () => {
    if (scrollInfo.isBottom) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const addBookmark = () => {
    const scrollPosition = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const relativePosition = (scrollPosition / docHeight) * 100;
    
    const newBookmark = {
      id: Date.now(),
      position: scrollPosition,
      relativePosition,
      name: `Bookmark ${bookmarks.length + 1}`
    };
    setBookmarks([...bookmarks, newBookmark]);
  };

  const handleNameKeyDown = (e, bookmark) => {
    if (e.key === 'Enter') {
      const updatedBookmarks = bookmarks.map(b => 
        b.id === bookmark.id ? { ...b, name: e.target.value } : b
      );
      setBookmarks(updatedBookmarks);
      setEditingBookmarkId(null);
    } else if (e.key === 'Escape') {
      setEditingBookmarkId(null);
    }
  };

  const updateBookmarkName = (id, name) => {
    setBookmarks(bookmarks.map(bookmark => 
      bookmark.id === id ? { ...bookmark, name } : bookmark
    ));
    setEditingBookmarkId(null);
  };

  const scrollToBookmark = (position) => {
    window.scrollTo({
      top: position,
      behavior: "smooth"
    });
  };

  const removeBookmark = (id, e) => {
    e.stopPropagation();
    setBookmarks(bookmarks.filter(b => b.id !== id));
  };

  return (
    <AnimatePresence>
      {scrollInfo.isVisible && (
        <div 
          className="fixed bottom-5 right-5 flex flex-col items-end space-y-2"
          onMouseEnter={() => setIsHoveringBookmarks(true)}
          onMouseLeave={() => setIsHoveringBookmarks(false)}
        >
          {/* Bookmarks Panel */}
          <AnimatePresence>
            {showBookmarksPanel && bookmarks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg py-1.5 mb-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                style={{ 
                  maxWidth: '220px',
                  WebkitBackdropFilter: 'blur(8px)'
                }}
              >
                {[...bookmarks]
                  .sort((a, b) => a.position - b.position)
                  .map((bookmark, index) => (
                  <motion.div
                    key={bookmark.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="group flex flex-col px-3 py-1.5 hover:bg-blue-50/80 cursor-pointer text-xs border-b last:border-b-0 border-gray-100/50"
                    onClick={() => scrollToBookmark(bookmark.position)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 flex items-center space-x-2">
                        <span className="w-4 h-4 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full font-medium">
                          {index + 1}
                        </span>
                        {editingBookmarkId === bookmark.id ? (
                          <input
                            type="text"
                            defaultValue={bookmark.name}
                            className="w-full px-1 py-0.5 text-xs border border-blue-200 rounded focus:outline-none focus:border-blue-400"
                            onKeyDown={(e) => handleNameKeyDown(e, bookmark)}
                            onClick={e => e.stopPropagation()}
                            autoFocus
                          />
                        ) : (
                          <span className="text-gray-600">
                            {bookmark.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingBookmarkId(bookmark.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 transition-opacity duration-200"
                        >
                          ✎
                        </button>
                        <button
                          onClick={(e) => removeBookmark(bookmark.id, e)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity duration-200"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reading Time Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setReadingStats(prev => ({ ...prev, showStats: !prev.showStats }))}
            className="relative p-3 rounded-full bg-purple-500 text-white shadow-lg hover:bg-purple-600 transition duration-300"
          >
            <FaClock size={20} />
            <AnimatePresence>
              {readingStats.showStats && (
                <motion.div
                  initial={{ opacity: 0, y: 0, scale: 0.8 }}
                  animate={{ opacity: 1, y: -15, scale: 1 }}
                  exit={{ opacity: 0, y: 0, scale: 0.8 }}
                  className="absolute bottom-full mb-1 right-0 bg-white text-gray-800 px-3 py-1 rounded-lg shadow-lg whitespace-nowrap text-xs font-medium"
                  style={{ transform: 'translateX(-25%)' }}
                >
                  <div className="flex flex-col items-center">
                    <div className="text-purple-600">
                      {readingStats.timeLeft <= 0 ? (
                        "Finished reading!"
                      ) : (
                        <>
                          ~{readingStats.timeLeft} min left
                          <div className="flex items-center justify-between w-full">
                            <span className="text-gray-400 text-[10px]">
                              ({readingStats.wordsLeft} words)
                            </span>
                            <span className="text-gray-400 text-[10px] ml-2">
                              {readingStats.percentComplete}% complete
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="absolute bottom-0 right-[25%] transform translate-y-1/2 rotate-45 w-2 h-2 bg-white"></div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Main Button Group */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="flex items-center space-x-2"
          >
            {/* Bookmark Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={addBookmark}
              className={`p-3 rounded-full bg-indigo-500 text-white shadow-lg hover:bg-indigo-600 transition duration-300 relative ${bookmarks.length > 0 ? 'after:content-[""] after:absolute after:-top-1 after:-right-1 after:w-3 after:h-3 after:bg-blue-400 after:rounded-full after:border-2 after:border-white' : ''}`}
            >
              <FaBookmark size={20} />
              <AnimatePresence>
                {showBookmarkTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded whitespace-nowrap"
                  >
                    Bookmark added!
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Scroll Button with Progress Ring */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={scrollToTopOrBottom}
              className="relative p-3 rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 transition duration-300 group"
            >
              <div className="absolute inset-0">
                <svg className="w-full h-full" viewBox="0 0 50 50">
                  {/* Background circle */}
                  <circle
                    cx="25"
                    cy="25"
                    r="20"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="3"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="25"
                    cy="25"
                    r="20"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeDasharray={`${2 * Math.PI * 20}`}
                    strokeDashoffset={`${2 * Math.PI * 20 * (1 - scrollInfo.progress / 100)}`}
                    transform="rotate(-90 25 25)"
                    style={{ transition: "stroke-dashoffset 0.3s ease" }}
                  />
                  {/* Bookmark indicators */}
                  {[...bookmarks]
                    .sort((a, b) => a.position - b.position)
                    .map((bookmark) => {
                    const angle = (bookmark.relativePosition / 100) * 360 - 90;
                    const radius = 22; // Slightly larger than the progress ring (20)
                    const x = 25 + radius * Math.cos((angle * Math.PI) / 180);
                    const y = 25 + radius * Math.sin((angle * Math.PI) / 180);
                    
                    return (
                      <g key={`indicator-${bookmark.id}`}>
                        {/* Glow effect */}
                        <circle
                          cx={x}
                          cy={y}
                          r="3.5"
                          fill="rgba(147, 197, 253, 0.3)"
                          className="transition-all duration-200"
                        />
                        {/* Hover target (larger invisible circle) */}
                        <circle
                          cx={x}
                          cy={y}
                          r="6"
                          fill="transparent"
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            scrollToBookmark(bookmark.position);
                          }}
                        />
                        {/* Visible bookmark dot */}
                        <circle
                          cx={x}
                          cy={y}
                          r="2.5"
                          fill="#3B82F6"
                          stroke="white"
                          strokeWidth="1"
                          className="transition-all duration-200 group-hover:fill-yellow-400 group-hover:stroke-blue-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            scrollToBookmark(bookmark.position);
                          }}
                        >
                          <title>Bookmark {bookmarks.indexOf(bookmark) + 1}</title>
                        </circle>
                      </g>
                    );
                  })}
                </svg>
              </div>
              <div className="relative z-10">
                {scrollInfo.isBottom ? <FaArrowUp size={20} /> : <FaArrowDown size={20} />}
              </div>
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ScrollButton;
