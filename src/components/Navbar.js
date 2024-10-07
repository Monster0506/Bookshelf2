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
        <Link to="/" className="flex items-center">
          <img
            src="/bookshelf.png"
            alt="Bookshelf Logo"
            className="w-10 h-10 mr-2"
          />
          <h1 className="text-xl">Bookshelf</h1>
        </Link>

        {currentUser ? (
          <div className="flex items-center">
            <Link to="/add-article" className="mr-4 flex items-center">
              <FaPlus className="mr-2" /> Add Article
            </Link>
            <Link to="/" className="mr-4 flex items-center">
              <FaBook className="mr-2" />
            </Link>
            <Link to="/trash" className="mr-4 flex items-center">
              <FaTrash className="mr-2" />
            </Link>
            <Link to="/graph" className="mr-4 flex items-center">
              <FaProjectDiagram className="mr-2" />
            </Link>

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
                  <Link
                    to="/profile"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    Profile
                  </Link>
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
            <Link to="/login" className="mr-4">
              Login
            </Link>
            <Link to="/signup">Signup</Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
