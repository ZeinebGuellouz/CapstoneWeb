import React from "react";
import { toast } from "react-toastify";
import { auth } from "./firebase/firebaseConfig";
import { deleteUser } from "firebase/auth";

interface ProfilePanelProps {
  user: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    providerId: string;
    providerUid?: string;  // ✅ Add this

  };
  onLogout: () => void;
}

export const ProfilePanel: React.FC<ProfilePanelProps> = ({ user, onLogout }) => {
  const handleDeleteAccount = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await deleteUser(currentUser);
        toast.success("Account deleted successfully!");
        onLogout();
      }
    } catch (error) {
      toast.error("Failed to delete account. Please try again.");
    }
  };

  const getInitials = (name: string | null, email: string | null) => {
    const base = name || email?.split("@")[0] || "U";
    const parts = base.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return parts[0][0].toUpperCase() + parts[1][0].toUpperCase();
  };

  const renderAvatar = () => {
    const avatarUrl =
        user.providerId === "facebook.com" && user.providerUid
             ? `https://graph.facebook.com/${user.providerUid}/picture?type=large`
             : user.photoURL;


    if (avatarUrl && user.providerId !== "password") {
      return (
        <img
          src={avatarUrl}
          alt="User Avatar"
          className="w-16 h-16 rounded-full"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/default-avatar.png";
          }}
        />
      );
    }

    return (
      <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-xl font-bold text-gray-700">
        {getInitials(user.displayName, user.email)}
      </div>
    );
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-sm mx-auto">
      <div className="flex items-center space-x-4">
        {renderAvatar()}
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            {user.displayName || user.email?.split("@")[0] || "User"}
          </h2>
          <p className="text-sm text-gray-600">{user.email || "No email provided"}</p>
        </div>
      </div>
      <div className="mt-6 space-y-4">
        <button
          onClick={onLogout}
          className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition"
        >
          Sign Out
        </button>
        <button
          onClick={handleDeleteAccount}
          className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
};
