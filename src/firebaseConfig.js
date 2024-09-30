import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
const firebaseConfig = {
  apiKey: "AIzaSyCgkf_A6325qgWjn3NQZYCOYwqt60FqLNc",
  authDomain: "bookshelf-cc798.firebaseapp.com",
  projectId: "bookshelf-cc798",
  storageBucket: "bookshelf-cc798.appspot.com",
  messagingSenderId: "1039882771188",
  appId: "1:1039882771188:web:8ddd9b585908bd6e6c9ca1",
  measurementId: "G-G1CRETCGSL",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);
export { db, auth, analytics, storage };
