import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  }, []);

  useEffect(() => {
    setTimeout(() => {
      window.focus();
      document.body.click();
    }, 300);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
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
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentIndex, isSpeaking, isPaused]);

  useEffect(() => {
    if (shouldAutoPlayRef.current && isPlayAll && !isPaused && voices.length > 0) {
      shouldAutoPlayRef.current = false;
      playCurrentSlide();
    }
  }, [currentIndex, isPlayAll, isPaused, voices]);

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
      console.log("✅ Speech ended");
      setIsSpeaking(false);
      setIsPaused(false);
      if (isPlayAll && currentIndex < slides.length - 1) {
        shouldAutoPlayRef.current = true;
        setCurrentIndex(currentIndex + 1);
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

  return (
    <div className="fixed inset-0 bg-black text-white flex items-center justify-center overflow-hidden">
      {currentSlide && (
        <img
          src={currentSlide.image}
          alt={currentSlide.title}
          className="w-full h-full object-contain m-0 p-0"
        />
      )}

      <button
        onClick={goBack}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 p-3 rounded-full"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>

      <button
        onClick={goNext}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 p-3 rounded-full"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      <div className="absolute bottom-6 text-sm text-white bg-white/10 px-4 py-2 rounded-xl">
        Slide {currentIndex + 1} / {slides.length}
        {isSpeaking && (
          <span className="ml-4 text-green-400">
            {isPaused ? "⏸️ Paused" : "🔊 Speaking"}
          </span>
        )}
      </div>
    </div>
  );
}
