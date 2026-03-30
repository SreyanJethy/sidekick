# SideKick — Full Stack Companion Matching Platform

## Architecture

```
SideKick-full/
├── backend/              # Node.js/Express API (Vercel)
├── frontend/             # React 18 (Vercel)
├── python-matching/      # Smart Matching microservice (Render)
├── python-face/          # Face Verification microservice (Render)
└── python-nlp-services/  # NLP microservices (Render)
```

## Live URLs

| Service | URL |
|---|---|
| Backend API | https://sidekick-be.vercel.app |
| Frontend | https://sidekick-r40f4ul8b-soumya7-rxhuls-projects.vercel.app |
| Smart Matching | https://sidekick-microservice-2.onrender.com |
| Face Verification | https://sidekick-py.onrender.com |
| NLP Services | https://sidekick-nlp-services.onrender.com |

## Tech Stack

- **Frontend**: React 18, Framer Motion, TailwindCSS, Socket.io-client
- **Backend**: Node.js, Express, MongoDB Atlas, JWT, Nodemailer
- **Python Services**: Flask, Gunicorn
- **Database**: MongoDB Atlas (AWS Mumbai ap-south-1)

## Microservices

### Smart Matching (`/python-matching`)
- Ranks companions using: Interests (35%) + Availability (25%) + Distance (25%) + Safety (15%)
- Endpoint: `POST /match`

### Face Verification (`/python-face`)
- Verifies user face with confidence score
- Endpoint: `POST /face-verify`

### NLP Services (`/python-nlp-services`)
- `POST /moderate` — Content moderation (toxic message detection)
- `POST /sentiment` — Sentiment analysis + distress detection
- `POST /vibe-tag` — Auto-assign vibe tags from interests
- `POST /cluster` — Location-based user clustering

## Environment Variables

### Backend
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
GMAIL_USER=...
GMAIL_PASS=...
CLIENT_URL=...
PYTHON_SERVICE_URL=https://sidekick-microservice-2.onrender.com
FACE_SERVICE_URL=https://sidekick-py.onrender.com
NLP_SERVICE_URL=https://sidekick-nlp-services.onrender.com
```

### Frontend
```
REACT_APP_API_URL=https://sidekick-be.vercel.app/api
REACT_APP_SOCKET_URL=https://sidekick-be.vercel.app
```

## Setup

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm start
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm start
```

### Python Services
```bash
cd python-matching  # or python-face or python-nlp-services
pip install -r requirements.txt
python app.py
```
