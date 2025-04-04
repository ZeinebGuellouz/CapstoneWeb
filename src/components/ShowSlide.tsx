import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Maximize2, ChevronRight, ChevronLeft, Presentation } from "lucide-react";
import SlideNavigation from "./SlideNavigation";
import SpeechEditor from "./SpeechEditor";
import SpeechControls from "./SpeechControls";
import { Slide } from "../types";
import { getAuth, onAuthStateChanged } from "firebase/auth";
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
  const presentationId = queryParams.get("presentationId");
  const [speeches, setSpeeches] = useState<{ [key: number]: string }>({});
  const [voiceTone, setVoiceTone] = useState("Formal");
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(1);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user || !presentationId) return;
      try {
        const slidesRef = collection(
          doc(db, "users", user.uid, "presentations", presentationId),
          "slides"
        );
        const snapshot = await getDocs(slidesRef);
        const slideDocs = snapshot.docs
          .map((doc) => ({ slideNumber: parseInt(doc.id), ...doc.data() }))
          .sort((a, b) => a.slideNumber - b.slideNumber);
        const formattedSlides: Slide[] = slideDocs.map((slide: any) => ({
          presentationId,
          slideNumber: slide.slideNumber,
          text: slide.generated_speech || slide.text || "",
          image: slide.image || "",
          title: slide.title || "Untitled Slide",
        }));
        setSlides(formattedSlides);
        setCurrentSlideIndex(0);
      } catch (error) {
        console.error("Failed to fetch slides from Firestore:", error);
      }
    });
    return () => unsubscribe();
  }, [location.search, presentationId]);

  const currentSlide = slides[currentSlideIndex];

  const toggleFullScreen = () => {
    if (!document.fullscreenElement && slideContainerRef.current) {
      slideContainerRef.current.requestFullscreen().catch(console.error);
      setIsFullScreen(true);
    } else {
      document.exitFullscreen().catch(console.error);
      setIsFullScreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) setIsFullScreen(false);
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-blue-100 font-sans">
      {/* Top Navbar */}
      <nav className="bg-white shadow-md fixed top-0 left-0 w-full h-16 flex items-center justify-between px-6 z-50">
        <h1
          className="text-2xl font-bold text-blue-700 tracking-tight cursor-pointer"
          onClick={() => navigate("/")}
        >
          PresentPro
        </h1>
        <button
          onClick={() => navigate("/", { state: { scrollToUpload: true } })}
          className="text-sm text-blue-600 hover:underline"
        >
          Upload New Presentation
        </button>
      </nav>
  
      {/* Main Layout */}
      <div className="flex flex-1 pt-20 px-6 pb-6 justify-center gap-6">
        {/* Sidebar: Your Slides */}
        <div className="w-72 flex flex-col rounded-3xl shadow-xl bg-gradient-to-tr from-white via-blue-50 to-blue-100 border border-blue-100 p-4">
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <SlideNavigation
              slides={slides}
              setCurrentSlideIndex={setCurrentSlideIndex}
              currentSlideIndex={currentSlideIndex}
            />
          </div>
        </div>
  
        {/* Main Slide Viewer and Speech Editor */}
        <main className="flex flex-col flex-1 gap-6 transition-opacity duration-700 ease-in-out animate-fade-in max-w-[850px]">
          {/* Slide Viewer */}
          <div
            ref={slideContainerRef}
            className={`relative flex justify-center items-center rounded-3xl shadow-xl transition-all duration-700 ease-in-out backdrop-blur bg-gradient-to-tr from-white via-blue-50 to-blue-100 border border-blue-100 ${
              isFullScreen ? "h-screen w-screen p-0" : "h-[600px] p-8"
            }`}
          >
            {currentSlide ? (
              <img
                key={currentSlide.slideNumber}
                src={currentSlide.image}
                alt={currentSlide.title}
                className="max-h-full max-w-full object-contain rounded-xl shadow-md"
              />
            ) : (
              <div className="text-center p-8">
                <Presentation className="h-16 w-16 text-blue-200 mb-4" />
                <p className="text-blue-500 text-lg">No slides available</p>
                <p className="text-blue-400 text-sm">Upload to get started</p>
              </div>
            )}
  
            <button
              onClick={toggleFullScreen}
              className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow hover:bg-blue-50 transition backdrop-blur"
            >
              <Maximize2 className="h-5 w-5 text-blue-600" />
            </button>
  
            {slides.length > 1 && (
              <>
                <button
                  onClick={handlePrevSlide}
                  disabled={currentSlideIndex === 0}
                  className="absolute left-4 p-3 rounded-full bg-white/90 hover:bg-blue-50 disabled:opacity-50"
                >
                  <ChevronLeft className="h-6 w-6 text-blue-600" />
                </button>
                <button
                  onClick={handleNextSlide}
                  disabled={currentSlideIndex === slides.length - 1}
                  className="absolute right-4 p-3 rounded-full bg-white/90 hover:bg-blue-50 disabled:opacity-50"
                >
                  <ChevronRight className="h-6 w-6 text-blue-600" />
                </button>
              </>
            )}
  
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/80 px-4 py-1 rounded-full shadow">
              <p className="text-sm font-medium text-blue-700">
                {currentSlideIndex + 1} / {slides.length}
              </p>
            </div>
          </div>
  
          {/* Speech Editor */}
          {currentSlide && presentationId && (
            <SpeechEditor
              slide={currentSlide}
              slides={slides}
              slideIndex={currentSlideIndex}
              speeches={speeches}
              setSpeeches={setSpeeches}
              voiceTone={voiceTone}
              speed={speed}
              pitch={pitch}
              presentationId={presentationId}
            />
          )}
        </main>
  
        {/* Sidebar: Speech Assistant */}
        <div className="w-80 animate-slide-in rounded-3xl shadow-xl bg-gradient-to-tr from-white via-blue-50 to-blue-100 border border-blue-100 p-4">
          {currentSlide && (
            <SpeechControls
              slide={currentSlide}
              slides={slides}
              setVoiceTone={setVoiceTone}
              setSpeed={setSpeed}
              setPitch={setPitch}
              voiceTone={voiceTone}
              speed={speed}
              pitch={pitch}
              speeches={speeches}
              totalSlides={slides.length}
              currentIndex={currentSlideIndex}
              setCurrentSlideIndex={setCurrentSlideIndex}
            />
          )}
        </div>
      </div>
    </div>
  );
  }
  export default ShowSlide;
