import { useState, useEffect } from "react";
import { Slide } from "@/types";
import { db, auth } from "@/components/firebase/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

interface SpeechEditorProps {
  slide: Slide;
  slides: Slide[];
  slideIndex: number;
  speeches: { [key: number]: string };
  setSpeeches: React.Dispatch<React.SetStateAction<{ [key: number]: string }>>;
  voiceTone: string;
  speed: number;
  pitch: number;
  presentationId: string; // ✅ NEW
}

export default function SpeechEditor({
  slide,
  slides,
  slideIndex,
  speeches,
  setSpeeches,
  voiceTone,
  speed,
  pitch,
  presentationId, // ✅ NEW
}: SpeechEditorProps) {
  const [speech, setSpeech] = useState<string>(speeches[slideIndex] || slide.text || "");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const user = auth.currentUser;
  const userId = user?.uid;

  useEffect(() => {
    setSpeech(speeches[slideIndex] || slide.text || "");
  }, [slideIndex, speeches, slide.text]);

  // ✅ Save to Firestore
  const saveToFirestore = async (text: string) => {
    if (!userId || !presentationId) return;
    const slideRef = doc(db, "users", userId, "presentations", presentationId, "slides", `${slideIndex + 1}`);
    await setDoc(slideRef, {
      generated_speech: text,
      voice_tone: voiceTone,
      speed,
      pitch,
    }, { merge: true });
  };

  const regenerateSpeech = async () => {
    setLoading(true);
    setError(null);

    try {
      const previousSlides = slides.slice(0, slideIndex).map((s: Slide) => ({ text: s.text }));

      const response = await fetch("http://127.0.0.1:8000/generate_speech/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previous_slides: previousSlides,
          current_slide: { text: slide.text },
          slide_index: slideIndex,
          voice_tone: voiceTone,
          speed,
          pitch,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate speech: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.speech) {
        throw new Error("Invalid response from server.");
      }

      setSpeech(data.speech);
      setSpeeches((prev) => ({ ...prev, [slideIndex]: data.speech }));
      await saveToFirestore(data.speech); // ✅ Save to Firestore
    } catch (error) {
      console.error("❌ Error generating speech:", error);
      setSpeech("[Failed to generate speech]");
      setError("Speech generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Save manual edits too
  const handleManualEdit = async (value: string) => {
    setSpeech(value);
    setSpeeches((prev) => ({ ...prev, [slideIndex]: value }));
    await saveToFirestore(value);
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Speech Editor for Slide {slideIndex + 1}
      </h3>

      <textarea
        value={speech}
        onChange={(e) => handleManualEdit(e.target.value)}
        className="w-full h-36 p-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 transition-all resize-none"
        placeholder="Type or edit AI-generated speech..."
      />

      {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}

      <button
        onClick={regenerateSpeech}
        disabled={loading}
        className={`mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition-all ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Generating..." : "Regenerate Speech"}
      </button>
    </div>
  );
}
