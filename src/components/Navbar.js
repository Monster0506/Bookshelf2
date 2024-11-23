import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { 
  FaPlus, 
  FaBook, 
  FaTrash, 
  FaProjectDiagram, 
  FaFolder, 
  FaUserShield,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaChevronDown
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Admin UIDs - keep in sync with AdminPage
  const ADMIN_UIDS = [process.env.REACT_APP_ADMIN_UID];
  const isAdmin = ADMIN_UIDS.includes(currentUser?.uid);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          className="w-8 h-8 rounded-full object-cover border-2 border-transparent group-hover:border-blue-500 transition-colors"
        />
      );
    }
    return (
      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white border-2 border-transparent group-hover:border-blue-300 transition-colors">
        {currentUser?.email.charAt(0).toUpperCase()}
      </div>
    );
  };

  const dropdownVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.95,
      y: -20,
      transition: {
        duration: 0.1
      }
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        duration: 0.3,
        bounce: 0.3
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.95,
      y: -20,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <nav className="p-4 bg-gray-800 text-white">
      <div className="px-4 sm:px-6 lg:px-8 w-full flex justify-between items-center">
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
            <Link to="/add-article" className="mr-4 flex items-center hover:text-blue-400 transition-colors">
              <FaPlus className="mr-2" /> Add Article
            </Link>
            <Link to="/" className="mr-4 flex items-center hover:text-blue-400 transition-colors">
              <FaBook className="mr-2" />
            </Link>
            <Link to="/folders" className="mr-4 flex items-center hover:text-blue-400 transition-colors">
              <FaFolder className="mr-2" />
            </Link>
            <Link to="/trash" className="mr-4 flex items-center hover:text-blue-400 transition-colors">
              <FaTrash className="mr-2" />
            </Link>
            <Link to="/graph" className="mr-4 flex items-center hover:text-blue-400 transition-colors">
              <FaProjectDiagram className="mr-2" />
            </Link>
            {isAdmin && (
              <Link to="/admin" className="mr-4 flex items-center text-yellow-400 hover:text-yellow-300 transition-colors">
                <FaUserShield className="mr-2" />
              </Link>
            )}

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                className="flex items-center space-x-2 group focus:outline-none"
                onClick={() => setShowDropdown(!showDropdown)}
                aria-expanded={showDropdown}
                aria-haspopup="true"
              >
                {getProfileDisplay()}
                <FaChevronDown 
                  className={`text-gray-400 group-hover:text-blue-400 transition-transform duration-200 ${
                    showDropdown ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-50"
                  >
                    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-b border-gray-200">
                      <p className="text-sm text-gray-600">Signed in as</p>
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {currentUser?.email}
                      </p>
                    </div>
                    
                    <div className="py-2">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <FaUser className="w-4 h-4 mr-3" />
                        Profile
                      </Link>
                    </div>

                    <div className="border-t border-gray-200 py-2">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <FaSignOutAlt className="w-4 h-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="space-x-4">
            <Link 
              to="/login" 
              className="text-gray-300 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link 
              to="/signup"
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg transition-colors"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
