# SideKick — Database Design

Database: **MongoDB Atlas** (Free M0 Cluster)

---

## Collections Overview

| Collection | Purpose |
|------------|---------|
| `users` | All user accounts, verification status, profile |
| `matches` | Match requests between users |
| `events` | User-created activities/outings |
| `chatmessages` | Individual chat messages per room |
| `reports` | Safety reports submitted by users |

---

## Collection: `users`

```js
{
  _id: ObjectId,
  name: String,           // Required
  email: String,          // Unique, lowercase
  phone: String,          // Unique, E.164 format
  passwordHash: String,   // bcrypt hashed

  // Verification flags
  isPhoneVerified: Boolean,   // OTP verified
  isIdVerified: Boolean,      // Gov ID verified
  isFaceVerified: Boolean,    // Face scan verified
  otpCode: String,            // Temp, cleared after verify
  otpExpiry: Date,

  // Profile
  age: Number,
  gender: Enum['male','female','non-binary','prefer-not-to-say'],
  bio: String,            // max 200 chars
  profilePhoto: String,   // URL or base64
  faceDescriptor: String, // Hashed face fingerprint

  // Matching data
  interests: [String],    // ['🎬 Movies', '🍕 Food', ...]
  vibeTag: String,        // '🌟 The Adventurer'
  availability: [{
    day: String,          // 'Mon', 'Sat', ...
    slots: [String]       // ['morning', 'evening']
  }],
  location: {
    city: String,
    lat: Number,
    lng: Number
  },

  // Safety
  safetyContacts: [{ name: String, phone: String }],
  safetyScore: Number,    // 0–100, default 100
  blockedUsers: [ObjectId refs User],
  isActive: Boolean,
  role: Enum['user','admin'],

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** `email` (unique), `phone` (unique), `location.city`

---

## Collection: `matches`

```js
{
  _id: ObjectId,
  requester: ObjectId,    // ref User (who sent request)
  receiver: ObjectId,     // ref User (who received)
  event: ObjectId,        // ref Event (optional, if event-based)
  status: Enum['pending','accepted','rejected','cancelled'],
  
  // Scores from Python microservice
  matchScore: Number,
  interestScore: Number,
  distanceScore: Number,
  availabilityScore: Number,
  safetyScore: Number,
  
  chatRoomId: String,     // Unique room ID for Socket.io

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** `{ requester, receiver }` (compound), `chatRoomId`, `status`

---

## Collection: `events`

```js
{
  _id: ObjectId,
  creator: ObjectId,      // ref User
  title: String,
  description: String,
  category: String,       // 'movie','sports','food','music','hangout','study'
  date: Date,
  timeSlot: String,       // 'morning','afternoon','evening','night'
  location: {
    city: String,
    venue: String,
    lat: Number,
    lng: Number
  },
  maxParticipants: Number,    // default 2
  participants: [ObjectId],   // ref User[]
  isOpen: Boolean,
  tags: [String],

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** `location.city`, `date`, `category`, `isOpen`

---

## Collection: `chatmessages`

```js
{
  _id: ObjectId,
  roomId: String,         // Matches matches.chatRoomId — INDEXED
  sender: ObjectId,       // ref User
  content: String,
  type: Enum['text','system'],
  readBy: [ObjectId],     // ref User[]

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** `roomId` (for fast room history fetch), `{ roomId, createdAt }`

---

## Collection: `reports`

```js
{
  _id: ObjectId,
  reporter: ObjectId,     // ref User
  reported: ObjectId,     // ref User
  reason: Enum[
    'harassment',
    'fake_profile',
    'inappropriate_behavior',
    'spam',
    'no_show',
    'other'
  ],
  description: String,    // Optional details
  status: Enum['pending','reviewed','resolved'],
  adminNote: String,

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** `reported` (to count reports against a user), `status`

---

## Relationships Diagram

```
User ──────────────────────────────────┐
 │                                     │
 ├─[requester/receiver]──► Match ◄─────┤
 │                           │
 │                      chatRoomId
 │                           │
 │                           ▼
 │                      ChatMessage ──► sender (User)
 │
 ├─[creator]──────────► Event
 │                         │
 │                    participants[]
 │
 └─[reporter/reported]─► Report
```

---

## MongoDB Atlas Setup

```js
// Create indexes via Mongoose (auto) or Atlas UI:
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ phone: 1 }, { unique: true })
db.users.createIndex({ "location.city": 1 })

db.matches.createIndex({ requester: 1, receiver: 1 })
db.matches.createIndex({ chatRoomId: 1 })

db.events.createIndex({ "location.city": 1, date: 1 })

db.chatmessages.createIndex({ roomId: 1, createdAt: 1 })

db.reports.createIndex({ reported: 1 })
```
