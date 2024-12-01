import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { updateProfile, updateEmail, updatePassword, deleteUser } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion } from "framer-motion";
import { db } from "../firebaseConfig";
import { collection, query, where, orderBy, limit, getDocs, deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Loading from "../components/Loading";

function Profile() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(currentUser?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeUnit, setTimeUnit] = useState('minutes');
  const [wordUnit, setWordUnit] = useState('words');
  const [userStats, setUserStats] = useState({
    totalArticles: 0,
    lastArticleDate: null,
    totalWords: 0,
    averageWordsPerArticle: 0,
    totalReadingTime: 0,
    averageReadingTime: 0
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!currentUser) return;
      
      try {
        const articlesRef = collection(db, "articles");
        
        // Create optimized queries for stats
        const userArticlesQuery = query(
          articlesRef,
          where("userid", "==", currentUser.uid),
          orderBy("date", "desc")
        );
        
        const querySnapshot = await getDocs(userArticlesQuery);
        
        let totalArticles = 0;
        let lastArticleDate = null;
        let totalWords = 0;
        let totalReadingTime = 0;
        
        // Process stats in a single pass
        querySnapshot.forEach((doc) => {
          const article = doc.data();
          totalArticles++;
          
          // Calculate word count from content and notes
          const contentWords = (article.plaintext || '').trim().split(/\s+/).filter(word => word.length > 0).length;
          const noteWords = (article.note || '').trim().split(/\s+/).filter(word => word.length > 0).length;
          const articleWordCount = contentWords + noteWords;
          
          totalWords += articleWordCount;
          
          // Calculate reading time (assuming 200 words per minute)
          const articleReadingTime = Math.ceil(articleWordCount / 200);
          totalReadingTime += articleReadingTime;
          
          if (!lastArticleDate || article.date > lastArticleDate) {
            lastArticleDate = article.date;
          }
        });

        // Calculate averages
        const averageWords = totalArticles ? Math.round(totalWords / totalArticles) : 0;
        const averageReadingTime = totalArticles ? Math.round(totalReadingTime / totalArticles) : 0;

        setUserStats({
          totalArticles,
          lastArticleDate: lastArticleDate ? lastArticleDate.toDate().toLocaleDateString() : null,
          totalWords,
          averageWordsPerArticle: averageWords,
          totalReadingTime,
          averageReadingTime
        });
      } catch (error) {
        console.error("Error fetching user stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [currentUser]);

  if (loading) {
    return <Loading />;
  }

  // Function to cycle through time units
  const cycleTimeUnit = () => {
    const units = ['minutes', 'hours', 'days'];
    const currentIndex = units.indexOf(timeUnit);
    const nextIndex = (currentIndex + 1) % units.length;
    setTimeUnit(units[nextIndex]);
  };

  // Function to cycle through word units
  const cycleWordUnit = () => {
    const units = ['words', 'pages', 'books', 'moby-dicks', 'war-and-peaces'];
    const currentIndex = units.indexOf(wordUnit);
    const nextIndex = (currentIndex + 1) % units.length;
    setWordUnit(units[nextIndex]);
  };

  // Function to format time based on current unit
  const formatTime = (minutes) => {
    switch (timeUnit) {
      case 'hours':
        return (minutes / 60).toFixed(1);
      case 'days':
        return (minutes / 1440).toFixed(1);
      default: // minutes
        return Math.round(minutes);
    }
  };

  // Function to format words based on current unit
  const formatWords = (words) => {
    switch (wordUnit) {
      case 'pages':
        return (words / 250).toFixed(1); 
      case 'books':
        return (words / 63500).toFixed(2);
      case 'moby-dicks':
        return (words / 209117).toFixed(2); 
      case 'war-and-peaces':
        return (words / 460000).toFixed(2); 
      default: 
        return words.toLocaleString(); 
    }
  };

  // Function to get unit label
  const getTimeUnitLabel = () => {
    return timeUnit.charAt(0).toUpperCase() + timeUnit.slice(1);
  };

  // Function to get word unit label
  const getWordUnitLabel = () => {
    switch (wordUnit) {
      case 'moby-dicks':
        return 'Moby Dicks';
      case 'war-and-peaces':
        return 'War and Peaces';
      default:
        return wordUnit.charAt(0).toUpperCase() + wordUnit.slice(1);
    }
  };

  // Handle profile picture upload
  const handleProfilePictureChange = async (e) => {
    if (!currentUser) return;
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      setError("Please upload an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError("Image size should be less than 5MB.");
      return;
    }

    setUploading(true);
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `profilePictures/${currentUser.uid}`);
      await uploadBytes(storageRef, file);

      // Get the download URL
      const photoURL = await getDownloadURL(storageRef);

      // Update the user's profile picture
      await updateProfile(currentUser, { photoURL });
      setMessage("Profile picture updated successfully!");
      setError("");
    } catch (error) {
      console.error("Error updating profile picture:", error);
      setError("Failed to update profile picture.");
    } finally {
      setUploading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await updatePassword(currentUser, password);
      setMessage("Password updated successfully!");
      setError("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error updating password:", error);
      if (error.code === "auth/requires-recent-login") {
        setError(
          "This operation is sensitive and requires recent login. Please log out and log in again."
        );
      } else if (error.code === "auth/weak-password") {
        setError(
          "The password is too weak. Please choose a stronger password."
        );
      } else {
        setError("Failed to update password. Please try again.");
      }
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!currentUser) return;

    try {
      // Delete user's articles
      const articlesRef = collection(db, "articles");
      const userArticlesQuery = query(articlesRef, where("userid", "==", currentUser.uid));
      const querySnapshot = await getDocs(userArticlesQuery);
      
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Delete user account
      await deleteUser(currentUser);
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      if (error.code === "auth/requires-recent-login") {
        setError("Please log out and log in again to delete your account.");
      } else {
        setError("Failed to delete account. Please try again.");
      }
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-white to-gray-100 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="max-w-2xl mx-auto space-y-8"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Header Section */}
        <div className="text-center space-y-2">
          <motion.h1
            className="text-4xl font-bold text-gray-900"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Your Profile
          </motion.h1>
          <p className="text-gray-600">{currentUser?.email}</p>
        </div>

        {/* Notifications */}
        <div className="space-y-2">
          {error && (
            <motion.div
              className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-red-700">{error}</p>
            </motion.div>
          )}

          {message && (
            <motion.div
              className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-green-700">{message}</p>
            </motion.div>
          )}
        </div>

        {/* Profile Picture Card */}
        <motion.div
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-500">
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
              <div className="relative">
                <img
                  src={currentUser?.photoURL || "https://via.placeholder.com/150"}
                  alt="Profile"
                  className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg"
                />
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                    <Loading loading="Uploading..." />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="pt-20 pb-6 px-6 text-center">
            <label className="inline-block px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full cursor-pointer transform transition hover:scale-105 hover:shadow-lg">
              Change Picture
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="hidden"
              />
            </label>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-6">
          <motion.div
            className="bg-white p-6 rounded-2xl shadow-lg text-center"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-5xl font-bold text-blue-500 mb-2">
              {userStats.totalArticles}
            </div>
            <div className="text-gray-600">Articles Read</div>
          </motion.div>
          <motion.div
            className="bg-white p-6 rounded-2xl shadow-lg text-center"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-gray-900 font-semibold mb-2">
              {userStats.lastArticleDate || 'No articles yet'}
            </div>
            <div className="text-gray-600">Last Article</div>
          </motion.div>
          <motion.div
            className="bg-white p-6 rounded-2xl shadow-lg text-center cursor-pointer"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            onClick={cycleWordUnit}
          >
            <div className="text-5xl font-bold text-blue-500 mb-2">
              {formatWords(userStats.totalWords)}
            </div>
            <div className="text-gray-600">Total {getWordUnitLabel()}</div>
          </motion.div>
          <motion.div
            className="bg-white p-6 rounded-2xl shadow-lg text-center cursor-pointer"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            onClick={cycleWordUnit}
          >
            <div className="text-gray-900 font-semibold mb-2">
              {formatWords(userStats.averageWordsPerArticle)}
            </div>
            <div className="text-gray-600">Average {getWordUnitLabel()} per Article</div>
          </motion.div>
          <motion.div
            className="bg-white p-6 rounded-2xl shadow-lg text-center cursor-pointer"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            onClick={cycleTimeUnit}
          >
            <div className="text-5xl font-bold text-blue-500 mb-2">
              {formatTime(userStats.totalReadingTime)}
            </div>
            <div className="text-gray-600">Total Reading Time ({getTimeUnitLabel()})</div>
          </motion.div>
          <motion.div
            className="bg-white p-6 rounded-2xl shadow-lg text-center cursor-pointer"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            onClick={cycleTimeUnit}
          >
            <div className="text-gray-900 font-semibold mb-2">
              {formatTime(userStats.averageReadingTime)}
            </div>
            <div className="text-gray-600">Average Reading Time per Article ({getTimeUnitLabel()})</div>
          </motion.div>
        </div>

        {/* Password Change Card */}
        <motion.div
          className="bg-white rounded-2xl shadow-lg p-6"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Confirm new password"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg transform transition hover:scale-105 hover:shadow-lg"
            >
              Update Password
            </button>
          </form>
        </motion.div>

        {/* Delete Account Card */}
        <motion.div
          className="bg-white rounded-2xl shadow-lg p-6"
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Danger Zone</h2>
          <p className="text-gray-600 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-2 px-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg transform transition hover:scale-105 hover:shadow-lg"
          >
            Delete Account
          </button>
        </motion.div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-8 max-w-md w-full"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Delete Account?
              </h3>
              <p className="text-gray-600 mb-6">
                This will permanently delete your account and all associated articles. This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg transform transition hover:scale-105 hover:shadow-lg"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default Profile;
