
import { useState, useEffect, useRef } from "react";
import { auth, db } from "@/components/firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

interface SpeechControlsProps {
  slide?: {
    presentationId: string;
    slideNumber: number;
    text: string;
  };
  slides: { presentationId: string; slideNumber: number; text: string }[];
  setVoiceTone?: (tone: string) => void;
  setSpeed?: (speed: number) => void;
  setPitch?: (pitch: number) => void;
  voiceTone?: string;
  speed?: number;
  pitch?: number;
  speeches?: { [key: number]: string };
  totalSlides: number;
  currentIndex: number;
  setCurrentSlideIndex: React.Dispatch<React.SetStateAction<number>>;
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
}

export default function SpeechControls({
  slide,
  setVoiceTone,
  setSpeed,
  setPitch,
  voiceTone = "Formal",
  speed = 1,
  pitch = 1,
  speeches = {},
  totalSlides,
  setCurrentSlideIndex,
  currentIndex,
  slides,
  selectedVoice,
  setSelectedVoice,
}: SpeechControlsProps) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayAll, setIsPlayAll] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  const synthRef = useRef(window.speechSynthesis);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const wasManuallyStopped = useRef(false);


  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        if (!selectedVoice) setSelectedVoice(voices[0].name);
        setVoicesLoaded(true);
      }
    };
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
    loadVoices();
  }, []);

  useEffect(() => {
    if (!slide || !voicesLoaded) return;

    const fetchSpeechSettings = async () => {
      setLoading(true);
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated");

        const userId = user.uid;
        const slideRef = doc(db, "users", userId, "presentations", slide.presentationId, "slides", String(slide.slideNumber));
        const snapshot = await getDoc(slideRef);
        if (!snapshot.exists()) throw new Error("Slide data not found");

        const data = snapshot.data();
        setVoiceTone?.(data.voice_tone ?? "Formal");
        setSpeed?.(data.speed ?? 1);
        setPitch?.(data.pitch ?? 1);
        if (data.voice && availableVoices.find(v => v.name === data.voice)) {
          setSelectedVoice(data.voice);
        }
      } catch (error) {
        console.error("❌ Error fetching speech settings from Firestore:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpeechSettings();
  }, [slide?.presentationId, slide?.slideNumber, voicesLoaded]);

  useEffect(() => {
    if (!isPlaying || !isPlayAll || synthRef.current.speaking) return;

    setTimeout(() => {
      console.log("🔁 Now speaking slide", currentIndex);
      speakSlide(currentIndex);
    }, 300);
  }, [currentIndex, isPlaying, isPlayAll]);

  const retriesRef = useRef(0); // Track retries for the current utterance

  const speakSlide = (index: number) => {
    const text = speeches[index] || slides[index]?.text || "";
    if (!text.trim()) {
      console.log(`⚠️ Skipping empty slide ${index + 1}`);
      handleNext(index);
      return;
    }
  
    if (synthRef.current.speaking || synthRef.current.pending) {
      console.log("⏳ Still speaking. Cancelling...");
      synthRef.current.cancel();
  
      if (retriesRef.current < 1) {
        retriesRef.current++;
        setTimeout(() => speakSlide(index), 300);
      } else {
        console.warn("⚠️ Retried already. Moving to next slide.");
        retriesRef.current = 0;
        handleNext(index);
      }
      return;
    }
  
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = pitch;
    utterance.rate = speed;
  
    const selected = availableVoices.find(v => v.name === selectedVoice);
    if (selected) utterance.voice = selected;
  
    utterance.onend = () => {
      if (wasManuallyStopped.current) {
        console.log("🛑 Speech manually stopped — skipping next slide");
        wasManuallyStopped.current = false;
        return;
      }
      console.log(`✅ Finished slide ${index + 1}`);
      retriesRef.current = 0;
      if (isPlayAll) handleNext(index);
    };
    
    utterance.onerror = (e) => {
      if (wasManuallyStopped.current) {
        console.log("🛑 Speech manually stopped — skipping next slide");
        wasManuallyStopped.current = false;
        return;
      }
      console.error(`❌ Speech error on slide ${index + 1}:`, e.error);
      retriesRef.current = 0;
      if (isPlayAll) handleNext(index);
    };
    
  
    currentUtteranceRef.current = utterance;

    // 🛠 FIX: delay to ensure voice is loaded properly
    setTimeout(() => {
      synthRef.current.speak(utterance);
    }, 100); // 100ms works well across browsers
  };
  const handleNext = (current: number) => {
    const next = current + 1;
    if (next < totalSlides) {
      setCurrentSlideIndex(next);
    } else {
      console.log("✅ All slides done. Stopping.");
      stop();
    }
  };
  
  const playAll = () => {
    stop(); // ensure clean start
    setIsPlayAll(true);
    setIsPlaying(true);
    retriesRef.current = 0;
    speakSlide(currentIndex);
  };
  

  const pause = () => {
    synthRef.current.pause();
    setIsPaused(true);
    setIsPlaying(false);
  };

  const resume = () => {
    synthRef.current.resume();
    setIsPaused(false);
    setIsPlaying(true);
  };

  const stop = () => {
    wasManuallyStopped.current = true;
    synthRef.current.cancel();
    setIsPaused(false);
    setIsPlaying(false);
    setIsPlayAll(false);
  };
  

  const restart = () => {
    stop();
    setTimeout(() => {
      setCurrentSlideIndex(0);
      playAll();
    }, 200);
  };

  const handleSaveSpeech = async () => {
    if (!slide) return;
    setStatus("Saving...");
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("No auth token found");

      const speechData = {
        presentation_id: slide.presentationId,
        slide_number: slide.slideNumber,
        generated_speech: speeches[slide.slideNumber - 1] || slide.text,
        voice_tone: voiceTone,
        speed,
        pitch,
        voice: selectedVoice,
        text: slide.text,
      };

      const response = await fetch("http://127.0.0.1:8000/save_speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(speechData),
      });

      if (!response.ok) throw new Error("Failed to save speech settings.");
      setStatus("✅ Speech settings saved successfully!");
    } catch (error) {
      console.error("❌ Error saving speech:", error);
      setStatus("⚠️ Failed to save speech.");
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 via-white to-blue-100 rounded-xl shadow-lg border border-blue-200 space-y-6">
      <h2 className="text-2xl font-bold text-blue-900">🎤 Speech Assistant</h2>
      {loading ? (
        <p className="text-blue-500">Loading settings...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-semibold text-blue-800">Speech Style</label>
              <select
                value={voiceTone}
                onChange={(e) => setVoiceTone?.(e.target.value)}
                className="w-full p-2 mt-1 rounded border border-blue-200 bg-white text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="Formal">Formal</option>
                <option value="Casual">Casual</option>
                <option value="Enthusiastic">Enthusiastic</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-800">Voice</label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice?.(e.target.value)}                
                className="w-full p-2 mt-1 rounded border border-blue-200 bg-white text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {availableVoices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-800">Speed: {speed.toFixed(1)}x</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed?.(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-800">Pitch: {pitch.toFixed(1)}</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch?.(parseFloat(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <button onClick={playAll} disabled={isPlaying || !voicesLoaded} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-xl shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed">
              ▶️ Play All
            </button>
            <button onClick={pause} disabled={!isPlaying} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-xl shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed">
              ⏸️ Pause
            </button>
            <button onClick={resume} disabled={!isPaused} className="bg-blue-400 hover:bg-blue-500 text-white font-semibold py-2 rounded-xl shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed">
              ▶️ Resume
            </button>
            <button onClick={stop} disabled={!isPlaying && !isPaused} className="bg-blue-300 hover:bg-blue-400 text-white font-semibold py-2 rounded-xl shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed">
              ⏹️ Stop
            </button>
            <button onClick={restart} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-xl shadow-sm transition">
              🔁 Restart
            </button>
              </div>

          <div className="mt-6">
            <button onClick={handleSaveSpeech} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl shadow-md transition">
              💾 Save Speech
            </button>
          </div>

          {isPlaying && isPlayAll && (
            <p className="text-center text-sm text-green-600 mt-2">
              🔊 Speaking Slide {currentIndex + 1} of {totalSlides}
            </p>
          )}

          {status && (
            <p className="text-center text-sm mt-2 text-blue-700">{status}</p>
          )}
        </>
      )}
    </div>
  );
}
