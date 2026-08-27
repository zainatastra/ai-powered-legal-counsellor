const crypto = require('crypto');
const path = require('path');
const express = require('express');
const OpenAI = require('openai');
const { Resend } = require('resend');
const admin = require('firebase-admin');
const dotenv = require('dotenv');

// -----------------------------------------------------------------------------
// Environment
// -----------------------------------------------------------------------------

dotenv.config({
  path: path.join(__dirname, '..', '.env')
});

// -----------------------------------------------------------------------------
// Firebase Admin SDK
// -----------------------------------------------------------------------------
//
// Credentials are loaded from environment variables instead of a service
// account JSON file. Never commit a Firebase service-account private key.
// For local development, put the following values in server/.env:
//
// FIREBASE_PROJECT_ID=...
// FIREBASE_CLIENT_EMAIL=...
// FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
//
// In managed Google environments, Application Default Credentials may be
// used automatically when these variables are not present.

if (!admin.apps.length) {
  const firebaseProjectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT;

  const firebaseClientEmail =
    process.env.FIREBASE_CLIENT_EMAIL;

  const firebasePrivateKey =
    process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\\n')
      : '';

  if (
    firebaseProjectId &&
    firebaseClientEmail &&
    firebasePrivateKey
  ) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: firebaseProjectId,
        clientEmail: firebaseClientEmail,
        privateKey: firebasePrivateKey
      })
    });
  } else {
    // Allows Google-managed environments to use Application Default
    // Credentials without storing a private key in the application.
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  }
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

// -----------------------------------------------------------------------------
// Application configuration
// -----------------------------------------------------------------------------

const app = express();

const PORT = process.env.PORT || 3001;

const MODEL =
  process.env.OPENAI_MODEL || 'gpt-4.1-mini';

const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY ||
  process.env.REACT_APP_OPENAI_API_KEY;

const RESEND_API_KEY =
  process.env.RESEND_API_KEY;

const resend = RESEND_API_KEY
  ? new Resend(RESEND_API_KEY)
  : null;

// -----------------------------------------------------------------------------
// Free legal-chat usage limit
// -----------------------------------------------------------------------------
const FREE_MESSAGE_LIMIT = 10;
const FREE_MESSAGE_WINDOW_MS = 5 * 60 * 60 * 1000;
const FREE_MESSAGE_USAGE_COLLECTION = 'legalChatUsage';

// -----------------------------------------------------------------------------
// OTP configuration
// -----------------------------------------------------------------------------

const OTP_COLLECTION = 'emailOtpVerifications';

const OTP_EXPIRY_MS = 5 * 60 * 1000;

const OTP_RESEND_COOLDOWN_MS = 30 * 1000;

const OTP_MAX_ATTEMPTS = 5;

/*
 * -----------------------------------------------------------------------
 * OTP request / verify limits (per email, independent of each other)
 * -----------------------------------------------------------------------
 * - Sending: max 3 codes per email, then a 30-minute block.
 * - Verifying: max 3 wrong guesses per email (across any code), then a
 *   1-hour block.
 * Tracked in their own collection, keyed by normalized email (not uid),
 * so the limit survives the account being deleted and re-created with
 * the same email.
 */

const OTP_RATE_LIMIT_COLLECTION = 'otpRateLimits';

const MAX_OTP_SEND_ATTEMPTS = 3;

const OTP_SEND_BLOCK_MS = 30 * 60 * 1000;

const MAX_OTP_WRONG_ATTEMPTS = 3;

const OTP_VERIFY_BLOCK_MS = 60 * 60 * 1000;

// -----------------------------------------------------------------------------
// CORS
// -----------------------------------------------------------------------------

const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000'
]);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader(
      'Access-Control-Allow-Origin',
      origin
    );
  }

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,POST,OPTIONS'
  );

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );

  res.setHeader(
    'Access-Control-Allow-Credentials',
    'true'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use(
  express.json({
    limit: '32kb'
  })
);

// -----------------------------------------------------------------------------
// AI system instructions
// -----------------------------------------------------------------------------

const systemInstructions = `
You are an AI-powered legal advisor with expertise in Pakistan Penal Code 1860,
Constitution of Pakistan 1973, PECA Act (Cybercrime Laws), Family & Inheritance
Laws.

Refer to exact sections or articles when possible.

Avoid making up laws.

If unsure, say:
"Please consult a qualified lawyer."

Do not give any answer to a prompt other than legal query or Pakistan laws.
`;

// -----------------------------------------------------------------------------
// Helper functions
// -----------------------------------------------------------------------------

function generateOtp() {
  return crypto
    .randomInt(10000, 100000)
    .toString();
}

function hashOtp(uid, otp) {
  return crypto
    .createHash('sha256')
    .update(`${uid}:${otp}`)
    .digest('hex');
}

function maskEmail(email) {
  if (!email || !email.includes('@')) {
    return email || '';
  }

  const [localPart, domain] =
    email.split('@');

  if (localPart.length <= 2) {
    return `${localPart[0] || '*'}***@${domain}`;
  }

  const first =
    localPart.substring(0, 2);

  const last =
    localPart.substring(
      localPart.length - 1
    );

  return `${first}${'*'.repeat(
    Math.max(localPart.length - 3, 3)
  )}${last}@${domain}`;
}

function getRemainingSeconds(date) {
  if (!date) {
    return 0;
  }

  const remaining =
    date.getTime() - Date.now();

  return Math.max(
    0,
    Math.ceil(remaining / 1000)
  );
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.ceil(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }

  return `${secs}s`;
}

function getOtpRateLimitRef(email) {
  const normalizedEmail =
    (email || '').trim().toLowerCase();

  return adminDb
    .collection(OTP_RATE_LIMIT_COLLECTION)
    .doc(normalizedEmail);
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// -----------------------------------------------------------------------------
// Health check
// -----------------------------------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    openaiConfigured:
      Boolean(OPENAI_API_KEY),
    resendConfigured:
      Boolean(RESEND_API_KEY),
    firebaseAdminConfigured:
      Boolean(adminAuth && adminDb),
    model: MODEL
  });
});

// -----------------------------------------------------------------------------
// Test Resend email
// -----------------------------------------------------------------------------

app.post('/api/test-email', async (req, res) => {
  const email =
    typeof req.body?.email === 'string'
      ? req.body.email.trim()
      : '';

  if (!email) {
    return res.status(400).json({
      message:
        'Please provide a test email address.'
    });
  }

  if (!resend) {
    console.error(
      'RESEND_API_KEY is not configured.'
    );

    return res.status(503).json({
      message:
        'Resend is not configured on the server.'
    });
  }

  try {
    const { data, error } =
      await resend.emails.send({
        from:
          'AI Legal Counsellor <verify@fyp.astrasoftdigital.com>',

        to: [email],

        subject:
          'Test Email — AI Legal Counsellor',

        html: `
          <div
            style="
              font-family: Arial, sans-serif;
              padding: 32px;
              color: #172033;
            "
          >
            <h2>
              AI Legal Counsellor
            </h2>

            <p>
              This is a test email from the
              AI Legal Counsellor.
            </p>

            <p>
              Resend email delivery is working correctly.
            </p>
          </div>
        `
      });

    if (error) {
      console.error(
        'Resend request failed:',
        error
      );

      return res.status(502).json({
        message:
          'Resend could not send the email.'
      });
    }

    return res.json({
      ok: true,
      id: data?.id
    });
  } catch (error) {
    console.error(
      'Resend request failed:',
      {
        message: error?.message
      }
    );

    return res.status(502).json({
      message:
        'The email service could not send the email right now.'
    });
  }
});

// -----------------------------------------------------------------------------
// Send verification OTP
//
// Existing frontend endpoint is intentionally kept as:
// POST /api/auth/send-verification
//
// It now sends a 5-digit OTP instead of a verification link.
// -----------------------------------------------------------------------------

app.post(
  '/api/auth/send-verification',
  async (req, res) => {
    if (!resend) {
      console.error(
        'RESEND_API_KEY is not configured.'
      );

      return res.status(503).json({
        message:
          'The email service is not configured on the server.'
      });
    }

    const idToken =
      typeof req.body?.idToken === 'string'
        ? req.body.idToken.trim()
        : '';

    /*
     * initialSend = true is used when the verification screen
     * first opens. It must be idempotent: opening/remounting the
     * screen must NEVER generate another OTP while a valid OTP
     * already exists.
     *
     * forceResend = true is used only by the explicit "Resend code"
     * button after the cooldown has elapsed.
     */
    const initialSend =
      req.body?.initialSend === true;

    const forceResend =
      req.body?.forceResend === true;

    if (!idToken) {
      return res.status(401).json({
        message:
          'Authentication is required.'
      });
    }

    try {
      // -----------------------------------------------------------------------
      // Verify Firebase ID token
      // -----------------------------------------------------------------------

      const decodedToken =
        await adminAuth.verifyIdToken(
          idToken
        );

      const uid =
        decodedToken.uid;

      const userRecord =
        await adminAuth.getUser(uid);

      if (!userRecord.email) {
        return res.status(400).json({
          message:
            'The account does not have an email address.'
        });
      }

      // -----------------------------------------------------------------------
      // Already verified
      // -----------------------------------------------------------------------

      if (userRecord.emailVerified) {
        return res.json({
          ok: true,
          alreadyVerified: true,
          message:
            'Your email address is already verified.'
        });
      }

      // -----------------------------------------------------------------------
      // OTP SEND LIMIT: max 3 codes per email, then a 30-minute block.
      // Keyed by email (not uid) so it survives account deletion/recreation.
      // -----------------------------------------------------------------------

      const rateLimitRef =
        getOtpRateLimitRef(
          userRecord.email
        );

      const rateLimitSnapshot =
        await rateLimitRef.get();

      const rateLimitData =
        rateLimitSnapshot.exists
          ? rateLimitSnapshot.data()
          : null;

      const sendBlockedUntil =
        rateLimitData?.sendBlockedUntil?.toDate?.();

      if (
        sendBlockedUntil &&
        sendBlockedUntil.getTime() > Date.now()
      ) {
        const retryAfterSeconds =
          getRemainingSeconds(
            sendBlockedUntil
          );

        return res.status(429).json({
          message:
            `You've requested the maximum of ${MAX_OTP_SEND_ATTEMPTS} verification codes for this email. Please try again in ${formatDuration(retryAfterSeconds)}.`,
          sendBlockedForSeconds:
            retryAfterSeconds
        });
      }

      const otpRef =
        adminDb
          .collection(OTP_COLLECTION)
          .doc(uid);

      /*
       * -----------------------------------------------------------------------
       * ATOMIC OTP RESERVATION
       * -----------------------------------------------------------------------
       *
       * This is the critical protection against duplicate OTP emails.
       *
       * React development mode can run effects more than once, and the
       * verification component can also be mounted more than once during
       * authentication state transitions.
       *
       * A normal "read -> generate -> write -> send" sequence is vulnerable
       * to concurrent requests because both requests can read "no OTP"
       * before either one writes it.
       *
       * Firestore transaction makes the reservation atomic.
       *
       * Only the request that successfully creates/replaces the OTP is
       * allowed to send an email.
       */

      let reservation = null;

      await adminDb.runTransaction(
        async (transaction) => {
          const snapshot =
            await transaction.get(
              otpRef
            );

          const existing =
            snapshot.exists
              ? snapshot.data()
              : null;

          const now =
            Date.now();

          const existingExpiresAt =
            existing?.expiresAt?.toDate?.();

          const existingLastSentAt =
            existing?.lastSentAt?.toDate?.();

          const existingIsActive =
            Boolean(
              existing &&
              existing.used !== true &&
              existingExpiresAt &&
              existingExpiresAt.getTime() >
                now
            );

          /*
           * ---------------------------------------------------------------
           * Existing active OTP
           * ---------------------------------------------------------------
           *
           * For the initial screen request we simply reuse the existing
           * OTP. No new email is sent.
           *
           * This makes the endpoint idempotent.
           */

          if (
            existingIsActive &&
            !forceResend
          ) {
            const expiresIn =
              getRemainingSeconds(
                existingExpiresAt
              );

            const resendAvailableIn =
              existingLastSentAt
                ? Math.max(
                    0,
                    Math.ceil(
                      (
                        OTP_RESEND_COOLDOWN_MS -
                        (
                          now -
                          existingLastSentAt.getTime()
                        )
                      ) / 1000
                    )
                  )
                : 0;

            reservation = {
              shouldSend: false,
              alreadySent: true,
              expiresIn,
              resendAvailableIn
            };

            return;
          }

          /*
           * ---------------------------------------------------------------
           * Explicit resend cooldown
           * ---------------------------------------------------------------
           *
           * If the user explicitly clicked Resend but the cooldown has not
           * elapsed, reject it atomically.
           */

          if (
            forceResend &&
            existingLastSentAt
          ) {
            const elapsed =
              now -
              existingLastSentAt.getTime();

            if (
              elapsed <
              OTP_RESEND_COOLDOWN_MS
            ) {
              const remaining =
                Math.ceil(
                  (
                    OTP_RESEND_COOLDOWN_MS -
                    elapsed
                  ) / 1000
                );

              reservation = {
                shouldSend: false,
                rateLimited: true,
                resendAvailableIn:
                  remaining
              };

              return;
            }
          }

          /*
           * ---------------------------------------------------------------
           * Create a brand-new OTP
           * ---------------------------------------------------------------
           */

          const otp =
            generateOtp();

          const otpHash =
            hashOtp(
              uid,
              otp
            );

          const expiresAt =
            new Date(
              now +
              OTP_EXPIRY_MS
            );

          transaction.set(
            otpRef,
            {
              uid,
              email:
                userRecord.email,

              otpHash,

              expiresAt:
                admin.firestore.Timestamp.fromDate(
                  expiresAt
                ),

              lastSentAt:
                admin.firestore.FieldValue
                  .serverTimestamp(),

              attempts: 0,

              used: false,

              createdAt:
                admin.firestore.FieldValue
                  .serverTimestamp()
            },
            {
              merge: false
            }
          );

          reservation = {
            shouldSend: true,
            otp,
            otpHash,
            expiresAt,
            expiresIn:
              Math.floor(
                OTP_EXPIRY_MS / 1000
              ),
            resendAvailableIn:
              Math.floor(
                OTP_RESEND_COOLDOWN_MS /
                  1000
              )
          };
        }
      );

      /*
       * -----------------------------------------------------------------------
       * Existing OTP / duplicate initial request
       * -----------------------------------------------------------------------
       */

      if (
        reservation?.rateLimited
      ) {
        return res.status(429).json({
          message:
            `Please wait ${reservation.resendAvailableIn} seconds before requesting another code.`,
          resendAvailableIn:
            reservation.resendAvailableIn
        });
      }

      if (
        reservation?.alreadySent
      ) {
        return res.json({
          ok: true,
          alreadySent: true,
          message:
            initialSend
              ? 'A verification code has already been sent to your email.'
              : 'Your current verification code is still active.',

          email:
            maskEmail(
              userRecord.email
            ),

          expiresIn:
            reservation.expiresIn,

          resendAvailableIn:
            reservation.resendAvailableIn
        });
      }

      /*
       * -----------------------------------------------------------------------
       * Send the newly reserved OTP through Resend
       * -----------------------------------------------------------------------
       */

      const safeEmail =
        escapeHtml(
          userRecord.email
        );

      const { data, error } =
        await resend.emails.send({
          from:
            'AI Legal Counsellor <verify@fyp.astrasoftdigital.com>',

          to: [
            userRecord.email
          ],

          subject:
            'Your AI Legal Counsellor verification code',

          html: `
            <!DOCTYPE html>

            <html>
              <head>
                <meta charset="UTF-8" />

                <meta
                  name="viewport"
                  content="width=device-width, initial-scale=1.0"
                />

                <title>
                  Your verification code
                </title>
              </head>

              <body
                style="
                  margin: 0;
                  padding: 0;
                  background: #f6f7f9;
                  font-family: Arial, Helvetica, sans-serif;
                  color: #172033;
                "
              >
                <div
                  style="
                    max-width: 620px;
                    margin: 0 auto;
                    padding: 40px 20px;
                  "
                >
                  <div
                    style="
                      background: #ffffff;
                      border: 1px solid #e4e7eb;
                      border-radius: 18px;
                      padding: 40px 32px;
                      text-align: center;
                    "
                  >
                    <div
                      style="
                        color: #10243e;
                        font-size: 24px;
                        font-weight: 700;
                        margin-bottom: 8px;
                      "
                    >
                      AI Legal Counsellor
                    </div>

                    <div
                      style="
                        color: #8b929d;
                        font-size: 11px;
                        font-weight: 700;
                        letter-spacing: 1.5px;
                        margin-bottom: 42px;
                      "
                    >
                      LEGAL ASSISTANCE PLATFORM
                    </div>

                    <div
                      style="
                        color: #687589;
                        font-size: 20px;
                        font-weight: 600;
                        margin-bottom: 22px;
                      "
                    >
                      Your verification code
                    </div>

                    <p
                      style="
                        margin: 0 0 28px;
                        color: #596678;
                        font-size: 16px;
                        line-height: 1.6;
                      "
                    >
                      Use the code below to verify
                      your email address.
                      It expires in
                      <strong>5 minutes</strong>.
                    </p>

                    <div
                      style="
                        display: inline-block;
                        min-width: 250px;
                        padding: 24px 30px;
                        background: #f5f3ff;
                        border: 2px solid #d9d0ff;
                        border-radius: 18px;
                        color: #4c2bc4;
                        font-size: 42px;
                        font-weight: 700;
                        letter-spacing: 12px;
                        line-height: 1;
                        box-sizing: border-box;
                      "
                    >
                      ${reservation.otp}
                    </div>

                    <p
                      style="
                        margin: 30px 0 0;
                        color: #8a929d;
                        font-size: 12px;
                        line-height: 1.6;
                      "
                    >
                      Verification requested for
                      <strong>
                        ${safeEmail}
                      </strong>.
                    </p>

                    <p
                      style="
                        margin: 10px 0 0;
                        color: #8a929d;
                        font-size: 12px;
                        line-height: 1.6;
                      "
                    >
                      If you did not request this code,
                      you can safely ignore this email.
                    </p>
                  </div>

                  <div
                    style="
                      padding: 18px 10px;
                      text-align: center;
                      color: #9aa1ab;
                      font-size: 11px;
                    "
                  >
                    AI Legal Counsellor
                  </div>
                </div>
              </body>
            </html>
          `
        });

      /*
       * -----------------------------------------------------------------------
       * Resend failed
       * -----------------------------------------------------------------------
       *
       * Delete the reservation only if it is still the exact OTP we created.
       * This prevents an older failed request from deleting a newer OTP.
       */

      if (error) {
        console.error(
          'Verification OTP email failed:',
          error
        );

        await adminDb.runTransaction(
          async (transaction) => {
            const currentSnapshot =
              await transaction.get(
                otpRef
              );

            if (
              !currentSnapshot.exists
            ) {
              return;
            }

            const currentData =
              currentSnapshot.data();

            if (
              currentData.otpHash ===
              reservation.otpHash
            ) {
              transaction.delete(
                otpRef
              );
            }
          }
        );

        return res.status(502).json({
          message:
            'The verification code could not be sent.'
        });
      }

      /*
       * -----------------------------------------------------------------------
       * Success
       * -----------------------------------------------------------------------
       */

      // Only count this against the 3-per-email allowance now that a real
      // code was actually generated and emailed (not for idempotent
      // "already sent" replies or rate-limited resends above).
      await adminDb.runTransaction(
        async (transaction) => {
          const snap =
            await transaction.get(
              rateLimitRef
            );

          const data =
            snap.exists
              ? snap.data()
              : null;

          const now =
            Date.now();

          const currentBlockedUntil =
            data?.sendBlockedUntil?.toDate?.();

          /*
           * BUGFIX: only treat this as a fresh cycle if a block was
           * previously SET and has since expired. Using `!currentBlockedUntil`
           * alone was wrong - sendBlockedUntil is also null before the
           * limit has ever been hit (sends #1 and #2), which was
           * resetting the count to 0 on every single send and made the
           * 3-send limit unreachable.
           */
          const blockHasExpired =
            Boolean(currentBlockedUntil) &&
            currentBlockedUntil.getTime() <= now;

          const currentCount =
            blockHasExpired
              ? 0
              : Number(
                  data?.sendCount || 0
                );

          const nextCount =
            currentCount + 1;

          transaction.set(
            rateLimitRef,
            {
              email:
                userRecord.email
                  .trim()
                  .toLowerCase(),

              sendCount:
                nextCount,

              sendBlockedUntil:
                nextCount >=
                MAX_OTP_SEND_ATTEMPTS
                  ? admin.firestore.Timestamp.fromDate(
                      new Date(
                        now +
                        OTP_SEND_BLOCK_MS
                      )
                    )
                  : null,

              lastSentAt:
                admin.firestore.FieldValue
                  .serverTimestamp(),

              updatedAt:
                admin.firestore.FieldValue
                  .serverTimestamp()
            },
            {
              merge: true
            }
          );
        }
      );

      return res.json({
        ok: true,

        message:
          initialSend
            ? 'Verification code sent successfully.'
            : 'A new verification code has been sent.',

        email:
          maskEmail(
            userRecord.email
          ),

        expiresIn:
          reservation.expiresIn,

        resendAvailableIn:
          reservation.resendAvailableIn,

        id:
          data?.id
      });
    } catch (error) {
      console.error(
        'Send OTP request failed:',
        {
          code: error?.code,
          message: error?.message
        }
      );

      if (
        error?.code ===
          'auth/id-token-expired' ||
        error?.code ===
          'auth/invalid-id-token' ||
        error?.code ===
          'auth/argument-error'
      ) {
        return res.status(401).json({
          message:
            'Your authentication session has expired. Please log in again.'
        });
      }

      return res.status(500).json({
        message:
          'Unable to send the verification code right now.'
      });
    }
  }
);

// -----------------------------------------------------------------------------
// Verify 5-digit OTP
// -----------------------------------------------------------------------------

app.post(
  '/api/auth/verify-otp',
  async (req, res) => {
    const idToken =
      typeof req.body?.idToken === 'string'
        ? req.body.idToken.trim()
        : '';

    const otp =
      typeof req.body?.otp === 'string'
        ? req.body.otp.trim()
        : '';

    if (!idToken) {
      return res.status(401).json({
        message:
          'Authentication is required.'
      });
    }

    if (!/^\d{5}$/.test(otp)) {
      return res.status(400).json({
        message:
          'Please enter the 5-digit verification code.'
      });
    }

    try {
      // -----------------------------------------------------------------------
      // Verify Firebase authentication
      // -----------------------------------------------------------------------

      const decodedToken =
        await adminAuth.verifyIdToken(
          idToken
        );

      const uid =
        decodedToken.uid;

      const userRecord =
        await adminAuth.getUser(uid);

      // -----------------------------------------------------------------------
      // Already verified
      // -----------------------------------------------------------------------

      if (userRecord.emailVerified) {
        return res.json({
          ok: true,
          verified: true,
          message:
            'Your email address is already verified.'
        });
      }

      // -----------------------------------------------------------------------
      // OTP VERIFY LIMIT: max 3 wrong guesses per email (across any code),
      // then a 1-hour block. Independent of the send limit above, and
      // independent of the per-code `attempts` check further below.
      // -----------------------------------------------------------------------

      const rateLimitRef =
        getOtpRateLimitRef(
          userRecord.email
        );

      const rateLimitSnapshot =
        await rateLimitRef.get();

      const rateLimitData =
        rateLimitSnapshot.exists
          ? rateLimitSnapshot.data()
          : null;

      const verifyBlockedUntil =
        rateLimitData?.verifyBlockedUntil?.toDate?.();

      if (
        verifyBlockedUntil &&
        verifyBlockedUntil.getTime() > Date.now()
      ) {
        const retryAfterSeconds =
          getRemainingSeconds(
            verifyBlockedUntil
          );

        return res.status(429).json({
          message:
            `Too many incorrect attempts. Please try again in ${formatDuration(retryAfterSeconds)}.`,
          verifyBlockedForSeconds:
            retryAfterSeconds
        });
      }

      // -----------------------------------------------------------------------
      // Load OTP
      // -----------------------------------------------------------------------

      const otpRef =
        adminDb
          .collection(OTP_COLLECTION)
          .doc(uid);

      const otpSnapshot =
        await otpRef.get();

      if (!otpSnapshot.exists) {
        return res.status(400).json({
          message:
            'Your verification code has expired or does not exist. Please request a new code.'
        });
      }

      const otpData =
        otpSnapshot.data();

      // -----------------------------------------------------------------------
      // Check if already used
      // -----------------------------------------------------------------------

      if (otpData.used === true) {
        await otpRef.delete();

        return res.status(400).json({
          message:
            'This verification code has already been used. Please request a new code.'
        });
      }

      // -----------------------------------------------------------------------
      // Check expiration
      // -----------------------------------------------------------------------

      const expiresAt =
        otpData.expiresAt?.toDate?.();

      if (
        !expiresAt ||
        expiresAt.getTime() <=
          Date.now()
      ) {
        await otpRef.delete();

        return res.status(400).json({
          message:
            'Your verification code has expired. Please request a new code.'
        });
      }

      // -----------------------------------------------------------------------
      // Check attempts
      // -----------------------------------------------------------------------

      const attempts =
        Number(
          otpData.attempts || 0
        );

      if (
        attempts >=
        OTP_MAX_ATTEMPTS
      ) {
        await otpRef.delete();

        return res.status(429).json({
          message:
            'Too many incorrect attempts. Please request a new verification code.'
        });
      }

      // -----------------------------------------------------------------------
      // Compare OTP
      // -----------------------------------------------------------------------

      const submittedOtpHash =
        hashOtp(
          uid,
          otp
        );

      if (
        submittedOtpHash !==
        otpData.otpHash
      ) {
        // Cross-code wrong-guess counter (separate from the per-code
        // `attempts` check below, which only guards a single OTP).
        const nextWrongAttempts =
          await adminDb.runTransaction(
            async (transaction) => {
              const snap =
                await transaction.get(
                  rateLimitRef
                );

              const data =
                snap.exists
                  ? snap.data()
                  : null;

              const current =
                Number(
                  data?.wrongAttempts || 0
                ) + 1;

              const now =
                Date.now();

              transaction.set(
                rateLimitRef,
                {
                  email:
                    userRecord.email
                      .trim()
                      .toLowerCase(),

                  wrongAttempts:
                    current >=
                    MAX_OTP_WRONG_ATTEMPTS
                      ? 0
                      : current,

                  verifyBlockedUntil:
                    current >=
                    MAX_OTP_WRONG_ATTEMPTS
                      ? admin.firestore.Timestamp.fromDate(
                          new Date(
                            now +
                            OTP_VERIFY_BLOCK_MS
                          )
                        )
                      : data?.verifyBlockedUntil ||
                        null,

                  updatedAt:
                    admin.firestore.FieldValue
                      .serverTimestamp()
                },
                {
                  merge: true
                }
              );

              return current;
            }
          );

        if (
          nextWrongAttempts >=
          MAX_OTP_WRONG_ATTEMPTS
        ) {
          // Invalidate the current code too - it can't keep being guessed
          // during the 1-hour block.
          await otpRef.delete();

          return res.status(429).json({
            message:
              `Too many incorrect attempts. Please try again in ${formatDuration(OTP_VERIFY_BLOCK_MS / 1000)}.`,
            verifyBlockedForSeconds:
              Math.floor(
                OTP_VERIFY_BLOCK_MS / 1000
              )
          });
        }

        const nextAttempts =
          attempts + 1;

        if (
          nextAttempts >=
          OTP_MAX_ATTEMPTS
        ) {
          await otpRef.delete();

          return res.status(429).json({
            message:
              'Too many incorrect attempts. Please request a new verification code.'
          });
        }

        await otpRef.update({
          attempts:
            nextAttempts
        });

        return res.status(400).json({
          message:
            'The verification code is incorrect.',

          attemptsRemaining:
            OTP_MAX_ATTEMPTS -
            nextAttempts
        });
      }

      // -----------------------------------------------------------------------
      // OTP is correct
      // -----------------------------------------------------------------------

      await adminAuth.updateUser(
        uid,
        {
          emailVerified: true
        }
      );

      await otpRef.delete();

      // Clear the send/verify limiters for this email - the flow is done.
      await rateLimitRef.delete();

      return res.json({
        ok: true,
        verified: true,
        message:
          'Your email address has been verified successfully.'
      });
    } catch (error) {
      console.error(
        'OTP verification failed:',
        {
          code: error?.code,
          message: error?.message
        }
      );

      if (
        error?.code ===
          'auth/id-token-expired' ||
        error?.code ===
          'auth/invalid-id-token' ||
        error?.code ===
          'auth/argument-error'
      ) {
        return res.status(401).json({
          message:
            'Your authentication session has expired. Please log in again.'
        });
      }

      return res.status(500).json({
        message:
          'Unable to verify the code right now.'
      });
    }
  }
);

// -----------------------------------------------------------------------------
// Check verification status
// -----------------------------------------------------------------------------

app.post(
  '/api/auth/verification-status',
  async (req, res) => {
    const idToken =
      typeof req.body?.idToken === 'string'
        ? req.body.idToken.trim()
        : '';

    if (!idToken) {
      return res.status(401).json({
        message:
          'Authentication is required.'
      });
    }

    try {
      const decodedToken =
        await adminAuth.verifyIdToken(
          idToken
        );

      const userRecord =
        await adminAuth.getUser(
          decodedToken.uid
        );

      return res.json({
        ok: true,

        verified:
          Boolean(
            userRecord.emailVerified
          ),

        email:
          maskEmail(
            userRecord.email
          )
      });
    } catch (error) {
      console.error(
        'Verification status check failed:',
        {
          code: error?.code,
          message: error?.message
        }
      );

      return res.status(401).json({
        message:
          'Unable to verify the authentication session.'
      });
    }
  }
);

// -----------------------------------------------------------------------------
// Delete all saved chats for the authenticated user
// -----------------------------------------------------------------------------

app.post(
  '/api/auth/delete-chats',
  async (req, res) => {
    const idToken =
      typeof req.body?.idToken === 'string'
        ? req.body.idToken.trim()
        : '';

    if (!idToken) {
      return res.status(401).json({
        message:
          'Authentication is required.'
      });
    }

    try {
      const decodedToken =
        await adminAuth.verifyIdToken(
          idToken
        );

      const uid =
        decodedToken.uid;

      const chatQuery =
        adminDb
          .collection('chatHistory')
          .where('userId', '==', uid);

      const snapshot =
        await chatQuery.get();

      if (snapshot.empty) {
        return res.json({
          ok: true,
          deletedCount: 0
        });
      }

      let deletedCount = 0;
      let batch = adminDb.batch();
      let batchCount = 0;

      for (const chatDocument of snapshot.docs) {
        batch.delete(chatDocument.ref);
        batchCount += 1;
        deletedCount += 1;

        if (batchCount === 450) {
          await batch.commit();
          batch = adminDb.batch();
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      return res.json({
        ok: true,
        deletedCount
      });
    } catch (error) {
      console.error(
        'Delete all chats failed:',
        {
          code: error?.code,
          message: error?.message
        }
      );

      if (
        error?.code ===
          'auth/id-token-expired' ||
        error?.code ===
          'auth/invalid-id-token' ||
        error?.code ===
          'auth/argument-error'
      ) {
        return res.status(401).json({
          message:
            'Your authentication session has expired. Please log in again.'
        });
      }

      return res.status(500).json({
        message:
          'Unable to delete your chats right now.'
      });
    }
  }
);

// -----------------------------------------------------------------------------
// Legal AI chat
// -----------------------------------------------------------------------------

app.post(
  '/api/legal-chat',
  async (req, res) => {
    const message =
      typeof req.body?.message === 'string'
        ? req.body.message.trim()
        : '';

    if (!message) {
      return res.status(400).json({
        message:
          'Please enter a legal question.'
      });
    }

    const authorization =
      typeof req.headers.authorization === 'string'
        ? req.headers.authorization.trim()
        : '';

    if (!authorization.toLowerCase().startsWith('bearer ')) {
      return res.status(401).json({
        message:
          'Authentication is required.'
      });
    }

    const idToken = authorization.slice(7).trim();

    if (!idToken) {
      return res.status(401).json({
        message:
          'Authentication is required.'
      });
    }

    if (!OPENAI_API_KEY) {
      console.error(
        'OPENAI_API_KEY is not configured.'
      );

      return res.status(503).json({
        message:
          'The AI service is not configured on the server.'
      });
    }

    try {
      const decodedToken =
        await adminAuth.verifyIdToken(idToken);

      const uid = decodedToken.uid;
      const userRecord = await adminAuth.getUser(uid);

      if (!userRecord.emailVerified) {
        return res.status(403).json({
          message:
            'Please verify your email address before using the legal counsellor.'
        });
      }

      const usageRef = adminDb
        .collection(FREE_MESSAGE_USAGE_COLLECTION)
        .doc(uid);

      let usageResult = null;

      await adminDb.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(usageRef);
        const existing = snapshot.exists ? snapshot.data() : null;
        const now = Date.now();
        const blockedUntil = existing?.blockedUntil?.toDate?.();

        // The five-hour window has ended: give the user a fresh allowance.
        if (blockedUntil && blockedUntil.getTime() <= now) {
          transaction.set(usageRef, {
            uid,
            messageCount: 1,
            blockedUntil: null,
            windowStartedAt: admin.firestore.Timestamp.fromDate(new Date(now)),
            updatedAt: admin.firestore.Timestamp.fromDate(new Date(now))
          }, { merge: true });

          usageResult = {
            allowed: true,
            remaining: FREE_MESSAGE_LIMIT - 1
          };
          return;
        }

        // Still blocked from the previous exhausted allowance.
        if (blockedUntil && blockedUntil.getTime() > now) {
          usageResult = {
            allowed: false,
            blockedUntil,
            remainingSeconds: Math.ceil(
              (blockedUntil.getTime() - now) / 1000
            )
          };
          return;
        }

        const currentCount = Number(existing?.messageCount || 0);

        // Defensive recovery for an inconsistent record.
        if (currentCount >= FREE_MESSAGE_LIMIT) {
          const newBlockedUntil =
            new Date(now + FREE_MESSAGE_WINDOW_MS);

          transaction.set(usageRef, {
            uid,
            messageCount: FREE_MESSAGE_LIMIT,
            blockedUntil: admin.firestore.Timestamp.fromDate(newBlockedUntil),
            limitReachedAt: admin.firestore.Timestamp.fromDate(new Date(now)),
            updatedAt: admin.firestore.Timestamp.fromDate(new Date(now))
          }, { merge: true });

          usageResult = {
            allowed: false,
            blockedUntil: newBlockedUntil,
            remainingSeconds: Math.ceil(
              FREE_MESSAGE_WINDOW_MS / 1000
            )
          };
          return;
        }

        const nextCount = currentCount + 1;

        // The exact five-hour countdown begins when the final free message
        // is consumed.
        if (nextCount === FREE_MESSAGE_LIMIT) {
          const newBlockedUntil =
            new Date(now + FREE_MESSAGE_WINDOW_MS);

          transaction.set(usageRef, {
            uid,
            messageCount: FREE_MESSAGE_LIMIT,
            blockedUntil: admin.firestore.Timestamp.fromDate(newBlockedUntil),
            limitReachedAt: admin.firestore.Timestamp.fromDate(new Date(now)),
            updatedAt: admin.firestore.Timestamp.fromDate(new Date(now))
          }, { merge: true });

          usageResult = {
            allowed: true,
            remaining: 0,
            limitReached: true,
            blockedUntil: newBlockedUntil
          };
          return;
        }

        transaction.set(usageRef, {
          uid,
          messageCount: nextCount,
          blockedUntil: null,
          updatedAt: admin.firestore.Timestamp.fromDate(new Date(now))
        }, { merge: true });

        usageResult = {
          allowed: true,
          remaining: FREE_MESSAGE_LIMIT - nextCount
        };
      });

      if (!usageResult?.allowed) {
        return res.status(429).json({
          code: 'FREE_MESSAGE_LIMIT_REACHED',
          message: 'You are out of Free Messages.',
          blockedUntil:
            usageResult.blockedUntil?.toISOString?.() || null,
          remainingSeconds:
            usageResult.remainingSeconds || 0
        });
      }

      const client =
        new OpenAI({
          apiKey:
            OPENAI_API_KEY
        });

      const response =
        await client.responses.create({
          model: MODEL,

          instructions:
            systemInstructions,

          input: message,

          store: false
        });

      const text =
        response.output_text?.trim();

      if (!text) {
        return res.status(502).json({
          message:
            'The AI service returned an empty response.'
        });
      }

      return res.json({
        text,
        usage: {
          remaining: usageResult?.remaining ?? null,
          limitReached: Boolean(usageResult?.limitReached),
          blockedUntil:
            usageResult?.blockedUntil?.toISOString?.() || null
        }
      });
    } catch (error) {
      console.error(
        'OpenAI request failed:',
        {
          status:
            error?.status,

          code:
            error?.code,

          message:
            error?.message
        }
      );

      if (
        error?.code === 'auth/id-token-expired' ||
        error?.code === 'auth/invalid-id-token' ||
        error?.code === 'auth/argument-error'
      ) {
        return res.status(401).json({
          message:
            'Your authentication session has expired. Please log in again.'
        });
      }

      const status =
        Number.isInteger(
          error?.status
        )
          ? error.status
          : 500;

      if (status === 401) {
        return res.status(502).json({
          message:
            'The AI service authentication failed. Check the OpenAI API key.'
        });
      }

      if (status === 429) {
        return res.status(429).json({
          message:
            'The AI service is currently busy or rate-limited. Please try again shortly.'
        });
      }

      return res.status(502).json({
        message:
          'The AI service could not process the request right now.'
      });
    }
  }
);

// -----------------------------------------------------------------------------
// Start server
// -----------------------------------------------------------------------------

app.listen(
  PORT,
  () => {
    console.log(
      `Legal AI backend running on http://localhost:${PORT}`
    );

    console.log(
      `OpenAI model: ${MODEL}`
    );

    console.log(
      `Resend configured: ${Boolean(
        RESEND_API_KEY
      )}`
    );

    console.log(
      `Firebase Admin configured: ${Boolean(
        adminAuth && adminDb
      )}`
    );

    console.log(
      'Email OTP verification: enabled'
    );

    console.log(
      'OTP expiry: 5 minutes'
    );

    console.log(
      'OTP resend cooldown: 30 seconds'
    );

    console.log(
      'Maximum OTP attempts: 5'
    );
    console.log(
      `Free legal-chat messages: ${FREE_MESSAGE_LIMIT} per 5-hour cooldown`
    );
  }
);