import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';

// Flask backend URL — matches the port in app.py
const API_URL = 'http://localhost:5001';

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  // Called when Google returns a credential token successfully
  const handleGoogleSuccess = async (credentialResponse) => {
    setError(null);

    try {
      // Step 1: Send the Google credential token to our Flask backend
      const res = await fetch(`${API_URL}/api/auth/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Login failed');
      }

      const data = await res.json();
      const token = data.token;

      // Step 2: Save the JWT token to localStorage so other pages can use it
      localStorage.setItem('token', token);

      // Step 3: Decode the JWT payload to read the user's role.
      // A JWT has three parts separated by dots: header.payload.signature
      // The payload is Base64-encoded JSON — we decode it here without a library.
      const payloadBase64 = token.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64));
      const role = payload.role;

      // Save the role separately so any component can quickly read it
      localStorage.setItem('role', role);

      // Step 4: Redirect based on role
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/products');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Called if the user closes the Google popup or cancels
  const handleGoogleError = () => {
    setError('Google Sign-In was cancelled or failed. Please try again.');
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome</h1>
        <p style={styles.subtitle}>Sign in to continue to the store</p>

        {/* Google Sign-In button rendered by @react-oauth/google */}
        <div style={styles.buttonWrapper}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap={false}
            theme="outline"
            size="large"
            text="signin_with"
            shape="rectangular"
          />
        </div>

        {/* Error message — only shown if something went wrong */}
        {error && (
          <p style={styles.error}>⚠️ {error}</p>
        )}
      </div>
    </div>
  );
}

// Inline styles — simple and beginner-friendly
const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    fontFamily: 'sans-serif',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '48px 40px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
    textAlign: 'center',
    minWidth: '320px',
  },
  title: {
    margin: '0 0 8px',
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a1a',
  },
  subtitle: {
    margin: '0 0 32px',
    fontSize: '15px',
    color: '#666',
  },
  buttonWrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  error: {
    marginTop: '16px',
    color: '#d32f2f',
    fontSize: '14px',
    backgroundColor: '#fdecea',
    padding: '10px 14px',
    borderRadius: '6px',
  },
};
