import React from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className="flex items-center mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
    >
      <FaArrowLeft className="mr-2" /> Back
    </button>
  );
}

export default BackButton;
