import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Fullscreen, Play, Pause} from "lucide-react";
import { Slide } from "../types";

interface Props {
  slides: Slide[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  speeches: { [key: number]: string };
  voiceTone: string;
  speed: number;
  pitch: number;
  toggleFullScreen: () => void;
  selectedVoice: string;
}

export default function PresentationMode({
  slides,
  currentIndex,
  setCurrentIndex,
  speeches,
  speed,
  pitch,
  toggleFullScreen,
  selectedVoice,
}: Props) {
  const synthRef = useRef(window.speechSynthesis);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const shouldAutoPlayRef = useRef(false);

  const [isPaused, setIsPaused] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPlayAll, setIsPlayAll] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showControls, setShowControls] = useState(true);

  const currentSlide = slides[currentIndex];
  const text = speeches[currentIndex] || currentSlide?.text || "";

  useEffect(() => {
    const loadVoices = () => {
      const loadedVoices = window.speechSynthesis.getVoices();
      if (loadedVoices.length) {
        setVoices(loadedVoices);
        console.log("✅ Voices loaded in fullscreen:", loadedVoices.map(v => v.name));
      }
    };
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    // Hide controls after 3 seconds of inactivity
    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setTimeout(() => {
      window.focus();
      document.body.click();
    }, 300);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      setShowControls(true);
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goBack();
      if (e.key === "Escape") exitFullScreen();
      if (e.key === "Enter") {
        shouldAutoPlayRef.current = true;
        setIsPlayAll(true);
        playCurrentSlide();
      }
      if (e.key === " ") {
        e.preventDefault();
        if (isSpeaking && !isPaused) pause();
        else if (isPaused) resume();
        else playCurrentSlide();
      }
    };
    
    const handleMouseMove = () => {
      setShowControls(true);
      // Reset the timeout when mouse moves
      const timer = setTimeout(() => setShowControls(false), 3000);
      return () => clearTimeout(timer);
    };
    
    window.addEventListener("keydown", handleKey);
    window.addEventListener("mousemove", handleMouseMove);
    
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [currentIndex, isSpeaking, isPaused]);

  useEffect(() => {
    if (shouldAutoPlayRef.current && voices.length > 0) {
      playCurrentSlide();
    }
  }, [currentIndex, voices]);
    

  const playCurrentSlide = () => {
    if (!text.trim()) {
      console.warn("⚠️ Slide text is empty. Skipping...");
      return;
    }

    if (!voices.length) {
      console.warn("🕐 Voices not loaded yet. Aborting playback.");
      return;
    }

    const paddedText = "\u00A0" + text; // Non-breaking space fixes first word cut
    const utterance = new SpeechSynthesisUtterance(paddedText);
    utterance.pitch = pitch;
    utterance.rate = speed;

    const matchedVoice = voices.find((v) => v.name === selectedVoice);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => {
      console.log("🔊 Speech started");
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    
      if (shouldAutoPlayRef.current && currentIndex < slides.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        shouldAutoPlayRef.current = false; // Stop only after last slide
      }
    };
    

    utterance.onerror = (e) => {
      console.error("❌ Speech error:", e.error);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    currentUtteranceRef.current = utterance;

    // Fix: speak dummy silent utterance first, then the real one
    synthRef.current.cancel(); // Clear any queued speech
    const dummy = new SpeechSynthesisUtterance(".");
    dummy.volume = 0;
    synthRef.current.speak(dummy);

    setTimeout(() => {
      synthRef.current.speak(utterance);
    }, 150); // Let dummy flush first
  };

  const pause = () => {
    synthRef.current.pause();
    setIsPaused(true);
  };

  const resume = () => {
    synthRef.current.resume();
    setIsPaused(false);
  };

  const goNext = () => {
    synthRef.current.cancel();
    setIsPlayAll(false);
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goBack = () => {
    synthRef.current.cancel();
    setIsPlayAll(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const exitFullScreen = () => {
    synthRef.current.cancel();
    setIsPlayAll(false);
    toggleFullScreen();
  };

 

  const togglePlay = () => {
    if (isSpeaking) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else {
      shouldAutoPlayRef.current = true;
      playCurrentSlide();
    }
  };
  

 

  // Calculate progress for progress bar
  const progress = ((currentIndex + 1) / slides.length) * 100;
  
  return (
    <div 
      className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center overflow-hidden"
      onClick={() => setShowControls(true)}
    >
      {/* Slide content */}
      <div className="relative w-full h-full flex items-center justify-center">
        {currentSlide && (
          <img
            src={currentSlide.image}
            alt={currentSlide.title}
            className="w-full h-full object-contain m-0 p-0"
          />
        )}
      </div>
      
      {/* Animated gradient progress bar at the top */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gray-800">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {/* Controls container that fades in/out */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Navigation buttons */}
        <button
          onClick={(e) => { e.stopPropagation(); goBack(); }}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 p-4 rounded-full backdrop-blur-sm border border-white/10 pointer-events-auto transition-all duration-200 hover:scale-110"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 p-4 rounded-full backdrop-blur-sm border border-white/10 pointer-events-auto transition-all duration-200 hover:scale-110"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
        
        {/* Bottom controls bar */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/40 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full flex items-center gap-4 pointer-events-auto">
          {/* Slide counter */}
          <div className="text-sm font-medium mr-2">
            {currentIndex + 1} <span className="text-gray-400">/ {slides.length}</span>
          </div>
          
          {/* Divider */}
          <div className="h-6 w-px bg-white/20"></div>
          
          {/* Voice controls */}
          <div className="flex items-center gap-2">
            {isSpeaking ? (
              isPaused ? (
                <button 
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <Play className="w-5 h-5 text-green-400" />
                </button>
              ) : (
                <button 
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <Pause className="w-5 h-5 text-green-400" />
                </button>
              )
            ) : (
              <button 
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <Play className="w-5 h-5" />
              </button>
            )}
            
           
            
           
          </div>
          
          {/* Divider */}
          <div className="h-6 w-px bg-white/20"></div>
          
          {/* Exit fullscreen button */}
          <button 
            onClick={(e) => { e.stopPropagation(); exitFullScreen(); }}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <Fullscreen className="w-5 h-5" />
          </button>
        </div>
        
        {/* Speaking status overlay */}
        {isSpeaking && (
          <div className="absolute top-6 right-6 bg-black/40 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 pointer-events-auto">
            <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`}></span>
            {isPaused ? "Audio Paused" : "Speaking"}
          </div>
        )}
      </div>
    </div>
  );
}
