# SideKick — API Reference

Base URL: `http://localhost:5000/api`

---

## Auth Routes `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | ❌ | Register new user, triggers OTP |
| POST | `/verify-otp` | ❌ | Verify OTP, returns JWT |
| POST | `/resend-otp` | ❌ | Resend OTP to phone |
| POST | `/login` | ❌ | Login with email + password |
| POST | `/verify-id` | ✅ | Mock Gov ID verification |
| POST | `/verify-face` | ✅ | Mock face scan verification |
| GET  | `/me` | ✅ | Get current user |

### POST /register
```json
{ "name": "Arjun", "email": "a@b.com", "phone": "+919876543210", "password": "pass123" }
```

### POST /verify-otp
```json
{ "phone": "+919876543210", "otp": "123456" }
// Returns: { accessToken, user }
```

### POST /login
```json
{ "email": "a@b.com", "password": "pass123" }
// Returns: { accessToken, user }
```

---

## User Routes `/api/users`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PUT | `/profile` | ✅ | Update profile |
| GET | `/:id` | ✅ | Get public profile |
| POST | `/block` | ✅ | Block a user |
| POST | `/report` | ✅ | Report + auto-block user |

### PUT /profile (sample payload)
```json
{
  "bio": "Love movies and coffee",
  "age": 22,
  "gender": "male",
  "interests": ["🎬 Movies", "☕ Coffee"],
  "vibeTag": "☕ The Chill One",
  "availability": [{ "day": "Sat", "slots": ["evening", "night"] }],
  "location": { "city": "Bhubaneswar", "lat": 20.2961, "lng": 85.8245 }
}
```

---

## Match Routes `/api/matches`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/suggestions` | ✅ | AI-scored match suggestions |
| GET | `/active` | ✅ | Accepted matches |
| GET | `/pending` | ✅ | Incoming requests |
| POST | `/request` | ✅ | Send companion request |
| PUT | `/respond` | ✅ | Accept/reject request |

### POST /request
```json
{ "receiverId": "userId123", "eventId": "optionalEventId" }
```

### PUT /respond
```json
{ "matchId": "matchId123", "action": "accept" }
// action: "accept" | "reject"
```

---

## Event Routes `/api/events`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ✅ | List events (filter: city, category) |
| POST | `/` | ✅ | Create event |
| POST | `/:id/join` | ✅ | Join event |
| GET | `/mine` | ✅ | My created/joined events |

### POST / (create event)
```json
{
  "title": "Movie Night at PVR",
  "category": "movie",
  "date": "2025-09-15T18:00:00Z",
  "timeSlot": "evening",
  "location": { "city": "Bhubaneswar", "venue": "PVR Esplanade" },
  "maxParticipants": 2
}
```

---

## Chat Routes `/api/chats`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/rooms` | ✅ | All chat rooms for user |
| GET | `/:roomId` | ✅ | Chat history for a room |

---

## Safety Routes (via `/api/users`)

### POST /users/report
```json
{
  "reportedId": "userId",
  "reason": "fake_profile",
  "description": "This account seems fake"
}
// reason options: harassment | fake_profile | inappropriate_behavior | spam | no_show | other
```

---

## Python Microservice `/` (port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |
| POST | `/match` | Compute match scores |
| POST | `/face-verify` | Simulate face verification |

### POST /match
```json
{
  "user": { "id": "u1", "interests": ["🎬 Movies"], "availability": [...], "lat": 20.29, "lng": 85.82, "safetyScore": 100 },
  "candidates": [{ "id": "u2", "interests": ["🎬 Movies", "🍕 Food"], ... }]
}
// Returns: { results: [{ candidateId, totalScore, interestScore, availabilityScore, distanceScore, safetyScore }] }
```

---

## Socket.io Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join_room` | `roomId` | Join a chat room |
| `send_message` | `{ roomId, content }` | Send message |
| `typing` | `{ roomId, isTyping }` | Typing indicator |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `new_message` | `{ _id, roomId, content, sender, createdAt }` | New message broadcast |
| `user_typing` | `{ userId, isTyping }` | Typing indicator |

---

## Error Format
All errors follow:
```json
{ "message": "Human-readable error message" }
```

## Auth Header
```
Authorization: Bearer <JWT_TOKEN>
```
