import React from "react";
import { useAuth } from "../contexts/AuthContext";

function Profile() {
  const { currentUser } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
        <h1 className="text-2xl font-bold text-center">Profile</h1>
        <p>
          <strong>Email:</strong>{" "}
          {currentUser ? currentUser.email : "Not logged in"}
        </p>
      </div>
    </div>
  );
}

export default Profile;
