import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DOMPurify from "dompurify";
import debounce from "lodash.debounce";
import "react-markdown-editor-lite/lib/index.css";
import Header from "./Content/Header";
import HighlightManager from "./ActiveReading/HighlightManager";
import MarginNotes from "./ActiveReading/MarginNotes";
import HighlightPopup from "./ActiveReading/HighlightPopup";
import { useActiveReading } from "./ActiveReading/ActiveReadingProvider";
import ArticleContent from "./Content/ArticleContent";
import { annotate } from "rough-notation";

function ContentSection({
  article,
  title,
  setTitle,
  saveNotes,
  notes,
  setNotes,
  editing,
  setEditing,
  status,
  setStatus,
  tags,
  setTags,
  createdAt,
  showSummary,
  setShowSummary,
  relatedArticles,
  canEdit,
  isPublic,
  setIsPublic,
  tagSuggestions,
  setTagSuggestions,
  saving,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const contentRef = useRef(null);
  const {
    highlights,
    notes: marginNotes,
    activeHighlightColor,
    isHighlighting,
    setActiveHighlightColor,
    setIsHighlighting,
    addHighlight,
    removeHighlight,
    addNote,
    editNote,
    deleteNote,
    onLookupWord,
  } = useActiveReading();

  const [selectedHighlight, setSelectedHighlight] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  const renderHighlights = useCallback(() => {
    if (!contentRef.current || !highlights.length) return;

    // Get all existing highlights
    const existingHighlights = contentRef.current.querySelectorAll(
      "[data-highlight-id]",
    );
    const existingIds = new Set(
      Array.from(existingHighlights).map((el) => el.dataset.highlightId),
    );

    // Find highlights that need to be removed or updated
    existingHighlights.forEach((highlight) => {
      const id = highlight.dataset.highlightId;
      const currentHighlight = highlights.find((h) => h.id === id);

      if (!currentHighlight) {
        // Remove highlight if it no longer exists
        const annotation = highlight._roughAnnotation;
        if (annotation) {
          annotation.remove();
        }
        const parent = highlight.parentNode;
        while (highlight.firstChild) {
          parent.insertBefore(highlight.firstChild, highlight);
        }
        parent.removeChild(highlight);
      } else if (
        highlight.dataset.color !== currentHighlight.color ||
        highlight.dataset.annotationType !== currentHighlight.annotationType
      ) {
        // Update if color or style changed
        const annotation = highlight._roughAnnotation;
        if (annotation) {
          annotation.remove();
        }

        const colorMap = {
          yellow: "#ffd54f",
          green: "#81c784",
          blue: "#64b5f6",
          pink: "#f06292",
          purple: "#ba68c8",
        };

        const newAnnotation = annotate(highlight, {
          type: currentHighlight.annotationType || "highlight",
          color: colorMap[currentHighlight.color || "yellow"],
          iterations: 1,
          multiline: true,
          padding: currentHighlight.annotationType === "box" ? 5 : 2,
          animationDuration: 200,
          strokeWidth: 2,
        });

        highlight.dataset.color = currentHighlight.color;
        highlight.dataset.annotationType = currentHighlight.annotationType;
        highlight._roughAnnotation = newAnnotation;
        newAnnotation.show();
      }
    });

    // Sort highlights by start position (descending) to avoid position shifts
    const sortedHighlights = [...highlights].sort(
      (a, b) => b.range.start - a.range.start,
    );

    // Process each highlight that doesn't already exist
    sortedHighlights.forEach((highlight) => {
      // Skip if highlight already exists
      if (existingIds.has(highlight.id)) return;

      try {
        const range = document.createRange();
        const startNode = findNodeAtPosition(
          contentRef.current,
          highlight.range.start,
        );
        const endNode = findNodeAtPosition(
          contentRef.current,
          highlight.range.end,
        );

        if (!startNode || !endNode) {
          console.error("Could not find start or end node for highlight");
          return;
        }

        range.setStart(startNode.node, startNode.offset);
        range.setEnd(endNode.node, endNode.offset);

        // Create highlight span
        const highlightSpan = document.createElement("span");
        highlightSpan.dataset.highlightId = highlight.id;
        highlightSpan.dataset.color = highlight.color || "yellow";
        highlightSpan.dataset.annotationType =
          highlight.annotationType || "highlight";

        try {
          // Try to surround contents if possible
          range.surroundContents(highlightSpan);
        } catch (e) {
          // If surroundContents fails, manually wrap the content
          const contents = range.extractContents();
          highlightSpan.appendChild(contents);
          range.insertNode(highlightSpan);
        }

        // Create rough notation
        const colorMap = {
          yellow: "#ffd54f",
          green: "#81c784",
          blue: "#64b5f6",
          pink: "#f06292",
          purple: "#ba68c8",
        };

        const annotation = annotate(highlightSpan, {
          type: highlight.annotationType || "highlight",
          color: colorMap[highlight.color || "yellow"],
          iterations: 1,
          multiline: true,
          padding: highlight.annotationType === "box" ? 5 : 2,
          animationDuration: 200,
          strokeWidth: 2,
        });

        // Store annotation reference for cleanup
        highlightSpan._roughAnnotation = annotation;

        // Show the annotation immediately
        requestAnimationFrame(() => {
          annotation.show();
        });
      } catch (error) {}
    });
  }, [highlights]);

  // Helper function to find text node and offset at a given position
  const findNodeAtPosition = (root, targetPosition) => {
    let currentPosition = 0;
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      null,
      false,
    );

    let node;
    while ((node = walker.nextNode())) {
      const nodeLength = node.textContent.length;
      if (
        currentPosition <= targetPosition &&
        targetPosition <= currentPosition + nodeLength
      ) {
        return {
          node: node,
          offset: targetPosition - currentPosition,
        };
      }
      currentPosition += nodeLength;
    }
    return null;
  };

  const handleHighlightClick = useCallback(
    (event) => {
      const highlightSpan = event.target.closest("[data-highlight-id]");
      if (!highlightSpan) return;

      const highlightId = highlightSpan.dataset.highlightId;
      const highlight = highlights.find((h) => h.id === highlightId);
      if (!highlight) return;

      const rect = highlightSpan.getBoundingClientRect();
      setSelectedHighlight(highlightId);
      setPopupPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
    },
    [highlights],
  );

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    content.addEventListener("click", handleHighlightClick);
    return () => content.removeEventListener("click", handleHighlightClick);
  }, [handleHighlightClick]);

  useEffect(() => {
    renderHighlights();
  }, [renderHighlights, highlights]);

  const handleMetadataChange = debounce((field, value) => {
    const handlers = {
      title: setTitle,
      public: setIsPublic,
      tags: setTags,
      status: setStatus,
    };
    handlers[field]?.(value);
  }, 300);

  const handleAddNote = useCallback(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    const highlightId = text
      ? addHighlight(text, {
          start: selection.getRangeAt(0).startOffset,
          end: selection.getRangeAt(0).endOffset,
        })
      : null;

    addNote(text ? `Note for: "${text}"` : "New note", highlightId);
  }, [addHighlight, addNote]);

  const handleRemoveHighlight = useCallback(
    async (highlightId) => {
      await removeHighlight(highlightId);
      setSelectedHighlight(null);

      // Remove the highlight span from the DOM
      const highlightSpan = document.querySelector(
        `[data-highlight-id="${highlightId}"]`,
      );
      if (highlightSpan) {
        const parent = highlightSpan.parentNode;
        while (highlightSpan.firstChild) {
          parent.insertBefore(highlightSpan.firstChild, highlightSpan);
        }
        parent.removeChild(highlightSpan);
      }
    },
    [removeHighlight],
  );

  const renderContent = () => {
    return DOMPurify.sanitize(article.markdown || "No content available.");
  };

  return (
    <motion.div
      className="content-section relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Header title={title} editing={editing} setTitle={setTitle} />
      <ArticleContent
        content={renderContent()}
        contentRef={contentRef}
        onHighlightsRendered={() => {
          renderHighlights();
        }}
      />

      <AnimatePresence>
        {selectedHighlight && (
          <HighlightPopup
            position={popupPosition}
            highlightId={selectedHighlight}
            highlightText={
              highlights.find((h) => h.id === selectedHighlight)?.text
            }
            onRemove={() => handleRemoveHighlight(selectedHighlight)}
            onClose={() => setSelectedHighlight(null)}
          />
        )}
      </AnimatePresence>

      <HighlightManager
        activeHighlightColor={activeHighlightColor}
        setActiveHighlightColor={setActiveHighlightColor}
        isHighlighting={isHighlighting}
        setIsHighlighting={setIsHighlighting}
        onAddNote={handleAddNote}
        onLookupWord={onLookupWord}
      />

      <MarginNotes
        notes={marginNotes}
        onEditNote={editNote}
        onDeleteNote={deleteNote}
      />
    </motion.div>
  );
}

export default ContentSection;
