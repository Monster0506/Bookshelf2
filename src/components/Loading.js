import React from "react";

function Loading({ loading, boring }) {
  if (boring) return <p>{loading ? loading : "Loading Articles..."}</p>;

  return (
    <div className="flex items-center justify-center h-screen bg-[#121212]">
      <div className="text-center">
        {/* Glowing Spinner */}
        <div className="relative inline-block">
          <div className="w-12 h-12 border-4 border-t-4 border-gray-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-gray-500 rounded-full animate-ping" />
          </div>
        </div>

        {/* Pulsing Text */}
        <p className="mt-4 text-gray-300 text-lg font-medium animate-pulse">
          {loading || "Loading Articles..."}
        </p>
      </div>
    </div>
  );
}

export default Loading;
