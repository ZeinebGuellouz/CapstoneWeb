import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Fullscreen, Play, Pause, MessageCircle, X, Mic, MicOff } from "lucide-react";
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
  const lottieRef = useRef<any>(null);
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
  const [avatarPulse] = useState(false); // For avatar speaking animation
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // @ts-ignore
   const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
   const recognition = useRef<any>(null);
   const [isListening, setIsListening] = useState(false);


  const currentSlide = slides[currentIndex];
  const text = speeches[currentIndex] || currentSlide?.text || "";
  

  useEffect(() => {
    if (!SpeechRecognition) {
      console.warn("🧠 SpeechRecognition not supported on this browser.");
      return;
    }

    const recog = new SpeechRecognition();
    recog.lang = "en-US";
    recog.continuous = true;
    recog.interimResults = true;

    recog.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          setQuestion(transcript);
        }
      }
      if (finalTranscript) {
        setQuestion(finalTranscript);
      }
    };

    recog.onerror = (event: any) => {
      console.error("❌ Speech recognition error:", event.error);
      setIsAnswering(false);
      setIsListening(false);
    };

    recognition.current = recog;
  }, []);

 const toggleMic = () => {
    if (!isListening) {
      recognition.current?.start();
      setIsListening(true);
    } else {
      recognition.current?.stop();
      setIsListening(false);
    }
  };

  useEffect(() => {
    if (!lottieRef.current) return;
  
    if (isSpeaking && !isPaused) {
      console.log("▶️ Playing Lottie animation");
      lottieRef.current.play();
    } else {
      console.log("⏸ Stopping Lottie animation");
      lottieRef.current.stop(); // or .pause() if smoother
    }
  }, [isSpeaking, isPaused]);

  
  

  const speakAnswer = (answer: string, callback?: () => void) => {
    const loadedVoices = window.speechSynthesis.getVoices();
    const finalVoices = voices.length ? voices : loadedVoices;
    const matchedVoice = finalVoices.find((v) => v.name === selectedVoice);
  
    console.log("🗣 Speaking with voice:", matchedVoice?.name || "default", "| Answer:", answer);
  
    const utterance = new SpeechSynthesisUtterance(answer);
    utterance.pitch = pitch;
    utterance.rate = speed;
  
    if (matchedVoice) utterance.voice = matchedVoice;
  
    utterance.onend = () => {
      console.log("✅ Finished speaking answer.");
      if (callback) callback();
    };
  
    utterance.onerror = (e) => {
      console.error("❌ Error during answer speech:", e.error);
      if (callback) callback(); // fallback resume
    };
  
    synthRef.current.cancel(); // 🛑 kill previous speech
    synthRef.current.speak(utterance);
  };
  
  const handleAskQuestion = async (overrideQuestion?: string) => {
    const userQuestion = overrideQuestion || question;
    if (!userQuestion.trim()) return;
  
    pause(); // pause speech
    setIsAnswering(true);
  
    const fullPresentationText = slides.map((s) => speeches[s.slideNumber] || s.text || "").join("\n");
  
    try {
      const res = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slide_text: fullPresentationText,
          question: userQuestion
        }),
      });
  
      const data = await res.json();
  
      if (data.answer) {
        setAnswer(data.answer);
        setQaHistory((prev) => [...prev, { question: userQuestion, answer: data.answer }]);
      
        const waitAndSpeak = () => {
          if (!voicesReady) {
            console.log("🕐 Voices not ready yet, retrying...");
            setTimeout(waitAndSpeak, 200);
            return;
          }
          speakAnswer(data.answer, () => resume());
        };
      
        waitAndSpeak();
      } else {
        resume();
      }
      
    } catch (err) {
      console.error("❌ Failed to get answer:", err);
      resume();
    }
    setIsListening(false);   
    setIsAnswering(false);
    setShowQAInput(false);
    setQuestion("");
  };
  
  useEffect(() => {
    const loadVoices = () => {
      const loadedVoices = window.speechSynthesis.getVoices();
      if (loadedVoices.length > 0) {
        setVoices(loadedVoices);
        setVoicesReady(true);
        console.log("✅ Voices loaded:", loadedVoices.map(v => v.name));
      } else {
        console.warn("🕐 Voices not ready. Retrying...");
        setTimeout(loadVoices, 300);
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
            setIsSpeaking(true); // ✅ Start avatar animation immediately
            setIsPaused(false);  // ✅ Ensure paused state is false
            playCurrentSlide();  // 🔈 Start reading the slide aloud
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
  
  useEffect(() => {
    if (isSpeaking && !isPaused && lottieRef.current) {
      console.log("🔄 Slide changed during speech. Restarting animation.");
      lottieRef.current.goToAndPlay(0, true);
    }
  }, [currentIndex]);
  useEffect(() => {
    if (isSpeaking && !isPaused && lottieRef.current) {
      console.log("🔥 Ensuring avatar animation plays on slide", currentIndex);
      lottieRef.current.goToAndPlay(0, true);
    }
  }, [isSpeaking, isPaused, currentIndex]);
  
  
  
  const playCurrentSlide = async (overrideVoices?: SpeechSynthesisVoice[]) => {
    if (!text.trim()) {
      console.warn("⚠️ Slide text is empty. Skipping...");
      return;
    }
  
    const loadedVoices = window.speechSynthesis.getVoices();
    if (!voicesReady || loadedVoices.length === 0) {
      console.warn("🕐 Voices not ready. Aborting playback.");
      return;
    }
  
    const availableVoices = overrideVoices?.length
      ? overrideVoices
      : voices.length
      ? voices
      : loadedVoices;
  
    if (voices.length === 0 && availableVoices.length > 0) {
      setVoices(availableVoices);
    }
  
    const paddedText = "\u00A0" + text;
    const utterance = new SpeechSynthesisUtterance(paddedText);
    utterance.pitch = pitch;
    utterance.rate = speed;
  
    const matchedVoice = availableVoices.find((v) => v.name === selectedVoice);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
      console.log("🎙 Using voice:", matchedVoice.name);
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
    await new Promise(resolve => {
      const check = () => {
        if (!synthRef.current.speaking) resolve(null);
        else setTimeout(check, 50);
      };
      check();
    });
    
    synthRef.current.speak(utterance);
    
    if (lottieRef.current) {
      console.log("🎬 Manually triggering avatar animation...");
      lottieRef.current.goToAndPlay(0, true);
      lottieRef.current.play();
    }
    
  };
  
  
  const pause = () => {
    synthRef.current.pause();
    setIsPaused(true);
    videoRef.current?.pause();
  };
  

  const resume = () => {
    synthRef.current.resume();
    setIsPaused(false);
    videoRef.current?.play();
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

  const progress = ((currentIndex + 1) / slides.length) * 100;
  
  return (
    <div 
      className="fixed inset-0 bg-gradient-to-b from-[#1A1F2C] via-[#0F172A] to-black text-white flex flex-col items-center justify-center overflow-hidden"
      onClick={() => setShowControls(true)}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-[#1EAEDB] blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-40 right-1/4 w-80 h-80 rounded-full bg-[#9b87f5] blur-[100px] animate-pulse" 
               style={{animationDelay: '1s', animationDuration: '4s'}}></div>
          <div className="absolute top-1/3 right-1/3 w-64 h-64 rounded-full bg-[#7E69AB] blur-[150px] animate-pulse"
               style={{animationDelay: '2s', animationDuration: '5s'}}></div>
        </div>
      </div>
      
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDUgTCAyMCA1IE0gNSAwIEwgNSAyMCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50"></div>
      
      <div className="relative w-full h-full flex items-center justify-center z-10">
        {currentSlide && (
          <div className="w-full h-full flex items-center justify-center relative">
            <img
              src={currentSlide.image}
              alt={currentSlide.title}
              className="w-full h-full object-contain m-0 p-0 transition-opacity duration-300 ease-in-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 pointer-events-none"></div>
          </div>
        )}
      </div>
      
      {isSpeaking && (
        <div className={`absolute bottom-28 right-12 transition-all duration-500 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-90 translate-y-4'} z-30`}>
          <div className={`relative ${avatarPulse ? 'scale-105' : 'scale-100'} transition-transform duration-300`}>
            <div className="relative rounded-full overflow-hidden shadow-lg shadow-[#1EAEDB]/20">
              <video
                ref={videoRef}
                src="/videos/avatar.mp4"
                autoPlay
                loop
                muted
                playsInline
                className={`h-60 w-40 object-cover transition-all duration-500
                ${isPaused ? 'grayscale opacity-80' : 'grayscale-0 opacity-100'}
                `}
              />
            </div>
            
            {isSpeaking && !isPaused && (
              <div className="absolute -bottom-2 -right-2 flex items-center justify-center">
                <span className="relative flex h-8 w-8">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1EAEDB] opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-8 w-8 bg-[#1EAEDB] items-center justify-center">
                    <div className="flex space-x-1">
                      <div className="w-1 h-3 bg-white rounded-full animate-pulse" style={{animationDelay: '0ms'}}></div>
                      <div className="w-1 h-4 bg-white rounded-full animate-pulse" style={{animationDelay: '150ms'}}></div>
                      <div className="w-1 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '300ms'}}></div>
                    </div>
                  </span>
                </span>
              </div>
            )}
            
            {isPaused && (
              <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30">
                <div className="flex space-x-1.5">
                  <div className="w-1 h-4 bg-white rounded-sm"></div>
                  <div className="w-1 h-4 bg-white rounded-sm"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="absolute top-0 left-0 w-full h-1.5 bg-[#0000001a] z-20">
        <div 
          className="h-full bg-gradient-to-r from-[#1EAEDB] via-[#9b87f5] to-[#7E69AB] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-0 h-1.5 w-1.5 bg-white rounded-full animate-pulse"></div>
          <div className="absolute right-0 -bottom-1 h-3 w-[2px] bg-white/50 blur-sm"></div>
        </div>
      </div>
      
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'} z-20`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isListening) {
              recognition.current?.start();
              setIsListening(true);
              pause(); // optional
            } else {
              recognition.current?.stop();
              setIsListening(false);
            }
          }}
          className={`p-3 rounded-full transition-all duration-300 hover:scale-105 relative group ${isListening ? 'bg-red-600/30' : 'bg-[#1EAEDB]/10'}`}
        >
          {isListening ? (
            <MicOff className="w-5 h-5 text-red-400 group-hover:text-white" />
          ) : (
            <Mic className="w-5 h-5 text-[#1EAEDB] group-hover:text-white" />
          )}
          <div className="absolute inset-0 border border-transparent group-hover:border-white/30 rounded-full transition-all duration-300"></div>
        </button>
        

        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-[#1A1F2C]/80 p-5 rounded-full backdrop-blur-xl border border-white/10 pointer-events-auto transition-all duration-300 hover:scale-105 hover:translate-x-1 shadow-lg hover:shadow-[#9b87f5]/20 group"
          disabled={currentIndex === slides.length - 1}
        >
          <ChevronRight className={`w-7 h-7 text-white ${currentIndex === slides.length - 1 ? 'opacity-50' : 'opacity-100'} group-hover:text-[#1EAEDB]`} />
          <div className="absolute inset-0 rounded-full border border-[#1EAEDB]/0 group-hover:border-[#1EAEDB]/50 transition-all duration-300"></div>
        </button>
        
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/40 backdrop-blur-xl border border-[#9b87f5]/20 px-8 py-4 rounded-2xl flex items-center gap-6 pointer-events-auto shadow-2xl shadow-[#1EAEDB]/10 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDcuNSBMIDMwIDcuNSBNIDcuNSAwIEwgNy41IDMwIE0gMTUgMCBMIDE1IDMwIE0gMjIuNSAwIEwgMjIuNSAzMCBNIDAgMTUgTCAzMCAxNSBNIDAgMjIuNSBMIDMwIDIyLjUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
          
          <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-[#1EAEDB]/20 to-transparent skew-x-12 blur-xl opacity-40 animate-shimmer"></div>
          
          <div className="relative text-sm font-medium flex items-center gap-1 bg-black/30 px-3 py-1.5 rounded-lg border border-[#1EAEDB]/20">
            <span className="text-lg font-mono text-[#1EAEDB]">{currentIndex + 1}</span> 
            <span className="text-gray-400 text-xs font-mono">/ {slides.length}</span>
          </div>
          
          <div className="h-10 w-px bg-gradient-to-b from-[#1EAEDB]/0 via-[#1EAEDB]/30 to-[#1EAEDB]/0"></div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="p-3 hover:bg-[#1EAEDB]/10 rounded-full transition-all duration-300 hover:scale-105 relative group"
            >
              {isSpeaking && !isPaused ? (
                <Pause className="w-5 h-5 text-[#1EAEDB] group-hover:text-white" />
              ) : (
                <Play className="w-5 h-5 text-[#1EAEDB] group-hover:text-white" />
              )}
              {isSpeaking && !isPaused && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#1EAEDB] rounded-full animate-pulse"></span>
              )}
              <div className="absolute inset-0 border border-[#1EAEDB]/0 group-hover:border-[#1EAEDB]/50 rounded-full transition-all duration-300"></div>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                pause();
                setShowQAInput(true);
              }}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#1EAEDB] to-[#9b87f5] hover:from-[#1EAEDB] hover:to-[#7E69AB] transition-all duration-300 text-sm font-medium shadow-md hover:shadow-[#9b87f5]/30 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"></div>
              <MessageCircle className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Ask a Question</span>
            </button>
          </div>
          
          <div className="h-10 w-px bg-gradient-to-b from-[#1EAEDB]/0 via-[#1EAEDB]/30 to-[#1EAEDB]/0"></div>
          
          <button 
            onClick={(e) => { e.stopPropagation(); exitFullScreen(); }}
            className="p-3 hover:bg-[#1EAEDB]/10 rounded-full transition-all duration-300 group"
          >
            <Fullscreen className="w-5 h-5 text-white/70 group-hover:text-[#1EAEDB]" />
            <div className="absolute inset-0 border border-[#1EAEDB]/0 group-hover:border-[#1EAEDB]/50 rounded-full transition-all duration-300"></div>
          </button>
        </div>
        
        {isSpeaking && (
          <div className="absolute top-8 right-8 bg-black/30 backdrop-blur-xl border border-[#1EAEDB]/30 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 pointer-events-auto shadow-lg group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#1EAEDB]/5 to-[#9b87f5]/5"></div>
            <span className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-[#1EAEDB] animate-pulse'} shadow-sm ${isPaused ? 'shadow-amber-500/30' : 'shadow-[#1EAEDB]/30'}`}></span>
            <span className="relative">
              {isPaused ? "Audio Paused" : "Speaking"}
            </span>
          </div>
        )}
      </div>

     {showQAInput && (
  <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
    <div className="bg-[#1A1F2C]/90 border border-[#9b87f5]/20 p-6 rounded-2xl shadow-2xl max-w-xl w-full animate-fade-in relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <div className="w-1.5 h-6 bg-gradient-to-b from-[#1EAEDB] to-[#9b87f5] rounded-full mr-1"></div>
            Ask About This Slide
          </h3>
          <button
            onClick={() => {
              setShowQAInput(false);
              setAnswer("");
              resume();
            }}
            className="p-1 hover:bg-white/10 rounded-full transition-all group"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-white" />
          </button>
        </div>

        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type your question..."
          className="w-full px-4 py-3 rounded-xl bg-black/50 text-white border border-[#9b87f5]/30 focus:border-[#1EAEDB]/50 focus:outline-none focus:ring-2 focus:ring-[#1EAEDB]/20 transition-all mb-4"
          autoFocus
        />

        <div className="flex gap-3 justify-end items-center">
          <button
            onClick={() => {
              recognition.current?.stop();
              setShowQAInput(false);
              setAnswer("");
              resume();
            }}
            className="px-5 py-2.5 rounded-xl border border-[#9b87f5]/30 hover:border-[#9b87f5]/50 hover:bg-[#9b87f5]/10 transition-all text-sm font-medium group"
          >
            <span className="group-hover:text-[#9b87f5] transition-all">Cancel</span>
          </button>

          {/* 🎤 Mic Button */}
          <button
            onClick={() => {
              if (!isListening) {
                recognition.current?.start();
                setIsListening(true);
              } else {
                recognition.current?.stop();
                setIsListening(false);
              }
            }}
            className={`p-2 rounded-full transition-all duration-300 hover:scale-105 relative group border ${isListening ? 'bg-red-500/30 border-red-400' : 'bg-[#1EAEDB]/10 border-[#1EAEDB]/20'}`}
            title="Use voice"
          >
            {isListening ? (
              <MicOff className="w-4 h-4 text-red-300 group-hover:text-white" />
            ) : (
              <Mic className="w-4 h-4 text-[#1EAEDB] group-hover:text-white" />
            )}
          </button>

          <button
            onClick={() => {
              setShowQAInput(false);
              setAnswer("");
              setIsAnswering(true);
              handleAskQuestion();
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1EAEDB] to-[#9b87f5] hover:from-[#1EAEDB] hover:to-[#7E69AB] transition-all text-sm font-medium shadow-lg hover:shadow-[#1EAEDB]/30 relative overflow-hidden group"
          >
            <span className="absolute inset-0 w-full h-full bg-white/0 group-hover:bg-white/10 transition-all"></span>
            <span className="relative">Ask</span>
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      {isAnswering && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCA2MCBNIDAgMCBMIDYwIDYwIE0gMzAgMCBMIDMwIDYwIE0gMCAzMCBMIDYwIDMwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utb3BhY2l0eT0iMC4wMyIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] bg-fixed">
          <div className="bg-[#1A1F2C]/80 border border-[#9b87f5]/20 p-8 rounded-2xl shadow-2xl max-w-md w-full animate-fade-in text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1EAEDB]/10 to-[#9b87f5]/10 blur-xl opacity-50"></div>
            <div className="relative z-10 flex flex-col items-center justify-center gap-6">
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 border-2 border-[#9b87f5]/20 rounded-full"></div>
                <div className="absolute inset-0 border-t-2 border-r-2 border-[#1EAEDB] rounded-full animate-spin"></div>
                <div className="absolute inset-3 border border-[#9b87f5]/40 rounded-full"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-2 w-2 bg-[#1EAEDB] rounded-full animate-pulse"></div>
                </div>
                <div className="absolute inset-0 border border-[#1EAEDB]/20 rounded-full animate-ping" style={{animationDuration: "1.5s"}}></div>
              </div>
              
              <div>
                <p className="text-lg font-medium text-white">Analyzing content...</p>
                <p className="text-sm text-[#1EAEDB] mt-1">Finding the most relevant information</p>
              </div>
              
              <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-gradient-to-r from-[#1EAEDB] to-[#9b87f5] animate-progress"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {answer && !showQAInput && !isAnswering && (
        <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 bg-black/40 backdrop-blur-lg border border-[#9b87f5]/30 p-5 rounded-xl max-w-xl w-full shadow-2xl animate-fade-in relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#1EAEDB]/10 via-transparent to-[#9b87f5]/10 animate-shimmer"></div>
          
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDUgTCAyMCA1IE0gNSAwIEwgNSAyMCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
          
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#1EAEDB] to-[#9b87f5]"></div>
          
          <div className="relative z-10">
            <p className="text-white">{answer}</p>
          </div>
          
          <button
            onClick={() => setAnswer("")}
            className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded-full transition-all group"
          >
            <X className="w-4 h-4 text-gray-400 group-hover:text-white" />
          </button>
        </div>
      )}
    </div>
  );
}