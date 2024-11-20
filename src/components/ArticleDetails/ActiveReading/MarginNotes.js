import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaEdit, 
  FaTrash, 
  FaTimes, 
  FaImage, 
  FaLink, 
  FaTags,
  FaFilter,
  FaChevronDown,
  FaExternalLinkAlt,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';

const NOTE_CATEGORIES = {
  GENERAL: { label: 'General', color: 'gray' },
  QUESTION: { label: 'Question', color: 'yellow' },
  INSIGHT: { label: 'Insight', color: 'green' },
  IMPORTANT: { label: 'Important', color: 'red' },
  REFERENCE: { label: 'Reference', color: 'blue' },
  TODO: { label: 'To-Do', color: 'purple' }
};

const MarginNotes = ({ notes, onAddNote, onEditNote, onDeleteNote }) => {
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editCategory, setEditCategory] = useState('GENERAL');
  const [selectedImage, setSelectedImage] = useState(null);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleEditStart = (note) => {
    setEditingNoteId(note.id);
    setEditText(note.text);
    setEditCategory(note.category || 'GENERAL');
  };

  const handleEditSave = (noteId) => {
    const noteData = {
      text: editText,
      category: editCategory,
      ...(selectedImage && { image: selectedImage }),
      ...(linkUrl && linkText && { 
        links: [{ url: linkUrl, text: linkText }] 
      })
    };
    onEditNote(noteId, noteData);
    resetEditState();
  };

  const resetEditState = () => {
    setEditingNoteId(null);
    setEditText('');
    setEditCategory('GENERAL');
    setSelectedImage(null);
    setShowLinkInput(false);
    setLinkUrl('');
    setLinkText('');
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredNotes = notes.filter(note => 
    activeFilter === 'ALL' || note.category === activeFilter
  );

  const noteCounts = Object.entries(NOTE_CATEGORIES).reduce((acc, [key, _]) => {
    acc[key] = notes.filter(note => note.category === key).length;
    return acc;
  }, {});

  const totalNotes = notes.length;

  return (
    <div className="fixed left-0 top-32 flex items-start">
      <motion.div
        initial={{ width: 384 }}
        animate={{ width: isCollapsed ? 48 : 384 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="h-[calc(100vh-10rem)] bg-white/80 backdrop-blur-sm rounded-r-lg shadow-lg relative flex"
      >
        {/* Collapsed View */}
        <AnimatePresence>
          {isCollapsed && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-12 h-full py-4 flex flex-col items-center gap-3 border-r"
            >
              {Object.entries(NOTE_CATEGORIES).map(([key, { label, color }]) => (
                <div 
                  key={key}
                  className="relative group"
                  title={`${label} (${noteCounts[key]})`}
                >
                  <div className={`w-6 h-6 rounded-full bg-${color}-100 border-2 border-${color}-400 flex items-center justify-center text-xs font-medium text-${color}-700`}>
                    {noteCounts[key]}
                  </div>
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {label}
                  </div>
                </div>
              ))}
              <div className="mt-auto relative group" title={`Total Notes: ${totalNotes}`}>
                <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-gray-400 flex items-center justify-center text-xs font-medium text-gray-700">
                  {totalNotes}
                </div>
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Total Notes
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded View */}
        <motion.div 
          className={`${isCollapsed ? 'w-0 opacity-0 invisible' : 'w-full opacity-100 visible'} overflow-hidden transition-all duration-300`}
        >
          <div className="sticky top-0 z-10 bg-white p-2 shadow-md rounded-tr-lg mb-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-700">Margin Notes</h3>
              <div className="relative">
                <button
                  onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Filter Notes"
                >
                  <FaFilter className={activeFilter !== 'ALL' ? 'text-blue-500' : 'text-gray-500'} />
                </button>
                {showCategoryFilter && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20"
                  >
                    <button
                      onClick={() => {
                        setActiveFilter('ALL');
                        setShowCategoryFilter(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                        activeFilter === 'ALL' ? 'text-blue-500' : ''
                      }`}
                    >
                      All Notes
                    </button>
                    {Object.entries(NOTE_CATEGORIES).map(([key, { label, color }]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setActiveFilter(key);
                          setShowCategoryFilter(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                          activeFilter === key ? 'text-blue-500' : ''
                        }`}
                      >
                        <span className={`inline-block w-3 h-3 rounded-full bg-${color}-400 mr-2`} />
                        {label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          <div className="px-4 overflow-y-auto max-h-[calc(100vh-12rem)]">
            <AnimatePresence>
              {filteredNotes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                  className={`mb-4 p-4 bg-white rounded-lg shadow-lg border-l-4 border-${
                    NOTE_CATEGORIES[note.category || 'GENERAL'].color
                  }-400`}
                >
                  {editingNoteId === note.id ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="px-2 py-1 border rounded-md text-sm"
                        >
                          {Object.entries(NOTE_CATEGORIES).map(([key, { label }]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                        <div className="flex-1" />
                        <button
                          onClick={() => document.getElementById('image-upload').click()}
                          className="p-1.5 text-gray-600 hover:text-blue-600 transition-colors"
                          title="Add Image"
                        >
                          <FaImage />
                        </button>
                        <button
                          onClick={() => setShowLinkInput(!showLinkInput)}
                          className="p-1.5 text-gray-600 hover:text-blue-600 transition-colors"
                          title="Add Link"
                        >
                          <FaLink />
                        </button>
                      </div>

                      <input
                        type="file"
                        id="image-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />

                      {showLinkInput && (
                        <div className="space-y-2">
                          <input
                            type="url"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="Enter URL"
                            className="w-full p-2 border rounded-md text-sm"
                          />
                          <input
                            type="text"
                            value={linkText}
                            onChange={(e) => setLinkText(e.target.value)}
                            placeholder="Link Text"
                            className="w-full p-2 border rounded-md text-sm"
                          />
                        </div>
                      )}

                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />

                      {selectedImage && (
                        <div className="relative">
                          <img
                            src={selectedImage}
                            alt="Note attachment"
                            className="max-w-full h-auto rounded-md"
                          />
                          <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                          >
                            <FaTimes className="text-gray-600" />
                          </button>
                        </div>
                      )}

                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditSave(note.id)}
                          className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={resetEditState}
                          className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <span>{note.timestamp.toLocaleString()}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs bg-${
                          NOTE_CATEGORIES[note.category || 'GENERAL'].color
                        }-100 text-${
                          NOTE_CATEGORIES[note.category || 'GENERAL'].color
                        }-700`}>
                          {NOTE_CATEGORIES[note.category || 'GENERAL'].label}
                        </span>
                      </div>

                      <p className="text-gray-800 mb-2 whitespace-pre-wrap">{note.text}</p>

                      {note.image && (
                        <img
                          src={note.image}
                          alt="Note attachment"
                          className="max-w-full h-auto rounded-md mb-2"
                        />
                      )}

                      {note.links?.map((link, index) => (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-500 hover:text-blue-600 mb-2"
                        >
                          {link.text}
                          <FaExternalLinkAlt className="text-xs" />
                        </a>
                      ))}

                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditStart(note)}
                          className="p-1.5 text-gray-600 hover:text-blue-600 transition-colors"
                          title="Edit Note"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => onDeleteNote(note.id)}
                          className="p-1.5 text-gray-600 hover:text-red-600 transition-colors"
                          title="Delete Note"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-10 top-2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors"
          title={isCollapsed ? "Show Notes" : "Hide Notes"}
        >
          {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </motion.div>
    </div>
  );
};

export default MarginNotes;
