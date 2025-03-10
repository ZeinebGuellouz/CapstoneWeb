import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Navigation } from "./components/Navigation";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { Upload } from "./components/Upload";
import { Contact } from "./components/Contact";
import { ShowSlide } from "./components/ShowSlide";

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Track User Session
  const [user, setUser] = useState<string | null>(localStorage.getItem("authenticatedUser"));

  // ✅ Persist login state on refresh
  useEffect(() => {
    setUser(localStorage.getItem("authenticatedUser"));
  }, []);

  // ✅ Handle logout
  const handleLogout = () => {
    localStorage.removeItem("authenticatedUser"); // Remove session
    setUser(null); // Update state
    navigate("/"); // Redirect to home
  };

  // ✅ Navigate and scroll to upload section
  const navigateToUpload = () => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation
        isViewerPage={location.pathname === "/viewer"}
        navigateToUpload={navigateToUpload}
        user={user} // ✅ Pass user state
        onLogout={handleLogout} // ✅ Pass logout function
      />

      <main className="relative">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Hero />
                <Features />
                <Upload user={user} setUser={setUser} />  {/* ✅ Pass setUser to Upload */}
                <Contact />
              </>
            }
          />
          <Route
            path="/viewer"
            element={
              localStorage.getItem("uploadedFilePath") ? (
                <ShowSlide />
              ) : (
                <div className="text-center py-24 text-red-500">
                  No presentation uploaded. Please upload a file first.
                </div>
              )
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
