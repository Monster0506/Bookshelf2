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
export const addFolder = async (folderName, userId, isPublic) => {
  try {
    await addDoc(collection(db, "folders"), {
      name: folderName,
      userid: userId,
      public: isPublic,
      articles: [],
    });
  } catch (error) {
    console.error("Error adding folder: ", error);
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

// Delete a folder and clean up article references
export const deleteFolder = async (folderId) => {
  try {
    // Get the folder data first to get the list of articles
    const folderRef = doc(db, "folders", folderId);
    const folderDoc = await getDoc(folderRef);
    
    if (!folderDoc.exists()) {
      throw new Error("Folder not found");
    }

    const articles = folderDoc.data().articles || [];

    // Create an array of promises to update all articles
    const articleUpdates = articles.map(articleId => {
      const articleRef = doc(db, "articles", articleId);
      return updateDoc(articleRef, {
        folderId: "",
        folderName: ""
      });
    });

    // Wait for all article updates to complete, then delete the folder
    await Promise.all([
      ...articleUpdates,
      deleteDoc(folderRef)
    ]);
  } catch (error) {
    console.error("Error deleting folder: ", error);
    throw new Error("Failed to delete folder: " + error.message);
  }
};

// Get folders for a specific user
export const fetchUserFolders = async (userId) => {
  try {
    const folderQuery = query(
      collection(db, "folders"),
      where("userid", "==", userId),
    );
    const folderSnapshot = await getDocs(folderQuery);
    return folderSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
    return folderSnapshot.data();
  } catch (error) {
    console.error("Error fetching folder: ", error);
    throw new Error("Failed to fetch folder.");
  }
};
