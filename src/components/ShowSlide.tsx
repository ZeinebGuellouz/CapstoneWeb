import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Maximize2, ChevronRight, ChevronLeft, Presentation } from "lucide-react";
import SlideNavigation from "./SlideNavigation";
import SpeechEditor from "./SpeechEditor";
import SpeechControls from "./SpeechControls";
import PresentationMode from "./PresentationMode";
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
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .catch((err) => console.error("Fullscreen error:", err));
    } else {
      document.exitFullscreen()
        .then(() => {
          setIsFullScreen(false);
        })
        .catch(console.error);
    }
  };
  
  

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        // Now we know it's in fullscreen
        setIsFullScreen(true);
      } else {
        setIsFullScreen(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);
  

  if (isFullScreen && slides.length > 0) {
    return (
      <PresentationMode
        slides={slides}
        currentIndex={currentSlideIndex}
        setCurrentIndex={setCurrentSlideIndex}
        speeches={speeches}
        voiceTone={voiceTone}
        speed={speed}
        pitch={pitch}
        toggleFullScreen={toggleFullScreen}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-blue-100 font-sans">
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

      <div className="flex flex-1 pt-20 px-6 pb-6 justify-center gap-6">
        <div className="w-72 flex flex-col rounded-3xl shadow-xl bg-gradient-to-tr from-white via-blue-50 to-blue-100 border border-blue-100 p-4">
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <SlideNavigation
              slides={slides}
              setCurrentSlideIndex={setCurrentSlideIndex}
              currentSlideIndex={currentSlideIndex}
            />
          </div>
        </div>

        <main className="flex flex-col flex-1 gap-6 transition-opacity duration-700 ease-in-out animate-fade-in max-w-[850px]">
          <div
            ref={slideContainerRef}
            className="relative flex justify-center items-center rounded-3xl shadow-xl transition-all duration-700 ease-in-out backdrop-blur bg-gradient-to-tr from-white via-blue-50 to-blue-100 border border-blue-100 h-[600px] p-8"
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
          </div>

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
