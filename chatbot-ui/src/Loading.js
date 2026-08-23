import React from 'react';

const SHIMMER = 'loading-skeleton-shimmer';

const SkeletonBlock = ({ style, className = '' }) => (
  <div className={`${SHIMMER} ${className}`} style={style} aria-hidden="true" />
);

const BrandSkeleton = ({ dark = false }) => (
  <div style={styles.brandRow}>
    <SkeletonBlock style={{ ...styles.brandMark, ...(dark ? styles.darkSkeleton : {}) }} />
    <div style={styles.brandText}>
      <SkeletonBlock style={{ ...styles.brandLine, ...(dark ? styles.darkSkeleton : {}) }} />
      <SkeletonBlock style={{ ...styles.brandSubLine, ...(dark ? styles.darkSkeleton : {}) }} />
    </div>
  </div>
);

const AuthSkeleton = () => (
  <div style={styles.authPage}>
    <div style={styles.authContent}>
      <BrandSkeleton />

      <SkeletonBlock style={styles.authToggle} />

      <div style={styles.authCard}>
        <SkeletonBlock style={styles.authEyebrow} />
        <SkeletonBlock style={styles.authTitle} />
        <SkeletonBlock style={styles.authSubtitle} />

        <div style={styles.authFieldGroup}>
          <SkeletonBlock style={styles.authLabel} />
          <SkeletonBlock style={styles.authInput} />
        </div>

        <div style={styles.authFieldGroup}>
          <SkeletonBlock style={styles.authLabelShort} />
          <SkeletonBlock style={styles.authInput} />
        </div>

        <SkeletonBlock style={styles.authButton} />
      </div>
    </div>
  </div>
);

const SessionSkeleton = () => (
  <div style={styles.sessionPage}>
    <div style={styles.sessionCenter}>
      <SkeletonBlock style={styles.sessionLogo} />
      <SkeletonBlock style={styles.sessionTitle} />
      <SkeletonBlock style={styles.sessionSubtitle} />
    </div>
  </div>
);

const ChatbotSkeleton = () => (
  <div style={styles.chatPage}>
    <aside style={styles.chatSidebar}>
      <BrandSkeleton dark />

      <SkeletonBlock style={{ ...styles.chatUserCard, ...styles.darkSkeleton }} />
      <SkeletonBlock style={{ ...styles.chatNewButton, ...styles.darkSkeleton }} />

      <div style={styles.chatHistoryHead}>
        <SkeletonBlock style={{ ...styles.chatHistoryTitle, ...styles.darkSkeleton }} />
        <SkeletonBlock style={{ ...styles.chatHistoryCount, ...styles.darkSkeleton }} />
      </div>

      <div style={styles.chatHistoryList}>
        {[1, 2, 3].map((item) => (
          <div key={item} style={styles.chatHistoryItem}>
            <SkeletonBlock style={{ ...styles.chatHistoryIcon, ...styles.darkSkeleton }} />
            <SkeletonBlock style={{ ...styles.chatHistoryLine, ...styles.darkSkeleton }} />
          </div>
        ))}
      </div>

      <SkeletonBlock style={{ ...styles.chatLogout, ...styles.darkSkeleton }} />
    </aside>

    <main style={styles.chatMain}>
      <header style={styles.chatHeader}>
        <div style={styles.chatHeaderIdentity}>
          <SkeletonBlock style={styles.chatHeaderLogo} />
          <div>
            <SkeletonBlock style={styles.chatHeaderTitle} />
            <SkeletonBlock style={styles.chatHeaderSub} />
          </div>
        </div>
        <SkeletonBlock style={styles.chatHeaderStatus} />
      </header>

      <section style={styles.chatContent}>
        <SkeletonBlock style={styles.chatWelcomeIcon} />
        <SkeletonBlock style={styles.chatWelcomeEyebrow} />
        <SkeletonBlock style={styles.chatWelcomeTitle} />
        <SkeletonBlock style={styles.chatWelcomeTitleShort} />
        <SkeletonBlock style={styles.chatWelcomeText} />
        <SkeletonBlock style={styles.chatWelcomeTextShort} />

        <div style={styles.chatMessages}>
          <div style={styles.botMessageSkeleton}>
            <SkeletonBlock style={styles.messageAvatar} />
            <SkeletonBlock style={styles.botBubble} />
          </div>
          <div style={styles.userMessageSkeleton}>
            <SkeletonBlock style={styles.userBubble} />
          </div>
        </div>
      </section>

      <div style={styles.chatComposerArea}>
        <SkeletonBlock style={styles.composerHint} />
        <SkeletonBlock style={styles.composer} />
        <SkeletonBlock style={styles.composerDisclaimer} />
      </div>
    </main>
  </div>
);

const LawyersSkeleton = () => (
  <div style={styles.lawyersPage}>
    <div style={styles.lawyersHeader}>
      <SkeletonBlock style={styles.lawyersHeading} />
      <SkeletonBlock style={styles.lawyersHeaderButton} />
    </div>

    <div style={styles.lawyersGrid}>
      {[1, 2, 3].map((item) => (
        <div key={item} style={styles.lawyerCard}>
          <SkeletonBlock style={styles.lawyerImage} />
          <SkeletonBlock style={styles.lawyerName} />
          <SkeletonBlock style={styles.lawyerField} />
          <SkeletonBlock style={styles.lawyerButton} />
        </div>
      ))}
    </div>
  </div>
);

const Loading = ({ variant = 'session' }) => {
  const content = {
    auth: <AuthSkeleton />,
    chatbot: <ChatbotSkeleton />,
    lawyers: <LawyersSkeleton />,
    session: <SessionSkeleton />
  }[variant] || <SessionSkeleton />;

  return (
    <div
      style={styles.loaderWrapper}
      aria-label="Loading"
      aria-busy="true"
    >
      {content}

      <style>{`
        @keyframes alcSkeletonShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .${SHIMMER} {
          background: linear-gradient(
            100deg,
            rgba(226, 222, 213, 0.68) 20%,
            rgba(249, 247, 242, 0.98) 50%,
            rgba(226, 222, 213, 0.68) 80%
          );
          background-size: 240% 100%;
          animation: alcSkeletonShimmer 1.35s ease-in-out infinite;
        }

        @media (max-width: 900px) {
          .alc-loading-sidebar {
            width: 240px !important;
            min-width: 240px !important;
          }
        }

        @media (max-width: 767px) {
          .alc-loading-sidebar {
            display: none !important;
          }

          .alc-loading-chat-header {
            padding-left: 18px !important;
            padding-right: 18px !important;
          }

          .alc-loading-chat-content {
            padding-left: 22px !important;
            padding-right: 22px !important;
          }

          .alc-loading-lawyers-grid {
            grid-template-columns: 1fr !important;
          }

          .alc-loading-lawyer-card:nth-child(n+2) {
            display: none !important;
          }

          .alc-loading-auth-content {
            padding: 24px !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .${SHIMMER} {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

const styles = {
  loaderWrapper: {
    width: '100%',
    minHeight: '100vh',
    overflow: 'hidden',
    background: '#FCFBF8',
    color: '#10243E',
    fontFamily: "'Saira', 'Segoe UI', sans-serif"
  },

  // Shared
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '11px'
  },
  brandMark: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    flexShrink: 0
  },
  brandText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px'
  },
  brandLine: {
    width: '150px',
    height: '13px',
    borderRadius: '999px'
  },
  brandSubLine: {
    width: '96px',
    height: '8px',
    borderRadius: '999px'
  },
  darkSkeleton: {
    background: 'linear-gradient(100deg, rgba(255,255,255,0.055) 20%, rgba(255,255,255,0.13) 50%, rgba(255,255,255,0.055) 80%)',
    backgroundSize: '240% 100%'
  },

  // Auth
  authPage: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    background: '#FCFBF8'
  },
  authContent: {
    width: '100%',
    maxWidth: '520px',
    padding: '62px 30px',
    boxSizing: 'border-box'
  },
  authToggle: {
    width: '100%',
    height: '56px',
    borderRadius: '999px',
    margin: '28px 0 16px'
  },
  authCard: {
    width: '100%',
    background: '#FFFFFF',
    border: '1px solid #E6E0D5',
    borderRadius: '28px',
    padding: '34px',
    boxSizing: 'border-box',
    boxShadow: '0 18px 55px rgba(11,23,42,0.055)'
  },
  authEyebrow: {
    width: '125px',
    height: '10px',
    borderRadius: '999px',
    marginBottom: '14px'
  },
  authTitle: {
    width: '58%',
    height: '31px',
    borderRadius: '999px',
    marginBottom: '12px'
  },
  authSubtitle: {
    width: '86%',
    height: '12px',
    borderRadius: '999px',
    marginBottom: '30px'
  },
  authFieldGroup: {
    marginBottom: '18px'
  },
  authLabel: {
    width: '90px',
    height: '10px',
    borderRadius: '999px',
    marginBottom: '9px'
  },
  authLabelShort: {
    width: '72px',
    height: '10px',
    borderRadius: '999px',
    marginBottom: '9px'
  },
  authInput: {
    width: '100%',
    height: '48px',
    borderRadius: '999px'
  },
  authButton: {
    width: '100%',
    height: '50px',
    borderRadius: '999px',
    marginTop: '10px'
  },

  // Session hydration
  sessionPage: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#FCFBF8'
  },
  sessionCenter: {
    width: '230px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px'
  },
  sessionLogo: {
    width: '58px',
    height: '58px',
    borderRadius: '17px'
  },
  sessionTitle: {
    width: '180px',
    height: '14px',
    borderRadius: '999px'
  },
  sessionSubtitle: {
    width: '130px',
    height: '9px',
    borderRadius: '999px'
  },

  // Chatbot
  chatPage: {
    display: 'flex',
    height: '100vh',
    width: '100%',
    background: '#FCFBF8'
  },
  chatSidebar: {
    width: '280px',
    minWidth: '280px',
    height: '100vh',
    boxSizing: 'border-box',
    background: '#0B172A',
    padding: '22px 16px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0'
  },
  chatUserCard: {
    width: '100%',
    height: '60px',
    borderRadius: '14px',
    marginTop: '20px'
  },
  chatNewButton: {
    width: '100%',
    height: '46px',
    borderRadius: '999px',
    marginTop: '14px'
  },
  chatHistoryHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: '24px 8px 12px'
  },
  chatHistoryTitle: {
    width: '125px',
    height: '9px',
    borderRadius: '999px'
  },
  chatHistoryCount: {
    width: '22px',
    height: '22px',
    borderRadius: '999px'
  },
  chatHistoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px'
  },
  chatHistoryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    padding: '5px 7px'
  },
  chatHistoryIcon: {
    width: '27px',
    height: '27px',
    borderRadius: '8px',
    flexShrink: 0
  },
  chatHistoryLine: {
    width: '120px',
    height: '10px',
    borderRadius: '999px'
  },
  chatLogout: {
    width: '100%',
    height: '43px',
    borderRadius: '999px',
    marginTop: 'auto'
  },
  chatMain: {
    flex: 1,
    minWidth: 0,
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#FCFBF8'
  },
  chatHeader: {
    minHeight: '70px',
    padding: '0 30px',
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #E6E0D5'
  },
  chatHeaderIdentity: {
    display: 'flex',
    alignItems: 'center',
    gap: '11px'
  },
  chatHeaderLogo: {
    width: '35px',
    height: '35px',
    borderRadius: '10px'
  },
  chatHeaderTitle: {
    width: '150px',
    height: '12px',
    borderRadius: '999px',
    marginBottom: '6px'
  },
  chatHeaderSub: {
    width: '112px',
    height: '8px',
    borderRadius: '999px'
  },
  chatHeaderStatus: {
    width: '94px',
    height: '10px',
    borderRadius: '999px'
  },
  chatContent: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '52px 24px 20px',
    boxSizing: 'border-box'
  },
  chatWelcomeIcon: {
    width: '62px',
    height: '62px',
    borderRadius: '17px',
    marginBottom: '18px'
  },
  chatWelcomeEyebrow: {
    width: '195px',
    height: '9px',
    borderRadius: '999px',
    marginBottom: '13px'
  },
  chatWelcomeTitle: {
    width: '390px',
    maxWidth: '80%',
    height: '31px',
    borderRadius: '999px',
    marginBottom: '10px'
  },
  chatWelcomeTitleShort: {
    width: '310px',
    maxWidth: '68%',
    height: '31px',
    borderRadius: '999px',
    marginBottom: '17px'
  },
  chatWelcomeText: {
    width: '440px',
    maxWidth: '82%',
    height: '11px',
    borderRadius: '999px',
    marginBottom: '8px'
  },
  chatWelcomeTextShort: {
    width: '330px',
    maxWidth: '65%',
    height: '11px',
    borderRadius: '999px'
  },
  chatMessages: {
    width: '100%',
    maxWidth: '760px',
    marginTop: '30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  botMessageSkeleton: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px'
  },
  userMessageSkeleton: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  messageAvatar: {
    width: '30px',
    height: '30px',
    borderRadius: '9px',
    flexShrink: 0
  },
  botBubble: {
    width: '380px',
    maxWidth: '68%',
    height: '72px',
    borderRadius: '14px'
  },
  userBubble: {
    width: '230px',
    maxWidth: '55%',
    height: '48px',
    borderRadius: '14px'
  },
  chatComposerArea: {
    padding: '12px clamp(18px, 7vw, 100px) 17px',
    flexShrink: 0
  },
  composerHint: {
    width: '130px',
    height: '9px',
    borderRadius: '999px',
    marginBottom: '7px'
  },
  composer: {
    width: '100%',
    maxWidth: '900px',
    height: '54px',
    borderRadius: '999px',
    margin: '0 auto'
  },
  composerDisclaimer: {
    width: '210px',
    height: '8px',
    borderRadius: '999px',
    margin: '7px auto 0'
  },

  // Lawyers
  lawyersPage: {
    minHeight: '100vh',
    padding: '32px clamp(22px, 5vw, 70px)',
    boxSizing: 'border-box',
    background: '#FCFBF8'
  },
  lawyersHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '35px'
  },
  lawyersHeading: {
    width: '210px',
    height: '28px',
    borderRadius: '999px'
  },
  lawyersHeaderButton: {
    width: '100px',
    height: '42px',
    borderRadius: '999px'
  },
  lawyersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '24px',
    maxWidth: '1100px',
    margin: '0 auto'
  },
  lawyerCard: {
    background: '#FFFFFF',
    border: '1px solid #E6E0D5',
    borderRadius: '26px',
    padding: '28px 24px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 14px 40px rgba(11,23,42,0.055)'
  },
  lawyerImage: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    marginBottom: '20px'
  },
  lawyerName: {
    width: '62%',
    height: '14px',
    borderRadius: '999px',
    marginBottom: '10px'
  },
  lawyerField: {
    width: '40%',
    height: '10px',
    borderRadius: '999px',
    marginBottom: '25px'
  },
  lawyerButton: {
    width: '100%',
    height: '44px',
    borderRadius: '999px'
  }
};

export default Loading;
