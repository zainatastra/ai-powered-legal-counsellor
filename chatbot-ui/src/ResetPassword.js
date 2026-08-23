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

        <form
          onSubmit={handleReset}
          style={styles.form}
          className="reset-form"
        >
          <div style={styles.eyebrow}>ACCOUNT RECOVERY</div>

          <h2 style={styles.heading}>Reset password</h2>

          <p style={styles.intro}>
            Enter your registered email address and we'll send you a secure
            password reset link.
          </p>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email address</label>

            <div style={styles.inputContainer}>
              <Mail
                size={19}
                strokeWidth={1.8}
                style={styles.mailIcon}
              />

              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                className="reset-input"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            style={styles.button}
            className="reset-button"
          >
            Send reset link
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

          <button
            type="button"
            onClick={onBackToLogin}
            style={styles.backButton}
            className="reset-back-button"
          >
            <ArrowLeft size={18} strokeWidth={1.9} />
            <span>Back to login</span>
          </button>
        </form>

        <p style={styles.footer}>
          Your information is securely handled through the platform's
          authentication system.
        </p>
      </div>

      <style>{`
        .reset-input {
          transition:
            border-color 180ms ease,
            box-shadow 180ms ease,
            background 180ms ease;
        }

        .reset-input::placeholder {
          color: #9AA1AB;
          opacity: 1;
        }

        .reset-input:focus {
          border-color: #B8924A !important;
          box-shadow: 0 0 0 3px rgba(184, 146, 74, 0.12);
          background: #FFFFFF !important;
        }

        .reset-button {
          transition:
            background 180ms ease,
            transform 180ms ease,
            box-shadow 180ms ease;
        }

        .reset-button:hover {
          background: #172A46 !important;
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(13, 31, 55, 0.18);
        }

        .reset-button:active {
          transform: translateY(0);
        }

        .reset-back-button {
          transition: color 160ms ease, background 160ms ease;
        }

        .reset-back-button:hover {
          color: #8F6C2F !important;
          background: rgba(184, 146, 74, 0.06) !important;
        }

        @media (max-width: 600px) {
          .reset-form {
            padding: 30px 22px !important;
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
    marginBottom: '20px'
  },

  label: {
    marginBottom: '8px',
    color: '#304158',
    fontFamily: "'Jost', sans-serif",
    fontSize: '14px',
    fontWeight: '600'
  },

  inputContainer: {
    position: 'relative',
    width: '100%'
  },

  mailIcon: {
    position: 'absolute',
    left: '17px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#7B8696',
    pointerEvents: 'none'
  },

  input: {
    width: '100%',
    boxSizing: 'border-box',
    height: '50px',
    padding: '0 17px 0 48px',
    borderRadius: '999px',
    border: '1px solid #D7DDE5',
    background: '#FAFAF9',
    color: '#172033',
    fontFamily: "'Saira', 'Segoe UI', sans-serif",
    fontSize: '15px',
    outline: 'none'
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

  backButton: {
    alignSelf: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
    marginTop: '21px',
    padding: '10px 16px',
    border: '1px solid transparent',
    borderRadius: '999px',
    background: 'transparent',
    color: '#687589',
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

export default ResetPassword;
