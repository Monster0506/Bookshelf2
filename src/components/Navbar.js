import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { FaPlus, FaBook, FaTrash, FaProjectDiagram } from "react-icons/fa";
import { Link } from "react-router-dom";

function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  // Get the profile icon or first letter of the email
  const getProfileDisplay = () => {
    if (currentUser?.photoURL) {
      return (
        <img
          src={currentUser.photoURL}
          alt="Profile"
          className="w-8 h-8 rounded-full"
        />
      );
    }
    return (
      <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white">
        {currentUser?.email.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <nav className="p-4 bg-gray-800 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/">
          <h1 className="text-xl">Bookshelf</h1>
        </Link>
        {currentUser ? (
          <div className="flex items-center">
            <a href="/add-article" className="mr-4 flex items-center">
              <FaPlus className="mr-2" /> Add Article
            </a>
            <a href="/" className="mr-4 flex items-center">
              <FaBook className="mr-2" />
            </a>
            <a href="/trash" className="mr-4 flex items-center">
              <FaTrash className="mr-2" />
            </a>
            <a href="/graph" className="mr-4 flex items-center">
              <FaProjectDiagram className="mr-2" />
            </a>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                {getProfileDisplay()}
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded shadow-md z-10">
                  <a
                    href="/profile"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Profile
                  </a>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
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
