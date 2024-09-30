import { db } from "../firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

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
    throw new Error("Failed to add article");
  }
}
