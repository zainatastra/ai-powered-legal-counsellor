import React, {
  useEffect,
  useRef,
  useState
} from 'react';

import { auth } from './firebase';

const API_BASE_URL = 'http://localhost:3001';

const OTP_LENGTH = 5;

const RESEND_COOLDOWN = 30;

/*
 * SECURITY: only ever talk to the verification backend over HTTPS (or
 * localhost during development). Prevents the ID token / OTP from ever
 * being sent in plaintext if this is deployed with a misconfigured
 * http:// API_BASE_URL.
 */
const isSecureApiEndpoint = (url) => {
  try {
    const parsed = new URL(url);

    return (
      parsed.protocol === 'https:' ||
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1'
    );
  } catch {
    return false;
  }
};

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
        if (onVerified) {
          onVerified(refreshedUser);
        }

        return;
      }

      if (!isSecureApiEndpoint(API_BASE_URL)) {
        throw new Error(
          'Verification service endpoint is not securely configured.'
        );
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
        if (onVerified) {
          onVerified(
            refreshedUser
          );
        }

        return;
      }

      if (!isSecureApiEndpoint(API_BASE_URL)) {
        throw new Error(
          'Verification service endpoint is not securely configured.'
        );
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
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.icon}>
            ✓
          </div>

          <div style={styles.eyebrow}>
            EMAIL VERIFICATION
          </div>

          <h1 style={styles.heading}>
            Check your inbox
          </h1>

          <p style={styles.description}>
            Sending your verification code...
          </p>

          <div style={styles.email}>
            {displayedEmail}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main UI
  // ---------------------------------------------------------------------------

  return (
    <div style={styles.container}>
      <div style={styles.overlay} />

      <div style={styles.card}>
        <div style={styles.icon}>
          ✓
        </div>

        <div style={styles.eyebrow}>
          EMAIL VERIFICATION
        </div>

        <h1 style={styles.heading}>
          Check your inbox
        </h1>

        <p style={styles.description}>
          We sent a 5-digit code to
        </p>

        <div style={styles.email}>
          {displayedEmail}
        </div>

        <p style={styles.helperText}>
          Enter the code below to verify
          your email address.
        </p>

        <div
          style={styles.otpContainer}
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
                style={{
                  ...styles.otpInput,
                  ...(digit
                    ? styles.otpInputFilled
                    : {})
                }}
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
          style={{
            ...styles.primaryButton,
            ...(verifying ||
            otpLockSeconds > 0 ||
            otp.some(
              (digit) =>
                !digit
            )
              ? styles.disabledButton
              : {})
          }}
        >
          {verifying
            ? 'Verifying...'
            : otpLockSeconds > 0
              ? `Try again in ${otpLockSeconds}s`
              : 'Continue'}
        </button>

        {message && (
          <div
            style={
              styles.successMessage
            }
          >
            {message}
          </div>
        )}

        {error && (
          <div
            style={
              styles.errorMessage
            }
          >
            {error}
          </div>
        )}

        <div style={styles.resendArea}>
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
              style={
                styles.resendButton
              }
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
          style={
            styles.backButton
          }
        >
          ← Back to sign up
        </button>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const styles = {
  container: {
    position: 'relative',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    boxSizing: 'border-box',
    fontFamily:
      'Saira, sans-serif',
    background:
      '#F7F8FA'
  },

  overlay: {
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(circle at top, rgba(184,146,74,0.07), transparent 42%)',
    pointerEvents: 'none'
  },

  card: {
    position: 'relative',
    width: '100%',
    maxWidth: '500px',
    boxSizing: 'border-box',
    padding: '44px 42px',
    background:
      '#FFFFFF',
    border:
      '1px solid #E4E7EC',
    borderRadius: '22px',
    boxShadow:
      '0 22px 60px rgba(16,36,62,0.09)',
    textAlign:
      'center'
  },

  icon: {
    width: '58px',
    height: '58px',
    margin:
      '0 auto 20px',
    borderRadius:
      '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background:
      '#10243E',
    color:
      '#D0AE6B',
    fontSize: '25px',
    fontWeight: '700'
  },

  eyebrow: {
    marginBottom: '10px',
    color: '#B8924A',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '2px'
  },

  heading: {
    margin:
      '0 0 14px',
    color:
      '#10243E',
    fontSize: '30px',
    fontWeight: '700'
  },

  description: {
    margin:
      '0 auto 4px',
    maxWidth: '390px',
    color:
      '#7A8492',
    fontSize: '14px',
    lineHeight: '1.65'
  },

  email: {
    margin:
      '10px 0 20px',
    padding:
      '13px 16px',
    background:
      '#F3F5F8',
    border:
      '1px solid #E0E4EA',
    borderRadius:
      '10px',
    color:
      '#172A46',
    fontSize: '14px',
    fontWeight: '600',
    wordBreak:
      'break-word'
  },

  helperText: {
    margin:
      '0 0 24px',
    color:
      '#7A8492',
    fontSize: '14px',
    lineHeight:
      '1.6'
  },

  otpContainer: {
    display: 'flex',
    justifyContent:
      'center',
    gap: '10px',
    margin:
      '0 auto 24px'
  },

  otpInput: {
    width: '58px',
    height: '62px',
    boxSizing:
      'border-box',
    border:
      '1px solid #D7DDE6',
    borderRadius:
      '12px',
    background:
      '#FFFFFF',
    color:
      '#10243E',
    fontFamily:
      'Saira, sans-serif',
    fontSize: '25px',
    fontWeight: '700',
    textAlign:
      'center',
    outline:
      'none',
    transition:
      'border-color 160ms ease, box-shadow 160ms ease, background 160ms ease'
  },

  otpInputFilled: {
    border:
      '1px solid #10243E',
    background:
      '#F7F9FC',
    boxShadow:
      '0 0 0 2px rgba(16,36,62,0.05)'
  },

  primaryButton: {
    width: '100%',
    minHeight: '50px',
    border:
      'none',
    borderRadius:
      '10px',
    background:
      '#10243E',
    color:
      '#FFFFFF',
    fontFamily:
      'Saira, sans-serif',
    fontSize: '14px',
    fontWeight: '600',
    cursor:
      'pointer'
  },

  disabledButton: {
    opacity:
      0.55,
    cursor:
      'not-allowed'
  },

  resendArea: {
    minHeight: '25px',
    marginTop:
      '22px',
    color:
      '#8A929D',
    fontSize: '14px'
  },

  resendButton: {
    border:
      'none',
    background:
      'transparent',
    color:
      '#10243E',
    fontFamily:
      'Saira, sans-serif',
    fontSize: '14px',
    fontWeight: '600',
    cursor:
      'pointer',
    padding: 0
  },

  successMessage: {
    marginTop:
      '18px',
    padding:
      '11px 14px',
    borderRadius:
      '9px',
    background:
      '#F1F8F3',
    border:
      '1px solid #D5E8DA',
    color:
      '#2E6B4A',
    fontSize: '13px',
    lineHeight:
      '1.5'
  },

  errorMessage: {
    marginTop:
      '18px',
    padding:
      '11px 14px',
    borderRadius:
      '9px',
    background:
      '#FFF5F3',
    border:
      '1px solid #F0D5CF',
    color:
      '#9A4639',
    fontSize: '13px',
    lineHeight:
      '1.5'
  },

  backButton: {
    marginTop:
      '20px',
    border:
      'none',
    background:
      'transparent',
    color:
      '#7A8492',
    fontFamily:
      'Saira, sans-serif',
    fontSize: '13px',
    cursor:
      'pointer'
  }
};

export default EmailVerification;