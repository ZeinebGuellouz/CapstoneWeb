import * as React from "react";
import { Menu, X } from "lucide-react";

interface NavigationProps {
  isViewerPage?: boolean;
  navigateToUpload?: () => void;
  user: string | null; // ✅ Pass user state
  onLogout: () => void; // ✅ Logout function
}

export function Navigation({ isViewerPage, navigateToUpload, user, onLogout }: NavigationProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const navItems = [
    { title: "Home", onClick: () => (window.location.href = "/") },
    {
      title: "Upload a New Presentation",
      onClick: navigateToUpload || (() => {}),
    },
  ];

  return (
    <nav className="bg-white shadow-lg fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div
            className="flex items-center cursor-pointer"
            onClick={() => {
              if (window.location.pathname === "/") {
                document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" });
              } else {
                window.location.href = "/";
              }
            }}
          >
            <span className="text-xl font-bold text-gray-800">PresentPro</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {isViewerPage ? (
              navItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
                >
                  {item.title}
                </button>
              ))
            ) : (
              <>
                <button
                  onClick={() =>
                    window.location.pathname === "/"
                      ? document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" })
                      : (window.location.href = "/")
                  }
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
                >
                  Home
                </button>
                <button
                  onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
                >
                  Features
                </button>
                <button
                  onClick={() => document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
                >
                  Upload
                </button>
                <button
                  onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
                >
                  Contact
                </button>

                {/* ✅ Show Logout Button Only When User is Logged In */}
                {user && (
                  <button
                    onClick={onLogout}
                    className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium cursor-pointer hover:bg-red-600 transition"
                  >
                    Logout
                  </button>
                )}
              </>
            )}
          </div>

          {/* Mobile menu button */}
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

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              >
                {item.title}
              </button>
            ))}
            {/* ✅ Show Logout Button Only When User is Logged In (Mobile View) */}
            {user && (
              <button
                onClick={onLogout}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-500 hover:text-red-700 hover:bg-gray-50"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
