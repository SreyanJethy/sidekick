import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const STEPS = ['gov-id', 'face-scan', 'done'];

export default function VerifyIdPage() {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('gov-id');
  const [idType, setIdType] = useState('aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef();
  const canvasRef = useRef();

  const verifyId = async () => {
    if (idNumber.length < 6) return setError('Enter valid ID number');
    setLoading(true); setError('');
    try {
      await api.post('/auth/verify-id', { idType, idNumber });
      updateUser({ isIdVerified: true });
      setStep('face-scan');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally { setLoading(false); }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setScanning(true);
    } catch {
      setError('Camera access denied. Please allow camera permission.');
    }
  };

  const captureFace = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const descriptor = canvas.toDataURL('image/jpeg', 0.5);

    // Stop camera
    video.srcObject?.getTracks().forEach(t => t.stop());
    setScanning(false);
    setLoading(true);
    try {
      await api.post('/auth/verify-face', { faceDescriptor: descriptor });
      updateUser({ isFaceVerified: true });
      setStep('done');
    } catch (err) {
      setError('Face scan failed. Try again.');
    } finally { setLoading(false); }
  };

  if (step === 'done') return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 72 }}>🎉</div>
      <h2 style={{ fontSize: 28, fontWeight: 800, marginTop: 16 }}>You're Verified!</h2>
      <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Set up your profile to start finding companions</p>
      <button className="btn btn-primary" style={{ marginTop: 32, minWidth: 200 }} onClick={() => navigate('/setup-profile')}>
        Complete Profile →
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', maxWidth: 420, margin: '0 auto', padding: '40px 24px' }}>
      {/* Progress */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        {['ID Verification', 'Face Scan'].map((s, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= STEPS.indexOf(step) - 1 || (step === 'face-scan' && i === 0) ? 'var(--primary)' : 'var(--border)' }} />
        ))}
      </div>

      {step === 'gov-id' && (
        <div className="animate-in">
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 48 }}>🪪</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginTop: 12 }}>Government ID</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 14 }}>Required for safety verification</p>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="label">ID Type</label>
              <select className="input" value={idType} onChange={e => setIdType(e.target.value)}>
                <option value="aadhaar">Aadhaar Card</option>
                <option value="pan">PAN Card</option>
                <option value="passport">Passport</option>
                <option value="driving">Driving License</option>
              </select>
            </div>
            <div>
              <label className="label">ID Number</label>
              <input className="input" placeholder="Enter ID number" value={idNumber}
                onChange={e => setIdNumber(e.target.value)} />
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</p>}
            <button className="btn btn-primary btn-full" onClick={verifyId} disabled={loading}>
              {loading ? <span className="spinner" /> : 'Verify ID →'}
            </button>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
              🔒 Your ID is encrypted and never stored in plain text
            </p>
          </div>
        </div>
      )}

      {step === 'face-scan' && (
        <div className="animate-in">
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 48 }}>🤳</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginTop: 12 }}>Face Scan</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 14 }}>Confirm you're a real person</p>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', background: 'var(--bg-elevated)', borderRadius: 16, overflow: 'hidden', aspectRatio: '1', marginBottom: 20 }}>
              <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', display: scanning ? 'block' : 'none' }} />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              {!scanning && (
                <div style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 48 }}>📷</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Camera preview will appear here</span>
                </div>
              )}
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: 14, marginBottom: 12 }}>{error}</p>}
            {!scanning ? (
              <button className="btn btn-primary btn-full" onClick={startCamera}>Start Camera</button>
            ) : (
              <button className="btn btn-primary btn-full" onClick={captureFace} disabled={loading}>
                {loading ? <span className="spinner" /> : '📸 Capture Face'}
              </button>
            )}
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
              Ensure good lighting. Look directly at the camera.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
