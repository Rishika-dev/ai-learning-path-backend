# AI Learning Plan Generator API

Plain Node.js + Express. Collects interest, level, weekly hours, duration; stores plans in a local JSON file; generates a learning plan via Google Gemini (optional Serper for links).

## Requirements

- **Node.js** ≥ 18
- **Gemini API key** (for plan generation; get at [aistudio.google.com](https://aistudio.google.com/apikey))

## Setup

```bash
cp .env.example .env
# Set GEMINI_API_KEY in .env. Optionally SERPER_API_KEY for search links.
npm install
```

## Env

| Var | Required | Description |
|-----|----------|-------------|
| `GEMINI_API_KEY` | Yes (for generate) | Google AI / Gemini API key |
| `SERPER_API_KEY` | No | Serper.dev key for real links in plans |
| `PORT` | No (4000) | Server port |
| `DATA_FILE` | No | Path to JSON file (default: `data/plans.json`) |

## Run

```bash
npm start
# or with file watch:
npm run dev
```

## API

- `POST /plans` – create plan (body: `interest`, `level`, `weeklyHours`, `durationMonths`)
- `GET /plans` – list plans
- `GET /plans/:id` – get one plan
- `DELETE /plans/:id` – delete plan
- `POST /plans/:id/generate` – generate learning plan (Gemini)
- `GET /health` – health check

Plans are stored in `data/plans.json` (created automatically).
