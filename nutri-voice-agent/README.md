# Nutri Voice Agent (FastAPI + HTML)

Voice-first demo: transcribe speech in the browser, send text to a FastAPI backend for emotion scoring, then return nutrition suggestions and optional AI-powered advice.

## Layout

```
nutri-voice-agent/
  backend/    FastAPI API (emotion + advisor)
  frontend/   Static UI (voice + charts + animation)
  assets/     Optional paper figures (png)
```

## Requirements

- Python 3.11+ recommended
- A modern browser (Chrome/Edge recommended for Web Speech API)

## Run

### Backend

```bash
cd nutri-voice-agent/backend
pip install -r requirements.txt
copy .env.example .env
uvicorn app:app --reload --port 8000
```

If the advisor key is empty/missing, the backend returns safe fallback advice (no external calls).

### Frontend

Recommended (serves both `frontend/` and `assets/`):

```bash
cd nutri-voice-agent
python -m http.server 3000
```

Open: `http://localhost:3000/frontend/`

## API

- `GET /api/health`
- `POST /api/analyze` body: `{ "text": "..." }`
- `POST /api/session-summary` body: `{ "session_log": [...] }`

## Notes

- Override backend URL: `http://localhost:3000/frontend/?api=http://localhost:8000`
- Add your paper figures to `nutri-voice-agent/assets/` to display them in the UI.
