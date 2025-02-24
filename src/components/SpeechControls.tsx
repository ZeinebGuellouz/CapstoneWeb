import { useState, useEffect } from "react";

interface SpeechControlsProps {
  slide?: {
    presentationId: string;
    slideNumber: number;
    text: string;
  };
  setVoiceTone?: (tone: string) => void; // ✅ Make optional to prevent errors
  setSpeed?: (speed: number) => void; 
  setPitch?: (pitch: number) => void;
  voiceTone?: string; // ✅ Allow optional values
  speed?: number;
  pitch?: number;
}

export default function SpeechControls({
  slide,
  setVoiceTone,
  setSpeed,
  setPitch,
  voiceTone = "Formal",  // ✅ Default value
  speed = 1,            // ✅ Prevent undefined errors
  pitch = 1,
}: SpeechControlsProps) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!slide) return; // ✅ Prevents undefined slide errors

    const fetchSpeechSettings = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/get_speech?presentation_id=${slide.presentationId}&slide_number=${slide.slideNumber}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch speech settings");
        }

        const data = await response.json();
        setVoiceTone?.(data.voice_tone ?? "Formal"); // ✅ Use optional chaining
        setSpeed?.(data.speed ?? 1);
        setPitch?.(data.pitch ?? 1);
      } catch (error) {
        console.error("❌ Error fetching speech settings:", error);
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
      const speechData = {
        presentation_id: slide.presentationId,
        slide_number: slide.slideNumber,
        generated_speech: slide.text,
        voice_tone: voiceTone,
        speed,
        pitch,
      };

      const response = await fetch("http://127.0.0.1:8000/save_speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
          {/* Voice Tone Selection */}
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

          {/* Speed Control */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Speed
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={speed} // ✅ Prevents undefined
              onChange={(e) => setSpeed?.(parseFloat(e.target.value))}
              className="w-full mt-1 cursor-pointer accent-blue-500"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Current: {speed?.toFixed(1) ?? "1.0"}x
            </p>
          </div>

          {/* Pitch Control */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Pitch
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={pitch} // ✅ Prevents undefined
              onChange={(e) => setPitch?.(parseFloat(e.target.value))}
              className="w-full mt-1 cursor-pointer accent-blue-500"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Current: {pitch?.toFixed(1) ?? "1.0"}
            </p>
          </div>

          {/* Save Speech Button */}
          <button
            onClick={handleSaveSpeech}
            className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition-all"
          >
            Save Speech
          </button>

          {/* Display Save Status */}
          {status && <p className="mt-2 text-center text-gray-600">{status}</p>}
        </>
      )}
    </div>
  );
}
