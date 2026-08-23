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
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';

const Signup = ({
  onSignupComplete,
  onSwitchToLogin
}) => {
  const [firstName, setFirstName] =
    useState('');

  const [lastName, setLastName] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [submitting, setSubmitting] =
    useState(false);

  // Lightweight client-side throttle: slows down rapid repeated signup
  // submissions, which otherwise let anyone spam arbitrary email
  // addresses with verification emails, or rapidly enumerate which
  // emails already have accounts.
  const [lastAttemptAt, setLastAttemptAt] =
    useState(0);

  const MIN_SIGNUP_INTERVAL_MS = 5000;

  const handleSignup = async (e) => {
    e.preventDefault();

    if (submitting) {
      return;
    }

    const now = Date.now();

    if (now - lastAttemptAt < MIN_SIGNUP_INTERVAL_MS) {
      setMessage(
        'Error: Please wait a few seconds before trying again.'
      );

      return;
    }

    setLastAttemptAt(now);

    setMessage('');
    setSubmitting(true);

    const cleanFirstName =
      firstName.trim();

    const cleanLastName =
      lastName.trim();

    const cleanEmail =
      email.trim().toLowerCase();

    try {
      /*
       * ----------------------------------------------------------------------
       * STEP 1
       * Create the Firebase Authentication account.
       *
       * Firebase automatically signs the newly-created user in.
       *
       * We intentionally keep the user signed in because the OTP
       * verification screen needs the authenticated Firebase user.
       * ----------------------------------------------------------------------
       */

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

      const user =
        userCredential.user;

      /*
       * ----------------------------------------------------------------------
       * STEP 2
       * Store the profile information temporarily.
       *
       * We DO NOT write to Firestore here.
       *
       * The previous implementation attempted to create the Firestore
       * profile immediately after signup. If the Firestore rules require
       * verified users, that caused:
       *
       * FirebaseError: Missing or insufficient permissions.
       *
       * The profile can be created after OTP verification.
       * ----------------------------------------------------------------------
       */

      localStorage.setItem(
        'alc_pending_verification_email',
        cleanEmail
      );

      localStorage.setItem(
        'alc_pending_verification_profile',
        JSON.stringify({
          firstName: cleanFirstName,
          lastName: cleanLastName,
          email: cleanEmail
        })
      );

      /*
       * ----------------------------------------------------------------------
       * STEP 3
       * Make sure the newly-created Firebase user is available.
       *
       * EmailVerification.js will handle sending the OTP through our
       * backend/Resend integration.
       * ----------------------------------------------------------------------
       */

      if (!user) {
        throw new Error(
          'The account was created but the authentication session could not be established.'
        );
      }

      /*
       * ----------------------------------------------------------------------
       * STEP 4
       * Move directly to the OTP verification screen.
       *
       * DO NOT:
       *
       * - signOut()
       * - redirect to login
       * - redirect to chatbot
       * - call the verification-email endpoint here
       *
       * EmailVerification.js handles the OTP flow.
       * ----------------------------------------------------------------------
       */

      setMessage(
        'Account created successfully. Please verify your email.'
      );

      if (onSignupComplete) {
        onSignupComplete(
          cleanEmail
        );
      }
    } catch (error) {
      console.error(
        'Signup failed:',
        error
      );

      /*
       * ----------------------------------------------------------------------
       * "email-already-in-use" can legitimately mean two different things:
       *
       * 1. The email belongs to a fully verified account -> tell the user
       *    to log in.
       *
       * 2. The email belongs to an account that was created by a PREVIOUS
       *    signup attempt but was never OTP-verified (e.g. the user closed
       *    the verification screen). Firebase already created that account,
       *    so createUserWithEmailAndPassword will always fail for it, even
       *    though the user never finished signing up.
       *
       * Without handling case 2, the account is a permanent dead end: it
       * can't be re-created (already exists) and can't log in (unverified).
       *
       * We detect case 2 by attempting to sign in with the credentials the
       * user just typed. If that succeeds and the account is unverified,
       * we resume the OTP flow instead of showing a dead-end error.
       * ----------------------------------------------------------------------
       */

      if (error?.code === 'auth/email-already-in-use') {
        try {
          const signInResult =
            await signInWithEmailAndPassword(
              auth,
              cleanEmail,
              password
            );

          await signInResult.user.reload();

          if (!auth.currentUser?.emailVerified) {
            // Unfinished signup - resume OTP verification.
            localStorage.setItem(
              'alc_pending_verification_email',
              cleanEmail
            );

            localStorage.setItem(
              'alc_pending_verification_profile',
              JSON.stringify({
                firstName: cleanFirstName,
                lastName: cleanLastName,
                email: cleanEmail
              })
            );

            setMessage(
              'You already started creating this account. Please verify your email.'
            );

            if (onSignupComplete) {
              onSignupComplete(cleanEmail);
            }

            setSubmitting(false);
            return;
          }

          // Account exists and is already verified - don't leave the
          // user silently signed in from the signup screen.
          await signOut(auth);
        } catch (signInError) {
          console.error(
            'Resume-verification sign-in check failed:',
            signInError
          );
          // Falls through to the generic "already exists" message below,
          // e.g. because the password typed this time doesn't match.
        }
      }

      let errorMessage =
        'Unable to create your account. Please try again.';

      switch (error?.code) {
        case 'auth/email-already-in-use':
          errorMessage =
            'An account with this email already exists. Please log in instead.';
          break;

        case 'auth/invalid-email':
          errorMessage =
            'Please enter a valid email address.';
          break;

        case 'auth/weak-password':
          errorMessage =
            'Password is too weak. Please choose a stronger password.';
          break;

        case 'auth/network-request-failed':
          errorMessage =
            'Network error. Please check your internet connection and try again.';
          break;

        case 'auth/operation-not-allowed':
          errorMessage =
            'Email and password registration is currently disabled.';
          break;

        case 'auth/too-many-requests':
          errorMessage =
            'Too many attempts. Please wait a moment and try again.';
          break;

        default:
          /*
           * Only surface error.message for errors WE threw ourselves
           * (e.g. the custom Error above with no `.code`). Raw Firebase
           * SDK errors carry a `.code` and their message text can expose
           * internal details, so those fall back to the generic message
           * instead of being shown verbatim.
           */
          if (error?.message && !error?.code) {
            errorMessage =
              error.message;
          }
          break;
      }

      setMessage(
        `Error: ${errorMessage}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isSuccess =
    message.startsWith(
      'Account created successfully.'
    );

  return (
    <div style={styles.container}>
      <div
        style={styles.backgroundGlow}
      />

      <div style={styles.shell}>

        {/* ---------------------------------------------------------------- */}
        {/* BRAND                                                            */}
        {/* ---------------------------------------------------------------- */}

        <div style={styles.brand}>
          <div style={styles.brandMark}>
            <Scale
              size={24}
              strokeWidth={1.8}
            />
          </div>

          <div>
            <div style={styles.brandName}>
              AI-Powered Legal Counsellor
            </div>

            <div style={styles.brandSub}>
              LEGAL ASSISTANCE PLATFORM
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* AUTH TOGGLE                                                      */}
        {/* ---------------------------------------------------------------- */}

        <div
          style={styles.authToggle}
          role="tablist"
          aria-label="Authentication"
        >
          <div
            className="auth-toggle-indicator register-indicator"
            aria-hidden="true"
          />

          <button
            type="button"
            role="tab"
            aria-selected={false}
            onClick={
              onSwitchToLogin
            }
            style={styles.toggleButton}
            className="auth-toggle-button"
          >
            Login
          </button>

          <button
            type="button"
            role="tab"
            aria-selected
            style={{
              ...styles.toggleButton,
              ...styles.activeToggle
            }}
            className="auth-toggle-button active"
          >
            Register
          </button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* FORM                                                             */}
        {/* ---------------------------------------------------------------- */}

        <form
          onSubmit={handleSignup}
          className="signup-form"
          style={styles.form}
        >
          <div style={styles.eyebrow}>
            CREATE ACCOUNT
          </div>

          <h2 style={styles.heading}>
            Create your account
          </h2>

          <p style={styles.intro}>
            Register to access your
            AI-powered legal assistance
            dashboard.
          </p>

          {/* First + Last name */}

          <div
            className="signup-name-row"
            style={styles.nameRow}
          >
            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                First name
              </label>

              <input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) =>
                  setFirstName(
                    e.target.value
                  )
                }
                style={styles.input}
                className="signup-input"
                required
                disabled={submitting}
                autoComplete="given-name"
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                Last name
              </label>

              <input
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) =>
                  setLastName(
                    e.target.value
                  )
                }
                style={styles.input}
                className="signup-input"
                required
                disabled={submitting}
                autoComplete="family-name"
              />
            </div>
          </div>

          {/* Email */}

          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Email address
            </label>

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              style={styles.input}
              className="signup-input"
              required
              disabled={submitting}
              autoComplete="email"
            />
          </div>

          {/* Password */}

          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Password
            </label>

            <div
              style={
                styles.passwordContainer
              }
            >
              <input
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                style={
                  styles.passwordInput
                }
                className="signup-input"
                required
                disabled={submitting}
                autoComplete="new-password"
                minLength={6}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                style={
                  styles.eyeButton
                }
                className="signup-eye-button"
                aria-label={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
                disabled={submitting}
              >
                {showPassword ? (
                  <EyeOff
                    size={19}
                    strokeWidth={1.8}
                  />
                ) : (
                  <Eye
                    size={19}
                    strokeWidth={1.8}
                  />
                )}
              </button>
            </div>
          </div>

          {/* Submit */}

          <button
            type="submit"
            style={{
              ...styles.button,
              ...(submitting
                ? styles.buttonDisabled
                : {})
            }}
            className="signup-button"
            disabled={submitting}
          >
            {submitting
              ? 'Creating account...'
              : 'Create account'}
          </button>

          {/* Message */}

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
                <CheckCircle2
                  size={18}
                  strokeWidth={1.9}
                />
              ) : (
                <CircleAlert
                  size={18}
                  strokeWidth={1.9}
                />
              )}

              <span>
                {message}
              </span>
            </div>
          )}
        </form>

        <p style={styles.footer}>
          Your information is securely
          handled through the platform's
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
          box-shadow:
            0 3px 12px rgba(16, 36, 62, 0.12);
          pointer-events: none;
          z-index: 0;
          will-change: transform;
          transition:
            transform 360ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .auth-toggle-indicator.register-indicator {
          transform: translateX(100%);
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
          box-shadow:
            0 3px 12px rgba(16, 36, 62, 0.12);
        }

        .signup-input {
          transition:
            border-color 180ms ease,
            box-shadow 180ms ease,
            background 180ms ease;
        }

        .signup-input::placeholder {
          color: #9AA1AB;
          opacity: 1;
        }

        .signup-input:focus {
          border-color: #B8924A !important;
          box-shadow:
            0 0 0 3px rgba(184, 146, 74, 0.12);
          background: #FFFFFF !important;
        }

        .signup-button {
          transition:
            background 180ms ease,
            transform 180ms ease,
            box-shadow 180ms ease,
            opacity 180ms ease;
        }

        .signup-button:hover:not(:disabled) {
          background: #172A46 !important;
          transform: translateY(-1px);
          box-shadow:
            0 10px 24px rgba(13, 31, 55, 0.18);
        }

        .signup-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .signup-eye-button {
          transition:
            color 160ms ease,
            background 160ms ease;
        }

        .signup-eye-button:hover:not(:disabled) {
          color: #10243E !important;
          background:
            rgba(16, 36, 62, 0.05) !important;
        }

        @media (max-width: 600px) {

          .signup-form {
            padding: 30px 22px !important;
          }

          .signup-name-row {
            grid-template-columns: 1fr !important;
          }

          .signup-container {
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
    fontFamily:
      "'Saira', 'Segoe UI', sans-serif",
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
    boxShadow:
      '0 8px 20px rgba(16,36,62,0.14)'
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
    background:
      'rgba(255,255,255,0.98)',
    border:
      '1px solid #E4DED4',
    borderRadius: '30px',
    boxShadow:
      '0 20px 55px rgba(11, 23, 42, 0.08)',
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
    margin:
      '10px 0 28px',
    color: '#727C8B',
    fontSize: '15px',
    lineHeight: 1.55
  },

  nameRow: {
    display: 'grid',
    gridTemplateColumns:
      '1fr 1fr',
    gap: '14px'
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
    border:
      '1px solid #D7DDE5',
    background: '#FAFAF9',
    color: '#172033',
    fontFamily:
      "'Saira', 'Segoe UI', sans-serif",
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
    padding:
      '0 54px 0 17px',
    borderRadius: '999px',
    border:
      '1px solid #D7DDE5',
    background: '#FAFAF9',
    color: '#172033',
    fontFamily:
      "'Saira', 'Segoe UI', sans-serif",
    fontSize: '15px',
    outline: 'none'
  },

  eyeButton: {
    position: 'absolute',
    right: '7px',
    top: '50%',
    transform:
      'translateY(-50%)',
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

  button: {
    width: '100%',
    height: '52px',
    marginTop: '4px',
    padding: '0 20px',
    background: '#10243E',
    color: '#FFFFFF',
    fontFamily:
      "'Jost', sans-serif",
    fontSize: '15px',
    fontWeight: '600',
    border:
      '1px solid #10243E',
    borderRadius: '999px',
    cursor: 'pointer',
    outline: 'none'
  },

  buttonDisabled: {
    opacity: 0.65,
    cursor: 'not-allowed'
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
    border:
      '1px solid #D6EBDD'
  },

  errorMessage: {
    color: '#9A4141',
    background: '#FCF2F2',
    border:
      '1px solid #F0D9D9'
  },

  footer: {
    margin:
      '17px auto 0',
    maxWidth: '460px',
    color: '#8D9298',
    fontSize: '12px',
    lineHeight: 1.5,
    textAlign: 'center'
  }
};

export default Signup;