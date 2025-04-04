import { useState, useEffect } from "react";
import { Slide } from "@/types";
import { db, auth } from "@/components/firebase/firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface SpeechEditorProps {
  slide: Slide;
  slides: Slide[];
  slideIndex: number;
  speeches: { [key: number]: string };
  setSpeeches: React.Dispatch<React.SetStateAction<{ [key: number]: string }>>;
  voiceTone: string;
  speed: number;
  pitch: number;
  presentationId: string;
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
  presentationId,
}: SpeechEditorProps) {
  const [speech, setSpeech] = useState<string>(speeches[slideIndex] || slide.text || "");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const user = auth.currentUser;
  const userId = user?.uid;

  useEffect(() => {
    const loadSavedSpeech = async () => {
      if (!userId || !presentationId) return;

      const slideRef = doc(db, "users", userId, "presentations", presentationId, "slides", `${slideIndex + 1}`);
      const snapshot = await getDoc(slideRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        const savedSpeech = data.generated_speech || data.text || "";
        setSpeech(savedSpeech);
        setSpeeches((prev) => ({ ...prev, [slideIndex]: savedSpeech }));
      } else {
        setSpeech(slide.text || "");
      }
    };

    loadSavedSpeech();
  }, [slideIndex, userId, presentationId]);

  const saveToFirestore = async (text: string) => {
    if (!userId || !presentationId) return;

    const slideRef = doc(db, "users", userId, "presentations", presentationId, "slides", `${slideIndex + 1}`);
    await setDoc(
      slideRef,
      {
        generated_speech: text,
        voice_tone: voiceTone,
        speed,
        pitch,
      },
      { merge: true }
    );
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
      await saveToFirestore(data.speech);
    } catch (error) {
      console.error("❌ Error generating speech:", error);
      setSpeech("[Failed to generate speech]");
      setError("Speech generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualEdit = async (value: string) => {
    setSpeech(value);
    setSpeeches((prev) => ({ ...prev, [slideIndex]: value }));
    await saveToFirestore(value);
  };

  return (
    <div className="p-6 bg-gradient-to-tr from-blue-50 via-white to-blue-100 rounded-3xl shadow-xl border border-blue-200 transition-all duration-700 animate-fade-in">
      <h3 className="text-2xl font-extrabold text-blue-800 mb-4 flex items-center gap-2">
        <span className="text-3xl">📝</span> Slide {slideIndex + 1} - Speech Editor
      </h3>

      <textarea
        value={speech}
        onChange={(e) => handleManualEdit(e.target.value)}
        className="w-full h-44 p-4 border border-blue-300 bg-white text-blue-900 rounded-xl shadow-inner focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all resize-none placeholder:text-blue-400 text-base leading-relaxed"
        placeholder="Type or edit AI-generated speech..."
      />

      {error && <p className="mt-2 text-red-500 text-sm italic">{error}</p>}

      <button
        onClick={regenerateSpeech}
        disabled={loading}
        className={`mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-xl shadow-md transition-all text-base tracking-wide ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {loading ? "⏳ Generating..." : "🔁 Regenerate Speech"}
      </button>
    </div>
  );
}
