import React from "react";
import { FaArrowLeft } from "react-icons/fa";
import BackButton from "../BackButton";

function Header({
  activeTab,
  setActiveTab,
  tabs,
  showSidebar,
  setShowSidebar,
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <BackButton />
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center justify-between border-b-2 border-gray-200">
        {/* Tabs */}
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === tab.id
                  ? "border-b-4 border-blue-500 text-blue-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Show Metadata Button */}
        <button
          type="button"
          onClick={() => setShowSidebar(!showSidebar)}
          className="ml-auto px-4 py-2 text-sm font-medium bg-gray-500 text-white rounded-lg shadow hover:bg-gray-600 transition duration-300"
        >
          {showSidebar ? "Hide Metadata" : "Show Metadata"}
        </button>
      </div>
    </div>
  );
}

export default Header;
