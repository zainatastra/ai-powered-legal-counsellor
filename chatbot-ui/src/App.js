import React, { useState, useEffect } from 'react';
import Signup from './Signup';
import Login from './login';
import Chatbot from './chatbot';
import Lawyers from './Lawyers';
import ResetPassword from './ResetPassword';
import EmailVerification from './EmailVerification';
import Loading from './Loading';
import { auth } from './firebase';
import {
  onAuthStateChanged,
  signOut,
  deleteUser
} from 'firebase/auth';

function App() {
  const [page, setPage] = useState('login');
  const [user, setUser] = useState(null);

  const [verificationEmail, setVerificationEmail] =
    useState(
      () =>
        localStorage.getItem(
          'alc_pending_verification_email'
        ) || ''
    );

  const [loading, setLoading] =
    useState(false);

  const [authTransition, setAuthTransition] =
    useState(false);

  const [authReady, setAuthReady] =
    useState(false);

  const [loadingVariant, setLoadingVariant] =
    useState('session');

  /*
   * Tracks whether the user currently sitting on the OTP screen just came
   * from THIS signup form, in THIS session, and never verified anything yet.
   *
   * Only in that case is it safe to delete the Firebase account if they
   * abandon verification - otherwise we'd risk deleting a real, pre-existing
   * account that simply hasn't been verified yet (e.g. someone who logged
   * in to an old unverified account). It is only ever set to true by
   * handleSignupComplete, so a normal login of an existing unverified
   * account never touches it.
   */
  const [isFreshSignup, setIsFreshSignup] =
    useState(false);

  /*
   * --------------------------------------------------------------------------
   * FIREBASE AUTH STATE
   * --------------------------------------------------------------------------
   *
   * There are three possible states:
   *
   * 1. No Firebase user
   *    -> signup/login
   *
   * 2. Firebase user exists but email is not verified
   *    -> EmailVerification
   *
   * 3. Firebase user exists and email is verified
   *    -> chatbot
   *
   * We NEVER send an unverified user to the chatbot.
   */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          if (!currentUser) {
            setUser(null);

            const pendingEmail =
              localStorage.getItem(
                'alc_pending_verification_email'
              );

            if (pendingEmail) {
              setVerificationEmail(
                pendingEmail
              );

              setPage('verifyEmail');
            } else {
              setVerificationEmail('');

              setPage('login');
            }

            setAuthReady(true);

            return;
          }

          try {
            /*
             * Refresh the Firebase user so that
             * emailVerified contains the latest
             * server-side value.
             */
            await currentUser.reload();

            const refreshedUser =
              auth.currentUser;

            if (!refreshedUser) {
              setUser(null);
              setPage('login');
              setAuthReady(true);

              return;
            }

            /*
             * --------------------------------------------------------------
             * UNVERIFIED USER
             * --------------------------------------------------------------
             */

            if (
              !refreshedUser.emailVerified
            ) {
              console.log(
                'Authentication blocked: email address is not verified.'
              );

              setUser(null);

              const email =
                refreshedUser.email || '';

              setVerificationEmail(email);

              if (email) {
                localStorage.setItem(
                  'alc_pending_verification_email',
                  email
                );
              }

              setPage('verifyEmail');
              setAuthReady(true);

              return;
            }

            /*
             * --------------------------------------------------------------
             * VERIFIED USER
             * --------------------------------------------------------------
             */

            localStorage.removeItem(
              'alc_pending_verification_email'
            );

            setVerificationEmail('');

            setUser(refreshedUser);

            setPage('chatbot');

            setAuthReady(true);
          } catch (error) {
            console.error(
              'Authentication state verification failed:',
              error
            );

            setUser(null);
            setPage('login');
            setAuthReady(true);
          }
        }
      );

    return () => unsubscribe();
  }, []);

  /*
   * --------------------------------------------------------------------------
   * LOGOUT
   * --------------------------------------------------------------------------
   */

  const handleLogout = async () => {
    const confirmLogout =
      window.confirm(
        'Are you sure you want to logout?'
      );

    if (!confirmLogout) {
      return;
    }

    setLoadingVariant('session');
    setLoading(true);

    try {
      await signOut(auth);

      localStorage.removeItem(
        'alc_pending_verification_email'
      );

      localStorage.removeItem(
        'alc_pending_verification_profile'
      );

      setVerificationEmail('');
      setIsFreshSignup(false);
      setUser(null);
      setPage('login');
    } catch (error) {
      console.error(
        'Logout failed:',
        error
      );
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 700);
    }
  };

  /*
   * --------------------------------------------------------------------------
   * AUTHENTICATED PAGE NAVIGATION
   * --------------------------------------------------------------------------
   */

  const handlePageChange = (
    newPage
  ) => {
    setLoadingVariant(
      newPage === 'lawyers'
        ? 'lawyers'
        : newPage === 'chatbot'
          ? 'chatbot'
          : 'auth'
    );

    setLoading(true);

    setTimeout(() => {
      setPage(newPage);
      setLoading(false);
    }, 450);
  };

  /*
   * --------------------------------------------------------------------------
   * LOGIN / SIGNUP / RESET PASSWORD TRANSITION
   * --------------------------------------------------------------------------
   */

  const handleAuthSwitch = (
    newPage
  ) => {
    if (
      newPage === page ||
      authTransition
    ) {
      return;
    }

    setAuthTransition(true);

    setTimeout(() => {
      setPage(newPage);

      requestAnimationFrame(() => {
        setAuthTransition(false);
      });
    }, 170);
  };

  /*
   * --------------------------------------------------------------------------
   * SIGNUP COMPLETE
   * --------------------------------------------------------------------------
   *
   * Signup.js creates the Firebase account and stores the pending
   * verification information.
   *
   * We now show EmailVerification.
   *
   * EmailVerification.js is responsible for:
   *
   * - sending OTP through our backend
   * - accepting the OTP
   * - verifying the OTP
   * - updating Firebase verification state
   */

  const handleSignupComplete = (
    email
  ) => {
    const pendingEmail =
      email ||
      auth.currentUser?.email ||
      '';

    setVerificationEmail(
      pendingEmail
    );

    if (pendingEmail) {
      localStorage.setItem(
        'alc_pending_verification_email',
        pendingEmail
      );
    }

    setIsFreshSignup(true);

    setPage('verifyEmail');
  };

  /*
   * --------------------------------------------------------------------------
   * OTP VERIFICATION SUCCESS
   * --------------------------------------------------------------------------
   *
   * EmailVerification.js calls this after the OTP has been successfully
   * verified.
   */

  const handleVerificationSuccess =
    async (verifiedUser) => {
      try {
        /*
         * Refresh Firebase one more time so the latest
         * authentication state is available.
         */
        if (auth.currentUser) {
          await auth.currentUser.reload();
        }

        /*
         * Always use the latest Firebase user after reload.
         * The user object passed by EmailVerification.js may be stale.
         */
        const currentUser =
          auth.currentUser;

        if (!currentUser) {
          console.error(
            'Verification succeeded but no Firebase user is available.'
          );

          setUser(null);
          setPage('login');

          return;
        }

        /*
         * Never allow access to the application unless Firebase
         * confirms that the email is actually verified.
         */
        if (!currentUser.emailVerified) {
          console.error(
            'Verification callback completed, but Firebase still reports the email as unverified.'
          );

          const email =
            currentUser.email || verificationEmail || '';

          setUser(null);
          setVerificationEmail(email);

          if (email) {
            localStorage.setItem(
              'alc_pending_verification_email',
              email
            );
          }

          setPage('verifyEmail');

          return;
        }

        /*
         * Remove the pending verification state.
         */
        localStorage.removeItem(
          'alc_pending_verification_email'
        );

        setIsFreshSignup(false);

        /*
         * The profile information may still be needed
         * by EmailVerification.js after OTP verification,
         * so we intentionally do NOT remove:
         *
         * alc_pending_verification_profile
         *
         * here.
         *
         * EmailVerification.js can remove it after successfully
         * creating the Firestore profile.
         */

        setVerificationEmail('');

        setUser(currentUser);

        setPage('chatbot');
      } catch (error) {
        console.error(
          'Post-verification authentication failed:',
          error
        );

        setUser(null);
        setPage('login');
      }
    };

  /*
   * --------------------------------------------------------------------------
   * BACK TO LOGIN FROM EMAIL VERIFICATION
   * --------------------------------------------------------------------------
   */

  const handleVerificationBackToLogin =
    async () => {
      localStorage.removeItem(
        'alc_pending_verification_email'
      );

      localStorage.removeItem(
        'alc_pending_verification_profile'
      );

      setVerificationEmail('');

      try {
        const currentUser = auth.currentUser;

        /*
         * SECURITY: if this unverified account was just created by THIS
         * signup (isFreshSignup) and the person is abandoning verification
         * without ever proving they own the email, delete the Firebase
         * account instead of just signing out.
         *
         * Otherwise that email stays permanently "taken" in Firebase Auth
         * even though nobody ever verified it - which either locks the
         * real owner out of signing up, or leaves a squatted account
         * behind if someone typed in an email they don't own.
         *
         * We only ever do this for accounts created in this same session
         * (isFreshSignup) - a pre-existing unverified account reached via
         * a normal login is left untouched.
         */
        if (
          currentUser &&
          !currentUser.emailVerified &&
          isFreshSignup
        ) {
          await deleteUser(currentUser);
        } else if (currentUser) {
          await signOut(auth);
        }
      } catch (error) {
        console.error(
          'Verification screen cleanup failed:',
          error
        );

        // If deletion failed (e.g. requires a recent login), fall back to
        // a plain sign-out so the user is never stuck on this screen.
        try {
          if (auth.currentUser) {
            await signOut(auth);
          }
        } catch (signOutError) {
          console.error(
            'Fallback sign-out also failed:',
            signOutError
          );
        }
      }

      setIsFreshSignup(false);
      setUser(null);
      setPage('login');
    };

  /*
   * --------------------------------------------------------------------------
   * LOGIN SUCCESS
   * --------------------------------------------------------------------------
   *
   * Login.js authenticates the Firebase user.
   *
   * We then determine whether the email is verified.
   */

  const handleLoginSuccess =
    async () => {
      const currentUser =
        auth.currentUser;

      if (!currentUser) {
        setUser(null);
        setPage('login');

        return;
      }

      try {
        await currentUser.reload();

        const refreshedUser =
          auth.currentUser;

        if (!refreshedUser) {
          setUser(null);
          setPage('login');

          return;
        }

        /*
         * --------------------------------------------------------------
         * LOGIN USER IS NOT VERIFIED
         * --------------------------------------------------------------
         */

        if (
          !refreshedUser.emailVerified
        ) {
          console.log(
            'Login blocked: email address is not verified.'
          );

          setUser(null);

          const email =
            refreshedUser.email || '';

          setVerificationEmail(email);

          if (email) {
            localStorage.setItem(
              'alc_pending_verification_email',
              email
            );
          }

          setPage('verifyEmail');

          return;
        }

        /*
         * --------------------------------------------------------------
         * LOGIN USER IS VERIFIED
         * --------------------------------------------------------------
         */

        localStorage.removeItem(
          'alc_pending_verification_email'
        );

        setVerificationEmail('');

        setUser(refreshedUser);

        setPage('chatbot');
      } catch (error) {
        console.error(
          'Login verification check failed:',
          error
        );

        setUser(null);
        setPage('login');
      }
    };

  /*
   * --------------------------------------------------------------------------
   * WAIT FOR FIREBASE
   * --------------------------------------------------------------------------
   */

  if (!authReady) {
    return (
      <Loading
        variant={
          auth.currentUser
            ? 'chatbot'
            : 'session'
        }
      />
    );
  }

  /*
   * --------------------------------------------------------------------------
   * GENERAL LOADING
   * --------------------------------------------------------------------------
   */

  if (loading) {
    return (
      <Loading
        variant={loadingVariant}
      />
    );
  }

  /*
   * --------------------------------------------------------------------------
   * APPLICATION UI
   * --------------------------------------------------------------------------
   */

  return (
    <div className="app-wrapper">

      {/* ================================================================ */}
      {/* LAWYERS NAVIGATION                                               */}
      {/* ================================================================ */}
      {/* Note: the chatbot page previously had its own floating "Lawyers"  */}
      {/* button here too. It's been removed -- it duplicated the Lawyers  */}
      {/* nav item already in the chatbot sidebar, and its fixed top-right */}
      {/* position visually collided with the chat header, rendering      */}
      {/* behind it. The Lawyers page itself still needs this cluster,    */}
      {/* since Lawyers.js has no navigation of its own yet.               */}

      {user &&
        page === 'lawyers' && (
          <div className="floating-nav">

            <button
              onClick={() =>
                handlePageChange(
                  'chatbot'
                )
              }
              className="btn btn-secondary"
            >
              Legal Assistant
            </button>

            <button
              onClick={handleLogout}
              className="btn btn-secondary"
            >
              Sign out
            </button>

          </div>
        )}

      {/* ================================================================ */}
      {/* EMAIL OTP VERIFICATION                                           */}
      {/* ================================================================ */}

      {page === 'verifyEmail' ? (
        <div className="verification-area">
          <EmailVerification
            email={verificationEmail}
            onVerified={
              handleVerificationSuccess
            }
            onBackToLogin={
              handleVerificationBackToLogin
            }
          />
        </div>
      ) : user ? (

        /*
         * ================================================================
         * VERIFIED APPLICATION
         * ================================================================
         */

        <>
          {page === 'chatbot' && (
            <Chatbot
              onLogout={handleLogout}
            />
          )}

          {page === 'lawyers' && (
            <Lawyers />
          )}
        </>

      ) : (

        /*
         * ================================================================
         * AUTHENTICATION SCREENS
         * ================================================================
         */

        <div
          className={`auth-area${
            authTransition
              ? ' is-switching'
              : ''
          }`}
        >

          {/* ------------------------------------------------------------ */}
          {/* SIGNUP                                                       */}
          {/* ------------------------------------------------------------ */}

          {page === 'signup' && (
            <div
              key="signup-screen"
              className="auth-screen-enter"
            >
              <Signup
                onSignupComplete={
                  handleSignupComplete
                }
                onSwitchToLogin={() =>
                  handleAuthSwitch(
                    'login'
                  )
                }
              />
            </div>
          )}

          {/* ------------------------------------------------------------ */}
          {/* LOGIN                                                        */}
          {/* ------------------------------------------------------------ */}

          {page === 'login' && (
            <div
              key="login-screen"
              className="auth-screen-enter"
            >
              <Login
                onLoginSuccess={
                  handleLoginSuccess
                }
                onForgotPassword={() =>
                  handleAuthSwitch(
                    'resetPassword'
                  )
                }
                onSwitchToSignup={() =>
                  handleAuthSwitch(
                    'signup'
                  )
                }
              />
            </div>
          )}

          {/* ------------------------------------------------------------ */}
          {/* RESET PASSWORD                                               */}
          {/* ------------------------------------------------------------ */}

          {page === 'resetPassword' && (
            <div
              key="reset-screen"
              className="auth-screen-enter"
            >
              <ResetPassword
                onBackToLogin={() =>
                  handleAuthSwitch(
                    'login'
                  )
                }
              />
            </div>
          )}

        </div>
      )}
    </div>
  );
}

export default App;
