import React, { useState, useCallback, useEffect, useRef } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import DOMPurify from "dompurify";
import debounce from "lodash.debounce";
import { FaArrowLeft, FaArrowRight, FaFileAlt, FaLink, FaStickyNote, FaChartLine } from "react-icons/fa";
import "react-markdown-editor-lite/lib/index.css";
import RelatedArticles from "./Content/RelatedArticles";
import NotesEditor from "./Content/NotesEditor";
import Pagination from "./Content/Pagination";
import SummarySection from "./Content/SummarySection";
import Header from "./Content/Header";
import HighlightManager from "./ActiveReading/HighlightManager";
import MarginNotes from "./ActiveReading/MarginNotes";
import HighlightPopup from "./ActiveReading/HighlightPopup";
import { useActiveReading } from "./ActiveReading/ActiveReadingProvider";
import Statistics from "./Content/Statistics";
import SourceAttribution from "./Content/SourceAttribution";

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
  } = useActiveReading();

  const [selectedHighlight, setSelectedHighlight] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState('content');

  const tabs = [
    { id: 'content', label: 'Content', icon: FaFileAlt },
    { id: 'links', label: 'Links', icon: FaLink },
    { id: 'notes', label: 'Notes', icon: FaStickyNote },
    { id: 'stats', label: 'Statistics', icon: FaChartLine },
  ];

  const handleTextSelection = useCallback(async () => {
    if (!isHighlighting) return;

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();

    if (!text || !contentRef.current?.contains(range.commonAncestorContainer)) return;

    try {
      // Calculate the absolute position within the content
      let currentPos = 0;
      const walker = document.createTreeWalker(
        contentRef.current,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let startNode = null;
      let startOffset = 0;
      let endOffset = 0;

      // Find the start and end positions
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const nodeLength = node.textContent.length;

        if (node === range.startContainer) {
          startNode = node;
          startOffset = currentPos + range.startOffset;
        }
        if (node === range.endContainer) {
          endOffset = currentPos + range.endOffset;
          break;
        }
        currentPos += nodeLength;
      }

      if (startNode && startOffset < endOffset) {
        // Store the range values before clearing the selection
        const highlightRange = { start: startOffset, end: endOffset };
        
        // Clear the selection before creating the highlight
        selection.removeAllRanges();

        const highlightId = await addHighlight(text, highlightRange);
        if (highlightId) {
          // Re-render highlights instead of direct DOM manipulation
          renderHighlights();
        }
      }
    } catch (error) {
      selection.removeAllRanges();
    }
  }, [isHighlighting, addHighlight]);

  const renderHighlights = useCallback(() => {
    if (!contentRef.current || !highlights.length) return;

    // First, remove all existing highlights
    const existingHighlights = contentRef.current.querySelectorAll('[data-highlight-id]');
    existingHighlights.forEach(highlight => {
      const parent = highlight.parentNode;
      while (highlight.firstChild) {
        parent.insertBefore(highlight.firstChild, highlight);
      }
      parent.removeChild(highlight);
    });

    // Get the text content
    const content = contentRef.current;

    // Sort highlights by start position (descending) to avoid position shifts
    const sortedHighlights = [...highlights].sort((a, b) => b.range.start - a.range.start);

    // Keep track of current text position
    let currentPos = 0;
    const walker = document.createTreeWalker(
      content,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    // Build a map of text positions to nodes
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      const length = node.textContent.length;
      textNodes.push({
        node,
        start: currentPos,
        end: currentPos + length
      });
      currentPos += length;
    }

    // Process each highlight
    sortedHighlights.forEach(highlight => {
      try {
        // Find the text node(s) containing this highlight
        const relevantNodes = textNodes.filter(({ start, end }) => 
          (start <= highlight.range.start && highlight.range.start < end) ||
          (start < highlight.range.end && highlight.range.end <= end)
        );

        if (relevantNodes.length > 0) {
          const firstNode = relevantNodes[0];
          const lastNode = relevantNodes[relevantNodes.length - 1];

          // Create highlight span
          const span = document.createElement('span');
          span.className = `highlight-${highlight.color}`;
          span.dataset.highlightId = highlight.id;

          // Create a range for the highlight
          const range = document.createRange();
          const startOffset = Math.max(0, highlight.range.start - firstNode.start);
          const endOffset = Math.min(lastNode.node.length, highlight.range.end - lastNode.start);
          
          range.setStart(firstNode.node, startOffset);
          range.setEnd(lastNode.node, endOffset);

          // Wrap the text in highlight span
          range.surroundContents(span);
        }
      } catch (error) {
      }
    });
  }, [highlights, currentPage]);

  const handleHighlightClick = useCallback((event) => {
    const highlightSpan = event.target.closest('[data-highlight-id]');
    if (!highlightSpan) return;

    const highlightId = highlightSpan.dataset.highlightId;
    const rect = highlightSpan.getBoundingClientRect();
    
    setSelectedHighlight(highlightId);
    setPopupPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  }, []);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    content.addEventListener('click', handleHighlightClick);
    return () => content.removeEventListener('click', handleHighlightClick);
  }, [handleHighlightClick]);

  useEffect(() => {
    renderHighlights();
  }, [renderHighlights]);

  const calculatePagination = (size) => {
    const L = 11000,
      M = 8000;
    return size <= L
      ? 1
      : Math.ceil((size - L) / (M + Math.log(size / L) * 1000)) + 1;
  };

  const size = (article.markdown || "").length;
  const ITEMS_PER_PAGE = Math.ceil(size / calculatePagination(size));
  const totalPages = Math.ceil(size / ITEMS_PER_PAGE);

  const handleMetadataChange = debounce((field, value) => {
    const handlers = {
      title: setTitle,
      public: setIsPublic,
      tags: setTags,
      status: setStatus,
    };
    handlers[field]?.(value);
  }, 300);

  const handlePageChange = (direction) =>
    setCurrentPage((page) => page + direction);

  const handleAddNote = useCallback(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    const highlightId = text ? addHighlight(text, {
      start: selection.getRangeAt(0).startOffset,
      end: selection.getRangeAt(0).endOffset,
    }) : null;

    addNote(
      text ? `Note for: "${text}"` : "New note",
      highlightId
    );
  }, [addHighlight, addNote]);

  const handleRemoveHighlight = useCallback(async (highlightId) => {
    await removeHighlight(highlightId);
    setSelectedHighlight(null);
    
    // Remove the highlight span from the DOM
    const highlightSpan = document.querySelector(`[data-highlight-id="${highlightId}"]`);
    if (highlightSpan) {
      const parent = highlightSpan.parentNode;
      while (highlightSpan.firstChild) {
        parent.insertBefore(highlightSpan.firstChild, highlightSpan);
      }
      parent.removeChild(highlightSpan);
    }
  }, [removeHighlight]);

  useEffect(() => {
    const content = contentRef.current;
    if (content) {
      content.addEventListener('mouseup', handleTextSelection);
      return () => content.removeEventListener('mouseup', handleTextSelection);
    }
  }, [handleTextSelection]);

  const renderPageContent = () => {
    const content = (article.markdown || "").slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE,
    );
    return DOMPurify.sanitize(content || "No content available.");
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={contentRef}
        className="prose max-w-none"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(renderPageContent()),
        }}
      />
      <SourceAttribution article={article} />
    </div>
  );
}

export default ContentSection;
