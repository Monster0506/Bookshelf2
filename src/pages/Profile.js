import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { updateProfile, updateEmail, updatePassword } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion } from "framer-motion";

function Profile() {
  const { currentUser } = useAuth();
  const [email, setEmail] = useState(currentUser?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  // Handle profile picture upload
  const handleProfilePictureChange = async (e) => {
    if (!currentUser) return;
    const file = e.target.files[0];
    if (!file) return;

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
    } catch (error) {
      console.error("Error updating password:", error);
      if (error.code === "auth/requires-recent-login") {
        setError(
          "This operation is sensitive and requires a recent login. Please log in again and try again.",
        );
      } else if (error.code === "auth/weak-password") {
        setError(
          "The password is too weak. Please choose a stronger password.",
        );
      } else {
        setError("Failed to update password. Please try again.");
      }
    }
  };

  return (
    <motion.div
      className="flex items-center justify-center min-h-screen bg-white p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <motion.div
        className="w-full max-w-md p-8 space-y-6 bg-gray-200 rounded-2xl shadow-xl"
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.h1
          className="text-3xl font-extrabold text-center text-gray-800"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          Profile
        </motion.h1>

        {error && (
          <motion.p
            className="text-red-500 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {error}
          </motion.p>
        )}
        {message && (
          <motion.p
            className="text-green-500 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {message}
          </motion.p>
        )}

        <div className="space-y-6">
          <div className="bg-gray-100 p-4 rounded-lg shadow-inner">
            <p className="text-gray-700 font-semibold">
              <strong>Email:</strong>{" "}
              {currentUser ? currentUser.email : "Not logged in"}
            </p>
          </div>

          {/* Change Profile Picture */}
          <div className="space-y-2">
            <label className="block text-gray-800 font-semibold">
              Change Profile Picture:
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePictureChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {uploading && (
              <p className="text-blue-500 animate-pulse">Uploading...</p>
            )}
          </div>

          {/* Change Password */}
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div>
              <label className="block text-gray-800 font-semibold">
                Change Password:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-800 font-semibold">
                Confirm New Password:
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <motion.button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all duration-300 ease-in-out shadow-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Update Password
            </motion.button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default Profile;
