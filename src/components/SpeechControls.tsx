import { useState } from "react";

export default function SpeechControls() {
  const [voiceTone, setVoiceTone] = useState("Formal");
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(1);

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Speech Customization
      </h2>

      {/* Voice Tone Selection */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Voice Tone</label>
      <select
        value={voiceTone}
        onChange={(e) => setVoiceTone(e.target.value)}
        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
      >
        <option>Formal</option>
        <option>Casual</option>
        <option>Enthusiastic</option>
      </select>

      {/* Speed Control */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Speed</label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          className="w-full mt-1 cursor-pointer accent-blue-500"
        />
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Current: {speed.toFixed(1)}x</p>
      </div>

      {/* Pitch Control */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pitch</label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={pitch}
          onChange={(e) => setPitch(parseFloat(e.target.value))}
          className="w-full mt-1 cursor-pointer accent-blue-500"
        />
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Current: {pitch.toFixed(1)}</p>
      </div>

      {/* Save Button */}
      <button className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition-all">
        Save Speech
      </button>
    </div>
  );
}
