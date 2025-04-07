import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ChevronLeft, Pause, Play } from "lucide-react";
import { Slide } from "../types";

interface PresentationModeProps {
  slides: Slide[];
  currentIndex: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  speeches: { [key: number]: string };
  voiceTone: string;
  speed: number;
  pitch: number;
  toggleFullScreen: () => void;
}

const PresentationMode = ({
  slides,
  currentIndex,
  setCurrentIndex,
  speeches,
  speed,
  pitch,
}: PresentationModeProps) => {
  const [showControls, setShowControls] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const [exitingFullScreen, setExitingFullScreen] = useState(false);

  useEffect(() => {
    const show = () => {
      setShowControls(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    };
    window.addEventListener("mousemove", show);
    window.addEventListener("keydown", show);
    return () => {
      window.removeEventListener("mousemove", show);
      window.removeEventListener("keydown", show);
    };
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setExitingFullScreen(true);
        document.exitFullscreen().catch(console.error);
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && exitingFullScreen) {
        synthRef.current.cancel();
        navigate("/viewer?presentationId=" + slides[0]?.presentationId);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [navigate, slides, exitingFullScreen]);

  useEffect(() => {
    if (isPlaying) {
      speakCurrentSlide();
    }
  }, [currentIndex, isPlaying]);

  const speakCurrentSlide = () => {
    const text = speeches[currentIndex] || slides[currentIndex]?.text || "";
    if (!text.trim()) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(" " + text);
    utterance.pitch = pitch;
    utterance.rate = speed;
    utterance.onend = () => handleNext();
    utterance.onerror = () => handleNext();
    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
    synthRef.current.cancel();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <img
        src={slides[currentIndex]?.image}
        alt={slides[currentIndex]?.title}
        className="max-h-full max-w-full object-contain"
      />
      {showControls && (
        <div className="absolute bottom-8 w-full flex justify-center gap-4">
          <button onClick={handlePrev} className="bg-white px-4 py-2 rounded shadow">
            <ChevronLeft className="inline mr-1" /> Previous
          </button>
          {isPlaying ? (
            <button onClick={handlePause} className="bg-green-600 text-white px-4 py-2 rounded shadow">
              <Pause className="inline mr-1" /> Pause
            </button>
          ) : (
            <button onClick={handlePlay} className="bg-green-600 text-white px-4 py-2 rounded shadow">
              <Play className="inline mr-1" /> Start
            </button>
          )}
          <button onClick={handleNext} className="bg-white px-4 py-2 rounded shadow">
            <ChevronRight className="inline mr-1" /> Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PresentationMode;
