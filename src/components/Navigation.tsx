import * as React from "react";
import { Menu, X } from "lucide-react";
import { User } from "../types";
import { ProfilePanel } from "./ProfilePanel";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

interface NavigationProps {
  isViewerPage?: boolean;
  onUploadClick?: () => void;
  navigateToUpload?: () => void;
  user: User | null;
  onLogout: () => void;
  onShowLoginModal?: () => void;
}

export function Navigation({
  isViewerPage,
  navigateToUpload,
  onUploadClick,
  user,
  onLogout,
  onShowLoginModal,
}: NavigationProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [showProfile, setShowProfile] = React.useState(false);
  const profileRef = React.useRef<HTMLDivElement | null>(null);
  const { loading } = useAuth();
  const [refreshedPhotoURL, setRefreshedPhotoURL] = React.useState<string | null>(user?.photoURL || null);


  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfile(false);
      }
    };

    if (showProfile) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfile]);

  const renderAvatar = () => {
    console.log(user);
    let avatarUrl: string | null = null;
  
    if (user?.providerId === "facebook.com" && user.providerUid) {
      avatarUrl = `https://graph.facebook.com/${user.providerUid}/picture?type=large`;
    } else {
      avatarUrl = user?.photoURL || null;
    }
  
    if (user && refreshedPhotoURL && user.providerId !== "password") {
      return (
        <img
          src={refreshedPhotoURL}
          alt="Avatar"
          className="w-10 h-10 object-cover rounded-full"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/default-avatar.png";
          }}
        />
      );
    }
    
    return (
      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
        <span className="text-sm font-bold text-gray-600">
          {getInitials(user?.displayName || null)}
        </span>
      </div>
    );
  };
  
  return (
    <>
      <nav className="bg-white shadow-lg fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div
              className="flex items-center cursor-pointer"
              onClick={() => {
                if (window.location.pathname === "/") {
                  document
                    .getElementById("hero")
                    ?.scrollIntoView({ behavior: "smooth" });
                } else {
                  window.location.href = "/";
                }
              }}
            >
              <h1
                className="text-2xl font-bold text-blue-700 tracking-tight cursor-pointer"
                onClick={() => {
                  if (window.location.pathname === "/") {
                    document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" });
                  } else {
                    window.location.href = "/";
                  }
                }}
              >
                PresentPro
              </h1>
            </div>

            <div className="hidden md:flex items-center space-x-8 relative">
              {!isViewerPage && (
                <>
                  <button
                    onClick={() =>
                      window.location.pathname === "/"
                        ? document
                            .getElementById("hero")
                            ?.scrollIntoView({ behavior: "smooth" })
                        : (window.location.href = "/")
                    }
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
                  >
                    Home
                  </button>
                  <button
                    onClick={() => {
                      sessionStorage.setItem("scrollTo", "features");
                      window.location.href = "/";
                    }}
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
                  >
                    Features
                  </button>
                  <button
                    onClick={() => {
                      sessionStorage.setItem("scrollTo", "upload");
                      window.location.href = "/";
                    }}
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
                  >
                    Upload
                  </button>
                  <button
                    onClick={() => {
                      sessionStorage.setItem("scrollTo", "contact");
                      window.location.href = "/";
                    }}
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
                  >
                    Contact
                  </button>
                </>
              )}

              {user ? (
                <>
                  <button
                    onClick={() => (window.location.href = "/my-presentations")}
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
                  >
                    My Presentations
                  </button>

                  <button
                    onClick={() => setShowProfile((prev) => !prev)}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 hover:ring-2 ring-blue-400 overflow-hidden"
                  >
                    {renderAvatar()}
                  </button>

                  <AnimatePresence>
                    {showProfile && (
                      <motion.div
                        ref={profileRef}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-16 right-0 z-50"
                      >
                        <ProfilePanel
                          user={{
                            displayName: user.displayName,
                            email: user.email,
                            photoURL: user.photoURL,
                            providerId: user.providerId,
                            providerUid: user.providerUid, // ✅ Add this line

                          }}
                          onLogout={onLogout}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                !loading && (
                  <button
                    onClick={onShowLoginModal}
                    className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-light transition"
                  >
                    Sign Up
                  </button>
                )
              )}
            </div>

            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {user && (
                <button
                  onClick={() => setShowProfile((prev) => !prev)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-md"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      className="w-8 h-8 rounded-full"
                      alt="avatar"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/default-avatar.png";
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center font-bold text-sm">
                      {getInitials(user.displayName)}
                    </div>
                  )}
                  <span>Profile</span>
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}