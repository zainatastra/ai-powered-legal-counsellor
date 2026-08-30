import React, {
  useEffect,
  useRef,
  useState
} from 'react';

import { auth, db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

/*
 * SECURITY FIX: this was previously an absolute URL hardcoded to
 * 'http://localhost:3001' -- meaning it would silently keep pointing at
 * localhost (and fail outright) in any real deployment. It's now a
 * same-origin relative path, matching how the rest of the app already
 * talks to the backend (see chatbot.jsx's fetch('/api/legal-chat')).
 * A relative path always inherits the page's own protocol, so it can
 * never end up sending the ID token/OTP over a misconfigured http://
 * endpoint in production -- which also means the previous
 * isSecureApiEndpoint(...) guard is no longer needed and has been removed.
 */
const API_BASE_URL = '';

const OTP_LENGTH = 5;

// FIX: Signup.js saves the entered first/last name to localStorage
// ('alc_pending_verification_profile'), intending it to be written to the
// user's Firestore profile once email verification completes -- but
// nothing ever actually did that write, so users/{uid} never got a
// firstName/lastName, and the UI silently fell back to an email-derived
// name everywhere. This performs that write and then clears the
// localStorage keys, since they're no longer needed after this.
const persistPendingProfile = async (uid) => {
  try {
    const raw = localStorage.getItem('alc_pending_verification_profile');
    if (!raw) return;

    const profile = JSON.parse(raw);
    const firstName = (profile?.firstName || '').trim();
    const lastName = (profile?.lastName || '').trim();

    if (firstName || lastName) {
      await setDoc(
        doc(db, 'users', uid),
        { firstName, lastName },
        { merge: true }
      );
    }
  } catch (error) {
    console.error('Failed to persist pending profile:', error);
  } finally {
    localStorage.removeItem('alc_pending_verification_profile');
    localStorage.removeItem('alc_pending_verification_email');
  }
};

const RESEND_COOLDOWN = 30;

const EmailVerification = ({
  email,
  onVerified,
  onBackToLogin
}) => {
  const [otp, setOtp] = useState(
    Array(OTP_LENGTH).fill('')
  );

  const [loading, setLoading] = useState(false);

  const [verifying, setVerifying] =
    useState(false);

  const [resending, setResending] =
    useState(false);

  const [resendTimer, setResendTimer] =
    useState(0);

  const [otpLockSeconds, setOtpLockSeconds] =
    useState(0);

  const [message, setMessage] =
    useState('');

  const [error, setError] =
    useState('');

  const inputRefs = useRef([]);

  const displayedEmail =
    email ||
    auth.currentUser?.email ||
    '';

  // ---------------------------------------------------------------------------
  // Send OTP when verification screen opens
  // ---------------------------------------------------------------------------

  /*
   * React StrictMode intentionally runs effects twice in development.
   * A verification-code request must NEVER be tied directly to an
   * unguarded mount effect because that can generate duplicate emails.
   *
   * The ref prevents duplicate calls during the same mount.
   * The backend also enforces an atomic/idempotent reservation, so
   * remounts or concurrent requests cannot generate multiple OTPs.
   */
  const initialSendStartedRef = useRef(false);

  useEffect(() => {
    if (initialSendStartedRef.current) {
      return;
    }

    initialSendStartedRef.current = true;

    sendVerificationCode(true);
  }, []);

  // ---------------------------------------------------------------------------
  // Resend countdown
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (resendTimer <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      setResendTimer((current) => {
        if (current <= 1) {
          clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendTimer]);

  // ---------------------------------------------------------------------------
  // OTP lockout countdown (brute-force mitigation)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (otpLockSeconds <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      setOtpLockSeconds((current) => {
        if (current <= 1) {
          clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [otpLockSeconds]);

  // ---------------------------------------------------------------------------
  // Focus first OTP field
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [loading]);

  // ---------------------------------------------------------------------------
  // Send OTP
  // ---------------------------------------------------------------------------

  const sendVerificationCode = async (
    initialSend = false
  ) => {
    if (!initialSend) {
      if (resending || resendTimer > 0) {
        return;
      }

      setResending(true);
    }

    setMessage('');
    setError('');

    try {
      const currentUser =
        auth.currentUser;

      if (!currentUser) {
        throw new Error(
          'Your verification session has expired. Please log in again.'
        );
      }

      await currentUser.reload();

      const refreshedUser =
        auth.currentUser;

      if (!refreshedUser) {
        throw new Error(
          'Your verification session has expired. Please log in again.'
        );
      }

      // Already verified
      if (refreshedUser.emailVerified) {
        // Firestore rules check the ID token's email_verified CLAIM, which
        // is different from (and can lag behind) the live emailVerified
        // property just refreshed above -- force the token itself to be
        // reissued, or the write below silently fails permission checks.
        await refreshedUser.getIdToken(true);
        await persistPendingProfile(refreshedUser.uid);

        if (onVerified) {
          onVerified(refreshedUser);
        }

        return;
      }


      const token =
        await refreshedUser.getIdToken(
          true
        );

      const response =
        await fetch(
          `${API_BASE_URL}/api/auth/send-verification`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body: JSON.stringify({
              idToken: token,
              initialSend,
              forceResend: !initialSend
            })
          }
        );

      let data = {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        const sendError = new Error(
          data?.message ||
          'The verification code could not be sent.'
        );

        sendError.retryAfterSeconds =
          Number.isFinite(
            Number(data?.sendBlockedForSeconds)
          )
            ? Number(data.sendBlockedForSeconds)
            : null;

        throw sendError;
      }

      setOtp(
        Array(OTP_LENGTH).fill('')
      );

      setResendTimer(
        Number.isFinite(
          Number(data?.resendAvailableIn)
        )
          ? Number(data.resendAvailableIn)
          : RESEND_COOLDOWN
      );

      setMessage(
        data?.alreadySent
          ? 'Your verification code is already active in your inbox.'
          : initialSend
            ? 'We sent a verification code to your email.'
            : 'A new verification code has been sent.'
      );

      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      console.error(
        'Send verification code failed:',
        err
      );

      // Custom errors we throw ourselves (no `.code`) have safe, specific
      // messages. Raw Firebase SDK errors (`.code` starting with auth/...)
      // are replaced with a generic message so internal details aren't
      // exposed to the user.
      setError(
        err?.code
          ? 'The verification code could not be sent. Please try again.'
          : err?.message ||
            'The verification code could not be sent. Please try again.'
      );

      // Reflect the server's actual block/cooldown countdown (it is the
      // authoritative source - e.g. the 30-minute block after 3 sends).
      if (
        Number.isFinite(
          err?.retryAfterSeconds
        )
      ) {
        setResendTimer(
          err.retryAfterSeconds
        );
      }
    } finally {
      setLoading(false);
      setResending(false);
    }
  };

  // ---------------------------------------------------------------------------
  // OTP input
  // ---------------------------------------------------------------------------

  const handleOtpChange = (
    index,
    value
  ) => {
    const cleanValue =
      value
        .replace(/\D/g, '')
        .slice(0, 1);

    const updatedOtp = [
      ...otp
    ];

    updatedOtp[index] =
      cleanValue;

    setOtp(updatedOtp);

    setError('');
    setMessage('');

    if (
      cleanValue &&
      index <
        OTP_LENGTH - 1
    ) {
      inputRefs.current[
        index + 1
      ]?.focus();
    }

    // Automatically verify when all digits are entered.
    if (
      cleanValue &&
      index === OTP_LENGTH - 1 &&
      updatedOtp.every(
        (digit) => digit !== ''
      )
    ) {
      setTimeout(() => {
        verifyOtp(updatedOtp.join(''));
      }, 100);
    }
  };

  // ---------------------------------------------------------------------------
  // OTP keyboard navigation
  // ---------------------------------------------------------------------------

  const handleOtpKeyDown = (
    index,
    event
  ) => {
    if (
      event.key === 'Backspace' &&
      !otp[index] &&
      index > 0
    ) {
      inputRefs.current[
        index - 1
      ]?.focus();
    }

    if (
      event.key === 'ArrowLeft' &&
      index > 0
    ) {
      inputRefs.current[
        index - 1
      ]?.focus();
    }

    if (
      event.key === 'ArrowRight' &&
      index <
        OTP_LENGTH - 1
    ) {
      inputRefs.current[
        index + 1
      ]?.focus();
    }
  };

  // ---------------------------------------------------------------------------
  // Paste OTP
  // ---------------------------------------------------------------------------

  const handleOtpPaste = (
    event
  ) => {
    event.preventDefault();

    const pasted =
      event.clipboardData
        .getData('text')
        .replace(/\D/g, '')
        .slice(0, OTP_LENGTH);

    if (!pasted) {
      return;
    }

    const updatedOtp =
      Array(OTP_LENGTH)
        .fill('')
        .map(
          (_, index) =>
            pasted[index] || ''
        );

    setOtp(updatedOtp);
    setError('');
    setMessage('');

    const nextIndex =
      Math.min(
        pasted.length,
        OTP_LENGTH - 1
      );

    setTimeout(() => {
      inputRefs.current[
        nextIndex
      ]?.focus();
    }, 0);

    if (
      pasted.length ===
      OTP_LENGTH
    ) {
      setTimeout(() => {
        verifyOtp(pasted);
      }, 100);
    }
  };

  // ---------------------------------------------------------------------------
  // Verify OTP
  // ---------------------------------------------------------------------------

  const verifyOtp = async (
    providedOtp = null
  ) => {
    const code =
      providedOtp ||
      otp.join('');

    if (
      !/^\d{5}$/.test(code)
    ) {
      setError(
        'Please enter the 5-digit verification code.'
      );

      return;
    }

    if (verifying) {
      return;
    }

    // Brute-force mitigation: block further guesses for a cooldown period
    // after too many wrong codes in a row.
    if (otpLockSeconds > 0) {
      setError(
        `Too many incorrect attempts. Please wait ${otpLockSeconds}s and try again.`
      );

      return;
    }

    setVerifying(true);
    setMessage('');
    setError('');

    try {
      const currentUser =
        auth.currentUser;

      if (!currentUser) {
        throw new Error(
          'Your verification session has expired. Please log in again.'
        );
      }

      await currentUser.reload();

      const refreshedUser =
        auth.currentUser;

      if (!refreshedUser) {
        throw new Error(
          'Your verification session has expired. Please log in again.'
        );
      }

      if (
        refreshedUser.emailVerified
      ) {
        await refreshedUser.getIdToken(true);
        await persistPendingProfile(refreshedUser.uid);

        if (onVerified) {
          onVerified(
            refreshedUser
          );
        }

        return;
      }


      const token =
        await refreshedUser.getIdToken(
          true
        );

      const response =
        await fetch(
          `${API_BASE_URL}/api/auth/verify-otp`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body: JSON.stringify({
              idToken: token,
              otp: code
            })
          }
        );

      let data = {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        const verifyError = new Error(
          data?.message ||
          'The verification code is incorrect.'
        );

        verifyError.retryAfterSeconds =
          Number.isFinite(
            Number(data?.verifyBlockedForSeconds)
          )
            ? Number(data.verifyBlockedForSeconds)
            : null;

        throw verifyError;
      }

      // Refresh Firebase's local user state
      // after Firebase Admin marks the email verified.
      await refreshedUser.reload();

      const verifiedUser =
        auth.currentUser;

      if (
        !verifiedUser?.emailVerified
      ) {
        throw new Error(
          'Your email was verified, but the account status has not refreshed yet. Please try again.'
        );
      }

      setMessage(
        'Your email has been verified successfully.'
      );

      setOtp(
        Array(OTP_LENGTH).fill('')
      );

      // Same reasoning as the other two call sites: reload() refreshed the
      // live emailVerified flag, but Firestore rules check the ID token's
      // email_verified CLAIM, which needs its own forced refresh.
      await verifiedUser.getIdToken(true);
      await persistPendingProfile(verifiedUser.uid);

      if (onVerified) {
        setTimeout(() => {
          onVerified(
            verifiedUser
          );
        }, 500);
      }
    } catch (err) {
      console.error(
        'OTP verification failed:',
        err
      );

      setError(
        err?.code
          ? 'The verification code could not be verified. Please try again.'
          : err?.message ||
            'The verification code could not be verified. Please try again.'
      );

      setOtp(
        Array(OTP_LENGTH).fill('')
      );

      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);

      // The server is authoritative on the 3-wrong-guesses / 1-hour lock
      // (it survives reloads and even account deletion+recreation, which
      // a client-only counter cannot). Just reflect what it returned.
      if (
        Number.isFinite(
          err?.retryAfterSeconds
        )
      ) {
        setOtpLockSeconds(
          err.retryAfterSeconds
        );
      }
    } finally {
      setVerifying(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Back to login
  // ---------------------------------------------------------------------------

  const handleBackToLogin =
    () => {
      if (onBackToLogin) {
        onBackToLogin();
      }
    };

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="auth-page">
        <div className="ambient-glow" />
        <div className="auth-shell">
          <div className="auth-card" style={{ textAlign: 'center', alignItems: 'center' }}>
            <div className="modal-icon-circle brand" style={{ width: 58, height: 58, margin: '0 auto 20px', fontSize: '25px', fontWeight: 700 }}>
              ✓
            </div>

            <div className="auth-eyebrow">EMAIL VERIFICATION</div>

            <h1 className="auth-heading">Check your inbox</h1>

            <p className="auth-intro" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
              <span className="spinner" aria-hidden="true" />
              <span>Sending your verification code...</span>
            </p>

            <div className="info-chip">
              {displayedEmail}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main UI
  // ---------------------------------------------------------------------------

  return (
    <div className="auth-page">
      <div className="ambient-glow" />

      <div className="auth-shell">
        <div className="auth-card" style={{ textAlign: 'center', alignItems: 'center' }}>
          <div className="modal-icon-circle brand" style={{ width: 58, height: 58, margin: '0 auto 20px', fontSize: '25px', fontWeight: 700 }}>
            ✓
          </div>

          <div className="auth-eyebrow">
            EMAIL VERIFICATION
          </div>

          <h1 className="auth-heading">
            Check your inbox
          </h1>

          <p className="auth-intro" style={{ margin: '0 auto 4px', maxWidth: '390px' }}>
            We sent a 5-digit code to
          </p>

          <div className="info-chip">
            {displayedEmail}
          </div>

          <p className="auth-intro" style={{ margin: '0 0 24px' }}>
            Enter the code below to verify
            your email address.
          </p>

          <div
            className="otp-row"
            onPaste={handleOtpPaste}
          >
            {otp.map(
              (digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    inputRefs.current[
                      index
                    ] = element;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={
                    index === 0
                      ? 'one-time-code'
                      : 'off'
                  }
                  maxLength={1}
                  value={digit}
                  onChange={(event) =>
                    handleOtpChange(
                      index,
                      event.target.value
                    )
                  }
                  onKeyDown={(event) =>
                    handleOtpKeyDown(
                      index,
                      event
                    )
                  }
                  disabled={verifying || otpLockSeconds > 0}
                  aria-label={`Verification digit ${index + 1}`}
                  className={`otp-input ${digit ? 'filled' : ''}`}
                />
              )
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              verifyOtp()
            }
            disabled={
              verifying ||
              otpLockSeconds > 0 ||
              otp.some(
                (digit) =>
                  !digit
              )
            }
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
          >
            {verifying
              ? 'Verifying...'
              : otpLockSeconds > 0
                ? `Try again in ${otpLockSeconds}s`
                : 'Continue'}
          </button>

          {message && (
            <div className="inline-feedback success" style={{ width: '100%', boxSizing: 'border-box' }}>
              {message}
            </div>
          )}

          {error && (
            <div className="inline-feedback error" style={{ width: '100%', boxSizing: 'border-box' }}>
              {error}
            </div>
          )}

          <div style={{ minHeight: '25px', marginTop: '22px', color: 'var(--legal-muted)', fontSize: 'var(--fs-md)' }}>
            {resendTimer > 0 ? (
              <span>
                Resend code in{' '}
                <strong>
                  {resendTimer}s
                </strong>
              </span>
            ) : (
              <button
                type="button"
                onClick={() =>
                  sendVerificationCode(
                    false
                  )
                }
                disabled={resending}
                className="link-btn"
              >
                {resending
                  ? 'Sending...'
                  : 'Resend code'}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={
              handleBackToLogin
            }
            className="link-btn"
            style={{ marginTop: '20px' }}
          >
            ← Back to sign up
          </button>
        </div>
      </div>
    </div>
  );
};
export default EmailVerification;
