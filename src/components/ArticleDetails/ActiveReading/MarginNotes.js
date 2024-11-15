import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEdit, FaTrash, FaTimes } from 'react-icons/fa';

const MarginNotes = ({ notes, onAddNote, onEditNote, onDeleteNote }) => {
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editText, setEditText] = useState('');

  const handleEditStart = (note) => {
    setEditingNoteId(note.id);
    setEditText(note.text);
  };

  const handleEditSave = (noteId) => {
    onEditNote(noteId, editText);
    setEditingNoteId(null);
    setEditText('');
  };

  return (
    <div className="fixed right-4 top-24 w-72 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <AnimatePresence>
        {notes.map((note) => (
          <motion.div
            key={note.id}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className={`mb-4 p-4 bg-white rounded-lg shadow-lg border-l-4 ${
              note.color ? `border-${note.color}-400` : 'border-gray-400'
            }`}
          >
            {editingNoteId === note.id ? (
              <div className="space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => handleEditSave(note.id)}
                    className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingNoteId(null)}
                    className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-sm text-gray-600 mb-1">
                  {note.timestamp.toLocaleString()}
                </div>
                <p className="text-gray-800 mb-2">{note.text}</p>
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
  );
};

export default MarginNotes;
