import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Maximize } from "lucide-react"; // Full-screen icon
import { franc } from "franc-min"; // Language detection library

type Slide = {
  image: string;
  text: string;
};

export function ShowSlide() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false); // Track full-screen state
  const [isPlaying, setIsPlaying] = useState(false); // Track if TTS is playing
  const navigate = useNavigate();
  const location = useLocation();
  const slideContainerRef = useRef<HTMLDivElement>(null);

  // Load slides from navigation state (for initial load)
  useEffect(() => {
    if (location.state?.slides) {
      setSlides(location.state.slides);
      setCurrentSlide(0);
    } else {
      setSlides([]);
    }
  }, [location.state]);

  // Sync full-screen state with browser
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullScreen(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Detect language and find the corresponding voice
  const detectLanguageAndGetVoice = (text: string): SpeechSynthesisVoice | null => {
    const languageCodeMap: Record<string, string> = {
      fra: "fr-FR", // French
      eng: "en-US", // English
      spa: "es-ES", // Spanish
      deu: "de-DE", // German
      ita: "it-IT", // Italian
      por: "pt-PT", // Portuguese
    };

    const detectedLangCode = franc(text) || "eng"; // Default to English if language is unknown
    const matchedLang = languageCodeMap[detectedLangCode] || "en-US"; // Map to a supported language

    const voices = window.speechSynthesis.getVoices();
    return voices.find((voice) => voice.lang === matchedLang) || null; // Return matching voice or null
  };

  // SpeechSynthesis instance
  const speakSlideText = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = detectLanguageAndGetVoice(text);
      if (voice) {
        utterance.voice = voice;
      }

      window.speechSynthesis.cancel(); // Stop any ongoing speech
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);

      // Stop playing when finished
      utterance.onend = () => {
        setIsPlaying(false);
      };
    } else {
      console.error("Text-to-Speech not supported in this browser.");
    }
  };

  // Stop TTS
  const pauseTTS = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    }
  };

  // Resume TTS
  const resumeTTS = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
    }
  };

  // Handle navigation to the upload section on the home page
  const navigateToUpload = () => {
    navigate("/"); // Navigate to the home page
    setTimeout(() => {
      const uploadSection = document.getElementById("upload");
      if (uploadSection) {
        uploadSection.scrollIntoView({ behavior: "smooth" }); // Scroll to upload section
      }
    }, 100); // Short delay to ensure page loads
  };

  // Start narration on Enter and handle navigation with keyboard arrows
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && slides.length > 0) {
        speakSlideText(slides[currentSlide].text);
      }
      if (event.key === "ArrowRight" && currentSlide < slides.length - 1) {
        setCurrentSlide((prev) => prev + 1);
        speakSlideText(slides[currentSlide + 1]?.text);
      }
      if (event.key === "ArrowLeft" && currentSlide > 0) {
        setCurrentSlide((prev) => prev - 1);
        speakSlideText(slides[currentSlide - 1]?.text);
      }
      if (event.key === " " && slides.length > 0) {
        event.preventDefault(); // Prevent scrolling
        if (isPlaying) {
          pauseTTS();
        } else {
          resumeTTS();
        }
      }
      if (event.key === "Escape" && isFullScreen) {
        document.exitFullscreen(); // Exit fullscreen
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide, slides, isPlaying, isFullScreen]);

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
              <div
                className="flex items-center cursor-pointer"
                onClick={() => navigate("/")}
              >
                <span className="text-xl font-bold text-gray-800">PresentPro</span>
              </div>
              <div className="flex items-center space-x-8">
                <button
                  onClick={navigateToUpload} // Navigate to upload section
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium cursor-pointer"
                >
                  Upload a New Presentation
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}

      <main className={`pt-24 ${isFullScreen ? "pt-0" : ""}`}>
        <div className="mt-8 max-w-4xl mx-auto">
          <div
            ref={slideContainerRef}
            className="relative w-full h-auto"
            style={{
              height: isFullScreen ? "100vh" : "500px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {slides.length > 0 ? (
              <img
                src={slides[currentSlide].image}
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

            {slides.length > 0 && (
              <>
                <button
                  onClick={() => {
                    if (currentSlide > 0) {
                      setCurrentSlide((prev) => prev - 1);
                      speakSlideText(slides[currentSlide - 1]?.text);
                    }
                  }}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-600 text-white p-2 rounded-full shadow-md hover:bg-gray-700"
                >
                  &#8592;
                </button>
                <button
                  onClick={() => {
                    if (currentSlide < slides.length - 1) {
                      setCurrentSlide((prev) => prev + 1);
                      speakSlideText(slides[currentSlide + 1]?.text);
                    }
                  }}
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
