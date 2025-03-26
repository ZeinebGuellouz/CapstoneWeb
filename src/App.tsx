import { useState } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Navigation } from "./components/Navigation";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { Upload } from "./components/Upload";
import { Contact } from "./components/Contact";
import { ShowSlide } from "./components/ShowSlide";
import ViewPresentations from "./components/ViewPresentations";
import LoginModal from "./components/ui/LoginModal";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

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
        user={user}
        onLogout={logout}
        onShowLoginModal={() => setShowLoginModal(true)} // ✅ Shows modal
      />

      <main className="relative">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Hero />
                <Features />
                <Upload />
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
          <Route path="/my-presentations" element={<ViewPresentations />} />
        </Routes>
      </main>

      {/* ✅ Insert this right before closing the outer div */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLogin={(email) => {
            console.log("Logged in:", email);
            setShowLoginModal(false);
          }}
        />
      )}
    </div>
  );
}

export default App;
