import { useEffect, useState } from "react";
import { auth, db } from "@/components/firebase/firebaseConfig";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

interface Props {
  presentationId: string;
  voiceTone: string;
  setVoiceTone: (val: string) => void;
  speed: number;
  setSpeed: (val: number) => void;
  pitch: number;
  setPitch: (val: number) => void;
}

export default function GlobalSpeechSettings({
  presentationId,
  voiceTone,
  setVoiceTone,
  speed,
  setSpeed,
  pitch,
  setPitch,
}: Props) {
  const [status, setStatus] = useState("");
  const [applyToAllSlides, setApplyToAllSlides] = useState(false);

  const saveSettings = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid, "presentations", presentationId);

      // Save global settings
      await setDoc(userRef, {
        voice_tone: voiceTone,
        speed,
        pitch,
      }, { merge: true });

      // Optionally apply to all slides
      if (applyToAllSlides) {
        const slidesRef = collection(db, "users", user.uid, "presentations", presentationId, "slides");
        const slideDocs = await getDocs(slidesRef);

        const updatePromises = slideDocs.docs.map(slideDoc =>
          setDoc(slideDoc.ref, {
            voice_tone: voiceTone,
            speed,
            pitch,
          }, { merge: true })
        );

        await Promise.all(updatePromises);
      }

      setStatus("✅ Settings saved" + (applyToAllSlides ? " and applied to all slides!" : "!"));
      setTimeout(() => setStatus(""), 2500);
    } catch (err) {
      console.error("Error saving global settings:", err);
      setStatus("❌ Failed to save settings.");
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const ref = doc(db, "users", user.uid, "presentations", presentationId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        if (data.voice_tone) setVoiceTone(data.voice_tone);
        if (data.speed) setSpeed(data.speed);
        if (data.pitch) setPitch(data.pitch);
      }
    };

    loadSettings();
  }, [presentationId]);

  return (
    <div className="bg-white rounded-xl shadow p-6 border border-gray-200 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Global Speech Settings</h3>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-gray-700">Tone</label>
          <select
            value={voiceTone}
            onChange={(e) => setVoiceTone(e.target.value)}
            className="w-full mt-1 rounded border border-gray-300 p-2"
          >
            <option>Formal</option>
            <option>Casual</option>
            <option>Enthusiastic</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Speed ({speed.toFixed(1)}x)</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Pitch ({pitch.toFixed(1)})</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={pitch}
            onChange={(e) => setPitch(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <div className="mt-2">
        <label className="flex items-center space-x-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={applyToAllSlides}
            onChange={(e) => setApplyToAllSlides(e.target.checked)}
            className="form-checkbox text-blue-600"
          />
          <span>Apply to all slides</span>
        </label>
      </div>

      <button
        onClick={saveSettings}
        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded transition"
      >
        Save Global Settings
      </button>

      {status && <p className="text-sm mt-2 text-gray-600">{status}</p>}
    </div>
  );
}
