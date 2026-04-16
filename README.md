# nutriai

Nutri Voice Agent: a simple voice-first wellness demo with a static web UI + FastAPI backend.

## Project

- App folder: `nutri-voice-agent/`
  - `backend/` FastAPI API (emotion scoring + optional AI advice)
  - `frontend/` Static UI (voice, pipeline animation, charts)
  - `assets/` Optional paper figures (png)

## Run locally

### Backend

```bash
cd nutri-voice-agent/backend
pip install -r requirements.txt
copy .env.example .env
uvicorn app:app --reload --port 8000
```

### Frontend

Recommended (serves both `frontend/` and `assets/`):

```bash
cd nutri-voice-agent
python -m http.server 3000
```

Open: `http://localhost:3000/frontend/`

## Notes

- `.env` is ignored by git; put your API key only in `nutri-voice-agent/backend/.env`.
- If the advisor key is missing, the backend returns safe fallback advice.

