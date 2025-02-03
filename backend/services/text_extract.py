# services/text_extract.py
from collections import Counter
import re

def extract_keywords(text, num_keywords=5):
    """
      Extracts keywords from a text.
      Args:
        text: text to get the keywords from.
        num_keywords: Number of keywords to extract.
      Returns:
         list of keywords.
    """
    if not text:
       return []
    # Remove special characters and convert to lowercase
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text).lower()
    words = text.split()
    word_counts = Counter(words)
    keywords = [word for word, count in word_counts.most_common(num_keywords)]
    return keywords