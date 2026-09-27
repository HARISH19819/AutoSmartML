import os
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

_client = None

def get_gemini_client():
    """
    Safely initialize and return the Google GenAI client.
    Returns None if the API key is missing or initialization fails.
    """
    global _client
    if _client is not None:
        return _client

    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or api_key == "your_gemini_api_key_here":
        logger.warning("GEMINI_API_KEY is not configured. Falling back to heuristic insights.")
        return None

    try:
        from google import genai
        _client = genai.Client(api_key=api_key)
        return _client
    except Exception as e:
        logger.error(f"Failed to initialize Gemini Client: {e}")
        return None


def generate_gemini_content(prompt: str, model: str = "gemini-3.8-flash") -> str:
    """
    Generate content with Gemini model.
    Falls back gracefully if the API fails or quota is exhausted.
    """
    client = get_gemini_client()
    if not client:
        return None

    try:
        response = client.models.generate_content(
            model=model,
            contents=prompt,
        )
        if response and hasattr(response, "text") and response.text:
            return response.text.strip()
        return None
    except Exception as e:
        logger.warning(f"Gemini API request failed: {e}")
        return None
