from __future__ import annotations

import os
from typing import Any, Dict, List

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from emotion_engine import analyze_text
from health_advisor import get_health_advice
from nutrition_map import get_nutrition_for_emotion

load_dotenv()


app = FastAPI(title="Nutri Voice Agent", version="0.1.0")

origins = [
    o.strip()
    for o in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)


class SessionSummaryRequest(BaseModel):
    session_log: List[Dict[str, Any]] = Field(default_factory=list)


@app.get("/api/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/api/analyze")
def analyze(req: AnalyzeRequest) -> Dict[str, Any]:
    result = analyze_text(req.text)
    nutrition = get_nutrition_for_emotion(result.emotion)
    advice = get_health_advice(
        user_text=req.text,
        emotion=result.emotion,
        stress_level=result.stress_level,
        keywords=result.keywords_detected,
        nutrition=nutrition,
    )

    return {
        "emotion": result.emotion,
        "confidence": result.confidence,
        "all_emotions": result.all_emotions,
        "stress_level": result.stress_level,
        "keywords_detected": result.keywords_detected,
        "nutrition": nutrition,
        "health_advice": advice,
        "wellness_tip": nutrition.get("wellness_tip", ""),
    }


@app.post("/api/session-summary")
def session_summary(req: SessionSummaryRequest) -> Dict[str, Any]:
    log = req.session_log or []
    if not log:
        return {
            "dominant_emotion": "neutral",
            "wellness_trend": "steady",
            "overall_score": 70,
            "recommendations": ["Add some entries by analyzing voice/text first."],
        }

    emotions = [str(x.get("emotion", "neutral")) for x in log]
    dominant = max(set(emotions), key=emotions.count)

    stress_map = {"low": 1, "medium": 2, "high": 3}
    stress_vals = [stress_map.get(str(x.get("stress_level", "low")), 1) for x in log]
    mid = max(1, len(stress_vals) // 2)
    first_avg = sum(stress_vals[:mid]) / max(1, len(stress_vals[:mid]))
    last_avg = sum(stress_vals[mid:]) / max(1, len(stress_vals[mid:]))

    wellness_trend = "steady"
    if last_avg <= first_avg - 0.35:
        wellness_trend = "improving"
    elif last_avg >= first_avg + 0.35:
        wellness_trend = "worsening"

    avg_stress = sum(stress_vals) / max(1, len(stress_vals))
    overall = int(round(85 - (avg_stress - 1) * 22))
    overall = max(0, min(100, overall))

    nutrition = get_nutrition_for_emotion(dominant)
    recs = [
        f"Dominant emotion: {dominant}. Try: {nutrition.get('immediate_actions', ['Hydrate'])[0]}",
        f"Foods to prioritize: {', '.join(nutrition.get('foods_to_eat', [])[:3])}",
        "Keep sessions short: 5-10 minutes of check-in beats long sporadic use.",
    ]

    return {
        "dominant_emotion": dominant,
        "wellness_trend": wellness_trend,
        "overall_score": overall,
        "recommendations": recs,
    }

