import React, { useState } from "react";
import { motion } from "framer-motion";
import "react-markdown-editor-lite/lib/index.css";
const SummarySection = ({ showSummary, setShowSummary, summary }) => (
  <motion.div className="mb-6">
    <h2 className="text-2xl font-semibold mb-2">Summary</h2>
    {!showSummary ? (
      <motion.button
        onClick={() => setShowSummary(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition duration-300"
      >
        Show Summary
      </motion.button>
    ) : (
      <motion.p className="text-gray-700">
        {summary || "No summary available."}
      </motion.p>
    )}
  </motion.div>
);

export default SummarySection;
