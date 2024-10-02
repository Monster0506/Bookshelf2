import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { updateProfile, updateEmail, updatePassword } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
      setError("Failed to update password.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
        <h1 className="text-2xl font-bold text-center">Profile</h1>

        {error && <p className="text-red-500">{error}</p>}
        {message && <p className="text-green-500">{message}</p>}

        <div className="space-y-4">
          <p>
            <strong>Email:</strong>{" "}
            {currentUser ? currentUser.email : "Not logged in"}
          </p>

          {/* Change Profile Picture */}
          <div>
            <label className="block text-gray-700">
              Change Profile Picture:
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePictureChange}
              className="w-full p-2 border rounded"
            />
            {uploading && <p className="text-blue-500">Uploading...</p>}
          </div>

          {/* Change Password */}
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-gray-700">Change Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">
                Confirm New Password:
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;
