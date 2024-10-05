import React, { useState } from "react";
import { FaFacebookF, FaTwitter, FaEnvelope, FaCopy } from "react-icons/fa";
import { CSSTransition } from "react-transition-group";
import "../../css/ShareModal.css"; // Custom CSS for additional animations

function ShareModal({ show, onClose, shareLink, generateShareUrl }) {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <CSSTransition in={show} timeout={300} classNames="modal" unmountOnExit>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out">
        <div className="bg-white p-8 rounded-lg shadow-2xl transform transition-transform duration-500 ease-out max-w-md w-full scale-95 hover:scale-100">
          <h2 className="text-2xl font-bold text-center mb-6 animate-bounce">
            Share this Article
          </h2>

          <div className="mb-6">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="w-full p-3 text-gray-700 outline-none transition-colors duration-300 focus:bg-gray-100"
              />
              <button
                onClick={handleCopy}
                className="px-4 py-3 bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-300 flex items-center"
              >
                <FaCopy />
              </button>
            </div>
            {copySuccess && (
              <p className="mt-2 text-green-600 text-center transition-opacity duration-300">
                Link copied to clipboard!
              </p>
            )}
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-center mb-4">
              Share on Social Media
            </h3>
            <div className="flex justify-center space-x-6">
              <a
                href={generateShareUrl("facebook")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:bg-blue-100 p-3 rounded-full transition-transform duration-300 transform hover:scale-125"
              >
                <FaFacebookF size={24} />
              </a>
              <a
                href={generateShareUrl("twitter")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:bg-blue-100 p-3 rounded-full transition-transform duration-300 transform hover:scale-125"
              >
                <FaTwitter size={24} />
              </a>
              <a
                href={generateShareUrl("email")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:bg-gray-100 p-3 rounded-full transition-transform duration-300 transform hover:scale-125"
              >
                <FaEnvelope size={24} />
              </a>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-300 text-black rounded-lg hover:bg-gray-400 transition-transform duration-300 transform hover:scale-105"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </CSSTransition>
  );
}

export default ShareModal;
