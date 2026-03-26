"""
Face Verification Simulation
In production: replace with face-api.js (client) + DeepFace (server)
"""
import hashlib
import random

def simulate_face_verify(descriptor: str):
    if not descriptor:
        return {"verified": False, "message": "No face data provided"}

    # Simulate: generate a hash "fingerprint" from descriptor
    face_hash = hashlib.sha256(descriptor.encode()).hexdigest()[:16]

    # 95% success simulation
    success = random.random() > 0.05

    return {
        "verified": success,
        "faceHash": face_hash,
        "confidence": round(random.uniform(0.85, 0.99), 3) if success else round(random.uniform(0.3, 0.6), 3),
        "message": "Face verified successfully" if success else "Could not verify face. Please try again in good lighting."
    }
