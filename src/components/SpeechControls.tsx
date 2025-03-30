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
}: SpeechControlsProps) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const synthRef = useRef(window.speechSynthesis);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // ✅ Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      if (voices.length > 0 && !selectedVoice) {
        setSelectedVoice(voices[0].name);
      }
    };

    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
    loadVoices();
  }, []);

  // ✅ Load speech settings from Firestore
  useEffect(() => {
    if (!slide) return;

    const fetchSpeechSettings = async () => {
      setLoading(true);
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated");

        const userId = user.uid;
        const slideRef = doc(
          db,
          "users",
          userId,
          "presentations",
          slide.presentationId,
          "slides",
          String(slide.slideNumber)
        );

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
  }, [slide?.presentationId, slide?.slideNumber, availableVoices]);

  useEffect(() => {
    if (!isPlaying) return;
  
    // Give browser a short moment to register slide change
    setTimeout(() => {
      console.log("🔁 Now speaking slide", currentIndex);
      speakSlide(currentIndex);
    }, 300); // ⏱️ Small delay is key
  }, [currentIndex, isPlaying]);
  
  // ✅ Core TTS handler
  const speakSlide = (index: number) => {
    const text = speeches[index] || slides[index]?.text || "";

    if (!text.trim()) {
      console.log(`⚠️ Skipping empty slide ${index + 1}`);
      setTimeout(() => handleNext(index), 300);
      return;
    }

    if (synthRef.current.speaking || synthRef.current.pending) {
      console.log("⏳ Still speaking. Cancelling...");
      synthRef.current.cancel();
      setTimeout(() => speakSlide(index), 300); // ⏱️ give it more time
      return;
    }
    

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = pitch;
    utterance.rate = speed;

    const selected = availableVoices.find((v) => v.name === selectedVoice);
    if (selected) utterance.voice = selected;

    utterance.onend = () => {
      console.log(`✅ Finished slide ${index + 1}`);
      handleNext(index);
    };

    utterance.onerror = (e) => {
      console.error(`❌ Speech error on slide ${index + 1}:`, e.error);
      handleNext(index);
    };

    currentUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const handleNext = (current: number) => {
    if (!isPlaying) {
      console.log("⏹️ Not playing, so stopping at", current);
      return;
    }
  
    const next = current + 1;
    console.log("➡️ Going to slide", next);
  
    if (next < totalSlides) {
      setCurrentSlideIndex(next);
    } else {
      console.log("✅ All slides done. Stopping.");
      stop();
    }
  };
  useEffect(() => {
    console.log("🎯 currentIndex updated to:", currentIndex);
  }, [currentIndex]);
    

  const playAll = () => {
    const ensureVoicesReady = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        setTimeout(ensureVoicesReady, 100);
      } else {
        setIsPlaying(true);
        speakSlide(currentIndex);
      }
    };
    ensureVoicesReady();
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
    synthRef.current.cancel();
    setIsPaused(false);
    setIsPlaying(false);
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
    <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Speech Assistant</h2>
      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading settings...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            {/* Voice Controls */}
            <div>
              <label className="block text-sm font-medium">Voice Tone</label>
              <select value={voiceTone} onChange={(e) => setVoiceTone?.(e.target.value)} className="w-full p-2 rounded">
                <option>Formal</option>
                <option>Casual</option>
                <option>Enthusiastic</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Voice</label>
              <select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} className="w-full p-2 rounded">
                {availableVoices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Speed: {speed.toFixed(1)}x</label>
              <input type="range" min="0.5" max="2" step="0.1" value={speed} onChange={(e) => setSpeed?.(parseFloat(e.target.value))} className="w-full" />
            </div>

            <div>
              <label className="block text-sm font-medium">Pitch: {pitch.toFixed(1)}</label>
              <input type="range" min="0.5" max="2" step="0.1" value={pitch} onChange={(e) => setPitch?.(parseFloat(e.target.value))} className="w-full" />
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <button onClick={playAll} disabled={isPlaying} className="bg-green-500 text-white rounded p-2 disabled:opacity-50">▶️ Play All</button>
            <button onClick={pause} disabled={!isPlaying} className="bg-yellow-500 text-white rounded p-2 disabled:opacity-50">⏸️ Pause</button>
            <button onClick={resume} disabled={!isPaused} className="bg-blue-500 text-white rounded p-2 disabled:opacity-50">▶️ Resume</button>
            <button onClick={stop} disabled={!isPlaying && !isPaused} className="bg-red-500 text-white rounded p-2 disabled:opacity-50">⏹️ Stop</button>
          </div>

          <button onClick={restart} className="w-full bg-purple-500 text-white rounded p-2 mt-2">🔁 Restart From Beginning</button>
          <button onClick={handleSaveSpeech} className="w-full bg-indigo-500 text-white rounded p-2 mt-4">💾 Save Speech</button>

          {isPlaying && (
            <p className="text-center text-sm text-green-600 mt-2">
              🔊 Speaking Slide {currentIndex + 1} of {totalSlides}
            </p>
          )}

          {status && <p className="text-center text-sm mt-2">{status}</p>}
        </>
      )}
    </div>
  );
}
