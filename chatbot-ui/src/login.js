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
    <div style={styles.container}>
      <div style={styles.backgroundGlow}></div>

      <div style={styles.shell}>
        <div style={styles.brand}>
          <div style={styles.brandMark}>
            <Scale size={24} strokeWidth={1.8} />
          </div>

          <div>
            <div style={styles.brandName}>AI-Powered Legal Counsellor</div>
            <div style={styles.brandSub}>LEGAL ASSISTANCE PLATFORM</div>
          </div>
        </div>

        <div
          style={styles.authToggle}
          role="tablist"
          aria-label="Authentication"
        >
          <div
            className="auth-toggle-indicator login-indicator"
            aria-hidden="true"
          />

          <button
            type="button"
            role="tab"
            aria-selected
            style={{ ...styles.toggleButton, ...styles.activeToggle }}
            className="auth-toggle-button active"
          >
            Login
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={false}
            onClick={onSwitchToSignup}
            style={styles.toggleButton}
            className="auth-toggle-button"
          >
            Register
          </button>
        </div>

        {mfaResolver ? (
          <form
            onSubmit={handleMfaVerification}
            style={styles.form}
            className="login-form mfa-form"
          >
            <div style={styles.eyebrow}>TWO-FACTOR AUTHENTICATION</div>

            <h2 style={styles.heading}>Verify your identity</h2>

            <p style={styles.intro}>
              Enter the 6-digit code from your authenticator app to continue.
            </p>

            <div style={styles.mfaIcon}>
              <CheckCircle2 size={30} strokeWidth={1.8} />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Authenticator code</label>

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
                style={{ ...styles.input, ...styles.mfaInput }}
                className="login-input mfa-input"
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              style={{
                ...styles.button,
                ...(mfaLoading ? styles.disabledButton : {})
              }}
              className="login-button"
              disabled={mfaLoading}
            >
              {mfaLoading ? 'Verifying...' : 'Verify'}
            </button>

            {message && (
              <div style={{ ...styles.message, ...styles.errorMessage }}>
                <CircleAlert size={18} strokeWidth={1.9} />
                <span>{message}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleBackFromMfa}
              style={styles.backButton}
              className="login-forgot"
              disabled={mfaLoading}
            >
              ← Back to sign in
            </button>
          </form>
        ) : (
        <form
          onSubmit={handleLogin}
          style={styles.form}
          className="login-form"
        >
          <div style={styles.eyebrow}>WELCOME BACK</div>

          <h2 style={styles.heading}>Sign in</h2>

          <p style={styles.intro}>
            Sign in to continue to your AI-powered legal assistance dashboard.
          </p>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email address</label>

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              className="login-input"
              required
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>

            <div style={styles.passwordContainer}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.passwordInput}
                className="login-input"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                className="login-eye-button"
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
            style={styles.forgotText}
            className="login-forgot"
          >
            Forgot password?
          </button>

          <button
            type="submit"
            style={styles.button}
            className="login-button"
          >
            Sign in
          </button>

          {message && (
            <div
              style={{
                ...styles.message,
                ...(isSuccess
                  ? styles.successMessage
                  : styles.errorMessage)
              }}
            >
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
        <p style={styles.footer}>
          Your information is securely handled through the platform's
          authentication system.
        </p>
      </div>

      <style>{`

        .auth-toggle-indicator {
          position: absolute;
          top: 5px;
          bottom: 5px;
          left: 5px;
          width: calc(50% - 7px);
          border-radius: 999px;
          background: #FFFFFF;
          box-shadow: 0 3px 12px rgba(16, 36, 62, 0.12);
          pointer-events: none;
          z-index: 0;
          will-change: transform;
          transition: transform 360ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .auth-toggle-indicator.register-indicator {
          transform: translateX(100%);
        }

        .auth-toggle-indicator.login-indicator {
          transform: translateX(0);
        }

        .auth-toggle-button {
          transition:
            background 180ms ease,
            color 180ms ease,
            box-shadow 180ms ease,
            transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .auth-toggle-button:hover {
          color: #10243E !important;
        }

        .auth-toggle-button.active {
          box-shadow: 0 3px 12px rgba(16, 36, 62, 0.12);
        }

        .login-input {
          transition:
            border-color 180ms ease,
            box-shadow 180ms ease,
            background 180ms ease;
        }

        .login-input::placeholder {
          color: #9AA1AB;
          opacity: 1;
        }

        .login-input:focus {
          border-color: #B8924A !important;
          box-shadow: 0 0 0 3px rgba(184, 146, 74, 0.12);
          background: #FFFFFF !important;
        }

        .login-button {
          transition:
            background 180ms ease,
            transform 180ms ease,
            box-shadow 180ms ease;
        }

        .login-button:hover {
          background: #172A46 !important;
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(13, 31, 55, 0.18);
        }

        .login-button:active {
          transform: translateY(0);
        }

        .login-eye-button {
          transition: color 160ms ease, background 160ms ease;
        }

        .login-eye-button:hover {
          color: #10243E !important;
          background: rgba(16, 36, 62, 0.05) !important;
        }

        .login-forgot {
          transition: color 160ms ease, background 160ms ease;
        }

        .login-forgot:hover {
          color: #8F6C2F !important;
        }

        .mfa-input {
          text-align: center;
          letter-spacing: 6px;
          font-size: 20px !important;
          font-weight: 600;
        }

        .mfa-icon {
          width: 58px;
          height: 58px;
          margin: 0 auto 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #10243E;
          color: #D0AE6B;
        }

        .login-button:disabled {
          cursor: not-allowed;
          opacity: 0.7;
          transform: none !important;
          box-shadow: none !important;
        }

        .login-forgot:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        @media (max-width: 600px) {
          .login-form {
            padding: 30px 22px !important;
          }

          .login-container {
            padding: 28px 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    minHeight: '100vh',
    width: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#FCFBF8',
    fontFamily: "'Saira', 'Segoe UI', sans-serif",
    color: '#172033',
    overflow: 'auto',
    padding: '34px 20px'
  },

  backgroundGlow: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background:
      'radial-gradient(circle at 50% 10%, rgba(184,146,74,0.10), transparent 34%), linear-gradient(180deg, #FCFBF8 0%, #F7F5F0 100%)'
  },

  shell: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '560px',
    boxSizing: 'border-box'
  },

  brand: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '13px',
    marginBottom: '22px'
  },

  brandMark: {
    width: '48px',
    height: '48px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#10243E',
    color: '#D0AE6B',
    boxShadow: '0 8px 20px rgba(16,36,62,0.14)'
  },

  brandName: {
    color: '#10243E',
    fontFamily: "'Jost', sans-serif",
    fontSize: '18px',
    fontWeight: '700',
    letterSpacing: '-0.25px'
  },

  brandSub: {
    marginTop: '4px',
    color: '#8B929D',
    fontFamily: "'Jost', sans-serif",
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '1.4px'
  },

  authToggle: {
    position: 'relative',
    width: '100%',
    height: '58px',
    boxSizing: 'border-box',
    padding: '5px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4px',
    background: '#F0F1F3',
    border: '1px solid #E0E3E8',
    borderRadius: '999px',
    marginBottom: '16px'
  },

  authToggleIndicator: {
    position: 'absolute',
    top: '5px',
    bottom: '5px',
    left: '5px',
    width: 'calc(50% - 7px)',
    borderRadius: '999px',
    background: '#FFFFFF',
    boxShadow: '0 3px 12px rgba(16, 36, 62, 0.12)',
    pointerEvents: 'none',
    zIndex: 0
  },

  toggleButton: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    height: '100%',
    border: 'none',
    borderRadius: '999px',
    background: 'transparent',
    color: '#687589',
    fontFamily: "'Jost', sans-serif",
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    outline: 'none'
  },

  activeToggle: {
    background: 'transparent',
    color: '#10243E',
    position: 'relative',
    zIndex: 1
  },

  form: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '38px',
    background: 'rgba(255,255,255,0.98)',
    border: '1px solid #E4DED4',
    borderRadius: '30px',
    boxShadow: '0 20px 55px rgba(11, 23, 42, 0.08)',
    display: 'flex',
    flexDirection: 'column'
  },

  eyebrow: {
    color: '#B8924A',
    fontFamily: "'Jost', sans-serif",
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '1.8px',
    marginBottom: '9px'
  },

  heading: {
    margin: 0,
    color: '#10243E',
    fontFamily: "'Jost', sans-serif",
    fontSize: '32px',
    lineHeight: 1.15,
    fontWeight: '700',
    letterSpacing: '-0.8px'
  },

  intro: {
    margin: '10px 0 28px',
    color: '#727C8B',
    fontSize: '15px',
    lineHeight: 1.55
  },

  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '18px'
  },

  label: {
    marginBottom: '8px',
    color: '#304158',
    fontFamily: "'Jost', sans-serif",
    fontSize: '14px',
    fontWeight: '600'
  },

  input: {
    width: '100%',
    boxSizing: 'border-box',
    height: '50px',
    padding: '0 17px',
    borderRadius: '999px',
    border: '1px solid #D7DDE5',
    background: '#FAFAF9',
    color: '#172033',
    fontFamily: "'Saira', 'Segoe UI', sans-serif",
    fontSize: '15px',
    outline: 'none'
  },

  passwordContainer: {
    position: 'relative',
    width: '100%'
  },

  passwordInput: {
    width: '100%',
    boxSizing: 'border-box',
    height: '50px',
    padding: '0 54px 0 17px',
    borderRadius: '999px',
    border: '1px solid #D7DDE5',
    background: '#FAFAF9',
    color: '#172033',
    fontFamily: "'Saira', 'Segoe UI', sans-serif",
    fontSize: '15px',
    outline: 'none'
  },

  eyeButton: {
    position: 'absolute',
    right: '7px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '38px',
    height: '38px',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: '999px',
    background: 'transparent',
    color: '#6C7889',
    cursor: 'pointer'
  },

  forgotText: {
    alignSelf: 'flex-end',
    margin: '-3px 0 20px',
    padding: '7px 12px',
    border: 'none',
    borderRadius: '999px',
    background: 'transparent',
    color: '#6A7788',
    fontFamily: "'Jost', sans-serif",
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  button: {
    width: '100%',
    height: '52px',
    padding: '0 20px',
    background: '#10243E',
    color: '#FFFFFF',
    fontFamily: "'Jost', sans-serif",
    fontSize: '15px',
    fontWeight: '600',
    border: '1px solid #10243E',
    borderRadius: '999px',
    cursor: 'pointer',
    outline: 'none'
  },

  message: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    margin: '16px 0 0',
    padding: '12px 15px',
    borderRadius: '999px',
    fontSize: '14px',
    lineHeight: 1.45,
    textAlign: 'center'
  },

  successMessage: {
    color: '#2E6B4A',
    background: '#F1F8F3',
    border: '1px solid #D6EBDD'
  },

  errorMessage: {
    color: '#9A4141',
    background: '#FCF2F2',
    border: '1px solid #F0D9D9'
  },

  mfaIcon: {
    width: '58px',
    height: '58px',
    margin: '0 auto 22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    background: '#10243E',
    color: '#D0AE6B'
  },

  mfaInput: {
    textAlign: 'center',
    letterSpacing: '6px',
    fontSize: '20px',
    fontWeight: '600'
  },

  disabledButton: {
    opacity: 0.7,
    cursor: 'not-allowed'
  },

  backButton: {
    alignSelf: 'center',
    marginTop: '18px',
    padding: '7px 12px',
    border: 'none',
    borderRadius: '999px',
    background: 'transparent',
    color: '#6A7788',
    fontFamily: "'Jost', sans-serif",
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  footer: {
    margin: '17px auto 0',
    maxWidth: '460px',
    color: '#8D9298',
    fontSize: '12px',
    lineHeight: 1.5,
    textAlign: 'center'
  }
};

export default Login;