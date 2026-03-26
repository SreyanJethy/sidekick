# SideKick — Quick Start Guide

## Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB Atlas account (free)

---

## 1. Clone & Setup

```bash
git clone <your-repo>
cd sidekick
```

---

## 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MONGO_URI and JWT_SECRET
npm run dev
# Runs on http://localhost:5000
```

---

## 3. Python Microservice

```bash
cd python-service
pip install -r requirements.txt
python app.py
# Runs on http://localhost:8000
```

---

## 4. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm start
# Runs on http://localhost:3000
```

---

## 5. Test the Full Flow

1. Open `http://localhost:3000`
2. Register a new account
3. Check the **backend console** for the OTP (dev mode)
4. Enter OTP → redirected to ID verification
5. Enter any ID number → click Verify (95% success rate simulated)
6. Allow camera → capture face → verified!
7. Set profile: age, city, interests, availability
8. Go to **Match** tab to see companion suggestions
9. Send a request → log in as another user → accept
10. Chat opens — real-time messaging via Socket.io!

---

## 6. Dev Tips

### Creating Test Users Quickly
Use the provided seed script:
```bash
cd backend
node utils/seed.js
# Creates 10 test users in the same city with varied interests
```

### Check OTP in Dev
Look at your Node.js terminal:
```
📱 OTP for +919876543210: 482931
```

### Python Service Health
```
curl http://localhost:8000/health
# {"status": "ok", "service": "sidekick-python"}
```

### Test Matching Directly
```bash
curl -X POST http://localhost:8000/match \
  -H "Content-Type: application/json" \
  -d '{
    "user": {"id":"u1","interests":["🎬 Movies","🍕 Food"],"lat":20.29,"lng":85.82,"safetyScore":100},
    "candidates": [
      {"id":"u2","interests":["🎬 Movies","☕ Coffee"],"lat":20.30,"lng":85.83,"safetyScore":95}
    ]
  }'
```

---

## 7. Project Structure

```
sidekick/
├── backend/              # Node.js + Express API
│   ├── config/db.js
│   ├── controllers/      # Business logic
│   ├── middleware/auth.js
│   ├── models/           # Mongoose schemas
│   ├── routes/           # Express routers
│   ├── utils/socket.js   # Socket.io handler
│   └── server.js
│
├── frontend/             # React app
│   └── src/
│       ├── pages/        # Route components
│       ├── components/   # Shared UI
│       ├── context/      # AuthContext
│       └── utils/        # api.js, socket.js
│
├── python-service/       # Flask microservice
│   ├── app.py
│   ├── matching.py       # Scoring algorithm
│   └── face_verify.py    # Face sim
│
├── docs/                 # Documentation
│   ├── API.md
│   ├── DATABASE.md
│   └── MATCHING_ALGORITHM.md
│
├── docker-compose.yml
└── README.md
```

---

## 8. Deployment Checklist

- [ ] Create MongoDB Atlas cluster, get connection string
- [ ] Set all env variables on Render (backend + python)
- [ ] Deploy Python service to Render → get URL
- [ ] Set `PYTHON_SERVICE_URL` in backend env
- [ ] Deploy backend to Render → get URL
- [ ] Set `REACT_APP_API_URL` + `REACT_APP_SOCKET_URL` in Vercel
- [ ] Deploy frontend to Vercel
- [ ] Test full OTP → ID → face → match → chat flow
