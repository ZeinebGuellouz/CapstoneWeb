import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { Upload } from "./components/Upload";
import { Contact } from "./components/Contact";
import { ShowSlide } from "./components/ShowSlide";

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve the filePath from localStorage
  const filePath = localStorage.getItem("uploadedFilePath");

  // Navigate and scroll to upload section
  const navigateToUpload = () => {
    if (location.pathname !== "/") {
      // Navigate to home page first
      navigate("/");
      // Scroll after a short delay
      setTimeout(() => {
        const uploadSection = document.getElementById("upload");
        if (uploadSection) {
          uploadSection.scrollIntoView({ behavior: "smooth" });
        }
      }, 100); // Adjust delay if necessary
    } else {
      // Already on home page, directly scroll to upload section
      const uploadSection = document.getElementById("upload");
      if (uploadSection) {
        uploadSection.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation
        isViewerPage={location.pathname === "/viewer"} // Pass viewer-specific behavior
        navigateToUpload={navigateToUpload} // Pass function for Upload navigation
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
              filePath ? (
                <ShowSlide filePath={filePath} />
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
