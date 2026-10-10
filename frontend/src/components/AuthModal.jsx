import React, { useState } from 'react';
import api, { errorMessage } from '../services/api.js';

export default function AuthModal({ onLoginSuccess, onClose, isModal = false }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        const { data } = await api.post('/auth/login', { email, password });
        onLoginSuccess({ id: data.id, name: data.name, email: data.email, role: data.role });
      } else {
        const { data } = await api.post('/auth/register', { name, email, password });
        onLoginSuccess({ id: data.id, name: data.name, email: data.email, role: data.role });
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function handleQuickDemo() {
    setEmail('student@learnpath.local');
    setPassword('password');
    setMode('login');
    setError('');
  }

  function handleAdminDemo() {
    setEmail('admin@learnpath.local');
    setPassword('admin');
    setMode('login');
    setError('');
  }

  return (
    <div className={isModal ? "modal-overlay" : "auth-portal-page"}>
      {/* Background Cosmic Starfield & Nebula Glows */}
      <div className="cosmic-bg-decor" aria-hidden="true">
        <div className="cosmic-nebula-glow glow-1" />
        <div className="cosmic-nebula-glow glow-2" />
        <div className="cosmic-stars-layer">
          {[...Array(40)].map((_, i) => (
            <span
              key={i}
              className={`cosmic-star-dot ${i % 3 === 0 ? 'star-lg' : i % 2 === 0 ? 'star-sm' : ''}`}
              style={{
                left: `${((i * 19 + 7) % 96) + 2}%`,
                top: `${((i * 29 + 11) % 94) + 3}%`,
                animationDelay: `${(i * 0.4) % 3.5}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Glassmorphic Auth Card */}
      <div className="auth-portal-card">
        {isModal && onClose && (
          <button
            type="button"
            className="auth-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        )}

        {/* Brand Header */}
        <div className="auth-brand-lockup">
          <div className="auth-brand-badge">L</div>
          <div>
            <h2 className="auth-brand-title">LearnPath<span>.AI</span></h2>
            <p className="auth-brand-tagline">ADAPTIVE PREREQUISITE MASTERY</p>
          </div>
        </div>

        <div className="auth-card-body">
          <div className="auth-title-area">
            <h3>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h3>
            <p className="auth-subtitle">
              {mode === 'login'
                ? 'Sign in to access your personalized curriculum graph & progress tracking.'
                : 'Join LearnPath AI to start mastering programming concepts sequentially.'}
            </p>
          </div>

          {/* Quick Demo Switchers */}
          <div className="auth-demo-grid">
            <button
              type="button"
              className="demo-btn demo-student"
              onClick={handleQuickDemo}
              title="Fill student demo credentials"
            >
              <span>⚡</span> Demo Student
            </button>
            <button
              type="button"
              className="demo-btn demo-admin"
              onClick={handleAdminDemo}
              title="Fill admin console credentials"
            >
              <span>👑</span> Admin Console
            </button>
          </div>

          {error && (
            <div className="auth-error-banner" role="alert">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form-stack">
            {mode === 'register' && (
              <div className="form-field-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-field-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="student@learnpath.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-field-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="button button-primary button-full auth-submit-btn"
              disabled={submitting}
            >
              {submitting
                ? 'Connecting to platform…'
                : mode === 'login'
                  ? 'Sign In to Learning Space ➔'
                  : 'Create Student Account ➔'}
            </button>
          </form>

          <div className="auth-switch-footer">
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  className="auth-link-btn"
                  onClick={() => { setMode('register'); setError(''); }}
                >
                  Create an account
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  className="auth-link-btn"
                  onClick={() => { setMode('login'); setError(''); }}
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
