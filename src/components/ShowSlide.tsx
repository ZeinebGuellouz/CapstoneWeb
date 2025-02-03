import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Maximize } from "lucide-react";
import { franc } from "franc-min";

type Slide = {
  image: string;
  text: string;
};

export function ShowSlide() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const currentSlideRef = useRef(currentSlide);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (location.state?.slides) {
      setSlides(location.state.slides);
      setCurrentSlide(0);
    } else {
      setSlides([]);
    }
  }, [location.state]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    currentSlideRef.current = currentSlide;
  }, [currentSlide]);

  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const detectLanguageAndGetVoice = (text: string): SpeechSynthesisVoice | null => {
    const languageCodeMap: Record<string, string> = {
      fra: "fr-FR",
      eng: "en-US",
      spa: "es-ES",
      deu: "de-DE",
      ita: "it-IT",
      por: "pt-PT",
    };
    const detectedLangCode = franc(text) || "eng";
    const matchedLang = languageCodeMap[detectedLangCode] || "en-US";
    const voices = window.speechSynthesis.getVoices();
    return voices.find((voice) => voice.lang === matchedLang) || null;
  };

  const speakSlideText = (text: string) => {
    if ("speechSynthesis" in window) {
      if (paused && utteranceRef.current) {
        window.speechSynthesis.resume();
        setPaused(false);
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = detectLanguageAndGetVoice(text);
      if (voice) utterance.voice = voice;
      utterance.onend = () => setIsPlaying(false);
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  const toggleTTS = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setPaused(true);
    } else {
      speakSlideText(slides[currentSlide]?.text);
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && slides.length > 0) {
        speakSlideText(slides[currentSlideRef.current]?.text);
      }
      if (event.key === "ArrowRight" && currentSlideRef.current < slides.length - 1) {
        setCurrentSlide((prev) => prev + 1);
        window.speechSynthesis.cancel();
        speakSlideText(slides[currentSlideRef.current + 1]?.text);
        speakSlideText(slides[currentSlideRef.current + 1]?.text);
      }
      if (event.key === "ArrowLeft" && currentSlideRef.current > 0) {
        setCurrentSlide((prev) => prev - 1);
        window.speechSynthesis.cancel();
        speakSlideText(slides[currentSlideRef.current - 1]?.text);
        speakSlideText(slides[currentSlideRef.current - 1]?.text);
      }
      if (event.key === " " && slides.length > 0) {
        event.preventDefault();
        toggleTTS();
      }
      if (event.key === "Escape" && isFullScreen) {
        document.exitFullscreen();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [slides, isPlaying, isFullScreen]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement && slideContainerRef.current) {
      slideContainerRef.current.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  return (
    <div className={`min-h-screen ${isFullScreen ? "bg-black" : "bg-gray-50"}`}>
      {!isFullScreen && (
        <nav className="bg-white shadow-lg fixed w-full z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
            <span className="text-xl font-bold text-gray-800 cursor-pointer" onClick={() => navigate("/", { state: { scrollToUpload: true } })}>PresentPro</span>
            <button onClick={() => navigate("/", { state: { scrollToUpload: true } })} className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium cursor-pointer">Upload a New Presentation</button>
          </div>
        </nav>
      )}
      <main className={`pt-24 ${isFullScreen ? "pt-0" : ""}`}>
        <div className="mt-8 max-w-4xl mx-auto">
          <div ref={slideContainerRef} className="relative w-full flex items-center justify-center" style={{ height: isFullScreen ? "100vh" : "500px" }}>
            {slides.length > 0 ? (
              <img src={slides[currentSlide].image} alt={`Slide ${currentSlide + 1}`} className="max-w-full max-h-full object-contain" />
            ) : (
              <p className="text-gray-500">No slides available. Please upload a presentation.</p>
            )}
            <button onClick={toggleFullScreen} className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md hover:bg-gray-100"><Maximize className="h-6 w-6 text-gray-800" /></button>
          </div>
        </div>
      </main>
    </div>
  );
}
