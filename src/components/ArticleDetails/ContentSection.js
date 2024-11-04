import React, { useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import DOMPurify from "dompurify";
import debounce from "lodash.debounce";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import "react-markdown-editor-lite/lib/index.css";
import RelatedArticles from "./Content/RelatedArticles";
import NotesEditor from "./Content/NotesEditor";
import Pagination from "./Content/Pagination";
import SummarySection from "./Content/SummarySection";
import Header from "./Content/Header";

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

  const renderPageContent = () => {
    const content = (article.markdown || "").slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE,
    );
    return DOMPurify.sanitize(content || "No content available.");
  };

  return (
    <motion.div
      className="content-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Header title={title} editing={editing} setTitle={setTitle} />
      {createdAt && (
        <p className="created-at">
          Created: {format(new Date(createdAt.seconds * 1000), "PPp")}
        </p>
      )}
      <SummarySection
        showSummary={showSummary}
        setShowSummary={setShowSummary}
        summary={article.summary}
      />
      <div
        className="markdown-content"
        dangerouslySetInnerHTML={{ __html: renderPageContent() }}
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        handlePageChange={handlePageChange}
        setCurrentPage={setCurrentPage}
      />
      <NotesEditor
        notes={notes}
        setNotes={setNotes}
        saveNotes={saveNotes}
        canEdit={canEdit}
        saving={saving}
      />
      <RelatedArticles relatedArticles={relatedArticles} />
    </motion.div>
  );
}

export default ContentSection;
