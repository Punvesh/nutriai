from __future__ import annotations

import math
import re
from dataclasses import dataclass
from typing import Dict, List, Tuple


EMOTIONS: Tuple[str, ...] = (
    "happy",
    "sad",
    "angry",
    "fear",
    "disgust",
    "surprise",
    "neutral",
)


INTENSIFIERS: Dict[str, float] = {
    "slightly": 0.85,
    "little": 0.9,
    "kinda": 0.9,
    "kindof": 0.9,
    "somewhat": 0.95,
    "very": 1.2,
    "really": 1.2,
    "so": 1.15,
    "extremely": 1.35,
    "super": 1.35,
}

NEGATIONS = {
    "not",
    "no",
    "never",
    "dont",
    "don't",
    "cant",
    "can't",
    "wont",
    "won't",
    "isnt",
    "isn't",
    "arent",
    "aren't",
    "wasnt",
    "wasn't",
    "werent",
    "weren't",
}


# Weighted keywords/phrases per emotion. Lightweight + explainable (good for demos/viva).
LEXICON: Dict[str, List[Tuple[str, float]]] = {
    "happy": [
        ("happy", 2.0),
        ("joy", 2.0),
        ("excited", 1.8),
        ("grateful", 1.6),
        ("relieved", 1.4),
        ("good", 1.0),
        ("great", 1.2),
        ("awesome", 1.4),
        ("love", 1.1),
    ],
    "sad": [
        ("sad", 2.0),
        ("down", 1.4),
        ("tired", 1.1),
        ("exhausted", 1.5),
        ("burned out", 1.8),
        ("depressed", 2.2),
        ("lonely", 1.8),
        ("hopeless", 2.1),
        ("cry", 1.6),
    ],
    "angry": [
        ("angry", 2.0),
        ("mad", 1.8),
        ("furious", 2.3),
        ("annoyed", 1.5),
        ("irritated", 1.6),
        ("frustrated", 1.7),
        ("hate", 1.6),
    ],
    "fear": [
        ("fear", 2.0),
        ("afraid", 2.0),
        ("scared", 2.0),
        ("anxious", 1.9),
        ("nervous", 1.6),
        ("worried", 1.6),
        ("panic", 2.1),
        ("stressed", 1.5),
    ],
    "disgust": [
        ("disgust", 2.0),
        ("gross", 1.9),
        ("nauseous", 1.8),
        ("sick", 1.4),
        ("disappointed", 1.2),
        ("repulsed", 2.2),
    ],
    "surprise": [
        ("surprised", 2.0),
        ("shocked", 2.0),
        ("wow", 1.4),
        ("unexpected", 1.6),
        ("amazed", 1.7),
        ("cant believe", 1.8),
    ],
    "neutral": [
        ("okay", 0.8),
        ("fine", 0.8),
        ("normal", 0.8),
        ("alright", 0.8),
    ],
}


STRESS_HINTS = {
    "stressed",
    "stress",
    "anxious",
    "panic",
    "overwhelmed",
    "burned",
    "burnout",
    "tired",
    "exhausted",
    "insomnia",
}


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def _tokenize(text: str) -> List[str]:
    text = _normalize(text)
    text = re.sub(r"[^a-z0-9'\s]+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text.split() if text else []


def _bigrams(tokens: List[str]) -> List[str]:
    return [f"{tokens[i]} {tokens[i + 1]}" for i in range(len(tokens) - 1)]


def _softmax(scores: Dict[str, float]) -> Dict[str, float]:
    values = [scores[e] for e in EMOTIONS]
    max_v = max(values)
    exp_vals = [math.exp((v - max_v) / 1.25) for v in values]
    denom = sum(exp_vals) or 1.0
    return {e: (exp_vals[i] / denom) * 100.0 for i, e in enumerate(EMOTIONS)}


@dataclass(frozen=True)
class EmotionResult:
    emotion: str
    confidence: float
    all_emotions: Dict[str, float]
    stress_level: str
    keywords_detected: List[str]


def analyze_text(text: str) -> EmotionResult:
    tokens = _tokenize(text)
    bigrams = _bigrams(tokens)
    grams = tokens + bigrams

    raw: Dict[str, float] = {e: 0.0 for e in EMOTIONS}
    detected: List[str] = []

    for idx, gram in enumerate(grams):
        for emotion, entries in LEXICON.items():
            for key, weight in entries:
                if gram != key:
                    continue

                # Look back for negations/intensifiers (works best for unigram hits).
                multiplier = 1.0
                window = tokens[max(0, idx - 2) : idx] if idx < len(tokens) else tokens[-2:]
                if any(w in NEGATIONS for w in window):
                    multiplier *= 0.15
                for w in window:
                    multiplier *= INTENSIFIERS.get(w, 1.0)

                raw[emotion] += weight * multiplier
                detected.append(key)

    if "!" in text:
        raw["surprise"] += 0.6
        detected.append("!")

    if all(v <= 0.0 for v in raw.values()):
        raw["neutral"] = 1.0

    probs = _softmax(raw)
    emotion = max(probs, key=probs.get)
    confidence = round(probs[emotion], 1)

    token_set = set(tokens)
    stress_score = (
        probs["sad"] * 0.25
        + probs["angry"] * 0.20
        + probs["fear"] * 0.35
        + probs["disgust"] * 0.10
    )
    if token_set & STRESS_HINTS:
        stress_score += 15.0
    stress_level = "low"
    if stress_score >= 55.0:
        stress_level = "high"
    elif stress_score >= 35.0:
        stress_level = "medium"

    seen = set()
    keywords = []
    for k in detected:
        if k in seen:
            continue
        seen.add(k)
        keywords.append(k)
        if len(keywords) >= 10:
            break

    return EmotionResult(
        emotion=emotion,
        confidence=confidence,
        all_emotions={k: round(v, 1) for k, v in probs.items()},
        stress_level=stress_level,
        keywords_detected=keywords,
    )

