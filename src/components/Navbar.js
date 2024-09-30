import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login"); // Redirect to login page after logout
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  return (
    <nav className="p-4 bg-gray-800 text-white">
      <div className="container mx-auto flex justify-between">
        <h1 className="text-xl">Bookshelf</h1>
        {currentUser ? (
          <div className="flex items-center">
            <a href="/add-article" className="mr-4">
              Add Article
            </a>
            <a href="/articles" className="mr-4">
              Articles
            </a>
            <a href="/trash" className="mr-4">
              Trash
            </a>
            <a href="/profile" className="mr-4">
              Profile
            </a>
            <button
              onClick={handleLogout}
              className="bg-red-500 px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        ) : (
          <div>
            <a href="/login" className="mr-4">
              Login
            </a>
            <a href="/signup">Signup</a>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
