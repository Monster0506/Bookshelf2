import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchUserFolders,
  addFolder,
  updateFolder,
  deleteFolder,
  fetchArticlesInFolder,
} from "../utils/firestoreUtils";

function FolderList() {
  const { currentUser } = useAuth();
  const [folders, setFolders] = useState([]);
  const [newFolderName, setNewFolderName] = useState("");

  useEffect(() => {
    if (currentUser) {
      fetchUserFolders(currentUser.uid).then((data) => setFolders(data));
    }
  }, [currentUser]);

  const handleAddFolder = async () => {
    if (newFolderName.trim() !== "") {
      await addFolder(newFolderName, currentUser.uid, false);
      const updatedFolders = await fetchUserFolders(currentUser.uid);
      setFolders(updatedFolders);
      setNewFolderName("");
    }
  };

  const handleUpdateFolder = async (folderId, isPublic) => {
    await updateFolder(folderId, { public: isPublic });
    const updatedFolders = await fetchUserFolders(currentUser.uid);
    setFolders(updatedFolders);
  };

  const handleDeleteFolder = async (folderId) => {
    await deleteFolder(folderId);
    const updatedFolders = await fetchUserFolders(currentUser.uid);
    setFolders(updatedFolders);
  };

  const handleViewArticles = async (folderId) => {
    const updatedFolders = await Promise.all(
      folders.map(async (folder) => {
        if (folder.id === folderId) {
          const articles = await fetchArticlesInFolder(folderId);
          return { ...folder, articles };
        }
        return folder;
      }),
    );
    setFolders(updatedFolders);
  };

  return (
    <div className="p-6 bg-white shadow rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Manage Folders</h2>
      <div className="mb-4">
        <input
          type="text"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="New Folder Name"
        />
        <button
          onClick={handleAddFolder}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Folder
        </button>
      </div>
      <ul className="list-disc list-inside">
        {folders.map((folder) => (
          <li key={folder.id} className="mb-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold">{folder.name}</span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleUpdateFolder(folder.id, !folder.public)}
                  className={`px-3 py-1 rounded ${
                    folder.public ? "bg-green-500" : "bg-gray-500"
                  } text-white`}
                >
                  {folder.public ? "Make Private" : "Make Public"}
                </button>
                <button
                  onClick={() => handleDeleteFolder(folder.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded"
                >
                  Delete
                </button>
                <button
                  onClick={() => handleViewArticles(folder.id)}
                  className="px-3 py-1 bg-blue-500 text-white rounded"
                >
                  View Articles
                </button>
              </div>
            </div>
            {folder.articles && folder.articles.length > 0 && (
              <ul className="list-disc list-inside ml-6 mt-2">
                {folder.articles.map((article) => (
                  <li key={article.id} className="mb-1">
                    <a
                      href={`/articles/${article.id}`}
                      className="text-blue-500 hover:underline"
                    >
                      {article.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FolderList;
