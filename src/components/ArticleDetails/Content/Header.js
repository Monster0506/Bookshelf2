// Header.js
import React from "react";
import { motion } from "framer-motion";

function Header({ title, editing, setTitle }) {
  return (
    <motion.div
      className="text-center mb-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {editing ? (
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 text-2xl font-bold border border-gray-300 rounded-lg focus:outline-none"
          placeholder="Enter title here..."
        />
      ) : (
        <h1 className="text-3xl font-bold">{title}</h1>
      )}
    </motion.div>
  );
}

export default Header;
