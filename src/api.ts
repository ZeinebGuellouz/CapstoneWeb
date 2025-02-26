const API_URL = "http://127.0.0.1:8000";  

export const uploadFile = async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);
    
    const response = await fetch(`${API_URL}/upload/`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        throw new Error("Failed to upload file");
    }

    return response.json();
};

export const fetchSpeech = async (
    presentationId: string,
    slideNumber: number
): Promise<{ generated_speech: string } | null> => {
    const response = await fetch(
        `${API_URL}/get_speech?presentation_id=${presentationId}&slide_number=${slideNumber}`
    );

    if (!response.ok) {
        return null;
    }

    return response.json();
};

export const saveSpeech = async (
    presentationId: string,
    slideNumber: number,
    speechData: { generated_speech: string; voice_tone: string; speed: number; pitch: number }
): Promise<any> => {
    const response = await fetch(`${API_URL}/save_speech`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            presentation_id: presentationId, // ✅ Matches backend expectations
            slide_number: slideNumber, // ✅ Matches backend expectations
            generated_speech: speechData.generated_speech,
            voice_tone: speechData.voice_tone,
            speed: speechData.speed,
            pitch: speechData.pitch,
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to save speech");
    }

    return response.json();
};

/**
 * ✅ Improved `generateSpeech` function to:
 * - Include previous slides for better context.
 * - Generate only the speech for the current slide.
 */
export const generateSpeech = async (
    previousSlides: { text: string }[], // ✅ List of previous slides for context
    currentSlide: { text: string }, // ✅ The current slide that needs speech
    slideIndex: number // ✅ The index of the current slide
): Promise<{ speech: string }> => {
    const response = await fetch(`${API_URL}/generate_speech/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            previous_slides: previousSlides, // ✅ Send previous slides for context
            current_slide: currentSlide, // ✅ Only generate speech for this slide
            slide_index: slideIndex, // ✅ Ensure correct slide index is sent
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to generate speech");
    }

    return response.json();
};
