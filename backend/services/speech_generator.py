# services/speech_generator.py
from transformers import pipeline, set_seed
from .research_module import search_and_summarize  # Import your research module
from .text_extract import extract_keywords # Import a text extraction method to extract keywords

def generate_speech(prompt, model_name="gpt2", max_length=250, temperature=0.7, k=50, p=0.95):
  """
    Generates text using GPT-2
    Args:
        prompt: The text used for the prompt for text generation.
        model_name: The name of the model to use.
        max_length: Max lenght of the speech generated.
        temperature: Controls the randomness of the text (lower = more predictable, higher = more creative).
        k: top_k parameter for generation.
        p: top_p parameter for generation
  Returns:
        Generated text from the given prompt using the parameters given
  """
  generator = pipeline('text-generation', model=model_name)
  set_seed(42)  # For consistent generation
  generated_text = generator(prompt, max_length=max_length, num_return_sequences=1, temperature=temperature, top_k = k, top_p = p)[0]['generated_text']

  # Clean up and format output if necessary
  return generated_text

def generate_slide_speech(slide, presentation_topic):
    """
        Generates speech using GPT-2 for a given slide, including research.
        Args:
            slide: A dictionary or object containing slide information (text, title, etc.).
            presentation_topic: Main topic of the presentation for more contextual search
        Returns:
            speech_text: A string containing the generated speech.
    """
    slide_text = slide.get('slide_text', '')  # Use .get to handle cases where 'slide_text' might be missing
    slide_title = slide.get('slide_title', '')  # Optional: if you have slide titles available
    if not slide_text:
        return "No text content on this slide."

    # 1. Extract Key Topics (or use title if no keywords method defined)
    keywords = extract_keywords(slide_text) if extract_keywords else [slide_title] #extract keywords if its defined

    # 2. Internet Research (Call research module function)
    research_summary = search_and_summarize(keywords, presentation_topic) # Your Research function

    # 3. Construct a Prompt for GPT-2
    prompt = f"""
    This slide is about {slide_title} and it discusses {slide_text}.
    Here's a summary of related information I found from the web: {research_summary}.
    Generate a speech for this slide.
    """

    # 4. Generate speech text using GPT-2
    speech_text = generate_speech(prompt)

    return speech_text