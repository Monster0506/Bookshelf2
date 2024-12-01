import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  FaFolder,
  FaFolderOpen,
  FaChevronDown,
  FaChevronUp,
  FaBook,
  FaPlus,
  FaPalette,
  FaRegClone,
  FaTrash,
} from "react-icons/fa";
import {
  fetchUserFolders,
  addFolder,
  updateFolder,
  deleteFolder,
  createFolderFromTemplate,
  fetchArticlesInFolder,
  updateArticleFolder,
} from "../utils/firestoreUtils";

const FOLDER_TEMPLATES = [
  { id: "research", name: "Research", icon: "📚" },
  { id: "reading", name: "Reading List", icon: "📖" },
  { id: "work", name: "Work", icon: "💼" },
];

const FOLDER_COLORS = [
  { id: "blue", value: "#3B82F6", name: "Blue" },
  { id: "red", value: "#EF4444", name: "Red" },
  { id: "green", value: "#10B981", name: "Green" },
  { id: "purple", value: "#8B5CF6", name: "Purple" },
  { id: "yellow", value: "#F59E0B", name: "Yellow" },
  { id: "indigo", value: "#6366F1", name: "Indigo" },
];

function FolderList() {
  const { currentUser } = useAuth();
  const [folders, setFolders] = useState([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0].value);
  const [loading, setLoading] = useState(false);
  const [folderArticles, setFolderArticles] = useState({});

  useEffect(() => {
    if (currentUser) {
      loadFolders();
    }
  }, [currentUser]);

  const loadFolders = async () => {
    if (!currentUser) return;
    try {
      const fetchedFolders = await fetchUserFolders(currentUser.uid);
      setFolders(fetchedFolders);
    } catch (error) {
      console.error("Error loading folders:", error);
    }
  };

  const loadFolderArticles = async (folderId) => {
    try {
      const articles = await fetchArticlesInFolder(folderId);
      setFolderArticles(prev => ({
        ...prev,
        [folderId]: articles || [] // Ensure we always have an array
      }));
    } catch (error) {
      console.error("Error loading folder articles:", error);
      setFolderArticles(prev => ({
        ...prev,
        [folderId]: [] // Set empty array on error
      }));
    }
  };

  const toggleArticles = async (folderId) => {
    try {
      if (expandedFolders.has(folderId)) {
        setExpandedFolders(prev => {
          const newSet = new Set(prev);
          newSet.delete(folderId);
          return newSet;
        });
      } else {
        setExpandedFolders(prev => {
          const newSet = new Set(prev);
          newSet.add(folderId);
          return newSet;
        });
        if (!folderArticles[folderId]) {
          await loadFolderArticles(folderId);
        }
      }
    } catch (error) {
      console.error("Error toggling folder:", error);
      // Keep the folder closed on error
      setExpandedFolders(prev => {
        const newSet = new Set(prev);
        newSet.delete(folderId);
        return newSet;
      });
    }
  };

  const handleAddFolder = async () => {
    if (!newFolderName.trim() || !currentUser) return;
    try {
      setLoading(true);
      await addFolder(newFolderName.trim(), currentUser.uid, false, null, {
        color: selectedColor,
      });
      setNewFolderName("");
      loadFolders();
    } catch (error) {
      console.error("Error adding folder:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromTemplate = async (templateId) => {
    if (!currentUser) return;
    try {
      setLoading(true);
      await createFolderFromTemplate(templateId, currentUser.uid);
      loadFolders();
      setShowTemplateModal(false);
    } catch (error) {
      console.error("Error creating folder from template:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFolder = async (folderId, isPublic) => {
    try {
      await updateFolder(folderId, { public: isPublic });
      loadFolders();
    } catch (error) {
      console.error("Error updating folder:", error);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (window.confirm("Are you sure you want to delete this folder and all its contents?")) {
      try {
        setLoading(true);
        await deleteFolder(folderId);
        loadFolders();
      } catch (error) {
        console.error("Error deleting folder:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    try {
      setLoading(true);
      
      // Update the article's folder in Firestore
      await updateArticleFolder(draggableId, destination.droppableId);

      // Update the local state
      setFolderArticles(prev => {
        const sourceArticles = [...(prev[source.droppableId] || [])];
        const destArticles = [...(prev[destination.droppableId] || [])];
        const [movedArticle] = sourceArticles.splice(source.index, 1);
        destArticles.splice(destination.index, 0, movedArticle);

        return {
          ...prev,
          [source.droppableId]: sourceArticles,
          [destination.droppableId]: destArticles
        };
      });

      // Expand the destination folder if it's not already expanded
      setExpandedFolders(prev => {
        const newSet = new Set(prev);
        newSet.add(destination.droppableId);
        return newSet;
      });
    } catch (error) {
      console.error("Error moving article:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderArticles = (folderId) => {
    const articles = folderArticles[folderId] || [];
    return (
      <Droppable droppableId={folderId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`pl-8 space-y-2 ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
          >
            {articles.map((article, index) => (
              <Draggable key={article.id} draggableId={article.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`p-2 rounded-lg ${
                      snapshot.isDragging
                        ? 'bg-blue-100 shadow-lg'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <Link
                      to={`/articles/${article.id}`}
                      className="flex items-center space-x-2 text-gray-700 hover:text-blue-600"
                    >
                      <FaBook className="flex-shrink-0" />
                      <span className="truncate">{article.title || 'Untitled Article'}</span>
                    </Link>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    );
  };

  const renderFolder = (folder, level = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    
    return (
      <div key={folder.id} className="w-full">
        <Droppable droppableId={folder.id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`w-full ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
            >
              <div
                className={`flex items-center p-3 hover:bg-gray-50 rounded-lg`}
                style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
              >
                <div className="flex items-center flex-grow">
                  <button
                    onClick={() => toggleArticles(folder.id)}
                    className="mr-2 text-gray-500 hover:text-gray-700"
                  >
                    {isExpanded ? <FaChevronDown /> : <FaChevronUp />}
                  </button>
                  <Link
                    to={`/folders/${folder.id}`}
                    className="flex items-center flex-grow group"
                  >
                    <span className="mr-2 text-gray-500 group-hover:text-gray-700">
                      {isExpanded ? <FaFolderOpen style={{ color: folder.color }} /> : <FaFolder style={{ color: folder.color }} />}
                    </span>
                    <span className="text-gray-700 group-hover:text-gray-900">{folder.name}</span>
                  </Link>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteFolder(folder.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>
              </div>
              {isExpanded && (
                <div className="space-y-1">
                  {renderArticles(folder.id)}
                  {folder.children?.map(childFolder => renderFolder(childFolder, level + 1))}
                </div>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    );
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="p-4 max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">My Folders</h2>
          <div className="flex items-center space-x-4 mb-4">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="New folder name"
              className="flex-grow p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-500"
            />
            <div className="relative">
              <button
                onClick={() => document.getElementById("colorPicker").click()}
                className="p-2 rounded bg-white border shadow-sm hover:bg-gray-50"
                style={{ color: selectedColor }}
              >
                <FaPalette />
              </button>
              <input
                type="color"
                id="colorPicker"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="absolute opacity-0 w-0 h-0"
              />
            </div>
            <button
              onClick={handleAddFolder}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600 transition-colors flex items-center"
            >
              <FaPlus className="mr-2" /> Add Folder
            </button>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="px-4 py-2 bg-purple-500 text-white rounded shadow hover:bg-purple-600 transition-colors flex items-center"
            >
              <FaRegClone className="mr-2" /> Use Template
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {folders.map(folder => renderFolder(folder))}
        </div>

        {/* Template Modal */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Choose a Template</h3>
              <div className="space-y-4">
                {FOLDER_TEMPLATES.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleCreateFromTemplate(template.id)}
                    className="w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center"
                  >
                    <span className="text-2xl mr-4">{template.icon}</span>
                    <span className="font-medium">{template.name}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors w-full"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </DragDropContext>
  );
}

export default FolderList;
