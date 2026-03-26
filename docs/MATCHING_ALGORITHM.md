# SideKick — Matching Algorithm

## Overview

The matching engine runs as a **Python Flask microservice** called by the Node.js backend.
It scores candidate users on 4 dimensions and returns a ranked list.

---

## Final Score Formula

```
TotalScore = 0.35 × InterestScore
           + 0.25 × AvailabilityScore
           + 0.25 × DistanceScore
           + 0.15 × SafetyScore
```

All sub-scores are normalized to **0–100**.

---

## 1. Interest Score — Jaccard Similarity

Measures overlap between two users' interest sets.

```
InterestScore = |A ∩ B| / |A ∪ B| × 100

Example:
  User A: ['🎬 Movies', '🍕 Food', '☕ Coffee']
  User B: ['🎬 Movies', '🍕 Food', '🎵 Music']

  Intersection = {Movies, Food} → 2
  Union        = {Movies, Food, Coffee, Music} → 4
  Score        = 2/4 × 100 = 50
```

**Why Jaccard?** It penalizes users who picked everything vs users with focused interests, giving a more meaningful compatibility signal.

---

## 2. Availability Score — Slot Overlap

Measures how many (day, time-slot) pairs overlap.

```
AvailabilityScore = |overlapping slots| / |user's total slots| × 100

Example:
  User A availability: {(Sat, evening), (Sun, afternoon), (Fri, night)}
  User B availability: {(Sat, evening), (Sat, afternoon), (Sun, afternoon)}

  Overlap = {(Sat, evening), (Sun, afternoon)} → 2
  User A total slots = 3
  Score = 2/3 × 100 = 66.7
```

If user has no availability set → returns **50** (neutral, not penalized).

---

## 3. Distance Score — Haversine Formula

Converts geographic distance to a 0–100 score.
Maximum useful range: **30 km** (configurable).

```
DistanceScore = (1 - distance_km / max_km) × 100

Haversine:
  R = 6371 km
  φ = latitude in radians
  λ = longitude in radians

  a = sin²(Δφ/2) + cos(φ1)·cos(φ2)·sin²(Δλ/2)
  distance = R × 2 × atan2(√a, √(1−a))

Example:
  Distance = 10 km, max = 30 km
  Score = (1 - 10/30) × 100 = 66.7

  Distance = 0 km (same location): Score = 100
  Distance ≥ 30 km: Score = 0
```

If coordinates unknown → returns **50** (neutral).

---

## 4. Safety Score

Directly uses the candidate's `safetyScore` field (0–100).
- Default: **100** (new user, no reports)
- Each valid report against them: **−10 points**
- Clamped to [0, 100]

---

## Full Pseudocode

```python
function computeMatches(user, candidates[]):
    results = []

    for candidate in candidates:
        # 1. Interest overlap (Jaccard)
        A = set(user.interests)
        B = set(candidate.interests)
        if A is empty or B is empty:
            i_score = 0
        else:
            i_score = len(A & B) / len(A | B) * 100

        # 2. Availability overlap
        user_slots   = flatten_availability(user.availability)
        cand_slots   = flatten_availability(candidate.availability)
        if user_slots is empty:
            a_score = 50
        else:
            overlap = len(user_slots & cand_slots)
            a_score = min(overlap / len(user_slots) * 100, 100)

        # 3. Distance (Haversine)
        if any coordinate is null:
            d_score = 50
        else:
            km = haversine(user.lat, user.lng, candidate.lat, candidate.lng)
            d_score = max(0, (1 - km / 30) * 100)

        # 4. Safety
        s_score = clamp(candidate.safetyScore, 0, 100)

        # Weighted sum
        total = 0.35*i_score + 0.25*a_score + 0.25*d_score + 0.15*s_score

        results.append({
            candidateId: candidate.id,
            totalScore:  round(total, 2),
            interestScore,
            availabilityScore,
            distanceScore,
            safetyScore: s_score
        })

    # Sort descending, return top 20
    results.sort(key=totalScore, descending=True)
    return results[:20]


function flatten_availability(availability):
    slots = set()
    for entry in availability:
        for slot in entry.slots:
            slots.add((entry.day, slot))
    return slots


function haversine(lat1, lng1, lat2, lng2):
    R = 6371
    φ1, φ2 = radians(lat1), radians(lat2)
    Δφ = radians(lat2 - lat1)
    Δλ = radians(lng2 - lng1)
    a = sin(Δφ/2)² + cos(φ1)·cos(φ2)·sin(Δλ/2)²
    return R * 2 * atan2(√a, √(1−a))
```

---

## Filtering (Node.js, before Python call)

Before calling the Python service, Node.js pre-filters candidates:

1. **Same city** — `location.city` must match
2. **Not blocked** — excluded from `user.blockedUsers`
3. **Not already matched** — no existing Match document between the two users
4. **Active account** — `isActive: true`
5. **Phone verified** — `isPhoneVerified: true`

This reduces the candidate set before the Python scoring loop.

---

## Score Interpretation

| Total Score | Meaning |
|-------------|---------|
| 80–100 | 🔥 Excellent match |
| 60–79  | ✨ Great match |
| 40–59  | 👍 Decent match |
| 30–39  | 🤔 Low compatibility |
| < 30   | ❌ Filtered out (not shown) |

---

## Future Improvements (Post-MVP)

- **Collaborative filtering** — "Users like you also matched with..."
- **Mutual interest boost** — if both users already liked similar events
- **Activity history score** — higher score for users who actually showed up to past meetups
- **ML model** — train on accepted/rejected match data after enough volume
