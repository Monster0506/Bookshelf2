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
  orderBy
} from "firebase/firestore";

// Add caching mechanism
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

export async function addArticle(articleData) {
  try {
    const articlesCollectionRef = collection(db, "articles");
    const newArticle = {
      ...articleData,
      date: serverTimestamp(), // Set timestamp to the current time
    };
    const docRef = await addDoc(articlesCollectionRef, newArticle);
    
    // Invalidate relevant caches
    invalidateCache('user-articles');
    if (articleData.folderId) {
      invalidateCache(`folder-articles-${articleData.folderId}`);
    }
    
    console.log("Article added successfully with ID:", docRef.id);
    return { id: docRef.id };
  } catch (error) {
    console.error("Error adding article:", error);
    throw new Error("Failed to add article: " + error);
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
      color: "#EF4444", 
      icon: "research",
      subfolders: ["Literature", "Notes", "Data", "Drafts"]
    },
    reading: {
      name: "Reading List",
      color: "#10B981", 
      icon: "book",
      subfolders: ["To Read", "In Progress", "Read", "Favorites"]
    },
    work: {
      name: "Work",
      color: "#6366F1", 
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

    // Execute all operations in parallel
    await Promise.all([
      // Recursively delete subfolders
      ...subfolders.map(subfolderId => deleteFolder(subfolderId)),
      
      // Update article references
      ...articles.map(articleId => 
        updateDoc(doc(db, "articles", articleId), {
          folderId: "",
          folderName: ""
        })
      ),
      
      // Update parent folder if exists
      folderData.parentId ? 
        updateDoc(doc(db, "folders", folderData.parentId), {
          subfolders: arrayRemove(folderId),
          updatedAt: serverTimestamp()
        }) : Promise.resolve(),
      
      // Delete the folder itself
      deleteDoc(folderRef)
    ]);

    // Invalidate relevant caches
    invalidateCache('user-folders');
    invalidateCache(`folder-articles-${folderId}`);
    
  } catch (error) {
    console.error("Error deleting folder: ", error);
    throw new Error("Failed to delete folder: " + error.message);
  }
};

// Get folders for a specific user with nested structure
export const fetchUserFolders = async (userId) => {
  if (!userId) return [];

  const cacheKey = `user-folders-${userId}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const folderQuery = query(
      collection(db, "folders"),
      where("userid", "==", userId),
      orderBy("updatedAt", "desc")
    );
    
    const folderSnapshot = await getDocs(folderQuery);
    
    // Create a map of all folders
    const folderMap = new Map();
    folderSnapshot.docs.forEach(doc => {
      const folderData = { 
        id: doc.id, 
        ...doc.data(),
        lastModified: doc.data().updatedAt?.toDate().toLocaleDateString()
      };
      folderMap.set(doc.id, { ...folderData, children: [] });
    });

    // Organize into tree structure in a single pass
    const rootFolders = [];
    folderMap.forEach(folder => {
      if (folder.parentId && folderMap.has(folder.parentId)) {
        const parent = folderMap.get(folder.parentId);
        parent.children.push(folder);
      } else {
        rootFolders.push(folder);
      }
    });

    setCachedData(cacheKey, rootFolders);
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
      console.error("Folder not found:", folderId);
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
    console.log("Successfully updated folder and article");
  } catch (error) {
    console.error("Error updating folder with article: ", error);
    throw new Error("Failed to update folder with article: " + error.message);
  }
};

export const fetchArticlesInFolder = async (folderId) => {
  if (!folderId) return [];
  
  const cacheKey = `folder-articles-${folderId}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const folderRef = doc(db, "folders", folderId);
    const folderDoc = await getDoc(folderRef);
    
    if (!folderDoc.exists()) {
      console.error("Folder not found:", folderId);
      return [];
    }

    const articlesRef = collection(db, "articles");
    const q = query(
      articlesRef, 
      where("folderId", "==", folderId),
      orderBy("date", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const articles = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      dateFormatted: doc.data().date?.toDate().toLocaleDateString()
    }));

    setCachedData(cacheKey, articles);
    return articles;
  } catch (error) {
    console.error("Error fetching articles in folder:", error);
    // Return empty array instead of throwing to handle error gracefully
    return [];
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
  if (!articleId) return [];

  const cacheKey = `backlinks-${articleId}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const articlesRef = collection(db, "articles");
    const querySnapshot = await getDocs(articlesRef);
    const backlinks = [];
    
    querySnapshot.forEach((doc) => {
      const article = doc.data();
      // Skip if it's the same article
      if (doc.id === articleId) return;
      
      // Check if note contains a link to the target article
      if (article.note?.includes(`@article:${articleId}`)) {
        backlinks.push({
          id: doc.id,
          title: article.title,
          ...article,
          dateFormatted: article.date?.toDate().toLocaleDateString()
        });
      }
    });
    
    setCachedData(cacheKey, backlinks);
    return backlinks;
  } catch (error) {
    console.error("Error finding backlinks:", error);
    throw error;
  }
};

export const fetchUserArticles = async (currentUser) => {
  if (!currentUser) return [];

  const cacheKey = `user-articles-${currentUser.uid}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const articlesQuery = query(
      collection(db, "articles"),
      where("userid", "==", currentUser.uid),
      orderBy("date", "desc")
    );
    
    const articlesSnapshot = await getDocs(articlesQuery);
    const articlesData = articlesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dateFormatted: doc.data().date?.toDate().toLocaleDateString()
    }));

    setCachedData(cacheKey, articlesData);
    return articlesData;
  } catch (error) {
    console.error("Error fetching articles:", error);
    return [];
  }
};

// Add cache invalidation for write operations
export const invalidateCache = (pattern) => {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
};
