import { useState, useEffect, useRef } from "react";
import { auth, db } from "@/components/firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

interface SpeechControlsProps {
  slide?: {
    presentationId: string;
    slideNumber: number;
    text: string;
  };
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
}: SpeechControlsProps) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [isPaused, setIsPaused] = useState(false);

  const synthRef = useRef(window.speechSynthesis);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

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

  const speakSlideRecursively = (index: number) => {
    if (index >= totalSlides) return;

    const text = speeches[index] || "";
    if (!text) {
      setTimeout(() => speakSlideRecursively(index + 1), 300);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = pitch;
    utterance.rate = speed;

    const selected = availableVoices.find((v) => v.name === selectedVoice);
    if (selected) utterance.voice = selected;

    utterance.onend = () => {
      if (!synthRef.current.paused && index + 1 < totalSlides) {
        setCurrentSlideIndex(index + 1);
        setTimeout(() => speakSlideRecursively(index + 1), 400);
      }
    };

    synthRef.current.cancel();
    synthRef.current.speak(utterance);
    currentUtteranceRef.current = utterance;
    setIsPaused(false);
  };

  const pause = () => {
    synthRef.current.pause();
    setIsPaused(true);
  };

  const resume = () => {
    synthRef.current.resume();
    setIsPaused(false);
  };

  const stop = () => {
    synthRef.current.cancel();
    setIsPaused(false);
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

      if (!response.ok) {
        throw new Error("Failed to save speech settings.");
      }

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
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Voice Tone</label>
              <select
                value={voiceTone}
                onChange={(e) => setVoiceTone?.(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2 text-gray-900 dark:text-white"
              >
                <option>Formal</option>
                <option>Casual</option>
                <option>Enthusiastic</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Voice</label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2 text-gray-900 dark:text-white"
              >
                {availableVoices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Speed: {speed.toFixed(1)}x</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed?.(parseFloat(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pitch: {pitch.toFixed(1)}</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch?.(parseFloat(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => speakSlideRecursively(currentIndex)}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg shadow"
            >
              ▶️ Play All
            </button>
            <button
              onClick={pause}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 rounded-lg shadow"
            >
              ⏸️ Pause
            </button>
            <button
              onClick={resume}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg shadow"
            >
              ▶️ Resume
            </button>
            <button
              onClick={stop}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg shadow"
            >
              ⏹️ Stop
            </button>
          </div>

          <button
            onClick={handleSaveSpeech}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 rounded-lg shadow mt-4"
          >
            💾 Save Speech
          </button>

          {status && <p className="text-center text-sm text-gray-600 dark:text-gray-300 mt-2">{status}</p>}
        </div>
      )}
    </div>
  );
}
