import { useState } from "react";
import { Slide } from "@/types";

interface SpeechEditorProps {
  slide: Slide;
}

export default function SpeechEditor({ slide }: SpeechEditorProps) {
  const [speech, setSpeech] = useState(slide.text);

  const regenerateSpeech = () => {
    setSpeech("[New AI-generated speech for the slide]"); // Replace with actual AI API call
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Speech Editor
      </h3>

      <textarea
        value={speech}
        onChange={(e) => setSpeech(e.target.value)}
        className="w-full h-36 p-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 transition-all resize-none"
        placeholder="Type or edit AI-generated speech..."
      />

      <button
        onClick={regenerateSpeech}
        className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition-all"
      >
        Regenerate Speech
      </button>
    </div>
  );
}
