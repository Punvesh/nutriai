from __future__ import annotations

import os
from typing import Any, Dict, List

from dotenv import load_dotenv

load_dotenv()


def _fallback_advice(emotion: str, stress_level: str, keywords: List[str]) -> str:
    kws = ", ".join(keywords[:6]) if keywords else "no strong keywords"
    return (
        f"Based on what you shared, you may be feeling {emotion} with {stress_level} stress. "
        f"Key signals: {kws}. "
        "Try: drink water, eat a balanced snack (protein + fiber), and do 2 minutes of slow breathing "
        "(long exhale). If symptoms feel severe, worsen, or persist, consider professional medical advice."
    )


def get_health_advice(
    *,
    user_text: str,
    emotion: str,
    stress_level: str,
    keywords: List[str],
    nutrition: Dict[str, Any],
) -> str:
    api_key = (os.getenv("ADVISOR_API_KEY", "") or os.getenv("GEMINI_API_KEY", "")).strip()
    if not api_key:
        return _fallback_advice(emotion, stress_level, keywords)

    try:
        import google.generativeai as genai
    except Exception:
        return _fallback_advice(emotion, stress_level, keywords)

    model_name = (
        os.getenv("ADVISOR_MODEL", "") or os.getenv("GEMINI_MODEL", "") or "gemini-1.5-flash"
    ).strip() or "gemini-1.5-flash"
    genai.configure(api_key=api_key)

    prompt = f"""
You are a wellness assistant. Provide concise, practical guidance based on emotion and nutrition.
Do not claim diagnosis. Avoid dangerous advice. Keep it to ~120-180 words.

User said: {user_text!r}
Detected emotion: {emotion}
Stress level: {stress_level}
Keywords: {", ".join(keywords[:10])}

Nutrition suggestions:
- Foods to eat: {nutrition.get("foods_to_eat")}
- Foods to avoid: {nutrition.get("foods_to_avoid")}
- Supplements: {nutrition.get("supplements")}
- Immediate actions: {nutrition.get("immediate_actions")}

Return a single paragraph.
""".strip()

    try:
        model = genai.GenerativeModel(model_name)
        resp = model.generate_content(prompt)
        text = getattr(resp, "text", None)
        if not text:
            text = str(resp)
        return (text or "").strip() or _fallback_advice(emotion, stress_level, keywords)
    except Exception:
        return _fallback_advice(emotion, stress_level, keywords)
