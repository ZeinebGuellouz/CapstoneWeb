import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Maximize2, ChevronRight, ChevronLeft, Presentation } from "lucide-react";
import SlideNavigation from "./SlideNavigation";
import SpeechEditor from "./SpeechEditor";
import SpeechControls from "./SpeechControls";
import { Slide } from "../types"; // Ensure the correct Slide type is imported
import { getAuth,onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, doc } from "firebase/firestore";
import { db } from "./firebase/firebaseConfig"; 


export function ShowSlide() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const presentationId = queryParams.get("presentationId"); // ✅
  const [speeches, setSpeeches] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    const auth = getAuth();
  
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const queryParams = new URLSearchParams(location.search);
      const presentationId = queryParams.get("presentationId");
  
      if (!user || !presentationId) {
        console.error("Missing user or presentation ID");
        return;
      }
  
      try {
        const slidesRef = collection(
          doc(db, "users", user.uid, "presentations", presentationId),
          "slides"
        );
  
        const snapshot = await getDocs(slidesRef);
        const slideDocs = snapshot.docs
          .map((doc) => ({
            slideNumber: parseInt(doc.id),
            ...doc.data(),
          }))
          .sort((a, b) => a.slideNumber - b.slideNumber);
  
        const formattedSlides: Slide[] = slideDocs.map((slide: any) => ({
          presentationId,
          slideNumber: slide.slideNumber,
          text: slide.text || "",
          image: slide.image || "",
          title: slide.title || "Untitled Slide",
        }));
  
        setSlides(formattedSlides);
        setCurrentSlideIndex(0);
      } catch (error) {
        console.error("Failed to fetch slides from Firestore:", error);
      }
    });
  
    return () => unsubscribe(); // Cleanup listener on unmount
  }, [location.search]);

  const currentSlide = slides[currentSlideIndex];

  const toggleFullScreen = () => {
    if (!document.fullscreenElement && slideContainerRef.current) {
      slideContainerRef.current.requestFullscreen().catch(console.error);
      setIsFullScreen(true);
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(console.error);
      }
      setIsFullScreen(false);
    }
  };
  
  // ✅ Handle exiting fullscreen on `ESC` key
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullScreen(false);
      }
    };
  
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);
  

  const handleNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNextSlide();
      if (e.key === "ArrowLeft") handlePrevSlide();
      if (e.key === "f") toggleFullScreen();
      if (e.key === "Escape" && isFullScreen) toggleFullScreen(); 
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentSlideIndex, slides.length]);
 
  useEffect(() => {
    console.log("Current Slide Data in ShowSlide:", currentSlide);
  }, [currentSlide]);
  

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-800 shadow-md w-full fixed top-0 left-0 z-50 h-16 flex items-center px-6">
        <h1
          className="text-xl font-bold text-gray-900 dark:text-gray-100 cursor-pointer"
          onClick={() => navigate("/")}
        >
          PresentPro
        </h1>
        <button
          onClick={() => navigate("/", { state: { scrollToUpload: true } })}
          className="ml-auto text-gray-700 dark:text-gray-300 text-sm font-medium hover:underline"
        >
          Upload a New Presentation
        </button>
      </nav>

      {/* Main Content */}
      <div className="flex flex-1 mt-16"> {/* Adjust margin-top to match navbar height */}
        {/* Left Panel – Slide Navigation */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Presentation className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Slides</h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {slides.length} slides in presentation
            </p>
          </div>
          <div className="p-4">
            <SlideNavigation slides={slides} setCurrentSlideIndex={setCurrentSlideIndex} currentSlideIndex={currentSlideIndex} />
          </div>
        </div>

        {/* Center Panel – Active Slide & Speech Editor */}
        <div className="flex-1 flex flex-col p-6 space-y-6">
          <div
            ref={slideContainerRef}
            className={`relative flex justify-center items-center bg-white dark:bg-gray-800 rounded-lg shadow-lg transition-all duration-200
              ${isFullScreen ? "h-screen w-screen p-0" : "h-[600px] p-8"}`}
          >
            {currentSlide ? (
              <img
                src={currentSlide.image}
                alt={currentSlide.title}
                className="max-h-full max-w-full object-contain rounded"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8">
                <Presentation className="h-16 w-16 text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">No slides available.</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                  Add slides to get started with your presentation
                </p>
              </div>
            )}

            {/* Fullscreen button */}
            <button
              onClick={toggleFullScreen}
              className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 p-2 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 backdrop-blur-sm"
            >
              <Maximize2 className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>

            {/* Navigation Buttons */}
            {slides.length > 1 && (
              <>
                <button
                  onClick={handlePrevSlide}
                  disabled={currentSlideIndex === 0}
                  className="absolute left-4 p-3 rounded-full shadow-lg bg-white/90 dark:bg-gray-800/90 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                </button>
                <button
                  onClick={handleNextSlide}
                  disabled={currentSlideIndex === slides.length - 1}
                  className="absolute right-4 p-3 rounded-full shadow-lg bg-white/90 dark:bg-gray-800/90 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                </button>
              </>
            )}

            {/* Slide Progress */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-gray-800/90 px-4 py-2 rounded-full shadow-lg backdrop-blur-sm">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {currentSlideIndex + 1} / {slides.length}
              </p>
            </div>
          </div>

          {/* Speech Editor */}
          {currentSlide && presentationId && (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
    <SpeechEditor
      slide={currentSlide}
      slides={slides}
      slideIndex={currentSlideIndex}
      speeches={speeches}
      setSpeeches={setSpeeches}
      voiceTone="default"
      speed={1}
      pitch={1}
      presentationId={presentationId} // ✅ this line is now safe
    />
  </div>
)}

        </div>

        {/* Right Panel – Speech Customization & Controls */}
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Speech Controls</h2>
          </div>
          <div className="p-4">
            {currentSlide && <SpeechControls slide={currentSlide} />}

          </div>
        </div>
      </div>
    </div>
  );
}

export default ShowSlide;
