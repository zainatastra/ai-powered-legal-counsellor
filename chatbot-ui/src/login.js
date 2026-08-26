import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Scale,
  CheckCircle2,
  CircleAlert
} from 'lucide-react';
import { auth } from './firebase';
import {
  signInWithEmailAndPassword,
  getMultiFactorResolver,
  TotpMultiFactorGenerator
} from 'firebase/auth';

const Login = ({
  onLoginSuccess,
  onForgotPassword,
  onSwitchToSignup
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [mfaResolver, setMfaResolver] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);

  // Brute-force / credential-stuffing mitigation: lock out further
  // attempts for a cooldown period after too many wrong passwords.
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);

  const MAX_LOGIN_ATTEMPTS = 5;
  const LOGIN_LOCK_DURATION_MS = 30000;

  const handleMfaVerification = async (e) => {
    e.preventDefault();

    if (!mfaResolver || !/^[0-9]{6}$/.test(mfaCode)) {
      setMessage('Error: Enter the 6-digit code from your authenticator app.');
      return;
    }

    setMfaLoading(true);
    setMessage('');

    try {
      const totpHint = mfaResolver.hints?.find(
        (hint) => hint.factorId === TotpMultiFactorGenerator.FACTOR_ID
      );

      if (!totpHint) {
        setMessage('Error: No authenticator app is enrolled for this account.');
        return;
      }

      const assertion = TotpMultiFactorGenerator.assertionForSignIn(
        totpHint.uid,
        mfaCode
      );

      const userCredential = await mfaResolver.resolveSignIn(assertion);
      const user = userCredential.user;

      await user.reload();

      if (!user.emailVerified) {
        setMfaResolver(null);
        setMfaCode('');
        setMessage(
          'Please verify your email address before signing in. Redirecting you to verification...'
        );
        return;
      }

      setMfaResolver(null);
      setMfaCode('');
      setFailedAttempts(0);
      setMessage('Logged in successfully!');

      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error) {
      console.error('Authenticator verification failed:', error);

      if (error?.code === 'auth/invalid-verification-code') {
        setMessage('Error: Invalid authenticator code. Please try again.');
      } else if (error?.code === 'auth/session-expired') {
        setMfaResolver(null);
        setMfaCode('');
        setMessage('Error: Your verification session has expired. Please sign in again.');
      } else {
        setMessage('Error: Unable to verify the authenticator code. Please try again.');
      }
    } finally {
      setMfaLoading(false);
    }
  };

  const handleBackFromMfa = () => {
    setMfaResolver(null);
    setMfaCode('');
    setMessage('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage('');

    const now = Date.now();

    if (now < lockedUntil) {
      const waitSeconds = Math.ceil(
        (lockedUntil - now) / 1000
      );

      setMessage(
        `Error: Too many failed attempts. Please wait ${waitSeconds}s and try again.`
      );

      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // Refresh the Firebase user information so the latest
      // emailVerified status is available.
      await user.reload();

      if (!auth.currentUser?.emailVerified) {
        // IMPORTANT: do NOT sign the user out here.
        //
        // App.js's onAuthStateChanged listener already detects the
        // unverified session and redirects to the OTP screen while
        // keeping the Firebase session alive (required for
        // EmailVerification.js to send/verify the code).
        //
        // Calling signOut() here used to race with that listener:
        // it cleared the session right after it had been set up,
        // which made EmailVerification.js fail with
        // "Your verification session has expired."
        setMessage(
          'Please verify your email address before signing in. Redirecting you to verification...'
        );

        return;
      }

      setFailedAttempts(0);

      setMessage('Logged in successfully!');

      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error) {
      console.error('Login failed:', error);

      // Treat all "bad credentials" style errors identically and with a
      // single generic message. Firebase distinguishes wrong-password vs.
      // user-not-found internally, but exposing that distinction to the
      // client lets an attacker enumerate which emails have accounts.
      if (error?.code === 'auth/multi-factor-auth-required') {
        try {
          const resolver = getMultiFactorResolver(auth, error);

          const hasTotpFactor = resolver.hints?.some(
            (hint) => hint.factorId === TotpMultiFactorGenerator.FACTOR_ID
          );

          if (!hasTotpFactor) {
            setMessage('Error: No authenticator app is available for this account.');
            return;
          }

          setMfaResolver(resolver);
          setMfaCode('');
          setMessage('');
        } catch (resolverError) {
          console.error('Unable to start authenticator verification:', resolverError);
          setMessage('Error: Unable to start two-factor verification. Please try again.');
        }

        return;
      }

      const credentialErrorCodes = [
        'auth/wrong-password',
        'auth/user-not-found',
        'auth/invalid-credential',
        'auth/invalid-login-credentials'
      ];

      if (credentialErrorCodes.includes(error?.code)) {
        const nextAttempts = failedAttempts + 1;

        if (nextAttempts >= MAX_LOGIN_ATTEMPTS) {
          setFailedAttempts(0);
          setLockedUntil(
            Date.now() + LOGIN_LOCK_DURATION_MS
          );

          setMessage(
            `Error: Too many failed attempts. Please wait ${Math.ceil(
              LOGIN_LOCK_DURATION_MS / 1000
            )}s before trying again.`
          );
        } else {
          setFailedAttempts(nextAttempts);

          setMessage('Error: Invalid email or password.');
        }

        return;
      }

      // For anything else (network issues, disabled account, Firebase's
      // own rate limiting, etc.) show a safe, specific message without
      // ever surfacing the raw Firebase error text.
      let errorMessage =
        'Unable to sign in. Please try again.';

      switch (error?.code) {
        case 'auth/too-many-requests':
          errorMessage =
            'Too many attempts. Please wait a moment and try again.';
          break;

        case 'auth/network-request-failed':
          errorMessage =
            'Network error. Please check your internet connection and try again.';
          break;

        case 'auth/user-disabled':
          errorMessage =
            'This account has been disabled. Please contact support.';
          break;

        default:
          break;
      }

      setMessage(`Error: ${errorMessage}`);
    }
  };

  const isSuccess = message === 'Logged in successfully!';

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

        <div className="auth-toggle" role="tablist" aria-label="Authentication">
          <div className="auth-toggle-indicator" aria-hidden="true" />

          <button
            type="button"
            role="tab"
            aria-selected
            className="auth-toggle-button active"
          >
            Login
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={false}
            onClick={onSwitchToSignup}
            className="auth-toggle-button"
          >
            Register
          </button>
        </div>

        {mfaResolver ? (
          <form onSubmit={handleMfaVerification} className="auth-card">
            <div className="auth-eyebrow">TWO-FACTOR AUTHENTICATION</div>

            <h2 className="auth-heading">Verify your identity</h2>

            <p className="auth-intro">
              Enter the 6-digit code from your authenticator app to continue.
            </p>

            <div className="modal-icon-circle brand" style={{ width: 58, height: 58, margin: '0 auto 22px' }}>
              <CheckCircle2 size={30} strokeWidth={1.8} />
            </div>

            <div className="field-group">
              <label className="field-label">Authenticator code</label>

              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="Enter 6-digit code"
                value={mfaCode}
                onChange={(e) =>
                  setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                className="field-input mfa-input"
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={mfaLoading}
            >
              {mfaLoading ? 'Verifying...' : 'Verify'}
            </button>

            {message && (
              <div className="inline-feedback error">
                <CircleAlert size={18} strokeWidth={1.9} />
                <span>{message}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleBackFromMfa}
              className="link-btn"
              style={{ alignSelf: 'center', marginTop: '18px' }}
              disabled={mfaLoading}
            >
              ← Back to sign in
            </button>
          </form>
        ) : (
        <form onSubmit={handleLogin} className="auth-card">
          <div className="auth-eyebrow">WELCOME BACK</div>

          <h2 className="auth-heading">Sign in</h2>

          <p className="auth-intro">
            Sign in to continue to your AI-powered legal assistance dashboard.
          </p>

          <div className="field-group">
            <label className="field-label">Email address</label>

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field-input"
              required
            />
          </div>

          <div className="field-group">
            <label className="field-label">Password</label>

            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field-input"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="icon-btn"
                aria-label={
                  showPassword ? 'Hide password' : 'Show password'
                }
              >
                {showPassword ? (
                  <EyeOff size={19} strokeWidth={1.8} />
                ) : (
                  <Eye size={19} strokeWidth={1.8} />
                )}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onForgotPassword}
            className="link-btn"
            style={{ alignSelf: 'flex-end', margin: '-4px 0 20px' }}
          >
            Forgot password?
          </button>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            Sign in
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
        </form>

        )}
        <p className="footnote">
          Your information is securely handled through the platform's
          authentication system.
        </p>
      </div>
    </div>
  );
};

export default Login;
