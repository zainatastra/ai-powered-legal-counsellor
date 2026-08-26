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

import { Toast } from './GlobalFeedback';

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

  const [toast, setToast] =
    useState({
      open: false,
      message: '',
      type: 'default'
    });

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
          // Show this as a toast rather than the inline banner - it's
          // easy to miss above the fold, and this is the one signup
          // error people most need to actually notice.
          setToast({
            open: true,
            type: 'error',
            message:
              'This email is already registered. Please log in instead.'
          });

          return;

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
    <div className="auth-page">
      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() =>
          setToast((current) => ({
            ...current,
            open: false
          }))
        }
      />

      <div className="ambient-glow" />

      <div className="auth-shell">

        {/* ---------------------------------------------------------------- */}
        {/* BRAND                                                            */}
        {/* ---------------------------------------------------------------- */}

        <div className="auth-brand">
          <div className="auth-brand-mark">
            <Scale
              size={24}
              strokeWidth={1.8}
            />
          </div>

          <div>
            <div className="auth-brand-name">
              AI-Powered Legal Counsellor
            </div>

            <div className="auth-brand-sub">
              LEGAL ASSISTANCE PLATFORM
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* AUTH TOGGLE                                                      */}
        {/* ---------------------------------------------------------------- */}

        <div className="auth-toggle" role="tablist" aria-label="Authentication">
          <div
            className="auth-toggle-indicator register-active"
            aria-hidden="true"
          />

          <button
            type="button"
            role="tab"
            aria-selected={false}
            onClick={
              onSwitchToLogin
            }
            className="auth-toggle-button"
          >
            Login
          </button>

          <button
            type="button"
            role="tab"
            aria-selected
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
          className="auth-card"
        >
          <div className="auth-eyebrow">
            CREATE ACCOUNT
          </div>

          <h2 className="auth-heading">
            Create your account
          </h2>

          <p className="auth-intro">
            Register to access your
            AI-powered legal assistance
            dashboard.
          </p>

          {/* First + Last name */}

          <div className="field-row">
            <div className="field-group">
              <label className="field-label">
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
                className="field-input"
                required
                disabled={submitting}
                autoComplete="given-name"
              />
            </div>

            <div className="field-group">
              <label className="field-label">
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
                className="field-input"
                required
                disabled={submitting}
                autoComplete="family-name"
              />
            </div>
          </div>

          {/* Email */}

          <div className="field-group">
            <label className="field-label">
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
              className="field-input"
              required
              disabled={submitting}
              autoComplete="email"
            />
          </div>

          {/* Password */}

          <div className="field-group">
            <label className="field-label">
              Password
            </label>

            <div className="password-field">
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
                className="field-input"
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
                className="icon-btn"
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
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '4px' }}
            disabled={submitting}
          >
            {submitting
              ? 'Creating account...'
              : 'Create account'}
          </button>

          {/* Message */}

          {message && (
            <div className={`inline-feedback ${isSuccess ? 'success' : 'error'}`}>
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

        <p className="footnote">
          Your information is securely
          handled through the platform's
          authentication system.
        </p>
      </div>
    </div>
  );
};


export default Signup;
