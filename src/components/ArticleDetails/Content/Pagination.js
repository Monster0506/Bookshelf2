import React, { useState } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import "react-markdown-editor-lite/lib/index.css";
const Pagination = ({ currentPage, totalPages, handlePageChange }) => (
  <div className="flex justify-between items-center mt-4">
    <button
      onClick={() => handlePageChange(-1)}
      disabled={currentPage === 1}
      className={`flex items-center px-4 py-2 rounded ${
        currentPage === 1
          ? "bg-gray-300 cursor-not-allowed"
          : "bg-blue-500 text-white hover:bg-blue-600"
      } transition duration-300`}
    >
      <FaArrowLeft className="mr-2" /> Previous
    </button>
    <span className="text-sm text-gray-700">
      Page {currentPage} of {totalPages}
    </span>
    <button
      onClick={() => handlePageChange(1)}
      type="button"
      disabled={currentPage === totalPages}
      className={`flex items-center px-4 py-2 rounded ${
        currentPage === totalPages
          ? "bg-gray-300 cursor-not-allowed"
          : "bg-blue-500 text-white hover:bg-blue-600"
      } transition duration-300`}
    >
      Next <FaArrowRight className="ml-2" />
    </button>
  </div>
);

export default Pagination;
