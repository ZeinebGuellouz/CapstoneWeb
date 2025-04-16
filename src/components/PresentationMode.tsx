import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Fullscreen, Play, Pause, MessageCircle, X } from "lucide-react";
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
  const [showQAInput, setShowQAInput] = useState(false);
  const [question, setQuestion] = useState("");
  const [isAnswering, setIsAnswering] = useState(false);
  const [answer, setAnswer] = useState("");
  const [qaHistory, setQaHistory] = useState<{ question: string, answer: string }[]>([]);
  const [voicesReady, setVoicesReady] = useState(false);


  const currentSlide = slides[currentIndex];
  const text = speeches[currentIndex] || currentSlide?.text || "";

  const speakAnswer = (answer: string, callback?: () => void) => {
    const utterance = new SpeechSynthesisUtterance(answer);
    utterance.pitch = pitch;
    utterance.rate = speed;
  
    const matchedVoice = voices.find((v) => v.name === selectedVoice);
    if (matchedVoice) utterance.voice = matchedVoice;
  
    utterance.onend = () => {
      if (callback) callback();
    };
  
    synthRef.current.speak(utterance);
  };
  
  const handleAskQuestion = async () => {
    if (!question.trim()) return;
  
    pause(); // Pause slide speech
    setIsAnswering(true);
  
    const fullPresentationText = slides
      .map((s) => speeches[s.slideNumber] || s.text || "")
      .join("\n");
  
    console.log("🤖 Sending question to backend:", question);
    console.log("📄 Full presentation context being analyzed:", fullPresentationText);
  
    try {
      const res = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slide_text: fullPresentationText,
          question: question
        })
      });
  
      const data = await res.json();
      if (data.answer) {
        console.log("🧠 AI Answer:", data.answer);
        setAnswer(data.answer);
        setQaHistory((prev) => [...prev, { question, answer: data.answer }]);
  
        // ✅ Spinner disappears immediately, answer shows up now
        setIsAnswering(false);
  
        speakAnswer(data.answer, () => {
          resume(); // Resume slide speech after AI finishes speaking
        });
      } else {
        console.warn("⚠️ No answer received from backend.");
        setIsAnswering(false);
        resume();
      }
    } catch (err) {
      console.error("❌ Failed to get answer:", err);
      setIsAnswering(false);
      resume();
    }
  
    setShowQAInput(false);
    setQuestion("");
  };
  

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoices(voices);
        setVoicesReady(true);
        console.log("✅ Voices loaded:", voices.map(v => v.name));
      } else {
        console.warn("🕐 Voices not ready. Retrying...");
        setTimeout(loadVoices, 300); // retry after 300ms
      }
    };
  
    // First set up the listener, then call once
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
  
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
    
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.closest("input, textarea")
      ) return;
    
      switch (e.key) {
        case "ArrowRight":
          goNext();
          break;
        case "ArrowLeft":
          goBack();
          break;
        case "Escape":
          exitFullScreen();
          break;
        case "Enter": {
            const availableVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
            if (availableVoices.length > 0) {
              if (voices.length === 0) {
                setVoices(availableVoices); // Patch state if not yet updated
              }
              console.log("🔑 Enter pressed - Starting playback");
              shouldAutoPlayRef.current = true;
              setIsPlayAll(true);
                playCurrentSlide(); // Removed the argument as playCurrentSlide does not accept parameters
            } else {
              console.warn("🕐 Voices not loaded yet. Aborting.");
            }
            break;
          }
          
          
          
        case " ":
          e.preventDefault();
          if (isSpeaking && !isPaused) pause();
          else if (isPaused) resume();
          else playCurrentSlide();
          break;
        default:
          break;
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
  
  useEffect(() => {
    if (voicesReady && shouldAutoPlayRef.current) {
      console.log("✅ Voices now ready, auto-starting playback...");
      playCurrentSlide();
    }
  }, [voicesReady]);
  

  const playCurrentSlide = (overrideVoices?: SpeechSynthesisVoice[]) => {
    if (!text.trim()) {
      console.warn("⚠️ Slide text is empty. Skipping...");
      return;
    }
  
    const availableVoices = overrideVoices?.length
      ? overrideVoices
      : voices.length
      ? voices
      : window.speechSynthesis.getVoices();
  
    if (!availableVoices.length) {
      console.warn("🕐 Voices not loaded yet. Aborting playback.");
      return;
    }
  
    if (voices.length === 0 && availableVoices.length > 0) {
      setVoices(availableVoices); // patch global voices state if needed
    }
  
    const paddedText = "\u00A0" + text;
    const utterance = new SpeechSynthesisUtterance(paddedText);
    utterance.pitch = pitch;
    utterance.rate = speed;
  
    const matchedVoice = availableVoices.find((v) => v.name === selectedVoice);
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
        shouldAutoPlayRef.current = false;
      }
    };
  
    utterance.onerror = (e) => {
      console.error("❌ Speech error:", e.error);
      setIsSpeaking(false);
      setIsPaused(false);
    };
  
    currentUtteranceRef.current = utterance;
    synthRef.current.cancel();
    const dummy = new SpeechSynthesisUtterance(".");
    dummy.volume = 0;
    synthRef.current.speak(dummy);
  
    setTimeout(() => {
      synthRef.current.speak(utterance);
    }, 150);
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
      className="fixed inset-0 bg-gradient-to-b from-black to-gray-900 text-white flex flex-col items-center justify-center overflow-hidden"
      onClick={() => setShowControls(true)}
    >
      {/* Slide content */}
      <div className="relative w-full h-full flex items-center justify-center">
        {currentSlide && (
          <div className="w-full h-full flex items-center justify-center relative">
            <img
              src={currentSlide.image}
              alt={currentSlide.title}
              className="w-full h-full object-contain m-0 p-0 transition-opacity duration-300 ease-in-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60 pointer-events-none"></div>
          </div>
        )}
      </div>
      
      {/* Animated gradient progress bar at the top */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-800/30">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-500 ease-out rounded-r-full"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-0 h-1.5 w-1.5 bg-white rounded-full animate-pulse"></div>
        </div>
      </div>
      
      {/* Controls container that fades in/out */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Navigation buttons */}
        <button
          onClick={(e) => { e.stopPropagation(); goBack(); }}
          className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 p-5 rounded-full backdrop-blur-lg border border-white/10 pointer-events-auto transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-purple-500/20"
          disabled={currentIndex === 0}
        >
          <ChevronLeft className={`w-7 h-7 text-white ${currentIndex === 0 ? 'opacity-50' : 'opacity-100'}`} />
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 p-5 rounded-full backdrop-blur-lg border border-white/10 pointer-events-auto transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-purple-500/20"
          disabled={currentIndex === slides.length - 1}
        >
          <ChevronRight className={`w-7 h-7 text-white ${currentIndex === slides.length - 1 ? 'opacity-50' : 'opacity-100'}`} />
        </button>
        
        {/* Bottom controls bar */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-lg border border-white/10 px-8 py-4 rounded-2xl flex items-center gap-6 pointer-events-auto shadow-2xl shadow-purple-500/10">
          {/* Slide counter */}
          <div className="text-sm font-medium flex items-center gap-1">
            <span className="text-lg font-semibold">{currentIndex + 1}</span> 
            <span className="text-gray-400 text-xs">/ {slides.length}</span>
          </div>
          
          {/* Divider */}
          <div className="h-8 w-px bg-white/10"></div>
          
          {/* Voice controls */}
          <div className="flex items-center gap-4">
            <button 
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="p-3 hover:bg-white/10 rounded-full transition-all duration-300 hover:scale-105 relative"
            >
              {isSpeaking && !isPaused ? (
                <Pause className="w-5 h-5 text-blue-400" />
              ) : (
                <Play className="w-5 h-5 text-blue-400" />
              )}
              {isSpeaking && !isPaused && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
              )}
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                pause();
                setShowQAInput(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 text-sm font-medium shadow-md hover:shadow-blue-500/20"
            >
              <MessageCircle className="w-4 h-4" />
              Ask a Question
            </button>
          </div>
          
          {/* Divider */}
          <div className="h-8 w-px bg-white/10"></div>
          
          {/* Exit fullscreen button */}
          <button 
            onClick={(e) => { e.stopPropagation(); exitFullScreen(); }}
            className="p-3 hover:bg-white/10 rounded-full transition-all duration-300"
          >
            <Fullscreen className="w-5 h-5" />
          </button>
        </div>
        
        {/* Speaking status overlay */}
        {isSpeaking && (
          <div className="absolute top-8 right-8 bg-black/50 backdrop-blur-lg border border-white/10 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 pointer-events-auto shadow-lg">
            <span className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-blue-500 animate-pulse'}`}></span>
            {isPaused ? "Audio Paused" : "Speaking"}
          </div>
        )}
      </div>

      {/* Question input modal */}
      {showQAInput && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={(e) => e.stopPropagation()}>
          <div className="bg-gray-900/80 border border-indigo-500/20 p-6 rounded-2xl shadow-2xl max-w-xl w-full animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Ask About This Slide</h3>
              <button
                onClick={() => {
                  setShowQAInput(false);
                  setAnswer("");
                  resume();
                }}
                className="p-1 hover:bg-white/10 rounded-full transition-all"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your question..."
              className="w-full px-4 py-3 rounded-xl bg-black/40 text-white border border-indigo-500/30 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all mb-4"
              autoFocus
            />
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowQAInput(false);
                  setAnswer("");
                  resume();
                }}
                className="px-4 py-2 rounded-xl border border-gray-700 hover:bg-gray-800 transition-all text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowQAInput(false);
                  setAnswer("");
                  setIsAnswering(true);
                  handleAskQuestion();
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-medium shadow-md"
              >
                Ask
              </button>
            </div>
            
            {qaHistory.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Previous Q&A</h4>
                <div className="mt-2 text-white bg-black/40 px-4 py-3 rounded-xl text-sm max-h-48 overflow-y-auto space-y-3 border border-white/5">
                  {qaHistory.map((qa, idx) => (
                    <div key={idx} className="pb-3 border-b border-white/5 last:border-0">
                      <p className="font-medium text-indigo-300">Q: {qa.question}</p>
                      <p className="mt-1 text-gray-300">A: {qa.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Answer loading state */}
      {isAnswering && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900/80 border border-indigo-500/20 p-6 rounded-2xl shadow-2xl max-w-md w-full animate-fade-in text-center">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-t-2 border-r-2 border-indigo-500 rounded-full animate-spin"></div>
              <p className="text-lg font-medium text-white">Thinking about your question...</p>
              <p className="text-sm text-gray-400">Analyzing slide content for a relevant answer</p>
            </div>
          </div>
        </div>
      )}

      {/* Answer display */}
      {answer && !showQAInput && !isAnswering && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-lg border border-indigo-500/30 p-4 rounded-xl max-w-lg w-full shadow-2xl animate-fade-in">
          <p className="text-sm text-white">{answer}</p>
          <button
            onClick={() => setAnswer("")}
            className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded-full transition-all"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      )}
    </div>
  );
}
