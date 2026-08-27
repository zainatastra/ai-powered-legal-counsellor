import React from 'react';

const SkeletonBlock = ({ style, className = '', dark = false }) => (
  <div className={`skeleton ${dark ? 'on-dark' : ''} ${className}`.trim()} style={style} aria-hidden="true" />
);

const BrandSkeleton = ({ dark = false, round = false }) => (
  <div style={styles.brandRow}>
    <SkeletonBlock dark={dark} style={{ ...styles.brandMark, ...(round ? { borderRadius: 'var(--radius-full)' } : {}) }} />
    <div style={styles.brandText}>
      <SkeletonBlock dark={dark} style={styles.brandLine} />
      <SkeletonBlock dark={dark} style={styles.brandSubLine} />
    </div>
  </div>
);

const AuthSkeleton = () => (
  <div style={styles.authPage}>
    <div className="alc-loading-auth-content" style={styles.authContent}>
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
    <aside className="alc-loading-sidebar" style={styles.chatSidebar}>
      <BrandSkeleton round />

      <SkeletonBlock style={styles.sidebarLawyersBtn} />
      <SkeletonBlock style={styles.sidebarSearch} />
      <SkeletonBlock style={styles.chatNewButton} />

      <div style={styles.chatHistoryHead}>
        <SkeletonBlock style={styles.chatHistoryTitle} />
        <SkeletonBlock style={styles.chatHistoryCount} />
      </div>

      <div style={styles.chatHistoryList}>
        {[1, 2, 3].map((item) => (
          <div key={item} style={styles.chatHistoryItem}>
            <SkeletonBlock style={styles.chatHistoryIcon} />
            <SkeletonBlock style={styles.chatHistoryLine} />
          </div>
        ))}
      </div>

      <div style={styles.sidebarFooter}>
        <div style={styles.sidebarFooterRow}>
          <SkeletonBlock style={styles.sidebarFooterIcon} />
          <div style={styles.brandText}>
            <SkeletonBlock style={styles.sidebarFooterName} />
            <SkeletonBlock style={styles.sidebarFooterEmail} />
          </div>
        </div>
      </div>
    </aside>

    <main style={styles.chatMain}>
      <header className="alc-loading-chat-header" style={styles.chatHeader}>
        <SkeletonBlock style={styles.chatHeaderNotice} />
      </header>

      <section className="alc-loading-chat-content" style={styles.chatContent}>
        <SkeletonBlock style={styles.chatWelcomeIcon} />
        <SkeletonBlock style={styles.chatWelcomeEyebrow} />
        <SkeletonBlock style={styles.chatWelcomeTitle} />
        <SkeletonBlock style={styles.chatWelcomeTitleShort} />
        <SkeletonBlock style={styles.chatWelcomeText} />
        <SkeletonBlock style={styles.chatWelcomeTextShort} />
        <SkeletonBlock style={styles.chatWelcomeDisclaimer} />

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
        <div style={styles.composerCard}>
          <SkeletonBlock style={styles.composerHint} />
          <div style={styles.composerInputRow}>
            <SkeletonBlock style={styles.composerInput} />
            <SkeletonBlock style={styles.composerSendButton} />
          </div>
          <div style={styles.composerFooterRow}>
            <SkeletonBlock style={styles.composerChip} />
            <SkeletonBlock style={styles.composerChipWide} />
            <SkeletonBlock style={styles.composerDisclaimer} />
          </div>
        </div>
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

    <div className="alc-loading-lawyers-grid" style={styles.lawyersGrid}>
      {[1, 2, 3].map((item) => (
        <div key={item} className="alc-loading-lawyer-card" style={styles.lawyerCard}>
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
      `}</style>
    </div>
  );
};

const styles = {
  loaderWrapper: {
    width: '100%',
    minHeight: '100vh',
    overflow: 'hidden',
    background: 'var(--legal-ivory)',
    color: 'var(--legal-navy)',
    fontFamily: 'var(--font-family-base)'
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
    borderRadius: 'var(--radius-full)'
  },
  brandSubLine: {
    width: '96px',
    height: '8px',
    borderRadius: 'var(--radius-full)'
  },

  // Auth
  authPage: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    background: 'var(--legal-ivory)'
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
    borderRadius: 'var(--radius-full)',
    margin: '20px 0 16px'
  },
  authCard: {
    width: '100%',
    background: 'var(--legal-surface)',
    border: '1px solid var(--legal-border)',
    borderRadius: '20px',
    padding: '40px',
    boxSizing: 'border-box',
    boxShadow: '0 16px 40px rgba(16,36,62,0.14)'
  },
  authEyebrow: {
    width: '125px',
    height: '10px',
    borderRadius: 'var(--radius-full)',
    marginBottom: '14px'
  },
  authTitle: {
    width: '58%',
    height: '31px',
    borderRadius: 'var(--radius-full)',
    marginBottom: '12px'
  },
  authSubtitle: {
    width: '86%',
    height: '12px',
    borderRadius: 'var(--radius-full)',
    marginBottom: '30px'
  },
  authFieldGroup: {
    marginBottom: '18px'
  },
  authLabel: {
    width: '90px',
    height: '10px',
    borderRadius: 'var(--radius-full)',
    marginBottom: '9px'
  },
  authLabelShort: {
    width: '72px',
    height: '10px',
    borderRadius: 'var(--radius-full)',
    marginBottom: '9px'
  },
  authInput: {
    width: '100%',
    height: '48px',
    borderRadius: 'var(--radius-full)'
  },
  authButton: {
    width: '100%',
    height: '48px',
    borderRadius: 'var(--radius-full)',
    marginTop: '10px'
  },

  // Session hydration
  sessionPage: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--legal-ivory)'
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
    borderRadius: 'var(--radius-full)'
  },
  sessionSubtitle: {
    width: '130px',
    height: '9px',
    borderRadius: 'var(--radius-full)'
  },

  // Chatbot
  chatPage: {
    display: 'flex',
    height: '100vh',
    width: '100%',
    background: 'var(--legal-ivory)'
  },
  chatSidebar: {
    width: '300px',
    minWidth: '300px',
    height: '100vh',
    boxSizing: 'border-box',
    background: 'var(--legal-surface)',
    borderRight: '1px solid var(--legal-border)',
    padding: '24px 16px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0'
  },
  sidebarLawyersBtn: {
    width: 'calc(100% - 8px)',
    height: '46px',
    borderRadius: 'var(--radius-lg)',
    margin: '4px 4px 16px'
  },
  sidebarSearch: {
    width: '100%',
    height: '48px',
    borderRadius: 'var(--radius-full)',
    marginBottom: '16px'
  },
  chatNewButton: {
    width: '100%',
    height: '48px',
    borderRadius: 'var(--radius-full)',
    marginBottom: '12px'
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
    borderRadius: 'var(--radius-full)'
  },
  chatHistoryCount: {
    width: '22px',
    height: '22px',
    borderRadius: 'var(--radius-full)'
  },
  chatHistoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden'
  },
  chatHistoryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    padding: '8px'
  },
  chatHistoryIcon: {
    width: '30px',
    height: '30px',
    borderRadius: 'var(--radius-full)',
    flexShrink: 0
  },
  chatHistoryLine: {
    width: '120px',
    height: '10px',
    borderRadius: 'var(--radius-full)'
  },
  sidebarFooter: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid var(--legal-border)'
  },
  sidebarFooterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px'
  },
  sidebarFooterIcon: {
    width: '38px',
    height: '38px',
    borderRadius: 'var(--radius-full)',
    flexShrink: 0
  },
  sidebarFooterName: {
    width: '110px',
    height: '11px',
    borderRadius: 'var(--radius-full)'
  },
  sidebarFooterEmail: {
    width: '140px',
    height: '9px',
    borderRadius: 'var(--radius-full)'
  },
  chatMain: {
    flex: 1,
    minWidth: 0,
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--legal-ivory)'
  },
  chatHeader: {
    height: '60px',
    minHeight: '60px',
    padding: '0 24px',
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottom: '1px solid var(--legal-border)'
  },
  chatHeaderNotice: {
    width: '420px',
    maxWidth: '70%',
    height: '9px',
    borderRadius: 'var(--radius-full)'
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
    width: '66px',
    height: '66px',
    borderRadius: 'var(--radius-full)',
    marginBottom: '18px'
  },
  chatWelcomeEyebrow: {
    width: '195px',
    height: '9px',
    borderRadius: 'var(--radius-full)',
    marginBottom: '13px'
  },
  chatWelcomeTitle: {
    width: '390px',
    maxWidth: '80%',
    height: '31px',
    borderRadius: 'var(--radius-full)',
    marginBottom: '10px'
  },
  chatWelcomeTitleShort: {
    width: '310px',
    maxWidth: '68%',
    height: '31px',
    borderRadius: 'var(--radius-full)',
    marginBottom: '17px'
  },
  chatWelcomeText: {
    width: '440px',
    maxWidth: '82%',
    height: '11px',
    borderRadius: 'var(--radius-full)',
    marginBottom: '8px'
  },
  chatWelcomeTextShort: {
    width: '330px',
    maxWidth: '65%',
    height: '11px',
    borderRadius: 'var(--radius-full)'
  },
  chatWelcomeDisclaimer: {
    width: '540px',
    maxWidth: '92%',
    height: '52px',
    borderRadius: 'var(--radius-full)',
    margin: '28px auto 0'
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
    width: '38px',
    height: '38px',
    borderRadius: 'var(--radius-full)',
    flexShrink: 0
  },
  botBubble: {
    width: '380px',
    maxWidth: '68%',
    height: '72px',
    borderRadius: '20px',
    borderBottomLeftRadius: '6px'
  },
  userBubble: {
    width: '230px',
    maxWidth: '55%',
    height: '48px',
    borderRadius: '20px',
    borderBottomRightRadius: '6px'
  },
  chatComposerArea: {
    padding: '12px clamp(18px, 7vw, 32px) 24px',
    flexShrink: 0
  },
  composerCard: {
    width: '100%',
    maxWidth: '980px',
    margin: '0 auto',
    padding: '16px 16px 12px',
    boxSizing: 'border-box',
    background: 'var(--legal-surface)',
    border: '1px solid var(--legal-border)',
    borderRadius: '20px',
    boxShadow: 'var(--shadow-md)'
  },
  composerHint: {
    width: '170px',
    height: '9px',
    borderRadius: 'var(--radius-full)',
    marginBottom: '10px'
  },
  composerInputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  composerInput: {
    flex: 1,
    minWidth: 0,
    height: '52px',
    borderRadius: 'var(--radius-lg)'
  },
  composerSendButton: {
    width: '48px',
    height: '48px',
    borderRadius: 'var(--radius-full)',
    flexShrink: 0
  },
  composerFooterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '10px'
  },
  composerChip: {
    width: '100px',
    height: '31px',
    borderRadius: 'var(--radius-full)'
  },
  composerChipWide: {
    width: '110px',
    height: '31px',
    borderRadius: 'var(--radius-full)'
  },
  composerDisclaimer: {
    width: '190px',
    height: '8px',
    borderRadius: 'var(--radius-full)',
    marginLeft: 'auto'
  },

  // Lawyers
  lawyersPage: {
    minHeight: '100vh',
    padding: '32px clamp(22px, 5vw, 70px)',
    boxSizing: 'border-box',
    background: 'var(--legal-ivory)'
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
    borderRadius: 'var(--radius-full)'
  },
  lawyersHeaderButton: {
    width: '100px',
    height: '42px',
    borderRadius: 'var(--radius-full)'
  },
  lawyersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '24px',
    maxWidth: '1100px',
    margin: '0 auto'
  },
  lawyerCard: {
    background: 'var(--legal-surface)',
    border: '1px solid var(--legal-border)',
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
    borderRadius: 'var(--radius-full)',
    marginBottom: '10px'
  },
  lawyerField: {
    width: '40%',
    height: '10px',
    borderRadius: 'var(--radius-full)',
    marginBottom: '25px'
  },
  lawyerButton: {
    width: '100%',
    height: '44px',
    borderRadius: 'var(--radius-full)'
  }
};

export default Loading;
