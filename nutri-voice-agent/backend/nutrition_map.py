from __future__ import annotations

from typing import Any, Dict


NUTRITION_MAP: Dict[str, Dict[str, Any]] = {
    "happy": {
        "foods_to_eat": ["Greek yogurt", "Berries", "Salmon", "Mixed nuts", "Dark chocolate (small)"],
        "foods_to_avoid": ["Excess sugary drinks", "Ultra-processed snacks"],
        "supplements": ["Omega-3 (if diet is low)", "Vitamin D (if deficient)"],
        "immediate_actions": ["Hydrate", "Take a 10-minute walk", "Share gratitude with someone"],
        "wellness_tip": "Keep the momentum: prioritize protein + fiber to stabilize energy.",
    },
    "sad": {
        "foods_to_eat": ["Oats", "Banana", "Eggs", "Lentils", "Leafy greens"],
        "foods_to_avoid": ["Alcohol", "Heavy fried foods", "High-sugar desserts"],
        "supplements": ["Magnesium glycinate", "B-complex (if intake is low)"],
        "immediate_actions": ["Sunlight for 10 minutes", "Warm tea", "Short breathing exercise"],
        "wellness_tip": "Aim for a balanced meal within the next 2 hours to reduce fatigue swings.",
    },
    "angry": {
        "foods_to_eat": ["Cucumber", "Coconut water", "Brown rice", "Avocado", "Chamomile tea"],
        "foods_to_avoid": ["Energy drinks", "Very spicy foods (if they trigger irritation)"],
        "supplements": ["L-theanine", "Magnesium"],
        "immediate_actions": ["Cold water on face", "Box breathing (4-4-4-4)", "Delay decisions 10 minutes"],
        "wellness_tip": "Lower stimulants today; steady blood sugar helps emotional regulation.",
    },
    "fear": {
        "foods_to_eat": ["Whole grains", "Pumpkin seeds", "Orange", "Yogurt", "Herbal tea"],
        "foods_to_avoid": ["Excess caffeine", "Nicotine", "Skipping meals"],
        "supplements": ["Magnesium", "Omega-3"],
        "immediate_actions": ["Grounding: 5-4-3-2-1 senses", "Slow exhale focus", "Sip water"],
        "wellness_tip": "Small, regular meals can reduce jittery anxiety feelings.",
    },
    "disgust": {
        "foods_to_eat": ["Ginger tea", "Plain toast", "Rice porridge", "Apple", "Mint"],
        "foods_to_avoid": ["Greasy foods", "Very sweet foods", "Strong odors"],
        "supplements": ["Ginger (as needed)", "Probiotics (long-term)"],
        "immediate_actions": ["Fresh air", "Small sips of water", "Light meal"],
        "wellness_tip": "If nausea persists or is severe, consider medical guidance.",
    },
    "surprise": {
        "foods_to_eat": ["Water", "Fruit", "Nuts", "Whole-grain snack"],
        "foods_to_avoid": ["Impulse junk food", "Too much caffeine"],
        "supplements": ["None needed immediately"],
        "immediate_actions": ["Pause 30 seconds", "Breathe slowly", "Write down what happened"],
        "wellness_tip": "Surprise spikes arousal; a small snack can help stabilize.",
    },
    "neutral": {
        "foods_to_eat": ["Balanced meal: protein + fiber + healthy fat"],
        "foods_to_avoid": ["None specifically"],
        "supplements": ["Only if recommended for you"],
        "immediate_actions": ["Hydrate", "Posture reset", "Plan next meal"],
        "wellness_tip": "Consistency beats intensity: keep routines simple and repeatable.",
    },
}


def get_nutrition_for_emotion(emotion: str) -> Dict[str, Any]:
    return NUTRITION_MAP.get(emotion, NUTRITION_MAP["neutral"])

