import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { Maximize } from "lucide-react"; // Full-screen icon

export function ShowSlide() {
  const [slideImages, setSlideImages] = useState<string[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false); // Track full-screen state
  const navigate = useNavigate();
  const location = useLocation();
  const slideContainerRef = useRef<HTMLDivElement>(null);

  // Check if slides were passed via navigation state
  useEffect(() => {
    if (location.state?.slides) {
      setSlideImages(location.state.slides);
      setCurrentSlide(0);
      setError(null);
    } else {
      setSlideImages([]);
    }
  }, [location.state]);

  // Keyboard navigation for both full-screen and normal modes
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") goToNextSlide();
      if (event.key === "ArrowLeft") goToPreviousSlide();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide]);

  // Handle fullscreen changes (e.g., Esc key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullScreen(false); // Update state when exiting full screen
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSlideImages([]);
    setCurrentSlide(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://127.0.0.1:8000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSlideImages(response.data.slides);
    } catch (err) {
      setError("Failed to upload or process the file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goToNextSlide = () => {
    if (currentSlide < slideImages.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const goToPreviousSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      slideContainerRef.current?.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  return (
    <div className={`min-h-screen ${isFullScreen ? "bg-black" : "bg-gray-50"}`}>
      {/* Navbar */}
      {!isFullScreen && (
        <nav className="bg-white shadow-lg fixed w-full z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <span
                className="text-xl font-bold text-gray-800 cursor-pointer"
                onClick={() => navigate("/")}
              >
                PresentPro
              </span>
              <input
                type="file"
                accept=".pptx,.pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
              >
                Upload Presentation
              </label>
            </div>
          </div>
        </nav>
      )}

      <main className={`pt-24 ${isFullScreen ? "pt-0" : ""}`}>
        {!isFullScreen && (
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-primary">Presentation Viewer</h1>
          </div>
        )}

        <div className="mt-8 max-w-4xl mx-auto">
          <div
            ref={slideContainerRef}
            className={`relative w-full h-auto ${isFullScreen ? "fullscreen-slide" : ""}`}
            style={{
              height: isFullScreen ? "100vh" : "500px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {loading ? (
              <p className="text-gray-500">Processing presentation...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : slideImages.length > 0 ? (
              <img
                src={slideImages[currentSlide]}
                alt={`Slide ${currentSlide + 1}`}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }}
              />
            ) : (
              <p className="text-gray-500">No slides available. Please upload a presentation.</p>
            )}
            {!isFullScreen && slideImages.length > 0 && (
              <>
                <button
                  onClick={goToPreviousSlide}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-600 text-white p-2 rounded-full shadow-md hover:bg-gray-700"
                >
                  &#8592;
                </button>
                <button
                  onClick={goToNextSlide}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-600 text-white p-2 rounded-full shadow-md hover:bg-gray-700"
                >
                  &#8594;
                </button>
                <button
                  onClick={toggleFullScreen}
                  className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
                >
                  <Maximize className="h-6 w-6 text-gray-800" />
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
