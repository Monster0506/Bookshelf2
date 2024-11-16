import { db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  getDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

export async function addArticle(articleData) {
  try {
    const articlesCollectionRef = collection(db, "articles");
    const newArticle = {
      ...articleData,
      date: serverTimestamp(), // Set timestamp to the current time
    };
    await addDoc(articlesCollectionRef, newArticle);
  } catch (error) {
    console.error("Error adding article:", error);
    throw new Error("Failed to add article" + error);
  }
}

// Add a new folder
export const addFolder = async (folderName, userId, isPublic, parentId = null, customization = {}) => {
  try {
    const docRef = await addDoc(collection(db, "folders"), {
      name: folderName,
      userid: userId,
      public: isPublic,
      articles: [],
      parentId: parentId,
      subfolders: [],
      color: customization.color || "#3B82F6",
      icon: customization.icon || "folder",
      template: customization.template || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id };
  } catch (error) {
    console.error("Error adding folder: ", error);
    throw error;
  }
};

// Create folder from template
export const createFolderFromTemplate = async (templateName, userId) => {
  const templates = {
    research: {
      name: "Research",
      color: "#EF4444", // Red
      icon: "research",
      subfolders: ["Literature", "Notes", "Data", "Drafts"]
    },
    reading: {
      name: "Reading List",
      color: "#10B981", // Green
      icon: "book",
      subfolders: ["To Read", "In Progress", "Completed", "Favorites"]
    },
    work: {
      name: "Work",
      color: "#6366F1", // Indigo
      icon: "briefcase",
      subfolders: ["Projects", "References", "Archive"]
    }
  };

  const template = templates[templateName];
  if (!template) throw new Error("Template not found");

  try {
    // Create main folder
    const mainFolderRef = await addDoc(collection(db, "folders"), {
      name: template.name,
      userid: userId,
      public: false,
      articles: [],
      parentId: null,
      subfolders: [],
      color: template.color,
      icon: template.icon,
      template: templateName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Create subfolders
    const subfolderPromises = template.subfolders.map(subfolderName =>
      addDoc(collection(db, "folders"), {
        name: subfolderName,
        userid: userId,
        public: false,
        articles: [],
        parentId: mainFolderRef.id,
        subfolders: [],
        color: template.color,
        icon: template.icon,
        template: templateName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );

    const subfolders = await Promise.all(subfolderPromises);
    
    // Update main folder with subfolder references
    await updateDoc(mainFolderRef, {
      subfolders: subfolders.map(subfolder => subfolder.id)
    });

    return mainFolderRef.id;
  } catch (error) {
    console.error("Error creating folder from template: ", error);
    throw error;
  }
};

// Update folder metadata
export const updateFolder = async (folderId, updateData) => {
  try {
    const folderRef = doc(db, "folders", folderId);
    await updateDoc(folderRef, updateData);
  } catch (error) {
    console.error("Error updating folder: ", error);
  }
};

// Delete a folder and all its subfolders
export const deleteFolder = async (folderId) => {
  try {
    const folderRef = doc(db, "folders", folderId);
    const folderDoc = await getDoc(folderRef);
    
    if (!folderDoc.exists()) {
      throw new Error("Folder not found");
    }

    const folderData = folderDoc.data();
    const articles = folderData.articles || [];
    const subfolders = folderData.subfolders || [];

    // Recursively delete subfolders
    const subfolderPromises = subfolders.map(subfolderId => deleteFolder(subfolderId));
    await Promise.all(subfolderPromises);

    // Update article references
    const articleUpdates = articles.map(articleId => {
      const articleRef = doc(db, "articles", articleId);
      return updateDoc(articleRef, {
        folderId: "",
        folderName: ""
      });
    });

    // Delete the folder itself
    await Promise.all([
      ...articleUpdates,
      deleteDoc(folderRef)
    ]);

    // If this folder has a parent, update the parent's subfolders array
    if (folderData.parentId) {
      const parentRef = doc(db, "folders", folderData.parentId);
      await updateDoc(parentRef, {
        subfolders: arrayRemove(folderId),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error("Error deleting folder: ", error);
    throw new Error("Failed to delete folder: " + error.message);
  }
};

// Get folders for a specific user with nested structure
export const fetchUserFolders = async (userId) => {
  try {
    const folderQuery = query(
      collection(db, "folders"),
      where("userid", "==", userId)
    );
    const folderSnapshot = await getDocs(folderQuery);
    
    // Create a map of all folders
    const folderMap = new Map();
    folderSnapshot.docs.forEach(doc => {
      folderMap.set(doc.id, { id: doc.id, ...doc.data(), children: [] });
    });

    // Organize into tree structure
    const rootFolders = [];
    folderMap.forEach(folder => {
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          parent.children.push(folder);
        }
      } else {
        rootFolders.push(folder);
      }
    });

    return rootFolders;
  } catch (error) {
    console.error("Error fetching folders: ", error);
    return [];
  }
};

export const updateFolderWithArticle = async (folderId, articleId, remove = false) => {
  try {
    const folderRef = doc(db, "folders", folderId);
    const articleRef = doc(db, "articles", articleId);

    // Get the current folder data
    const folderDoc = await getDoc(folderRef);
    if (!folderDoc.exists()) {
      throw new Error("Folder not found");
    }

    // Update the folder's articles array
    const currentArticles = folderDoc.data().articles || [];
    let updatedArticles;

    if (remove) {
      updatedArticles = currentArticles.filter(id => id !== articleId);
    } else {
      if (!currentArticles.includes(articleId)) {
        updatedArticles = [...currentArticles, articleId];
      } else {
        updatedArticles = currentArticles;
      }
    }

    // Update both the folder and article documents
    await Promise.all([
      updateDoc(folderRef, {
        articles: updatedArticles
      }),
      updateDoc(articleRef, {
        folderId: remove ? null : folderId,
        folderName: remove ? null : folderDoc.data().name
      })
    ]);
  } catch (error) {
    console.error("Error updating folder with article: ", error);
    throw new Error("Failed to update folder with article.");
  }
};

export const fetchArticlesInFolder = async (folderId) => {
  try {
    const articlesRef = collection(db, "articles");
    const q = query(articlesRef, where("folderId", "==", folderId));
    const querySnapshot = await getDocs(q);
    const articles = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return articles;
  } catch (error) {
    console.error("Error fetching articles in folder: ", error);
    throw new Error("Failed to fetch articles in folder.");
  }
};

export const fetchFolder = async (folderId) => {
  try {
    const folderRef = doc(db, "folders", folderId);
    const folderSnapshot = await getDoc(folderRef);
    if (!folderSnapshot.exists()) {
      return null;
    }
    return {
      id: folderSnapshot.id,
      ...folderSnapshot.data()
    };
  } catch (error) {
    console.error("Error fetching folder: ", error);
    throw new Error("Failed to fetch folder.");
  }
};

// Update article's folder
export const updateArticleFolder = async (articleId, newFolderId) => {
  try {
    const articleRef = doc(db, "articles", articleId);
    const articleDoc = await getDoc(articleRef);
    
    if (!articleDoc.exists()) {
      throw new Error("Article not found");
    }

    const oldFolderId = articleDoc.data().folderId;

    // Get the new folder's name
    let newFolderName = "";
    if (newFolderId) {
      const newFolderRef = doc(db, "folders", newFolderId);
      const newFolderDoc = await getDoc(newFolderRef);
      if (newFolderDoc.exists()) {
        newFolderName = newFolderDoc.data().name;
      }
    }

    // Update the article
    await updateDoc(articleRef, {
      folderId: newFolderId || "",
      folderName: newFolderName || "",
      updatedAt: serverTimestamp()
    });

    // Remove article from old folder
    if (oldFolderId) {
      const oldFolderRef = doc(db, "folders", oldFolderId);
      await updateDoc(oldFolderRef, {
        articles: arrayRemove(articleId),
        updatedAt: serverTimestamp()
      });
    }

    // Add article to new folder
    if (newFolderId) {
      const newFolderRef = doc(db, "folders", newFolderId);
      await updateDoc(newFolderRef, {
        articles: arrayUnion(articleId),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error("Error updating article folder:", error);
    throw error;
  }
};

// Fetch all articles
export const fetchAllArticles = async () => {
  try {
    const articlesRef = collection(db, "articles");
    const querySnapshot = await getDocs(articlesRef);
    const articles = [];
    querySnapshot.forEach((doc) => {
      articles.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return articles;
  } catch (error) {
    console.error("Error fetching articles:", error);
    throw error;
  }
};

// Find articles that contain links to the specified article
export const findBacklinks = async (articleId) => {
  try {
    const articlesRef = collection(db, "articles");
    const querySnapshot = await getDocs(articlesRef);
    const backlinks = [];
    
    querySnapshot.forEach((doc) => {
      const article = doc.data();
      // Skip if it's the same article
      if (doc.id === articleId) return;
      
      // Check if note contains a link to the target article
      // We use article.note (singular) as that's how it's stored in the database
      if (article.note && article.note.includes(`@article:${articleId}`)) {
        backlinks.push({
          id: doc.id,
          title: article.title,
          ...article
        });
      }
    });
    
    return backlinks;
  } catch (error) {
    console.error("Error finding backlinks:", error);
    throw error;
  }
};
