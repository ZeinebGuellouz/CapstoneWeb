import { useState, useEffect } from "react";
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
}: SpeechControlsProps) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

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
        setVoiceTone?.(data.tone ?? "Formal");
        setSpeed?.(data.speed ?? 1);
        setPitch?.(data.pitch ?? 1);
      } catch (error) {
        console.error("❌ Error fetching speech settings from Firestore:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpeechSettings();
  }, [slide?.presentationId, slide?.slideNumber]);

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
    <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Speech Customization
      </h2>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading settings...</p>
      ) : (
        <>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Voice Tone
          </label>
          <select
            value={voiceTone}
            onChange={(e) => setVoiceTone?.(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
          >
            <option>Formal</option>
            <option>Casual</option>
            <option>Enthusiastic</option>
          </select>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Speed
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed?.(parseFloat(e.target.value))}
              className="w-full mt-1 cursor-pointer accent-blue-500"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Current: {speed?.toFixed(1) ?? "1.0"}x
            </p>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Pitch
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch?.(parseFloat(e.target.value))}
              className="w-full mt-1 cursor-pointer accent-blue-500"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Current: {pitch?.toFixed(1) ?? "1.0"}
            </p>
          </div>

          <button
            onClick={handleSaveSpeech}
            className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition-all"
          >
            Save Speech
          </button>

          {status && <p className="mt-2 text-center text-gray-600">{status}</p>}
        </>
      )}
    </div>
  );
}
