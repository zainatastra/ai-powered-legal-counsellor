import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Mail,
  Scale
} from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebase';

const ResetPassword = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset link sent! Please check your email.');
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const isSuccess =
    message === 'Password reset link sent! Please check your email.';

  return (
    <div className="auth-page">
      <div className="ambient-glow" />

      <div className="auth-shell">
        <div className="auth-brand">
          <div className="auth-brand-mark">
            <Scale size={24} strokeWidth={1.8} />
          </div>

          <div>
            <div className="auth-brand-name">AI-Powered Legal Counsellor</div>
            <div className="auth-brand-sub">LEGAL ASSISTANCE PLATFORM</div>
          </div>
        </div>

        <form onSubmit={handleReset} className="auth-card">
          <div className="auth-eyebrow">ACCOUNT RECOVERY</div>

          <h2 className="auth-heading">Reset password</h2>

          <p className="auth-intro">
            Enter your registered email address and we'll send you a secure
            password reset link.
          </p>

          <div className="field-group">
            <label className="field-label">Email address</label>

            <div className="field-input-wrap">
              <Mail size={19} strokeWidth={1.8} className="field-icon" />

              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field-input"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            Send reset link
          </button>

          {message && (
            <div className={`inline-feedback ${isSuccess ? 'success' : 'error'}`}>
              {isSuccess ? (
                <CheckCircle2 size={18} strokeWidth={1.9} />
              ) : (
                <CircleAlert size={18} strokeWidth={1.9} />
              )}

              <span>{message}</span>
            </div>
          )}

          <button
            type="button"
            onClick={onBackToLogin}
            className="link-btn"
            style={{ alignSelf: 'center', display: 'inline-flex', alignItems: 'center', gap: '7px', marginTop: '21px' }}
          >
            <ArrowLeft size={18} strokeWidth={1.9} />
            <span>Back to login</span>
          </button>
        </form>

        <p className="footnote">
          Your information is securely handled through the platform's
          authentication system.
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
