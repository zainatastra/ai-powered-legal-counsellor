import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { auth, db } from './firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import {
  onAuthStateChanged,
  updateProfile,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  signOut,
  multiFactor,
  TotpMultiFactorGenerator
} from 'firebase/auth';
import { ConsentModal, SuccessModal, ErrorModal, Toast } from './GlobalFeedback';
import Loading from './Loading';

const PUBLIC_PATH = process.env.PUBLIC_URL || '';
const sidebarLogoSrc = `${PUBLIC_PATH}/favicon.png`;
const headerLogoSrc = `${PUBLIC_PATH}/logo.png`;
const faviconSrc = `${PUBLIC_PATH}/favicon.png`;

const Icon = ({ name, size = 20, stroke = 1.8 }) => {
  const paths = {
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 5 5" /></>,
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9" /><path d="M9 20v-6h6v6" /></>,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" /></>,
    library: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M4 5.5v16" /><path d="M8 7h8" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    scale: <><path d="M12 3v18" /><path d="M5 6h14" /><path d="M7 6 3.5 13h7L7 6ZM17 6 13.5 13h7L17 6Z" /><path d="M8 21h8" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
    logout: <><path d="M10 5H5v14h5" /><path d="m14 8 4 4-4 4" /><path d="M18 12H9" /></>,
    chevronUp: <path d="m6 14 6-6 6 6" />,
    chevronDown: <path d="m6 10 6 6 6-6" />,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
    edit: <><path d="m4 16 9.8-9.8a2.1 2.1 0 0 1 3 3L7 18l-4 1 1-4Z" /><path d="m14 5 3 3" /></>,
    trash: <><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13" /><path d="M9 7V4h6v3" /></>,
    send: <path d="m5 4 15 8-15 8 3-8-3-8Zm3 8h12" />,
    spark: <><path d="m12 3 1.2 5.8L19 10l-5.8 1.2L12 17l-1.2-5.8L5 10l5.8-1.2L12 3Z" /><path d="m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 10v6" /><path d="M12 7h.01" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    settings: <><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.64 5.64l1.42 1.42M16.94 16.94l1.42 1.42M18.36 5.64l-1.42 1.42M7.06 16.94l-1.42 1.42" /><circle cx="12" cy="12" r="4" /></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.3 8.5-8 10-4.7-1.5-8-5-8-10V6l8-3Z" /><path d="M9 12.5 11 14.5 15.5 10" /></>,
    laptop: <><rect x="4" y="5" width="16" height="11" rx="1.5" /><path d="M2 19h20" /><path d="M9 19h6" /></>,
    mobile: <><rect x="7" y="2.5" width="10" height="19" rx="2" /><path d="M11 18.5h2" /></>,
    eye: <><path d="M2.5 12s3.2-5 9.5-5 9.5 5 9.5 5-3.2 5-9.5 5-9.5-5-9.5-5Z" /><circle cx="12" cy="12" r="2.5" /></>,
    eyeOff: <><path d="m3 3 18 18" /><path d="M10.6 6.3C11.05 6.2 11.51 6.14 12 6.14c6.3 0 9.5 5.86 9.5 5.86a16.3 16.3 0 0 1-2.65 3.25" /><path d="M6.15 6.8C3.75 8.1 2.5 12 2.5 12s3.2 5.86 9.5 5.86c1.02 0 1.95-.15 2.8-.4" /><path d="M10.3 10.3a2.5 2.5 0 0 0 3.4 3.4" /></>,
    lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
};


const SESSION_STORAGE_KEY = 'ai-legal-counsellor-session-id';
const MFA_DISPLAY_NAME = 'Authenticator app';
const QR_CODE_LIBRARY_URL = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';

const loadQrCodeLibrary = () => new Promise((resolve, reject) => {
  if (typeof window === 'undefined') {
    reject(new Error('QR code generation is only available in the browser.'));
    return;
  }

  if (window.QRCode) {
    resolve(window.QRCode);
    return;
  }

  const existingScript = document.querySelector(`script[data-legal-counsellor-qrcode="true"]`);
  if (existingScript) {
    existingScript.addEventListener('load', () => window.QRCode ? resolve(window.QRCode) : reject(new Error('QR code library failed to load.')), { once: true });
    existingScript.addEventListener('error', () => reject(new Error('QR code library failed to load.')), { once: true });
    return;
  }

  const script = document.createElement('script');
  script.src = QR_CODE_LIBRARY_URL;
  script.async = true;
  script.dataset.legalCounsellorQrcode = 'true';
  script.onload = () => window.QRCode ? resolve(window.QRCode) : reject(new Error('QR code library failed to load.'));
  script.onerror = () => reject(new Error('QR code library failed to load.'));
  document.head.appendChild(script);
});

const createSessionId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
};

const getStoredSessionId = () => {
  try {
    return window.localStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
};

const storeSessionId = (sessionId) => {
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  } catch {}
};

const clearStoredSessionId = () => {
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {}
};

const parseDeviceInfo = () => {
  const ua = navigator.userAgent || '';
  const platform = navigator.userAgentData?.platform || navigator.platform || '';
  const lower = ua.toLowerCase();

  const isMobile = /iphone|ipad|ipod|android|mobile/.test(lower);
  let device = isMobile ? 'Mobile' : 'Mac';
  let os = 'Unknown';

  if (/iphone|ipad|ipod/.test(lower)) {
    device = /ipad/.test(lower) ? 'iPad' : 'iPhone';
    const match = ua.match(/OS (\d+)[._](\d+)/i);
    os = match ? `iOS ${match[1]}.${match[2]}` : 'iOS';
  } else if (/android/.test(lower)) {
    device = 'Android';
    const match = ua.match(/Android\s([\d.]+)/i);
    os = match ? `Android ${match[1]}` : 'Android';
  } else if (/macintosh|mac os x/.test(lower) || /mac/i.test(platform)) {
    device = 'Mac';
    const match = ua.match(/Mac OS X\s([\d_]+)/i);
    os = match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS';
  } else if (/windows/.test(lower)) {
    device = 'Windows PC';
    const match = ua.match(/Windows NT\s([\d.]+)/i);
    os = match ? `Windows` : 'Windows';
  } else if (/linux/.test(lower)) {
    device = 'Linux';
    os = 'Linux';
  }

  let browser = 'Browser';
  if (/edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/opr\//i.test(ua)) browser = 'Opera';
  else if (/chrome\//i.test(ua) && !/edg\//i.test(ua)) browser = 'Chrome';
  else if (/firefox\//i.test(ua)) browser = 'Firefox';
  else if (/safari\//i.test(ua) && !/chrome\//i.test(ua)) browser = 'Safari';

  return {
    device,
    os,
    browser,
    icon: isMobile ? 'mobile' : 'laptop',
    userAgent: ua
  };
};

const getSessionLocation = async () => ({
  city: 'Unknown location',
  region: ''
});

const formatSessionDate = (timestamp) => {
  if (!timestamp) return 'Just now';
  const date = typeof timestamp?.toDate === 'function'
    ? timestamp.toDate()
    : new Date(timestamp);

  if (Number.isNaN(date.getTime())) return 'Just now';

  const datePart = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const timePart = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  });
  return `${datePart} at ${timePart}`;
};

// Lightweight, client-side chat title generator -- no extra AI call, so it
// costs nothing and is instant. Falls back sensibly for bare greetings.
const GREETING_ONLY = /^(hi+|hey+|hello+|salam\w*|assalam\w*|good\s?(morning|afternoon|evening))[\s!.,]*$/i;

const generateSmartTitle = (text) => {
  const trimmed = (text || '').trim();
  if (!trimmed) return 'New Conversation';
  if (GREETING_ONLY.test(trimmed)) return 'General Inquiry';

  const cleaned = trimmed
    .replace(/\s+/g, ' ')
    .replace(/^(please|can you|could you|i want to know|i need to know|i need|tell me about|what is|what are|how do i|how can i)\s+/i, '');

  const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  const withoutPunct = capitalized.replace(/[?.!]+$/, '');

  if (withoutPunct.length <= 42) return withoutPunct;

  const truncated = withoutPunct.slice(0, 42);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 20 ? truncated.slice(0, lastSpace) : truncated).trim() + '…';
};

const sortSessions = (items) => [...items].sort((a, b) => {
  const aTime = a.createdAt?.toMillis?.() || new Date(a.createdAt || 0).getTime() || 0;
  const bTime = b.createdAt?.toMillis?.() || new Date(b.createdAt || 0).getTime() || 0;
  return bTime - aTime;
});

// Formats an ISO timestamp in the viewer's own local time/timezone -- the
// server deliberately never formats this itself, since the server's
// timezone may not match the user's.
const formatResetTime = (isoString) => {
  if (!isoString) return '';
  try {
    return new Date(isoString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
};

const Chatbot = ({ onLogout }) => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [typingMessage, setTypingMessage] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [titleTyping, setTitleTyping] = useState({ chatId: null, text: '' });
  const [userId, setUserId] = useState(null);
  const [chatHistoryList, setChatHistoryList] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [editChatId, setEditChatId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userFirstName, setUserFirstName] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 900);
  const [historySearch, setHistorySearch] = useState('');
  const [activeAccountModal, setActiveAccountModal] = useState(null);
  const [profileNameInput, setProfileNameInput] = useState('');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');
  const [settingsSection, setSettingsSection] = useState('account');
  const [deleteAccountConsentOpen, setDeleteAccountConsentOpen] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [deleteChatsConsentOpen, setDeleteChatsConsentOpen] = useState(false);
  const [logoutConsentOpen, setLogoutConsentOpen] = useState(false);
  const [chatPendingDeletion, setChatPendingDeletion] = useState(null);
  const [deleteChatLoading, setDeleteChatLoading] = useState(false);
  const [deleteChatsLoading, setDeleteChatsLoading] = useState(false);
  const [accountDeleted, setAccountDeleted] = useState(false);
  const [globalFeedback, setGlobalFeedback] = useState({ type: null, title: '', message: '' });
  const [toast, setToast] = useState({ open: false, message: '', type: 'default' });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState(null);
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [isSettingUpTwoFactor, setIsSettingUpTwoFactor] = useState(false);
  const [isLoadingTwoFactor, setIsLoadingTwoFactor] = useState(false);
  const [isEnrollingTwoFactor, setIsEnrollingTwoFactor] = useState(false);
  const [twoFactorVerificationCode, setTwoFactorVerificationCode] = useState('');
  const [totpSecret, setTotpSecret] = useState(null);
  const [totpUri, setTotpUri] = useState('');
  const [twoFactorError, setTwoFactorError] = useState('');
  const [chatLimit, setChatLimit] = useState({ checked: false, reached: false, resetAt: null });
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const qrCodeRef = useRef(null);
  const sessionIdRef = useRef(null);
  const currentUserRef = useRef(null);


  const dropdownRefs = useRef({});
  const accountMenuRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      currentUserRef.current = user;

      if (user) {
        try {
          await user.reload();
          await user.getIdToken(true);
        } catch (error) {
          console.error('Authentication refresh failed:', error);
          setUserId(null);
          setAuthChecked(true);
          return;
        }

        if (!auth.currentUser?.emailVerified) {
          setUserId(null);
          setAuthChecked(true);
          return;
        }

        setUserId(user.uid);
        setUserEmail(user.email || '');
        const userProfile = await getDoc(doc(db, 'users', user.uid));
        const profileData = userProfile.exists() ? userProfile.data() : {};

        const firstName = typeof profileData.firstName === 'string'
          ? profileData.firstName.trim()
          : '';
        const lastName = typeof profileData.lastName === 'string'
          ? profileData.lastName.trim()
          : '';
        const firestoreFullName = [firstName, lastName].filter(Boolean).join(' ');

        const providerDisplayName =
          user.displayName ||
          user.providerData?.find(provider => provider.displayName)?.displayName ||
          '';

        const emailName = (user.email || '').split('@')[0]
          .replace(/[._-]+/g, ' ')
          .replace(/\b\w/g, letter => letter.toUpperCase())
          .trim();

        // Use the user's Firestore profile name as the source of truth.
        // Firebase Auth displayName and email are only fallbacks for older
        // accounts that may not have a complete profile document.
        const resolvedName = firestoreFullName || providerDisplayName.trim() || emailName || 'Account';
        setUserName(resolvedName);
        setUserFirstName(firstName || resolvedName.split(' ')[0] || '');
        setProfileNameInput(resolvedName);
        setProfileAvatarUrl(profileData.photoURL || user.photoURL || '');
        setAuthChecked(true);

        setIsLoadingHistory(true);
        try {
          await fetchChatHistoryList(user.uid);
        } finally {
          setIsLoadingHistory(false);
        }
      } else {
        setUserId(null);
        setAuthChecked(true);
        setIsLoadingHistory(false);
      }
    });

    return () => unsubscribe();
  }, []);


  const refreshTwoFactorState = () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setIsTwoFactorEnabled(false);
      return;
    }

    const enrolledFactors = multiFactor(currentUser).enrolledFactors || [];
    setIsTwoFactorEnabled(
      enrolledFactors.some(factor => factor.factorId === TotpMultiFactorGenerator.FACTOR_ID)
    );
  };

  useEffect(() => {
    refreshTwoFactorState();
  }, [userId]);

  // Checks the server-persisted free-message quota whenever a user becomes
  // authenticated -- covers initial load, page refresh, and logging back
  // in, so the "out of free messages" state is always driven by the
  // server/Firestore, never by anything stored in the browser.
  useEffect(() => {
    if (!userId) {
      setChatLimit({ checked: false, reached: false, resetAt: null });
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const activeUser = auth.currentUser || currentUserRef.current;
        const idToken = await activeUser?.getIdToken();
        if (!idToken) return;

        const response = await fetch('/api/legal-chat/limit-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
        });

        const data = await response.json();
        if (cancelled || !response.ok) return;

        setChatLimit({
          checked: true,
          reached: Boolean(data?.limitReached),
          resetAt: data?.resetAt || null
        });
      } catch (error) {
        console.error('Chat limit status check failed:', error);
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  // If the lockout is active and the tab stays open past the reset time,
  // clear it automatically -- the user shouldn't need to refresh to get
  // access back the moment the 5 hours are up.
  useEffect(() => {
    if (!chatLimit.reached || !chatLimit.resetAt) return undefined;

    const msRemaining = new Date(chatLimit.resetAt).getTime() - Date.now();
    if (msRemaining <= 0) {
      setChatLimit({ checked: true, reached: false, resetAt: null });
      return undefined;
    }

    const timer = setTimeout(() => {
      setChatLimit({ checked: true, reached: false, resetAt: null });
    }, msRemaining);

    return () => clearTimeout(timer);
  }, [chatLimit.reached, chatLimit.resetAt]);

  useEffect(() => {
    if (!userId) {
      setSessions([]);
      return undefined;
    }

    let cancelled = false;
    let heartbeatTimer = null;
    let unsubscribeSession = null;

    const registerSession = async () => {
      setIsLoadingSessions(true);

      const sessionId = createSessionId();
      sessionIdRef.current = sessionId;
      storeSessionId(sessionId);

      const deviceInfo = parseDeviceInfo();
      const location = await getSessionLocation();
      if (cancelled) return;

      const sessionRef = doc(db, 'sessions', sessionId);

      const sessionData = {
        userId,
        sessionId,
        device: deviceInfo.device,
        os: deviceInfo.os,
        browser: deviceInfo.browser,
        icon: deviceInfo.icon,
        userAgent: deviceInfo.userAgent,
        city: location.city,
        region: location.region,
        revoked: false,
        lastActiveAt: serverTimestamp()
      };

      await setDoc(sessionRef, {
        ...sessionData,
        createdAt: serverTimestamp()
      }, { merge: true });

      unsubscribeSession = onSnapshot(sessionRef, async snapshot => {
        if (!snapshot.exists()) return;
        const data = snapshot.data();

        if (data.revoked === true && !cancelled) {
          clearStoredSessionId();
          try {
            await signOut(auth);
          } finally {
            sessionIdRef.current = null;
            setActiveAccountModal(null);
            setIsAccountMenuOpen(false);
          }
        }
      });

      heartbeatTimer = window.setInterval(async () => {
        if (cancelled || !sessionIdRef.current || !auth.currentUser) return;
        try {
          await updateDoc(sessionRef, { lastActiveAt: serverTimestamp() });
        } catch (error) {
          console.error('Session heartbeat failed:', error);
        }
      }, 30000);

      setIsLoadingSessions(false);
    };

    registerSession().catch(error => {
      console.error('Session registration failed:', error);
      if (!cancelled) setIsLoadingSessions(false);
    });

    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('userId', '==', userId)
    );

    const unsubscribeSessions = onSnapshot(
      sessionsQuery,
      snapshot => {
        const nextSessions = snapshot.docs
          .map(item => ({ id: item.id, ...item.data() }))
          .filter(item => !item.revoked);
        setSessions(sortSessions(nextSessions));
      },
      error => {
        console.error('Session list failed:', error);
        setSessions([]);
      }
    );

    return () => {
      cancelled = true;
      if (heartbeatTimer) window.clearInterval(heartbeatTimer);
      unsubscribeSession?.();
      unsubscribeSessions();
    };
  }, [userId]);

  useEffect(() => {
    document.title = 'AI-Powered Legal Counsellor';

    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.type = 'image/png';
    favicon.href = faviconSrc;

    const fontId = 'titillium-web-font';
    if (!document.getElementById(fontId)) {
      const font = document.createElement('link');
      font.id = fontId;
      font.rel = 'stylesheet';
      font.href = 'https://fonts.googleapis.com/css2?family=Titillium+Web:wght@400;500;600;700&display=swap';
      document.head.appendChild(font);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const focusComposerInput = () => {
      requestAnimationFrame(() => {
        if (inputRef.current && document.activeElement !== inputRef.current) {
          inputRef.current.focus();
        }
      });
    };

    focusComposerInput();

    const handleGlobalTyping = (event) => {
      const target = event.target;
      const isEditableTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if (isEditableTarget || event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key.length === 1) {
        inputRef.current?.focus();
        setInput(prev => prev + event.key);
      } else if (event.key === 'Backspace') {
        inputRef.current?.focus();
        setInput(prev => prev.slice(0, -1));
      }
    };

    window.addEventListener('keydown', handleGlobalTyping);
    return () => window.removeEventListener('keydown', handleGlobalTyping);
  }, [authChecked, userId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const refs = Object.values(dropdownRefs.current).filter(Boolean);
      const clickedChatDropdown = refs.some(ref => ref.contains(event.target));
      const clickedAccountMenu = accountMenuRef.current?.contains(event.target);

      if (!clickedChatDropdown) setOpenDropdownId(null);
      if (!clickedAccountMenu) setIsAccountMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenProfile = () => {
    setIsAccountMenuOpen(false);
    setProfileNameInput(displayName);
    setActiveAccountModal('profile');
  };

  const handleOpenSettings = () => {
    setIsAccountMenuOpen(false);
    setSettingsSection('account');
    resetPasswordForm();
    setActiveAccountModal('settings');
  };

  const handleCloseAccountModal = () => {
    setActiveAccountModal(null);
  };

  const handleSaveProfile = async () => {
    const nextName = profileNameInput.trim();
    if (!userId || !nextName) return;

    const nameParts = nextName.split(/\\s+/);
    const firstName = nameParts.shift() || '';
    const lastName = nameParts.join(' ');

    try {
      await updateDoc(doc(db, 'users', userId), {
        firstName,
        lastName,
        displayName: nextName
      });

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: nextName });
      }

      setUserName(nextName);
      setProfileNameInput(nextName);
      setActiveAccountModal(null);
    } catch (error) {
      console.error('Profile update failed:', error);
    }
  };

  const handleDeleteAllChats = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !userId) return;

    setDeleteChatsLoading(true);

    try {
      const idToken = await currentUser.getIdToken(true);

      const response = await fetch('/api/auth/delete-chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ idToken })
      });

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
          'We could not delete your chats. Please try again.'
        );
      }

      setDeleteChatsConsentOpen(false);
      setChatHistoryList([]);
      setMessages([{ sender: 'bot', text: 'Hello! How can I help you today?' }]);
      setActiveChatId(null);
      setGlobalFeedback({
        type: 'success',
        title: 'Chats deleted',
        message: 'All of your saved conversations have been permanently deleted.'
      });
    } catch (error) {
      console.error('Delete all Chat Failed:', error);

      setDeleteChatsConsentOpen(false);
      setGlobalFeedback({
        type: 'error',
        title: 'Chats could not be deleted',
        message: error?.message || 'We could not delete your chats. Please try again later.'
      });
    } finally {
      setDeleteChatsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !userId) return;

    setDeleteAccountLoading(true);

    try {
      // Remove every chat document owned by this user.
      const chatQuery = query(
        collection(db, 'chatHistory'),
        where('userId', '==', userId)
      );
      const chatSnapshot = await getDocs(chatQuery);
      await Promise.all(chatSnapshot.docs.map(chatDoc => deleteDoc(chatDoc.ref)));

      // Remove the user's Firestore profile document.
      await deleteDoc(doc(db, 'users', userId));

      // Finally remove the Firebase Authentication account.
      await deleteUser(currentUser);

      setDeleteAccountConsentOpen(false);
      setActiveAccountModal(null);
      setChatHistoryList([]);
      setMessages([{ sender: 'bot', text: 'Hello! How may I help you today?' }]);
      setActiveChatId(null);
      setAccountDeleted(true);
      setGlobalFeedback({
        type: 'success',
        title: 'Account deleted',
        message: 'Your account, chats and stored profile data have been permanently deleted.'
      });
    } catch (error) {
      console.error('Account deletion failed:', error);

      const requiresRecentLogin =
        error?.code === 'auth/requires-recent-login' ||
        error?.code === 'auth/user-token-expired';

      setDeleteAccountConsentOpen(false);
      setGlobalFeedback({
        type: 'error',
        title: 'Account could not be deleted',
        message: requiresRecentLogin
          ? 'For security, Firebase requires you to sign in again before this account can be permanently deleted.'
          : 'We could not completely delete the account. Please try again.'
      });
    } finally {
      setDeleteAccountLoading(false);
    }
  };

  const passwordRules = {
    minLength: passwordForm.newPassword.length >= 12,
    uppercase: /[A-Z]/.test(passwordForm.newPassword),
    lowercase: /[a-z]/.test(passwordForm.newPassword),
    special: /[^A-Za-z0-9]/.test(passwordForm.newPassword),
    number: /\d/.test(passwordForm.newPassword)
  };

  const isNewPasswordValid = Object.values(passwordRules).every(Boolean);
  const passwordsMatch = passwordForm.newPassword.length > 0 && passwordForm.newPassword === passwordForm.confirmPassword;
  const canChangePassword = Boolean(passwordForm.oldPassword) && isNewPasswordValid && passwordsMatch && !isChangingPassword;

  const resetPasswordForm = () => {
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleChangePassword = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser?.email || !canChangePassword) return;

    setIsChangingPassword(true);

    try {
      const credential = EmailAuthProvider.credential(currentUser.email, passwordForm.oldPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, passwordForm.newPassword);

      resetPasswordForm();
      setToast({
        open: true,
        type: 'success',
        message: 'Password changed successfully. You will be signed out.'
      });

      window.setTimeout(async () => {
        try {
          clearStoredSessionId();
          const currentSessionId = sessionIdRef.current;
          if (currentSessionId) {
            await updateDoc(doc(db, 'sessions', currentSessionId), {
              endedAt: serverTimestamp(),
              revoked: true,
              revokedAt: serverTimestamp()
            }).catch(() => {});
          }
        } finally {
          await signOut(auth);
          setActiveAccountModal(null);
          setIsAccountMenuOpen(false);
          sessionIdRef.current = null;
        }
      }, 750);
    } catch (error) {
      console.error('Password change failed:', error);

      let message = 'We could not change your password. Please try again.';
      if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/wrong-password') {
        message = 'The old password is incorrect.';
      } else if (error?.code === 'auth/requires-recent-login') {
        message = 'For security, please sign in again before changing your password.';
      } else if (error?.code === 'auth/weak-password') {
        message = 'Please choose a stronger password.';
      } else if (error?.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please wait a moment and try again.';
      }

      setToast({ open: true, type: 'error', message });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleStartTwoFactorSetup = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || isLoadingTwoFactor || isSettingUpTwoFactor) return;

    setTwoFactorError('');
    setIsLoadingTwoFactor(true);

    try {
      if (!currentUser.emailVerified) {
        throw new Error('Please verify your email address before enabling two-factor authentication.');
      }

      const enrolledFactors = multiFactor(currentUser).enrolledFactors || [];
      if (enrolledFactors.some(factor => factor.factorId === TotpMultiFactorGenerator.FACTOR_ID)) {
        setIsTwoFactorEnabled(true);
        setIsSettingUpTwoFactor(false);
        return;
      }

      const multiFactorSession = await multiFactor(currentUser).getSession();
      const secret = await TotpMultiFactorGenerator.generateSecret(multiFactorSession);
      const uri = secret.generateQrCodeUrl(
        currentUser.email || 'Account',
        'AI Legal Counsellor'
      );

      setTotpSecret(secret);
      setTotpUri(uri);
      setTwoFactorVerificationCode('');
      setIsSettingUpTwoFactor(true);

    } catch (error) {
      console.error('Two-factor setup failed:', error);

      let message = 'We could not start two-factor authentication. Please try again.';
      if (error?.code === 'auth/requires-recent-login') {
        message = 'For security, please sign out and sign in again, then try enabling two-factor authentication.';
      } else if (error?.code === 'auth/multi-factor-auth-required') {
        message = 'Additional authentication is required before you can enable two-factor authentication.';
      } else if (error?.code === 'auth/operation-not-allowed') {
        message = 'Authenticator-app two-factor authentication is not enabled for this Firebase project yet.';
      } else if (error?.message) {
        message = error.message;
      }

      setTwoFactorError(message);
      setIsSettingUpTwoFactor(false);
    } finally {
      setIsLoadingTwoFactor(false);
    }
  };

  const handleCancelTwoFactorSetup = () => {
    setIsSettingUpTwoFactor(false);
    setIsEnrollingTwoFactor(false);
    setTwoFactorVerificationCode('');
    setTotpSecret(null);
    setTotpUri('');
    setTwoFactorError('');
    if (qrCodeRef.current) qrCodeRef.current.innerHTML = '';
  };

  const handleVerifyTwoFactor = async () => {
    const currentUser = auth.currentUser;
    const verificationCode = twoFactorVerificationCode.replace(/\s/g, '');

    if (!currentUser || !totpSecret || !/^\d{6}$/.test(verificationCode) || isEnrollingTwoFactor) return;

    setTwoFactorError('');
    setIsEnrollingTwoFactor(true);

    try {
      const assertion = TotpMultiFactorGenerator.assertionForEnrollment(
        totpSecret,
        verificationCode
      );

      await multiFactor(currentUser).enroll(assertion, MFA_DISPLAY_NAME);

      setIsTwoFactorEnabled(true);
      handleCancelTwoFactorSetup();
      setToast({
        open: true,
        type: 'success',
        message: 'Two-factor authentication is now enabled.'
      });
    } catch (error) {
      console.error('Two-factor verification failed:', error);

      let message = 'The verification code is incorrect or expired. Please enter the current 6-digit code from your authenticator app.';
      if (error?.code === 'auth/requires-recent-login') {
        message = 'For security, please sign out and sign in again, then complete the setup.';
      } else if (error?.code === 'auth/invalid-verification-code') {
        message = 'The verification code is incorrect. Please enter the current 6-digit code from your authenticator app.';
      } else if (error?.code === 'auth/maximum-second-factor-count-exceeded') {
        message = 'This account already has the maximum number of second factors enrolled.';
      }

      setTwoFactorError(message);
    } finally {
      setIsEnrollingTwoFactor(false);
    }
  };

  const handleTwoFactorToggle = async () => {
    if (isTwoFactorEnabled) {
      const currentUser = auth.currentUser;
      const factor = (multiFactor(currentUser).enrolledFactors || []).find(
        item => item.factorId === TotpMultiFactorGenerator.FACTOR_ID
      );

      if (!factor) {
        setIsTwoFactorEnabled(false);
        return;
      }

      setIsLoadingTwoFactor(true);
      setTwoFactorError('');

      try {
        await multiFactor(currentUser).unenroll(factor);
        setIsTwoFactorEnabled(false);
        setToast({
          open: true,
          type: 'success',
          message: 'Two-factor authentication has been disabled.'
        });
      } catch (error) {
        console.error('Two-factor disable failed:', error);
        setTwoFactorError(
          error?.code === 'auth/requires-recent-login'
            ? 'For security, please sign out and sign in again before disabling two-factor authentication.'
            : 'We could not disable two-factor authentication. Please try again.'
        );
      } finally {
        setIsLoadingTwoFactor(false);
      }

      return;
    }

    await handleStartTwoFactorSetup();
  };

  useEffect(() => {
    if (!isSettingUpTwoFactor || !totpUri || !qrCodeRef.current) return undefined;

    let cancelled = false;

    const renderQrCode = async () => {
      try {
        const QRCode = await loadQrCodeLibrary();
        if (cancelled || !qrCodeRef.current) return;

        qrCodeRef.current.innerHTML = '';
        new QRCode(qrCodeRef.current, {
          text: totpUri,
          width: 220,
          height: 220,
          colorDark: '#111827',
          colorLight: '#FFFFFF',
          correctLevel: QRCode.CorrectLevel.M
        });
      } catch (error) {
        if (!cancelled) {
          console.error('QR code generation failed:', error);
          setTwoFactorError('The QR code could not be generated. Please try again.');
        }
      }
    };

    renderQrCode();

    return () => {
      cancelled = true;
    };
  }, [isSettingUpTwoFactor, totpUri]);

  const confirmLogout = async () => {
    setIsAccountMenuOpen(false);
    const currentSessionId = sessionIdRef.current;

    try {
      if (currentSessionId) {
        await updateDoc(doc(db, 'sessions', currentSessionId), {
          endedAt: serverTimestamp(),
          lastActiveAt: serverTimestamp()
        }).catch(() => {});
      }
    } finally {
      clearStoredSessionId();
      sessionIdRef.current = null;
      await signOut(auth);
      // Deliberately do not call onLogout here. The Firebase auth-state
      // change is the source of truth and avoids any parent confirm dialog.
    }
  };

  const handleLogout = () => {
    setIsAccountMenuOpen(false);
    setLogoutConsentOpen(true);
  };

  const handleRevokeSession = async (session) => {
    if (!session?.id || session.id === sessionIdRef.current) return;

    setRevokingSessionId(session.id);
    try {
      await updateDoc(doc(db, 'sessions', session.id), {
        revoked: true,
        revokedAt: serverTimestamp()
      });
      setToast({
        open: true,
        type: 'success',
        message: `${session.device || 'Device'} session signed out.`
      });
    } catch (error) {
      console.error('Session revoke failed:', error);
      setToast({
        open: true,
        type: 'error',
        message: 'We could not sign out that session. Please try again.'
      });
    } finally {
      setRevokingSessionId(null);
    }
  };

  const fetchChatHistoryList = async (uid) => {
    const q = query(
      collection(db, 'chatHistory'),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    setChatHistoryList(querySnapshot.docs.map(item => ({ id: item.id, ...item.data() })));
  };

  const loadChatById = async (docId) => {
    const q = query(
      collection(db, 'chatHistory'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const docData = querySnapshot.docs.find(item => item.id === docId);

    if (docData) {
      setMessages(docData.data().messages || []);
      setActiveChatId(docId);
    }
  };

  const saveChatHistory = async (newMessages) => {
    if (!userId) return;

    if (activeChatId) {
      await updateDoc(doc(db, 'chatHistory', activeChatId), {
        messages: newMessages,
        createdAt: serverTimestamp()
      });
    } else {
      const firstUserText = newMessages.find(m => m.sender === 'user')?.text || '';
      const smartTitle = generateSmartTitle(firstUserText);

      const newChatRef = await addDoc(collection(db, 'chatHistory'), {
        userId,
        messages: newMessages,
        createdAt: serverTimestamp(),
        title: smartTitle
      });
      setActiveChatId(newChatRef.id);

      // Type the title out professionally rather than having it snap in --
      // the real title is already saved above, this just animates its
      // reveal in the sidebar.
      let i = 0;
      setTitleTyping({ chatId: newChatRef.id, text: '' });
      const titleInterval = setInterval(() => {
        i++;
        setTitleTyping({ chatId: newChatRef.id, text: smartTitle.slice(0, i) });
        if (i >= smartTitle.length) {
          clearInterval(titleInterval);
          setTitleTyping({ chatId: null, text: '' });
        }
      }, 35);
    }

    await fetchChatHistoryList(userId);
  };

  const handleNewChat = async () => {
    if (!userId) return;

    const newChat = await addDoc(collection(db, 'chatHistory'), {
      userId,
      messages: [{ sender: 'bot', text: 'Hello! How can I help you today?' }],
      createdAt: serverTimestamp(),
      title: 'New Chat'
    });

    setMessages([{ sender: 'bot', text: 'Hello! How can I help you today?' }]);
    setActiveChatId(newChat.id);
    await fetchChatHistoryList(userId);
  };

  const handleDeleteChat = (chatId) => {
    setChatPendingDeletion(chatId);
  };

  const confirmDeleteChat = async () => {
    if (!chatPendingDeletion) return;
    setDeleteChatLoading(true);

    try {
      await deleteDoc(doc(db, 'chatHistory', chatPendingDeletion));
      await fetchChatHistoryList(userId);

      if (activeChatId === chatPendingDeletion) {
        setMessages([{ sender: 'bot', text: 'Hello! How can I help you today?' }]);
        setActiveChatId(null);
      }
    } finally {
      setDeleteChatLoading(false);
      setChatPendingDeletion(null);
    }
  };

  const handleRenameChat = async (chatId) => {
    if (!newTitle.trim()) return;
    await updateDoc(doc(db, 'chatHistory', chatId), { title: newTitle.trim() });
    setEditChatId(null);
    setNewTitle('');
    await fetchChatHistoryList(userId);
  };

  const handleSend = async () => {
    const userMessage = input.trim();
    if (!userMessage || isResponding) return;

    // Strictly server-driven: if the last known status says we're locked
    // out, don't even attempt the request or touch the chat -- just
    // re-show the same modal. The composer is also disabled below while
    // this is true, so this is a safety net (e.g. a stale render) rather
    // than the primary gate.
    if (chatLimit.reached) {
      setGlobalFeedback({
        type: 'error',
        title: 'Free message limit reached',
        message: `You are out of Free Messages until ${formatResetTime(chatLimit.resetAt)}.`
      });
      return;
    }

    const newMessage = { sender: 'user', text: userMessage };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput('');
    setTypingMessage('');
    setIsResponding(true);

    try {
      // SECURITY FIX: /api/legal-chat now requires authentication on the
      // server (previously it accepted unauthenticated requests from
      // anyone who could reach the server directly), so the idToken has
      // to be sent along with the message.
      //
      // Falls back to the last-known user from the onAuthStateChanged
      // listener (currentUserRef) if auth.currentUser is unexpectedly
      // null at this exact moment -- this was previously causing
      // "Authentication is required" failures even for a genuinely
      // logged-in user, when auth.currentUser briefly returned null
      // during an internal SDK token-refresh cycle.
      const activeUser = auth.currentUser || currentUserRef.current;
      const idToken = await activeUser?.getIdToken();

      if (!idToken) {
        throw new Error('Your session has expired. Please log in again.');
      }

      const response = await fetch('/api/legal-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, message: userMessage })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data?.limitReached) {
          // The 10th message may have already gone through in a previous
          // request (in which case this branch won't usually be hit until
          // the *next* attempt) -- either way, the server is the source of
          // truth here, so sync local state from its resetAt and remove
          // the optimistic user message rather than showing it as "sent".
          setChatLimit({ checked: true, reached: true, resetAt: data.resetAt || null });
          setMessages(messages);
          setInput(userMessage);
          setIsResponding(false);

          setGlobalFeedback({
            type: 'error',
            title: 'Free message limit reached',
            message: `You are out of Free Messages until ${formatResetTime(data.resetAt)}.`
          });
          return;
        }

        throw new Error(data?.message || 'The legal assistant could not process the request.');
      }

      const botText = data?.text;
      if (!botText) throw new Error('The legal assistant returned an empty response.');

      // The 10th message still gets answered, but the same response tells
      // us the lockout just started -- lock the composer immediately
      // rather than waiting for the user's next attempt to be rejected.
      if (data?.chatLimit?.resetAt) {
        setChatLimit({ checked: true, reached: true, resetAt: data.chatLimit.resetAt });
      }

      // Slicing by index (rather than appending to previous state) so
      // every tick is self-correcting -- fixes a bug where the first
      // character of the response could be dropped.
      let currentIndex = 0;
      const typingInterval = setInterval(() => {
        currentIndex++;
        setTypingMessage(botText.slice(0, currentIndex));

        if (currentIndex >= botText.length) {
          clearInterval(typingInterval);
          const finalMessages = [...updatedMessages, { sender: 'bot', text: botText }];
          setMessages(finalMessages);
          setTypingMessage('');
          setIsResponding(false);
          saveChatHistory(finalMessages);

          if (data?.chatLimit?.resetAt) {
            setGlobalFeedback({
              type: 'error',
              title: 'Free message limit reached',
              message: `You are out of Free Messages until ${formatResetTime(data.chatLimit.resetAt)}.`
            });
          }
        }
      }, 30);
    } catch (error) {
      console.error('Legal assistant request failed:', error);
      const errorText = error?.message || '';
      let userFacingMessage = 'Sorry, the legal assistant could not process your request. Please try again.';

      if (errorText.toLowerCase().includes('api key') || errorText.toLowerCase().includes('authentication')) {
        userFacingMessage = 'The legal assistant is temporarily unavailable. Please check the AI service configuration.';
      } else if (errorText.toLowerCase().includes('rate limit')) {
        userFacingMessage = 'The legal assistant is currently busy. Please try again in a moment.';
      }

      setMessages(prev => [...prev, { sender: 'bot', text: userFacingMessage }]);
      setIsResponding(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredHistory = chatHistoryList.filter(chat => {
    const title = chat.title || chat.messages?.[0]?.text || 'New Chat';
    return title.toLowerCase().includes(historySearch.toLowerCase());
  });

  const isWelcome = messages.length === 1 && messages[0].sender === 'bot';
  const displayName = userName || userEmail.split('@')[0] || 'Account';
  const initials = displayName.trim().charAt(0).toUpperCase() || 'U';

  if (!authChecked) {
    // Auth state is still being resolved (e.g. right after a page refresh,
    // while Firebase rehydrates the session) -- show the skeleton matching
    // the real chat layout instead of flashing "Login required", which
    // was misleading since the user may well already be logged in and we
    // just don't know it yet.
    return <Loading variant="chatbot" />;
  }

  if (!userId) {
    return (
      <>
        <div className="page-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-5)' }}>
          <div className="auth-card" style={{ width: '100%', maxWidth: '420px', textAlign: 'center', alignItems: 'center' }}>
            <div className="modal-icon-circle brand" style={{ width: 60, height: 60, margin: '0 auto var(--space-4)' }}>
              <Icon name="scale" size={27} />
            </div>
            <h2 className="account-modal-title" style={{ fontSize: 'var(--fs-2xl)' }}>{accountDeleted ? 'Account deleted' : 'Login required'}</h2>
            <p className="auth-intro" style={{ margin: 'var(--space-2) 0 0' }}>
              {accountDeleted ? 'Your account and stored data have been permanently removed.' : 'Please log in to use the legal counsellor.'}
            </p>
          </div>
        </div>

        <SuccessModal
          open={globalFeedback.type === 'success'}
          title={globalFeedback.title}
          message={globalFeedback.message}
          onClose={() => setGlobalFeedback({ type: null, title: '', message: '' })}
          buttonText="Continue"
        />

        <ErrorModal
          open={globalFeedback.type === 'error'}
          title={globalFeedback.title}
          message={globalFeedback.message}
          onClose={() => setGlobalFeedback({ type: null, title: '', message: '' })}
        />
      </>
    );
  }

  return (
    <div className="chat-shell">
      {isSidebarOpen && (
        <aside className="chat-sidebar">
          <div className="chat-brand-row">
            <div className="chat-brand-logo-box">
              <img src={sidebarLogoSrc} alt="AI Legal Counsellor" className="chat-brand-logo" />
            </div>
            <div className="chat-brand-copy">
              <div className="chat-brand-title">AI Legal Counsellor</div>
              <div className="chat-brand-subtitle">Pakistani legal assistance</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { window.location.href = '/lawyers'; }}
            className="sidebar-lawyers-btn"
          >
            <Icon name="scale" size={18} />
            <span>Lawyers</span>
          </button>

          <div className="sidebar-search">
            <Icon name="search" size={18} />
            <input
              value={historySearch}
              onChange={e => setHistorySearch(e.target.value)}
              placeholder="Search conversations"
              className="sidebar-search-input"
            />
          </div>

          <button type="button" onClick={() => { handleNewChat(); setHistorySearch(''); }} className="sidebar-new-chat-btn">
            <span className="sidebar-new-chat-icon"><Icon name="plus" size={17} /></span>
            <span>New conversation</span>
          </button>

          <div id="chat-history" className="sidebar-history-header">
            <span>Recent conversations</span>
            <span className="sidebar-history-count">{isLoadingHistory ? '' : filteredHistory.length}</span>
          </div>

          <div className="sidebar-history-scroll">
            {isLoadingHistory ? (
              [1, 2, 3].map(item => (
                <div key={item} className="sidebar-history-item" style={{ cursor: 'default' }}>
                  <div className="sidebar-history-main">
                    <span className="skeleton" style={{ width: '30px', height: '30px', borderRadius: 'var(--radius-full)', flexShrink: 0 }} />
                    <span className="skeleton" style={{ width: '120px', height: '10px', borderRadius: 'var(--radius-full)' }} />
                  </div>
                </div>
              ))
            ) : filteredHistory.length === 0 ? (
              <div className="sidebar-empty-history">
                <div className="sidebar-empty-icon"><Icon name="clock" size={23} /></div>
                <div className="sidebar-empty-title">{historySearch ? 'No matches found' : 'No conversations yet'}</div>
                <div className="sidebar-empty-text">{historySearch ? 'Try another search.' : 'Start a new legal conversation.'}</div>
              </div>
            ) : (
              filteredHistory.map(chat => (
                <div
                  key={chat.id}
                  onClick={() => loadChatById(chat.id)}
                  className={`sidebar-history-item ${activeChatId === chat.id ? 'active' : ''}`}
                >
                  <div className="sidebar-history-main">
                    <div className="sidebar-history-icon"><Icon name="library" size={16} /></div>
                    <div className="sidebar-history-content">
                      {editChatId === chat.id ? (
                        <div className="sidebar-rename-area">
                          <input
                            type="text"
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            autoFocus
                            className="sidebar-rename-input"
                          />
                          <button type="button" onClick={e => { e.stopPropagation(); handleRenameChat(chat.id); }} className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}>Save</button>
                        </div>
                      ) : (
                        <span className="sidebar-history-title">
                          {titleTyping.chatId === chat.id
                            ? titleTyping.text
                            : (chat.title || chat.messages?.[0]?.text?.slice(0, 34) || 'New Chat')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className="sidebar-dropdown-wrap"
                    ref={el => { dropdownRefs.current[chat.id] = el; }}
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenDropdownId(openDropdownId === chat.id ? null : chat.id)}
                      className={`sidebar-more-btn ${openDropdownId === chat.id ? 'active' : ''}`}
                      aria-label="Conversation options"
                    >
                      <Icon name="more" size={17} />
                    </button>

                    {openDropdownId === chat.id && (
                      <div className="sidebar-dropdown">
                        <button type="button" onClick={() => { setEditChatId(chat.id); setNewTitle(chat.title || ''); setOpenDropdownId(null); }} className="sidebar-dropdown-btn">
                          <Icon name="edit" size={16} />
                          <span>Edit conversation</span>
                        </button>
                        <button type="button" onClick={() => { handleDeleteChat(chat.id); setOpenDropdownId(null); }} className="sidebar-dropdown-btn danger">
                          <Icon name="trash" size={16} />
                          <span>Delete conversation</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="sidebar-footer">
            <div className="account-menu-wrap" ref={accountMenuRef}>
              <div
                className={`account-dropup ${isAccountMenuOpen ? 'open' : ''}`}
                aria-hidden={!isAccountMenuOpen}
              >
                <div className="account-dropup-user">
                  <div className="account-icon-lg"><Icon name="user" size={21} /></div>
                  <div className="account-dropup-identity">
                    <div className="account-dropup-name">{userFirstName || displayName}</div>
                    <div className="account-dropup-email">{userEmail || 'No email available'}</div>
                  </div>
                </div>

                <div className="account-divider"></div>

                <div className="account-actions">
                  <button type="button" onClick={handleOpenProfile} className="account-action-btn">
                    <Icon name="user" size={17} />
                    <span>Profile</span>
                  </button>
                  <button type="button" onClick={handleOpenSettings} className="account-action-btn">
                    <Icon name="settings" size={17} />
                    <span>Settings</span>
                  </button>
                </div>

                <div className="account-divider sm"></div>

                <button type="button" onClick={handleLogout} className="account-logout-btn">
                  <Icon name="logout" size={18} />
                  <span>Log out</span>
                </button>
              </div>

              <button type="button" onClick={() => setIsAccountMenuOpen(prev => !prev)} className="account-trigger" aria-expanded={isAccountMenuOpen}>
                <div className="account-icon"><Icon name="user" size={19} /></div>
                <div className="account-trigger-identity">
                  <div className="account-trigger-name">{userFirstName || displayName}</div>
                  <div className="account-trigger-email">{userEmail || 'No email available'}</div>
                </div>
                <Icon name={isAccountMenuOpen ? 'chevronDown' : 'chevronUp'} size={18} />
              </button>
            </div>
            <div className="sidebar-footnote">AI assistance for Pakistani law</div>
          </div>
        </aside>
      )}

      {!isSidebarOpen && (
        <button type="button" onClick={() => setIsSidebarOpen(true)} className="mobile-menu-btn" aria-label="Open navigation">
          <Icon name="menu" size={20} />
        </button>
      )}

      {activeAccountModal && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) handleCloseAccountModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={activeAccountModal === 'profile' ? 'profile-modal-title' : 'settings-modal-title'}
            className={`account-modal ${activeAccountModal === 'profile' ? 'profile' : 'settings'}`}
          >
            <button
              type="button"
              onClick={handleCloseAccountModal}
              className="icon-btn"
              style={{ position: 'absolute', top: '16px', right: '16px', width: '42px', height: '42px' }}
              aria-label="Close"
            >
              <Icon name="close" size={25} stroke={1.8} />
            </button>

            {activeAccountModal === 'profile' ? (
              <>
                <h2 id="profile-modal-title" className="account-modal-title">Edit profile</h2>

                <div className="profile-avatar-lg">
                  {profileAvatarUrl ? (
                    <img src={profileAvatarUrl} alt={displayName} />
                  ) : (
                    <Icon name="user" size={62} stroke={1.55} />
                  )}
                </div>

                <div className="field-group" style={{ textAlign: 'left' }}>
                  <label className="field-label">Name</label>
                  <input
                    type="text"
                    value={profileNameInput}
                    onChange={event => setProfileNameInput(event.target.value)}
                    className="field-input"
                    autoComplete="name"
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={handleCloseAccountModal} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={!profileNameInput.trim()}
                    className="btn btn-primary"
                  >
                    Save
                  </button>
                </div>
              </>
            ) : (
              <div className="settings-layout">
                <div className="settings-nav">
                  <div className="settings-nav-heading">Settings</div>
                  <button
                    type="button"
                    onClick={() => setSettingsSection('account')}
                    className={`settings-nav-btn ${settingsSection === 'account' ? 'active' : ''}`}
                  >
                    <Icon name="user" size={18} />
                    <span>Account</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsSection('security')}
                    className={`settings-nav-btn ${settingsSection === 'security' ? 'active' : ''}`}
                  >
                    <Icon name="shield" size={18} />
                    <span>Security</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsSection('authentication');
                      setTwoFactorError('');
                    }}
                    className={`settings-nav-btn ${settingsSection === 'authentication' ? 'active' : ''}`}
                  >
                    <Icon name="shield" size={18} />
                    <span>Authentication</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsSection('sessions')}
                    className={`settings-nav-btn ${settingsSection === 'sessions' ? 'active' : ''}`}
                  >
                    <Icon name="laptop" size={18} />
                    <span>Sessions</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsSection('dataControls')}
                    className={`settings-nav-btn ${settingsSection === 'dataControls' ? 'active' : ''}`}
                  >
                    <Icon name="library" size={18} />
                    <span>Data Controls</span>
                  </button>
                </div>

                <div className="settings-content">
                  {settingsSection === 'account' && (
                    <div key="account" className="settings-panel">
                      <div className="settings-section-icon"><Icon name="user" size={20} /></div>
                      <h2 id="settings-modal-title" className="settings-content-title">Account</h2>
                      <div>
                        <div className="settings-row">
                          <span className="settings-row-label">Name</span>
                          <span className="settings-row-value">{displayName}</span>
                        </div>
                        <div className="settings-row">
                          <span className="settings-row-label">Email</span>
                          <span className="settings-row-value">{userEmail || 'No email available'}</span>
                        </div>
                        <div className="settings-row delete">
                          <span className="settings-row-label">Delete account</span>
                          <button
                            type="button"
                            onClick={() => setDeleteAccountConsentOpen(true)}
                            className="btn btn-outline-danger"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsSection === 'security' && (
                    <div key="security" className="settings-panel">
                      <div className="settings-section-icon"><Icon name="shield" size={20} /></div>
                      <h2 id="settings-modal-title" className="settings-content-title">Security</h2>
                      <div style={{ width: '100%', maxWidth: '720px', paddingTop: '2px' }}>
                        <div className="security-intro">
                          <div className="security-intro-title">Change Password</div>
                          <div className="security-intro-text">Update your password to keep your account secure.</div>
                        </div>

                        <div className="pw-field">
                          <label className="pw-field-label">Old Password</label>
                          <div className={`pw-input-wrap ${passwordForm.oldPassword ? 'valid' : ''}`}>
                            <input
                              type={showOldPassword ? 'text' : 'password'}
                              value={passwordForm.oldPassword}
                              onChange={event => setPasswordForm(prev => ({ ...prev, oldPassword: event.target.value }))}
                              className="pw-input"
                              placeholder="Enter your old password"
                              autoComplete="current-password"
                            />
                            <button type="button" onClick={() => setShowOldPassword(prev => !prev)} className="icon-btn" style={{ width: '38px', height: '38px' }} aria-label={showOldPassword ? 'Hide old password' : 'Show old password'}>
                              <Icon name={showOldPassword ? 'eyeOff' : 'eye'} size={20} />
                            </button>
                            {passwordForm.oldPassword && <span className="pw-valid-mark">✓</span>}
                          </div>
                        </div>

                        <div className="pw-field">
                          <label className="pw-field-label">New Password</label>
                          <div className={`pw-input-wrap ${passwordForm.newPassword && !isNewPasswordValid ? 'invalid' : ''} ${isNewPasswordValid ? 'valid' : ''}`}>
                            <input
                              type={showNewPassword ? 'text' : 'password'}
                              value={passwordForm.newPassword}
                              onChange={event => setPasswordForm(prev => ({ ...prev, newPassword: event.target.value }))}
                              className="pw-input"
                              placeholder="Enter your new password"
                              autoComplete="new-password"
                            />
                            <button type="button" onClick={() => setShowNewPassword(prev => !prev)} className="icon-btn" style={{ width: '38px', height: '38px' }} aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}>
                              <Icon name={showNewPassword ? 'eyeOff' : 'eye'} size={20} />
                            </button>
                          </div>

                          {passwordForm.newPassword && !isNewPasswordValid && (
                            <div className="pw-error-text">Please add all necessary characters to create a safe password.</div>
                          )}
                          <div className="pw-rules">
                            {[
                              ['minLength', 'Minimum characters 12'],
                              ['uppercase', 'One uppercase character'],
                              ['lowercase', 'One lowercase character'],
                              ['special', 'One special character'],
                              ['number', 'One number']
                            ].map(([key, label]) => (
                              <div key={key} className={`pw-rule ${passwordRules[key] ? 'valid' : ''}`}>
                                <span className="pw-rule-dot">{passwordRules[key] ? '✓' : '•'}</span>
                                <span>{label}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pw-field">
                          <label className="pw-field-label">Confirm New Password</label>
                          <div className={`pw-input-wrap ${passwordForm.confirmPassword && !passwordsMatch ? 'invalid' : ''} ${passwordsMatch ? 'valid' : ''}`}>
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={passwordForm.confirmPassword}
                              onChange={event => setPasswordForm(prev => ({ ...prev, confirmPassword: event.target.value }))}
                              className="pw-input"
                              placeholder="Enter your confirm new password"
                              autoComplete="new-password"
                            />
                            <button type="button" onClick={() => setShowConfirmPassword(prev => !prev)} className="icon-btn" style={{ width: '38px', height: '38px' }} aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}>
                              <Icon name={showConfirmPassword ? 'eyeOff' : 'eye'} size={20} />
                            </button>
                          </div>
                          {passwordForm.confirmPassword && !passwordsMatch && (
                            <div className="pw-error-text">Passwords do not match.</div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={handleChangePassword}
                          disabled={!canChangePassword}
                          className="btn btn-primary btn-lg"
                          style={{ width: '100%' }}
                        >
                          {isChangingPassword ? 'Changing Password…' : 'Change Password'}
                        </button>
                      </div>
                    </div>
                  )}

                  {settingsSection === 'authentication' && (
                    <div key="authentication" className="settings-panel" style={{ width: '100%', maxWidth: '760px' }}>
                      <div className="settings-section-icon"><Icon name="shield" size={20} /></div>
                      <h2 id="settings-modal-title" className="settings-content-title">Authentication</h2>

                      <div className="twofa-block">
                        <div className="twofa-row">
                          <div className="twofa-copy">
                            <div className="twofa-title">Authenticator app</div>
                            <div className="twofa-desc">
                              Use one-time codes from an authenticator app.
                            </div>
                          </div>

                          <button
                            type="button"
                            role="switch"
                            aria-checked={isTwoFactorEnabled || isSettingUpTwoFactor}
                            aria-label="Authenticator app"
                            onClick={handleTwoFactorToggle}
                            disabled={isLoadingTwoFactor || isSettingUpTwoFactor || isEnrollingTwoFactor}
                            className={`switch ${(isTwoFactorEnabled || isSettingUpTwoFactor) ? 'on' : ''}`}
                          >
                            <span className="switch-knob" />
                          </button>
                        </div>

                        {isSettingUpTwoFactor && (
                          <div className="twofa-setup">
                            <div className="twofa-step">
                              <div className="twofa-step-label">Step 1:</div>
                              <div>
                                Scan the QR code using your authenticator app, then enter the 6-digit code from the app.
                              </div>
                            </div>

                            <div className="twofa-qr-card">
                              <div ref={qrCodeRef} className="twofa-qr-code" aria-label="Authenticator app QR code" />
                            </div>

                            <div className="twofa-step second">
                              <div className="twofa-step-label">Step 2:</div>
                              <div>Enter your 6-digit code</div>
                            </div>

                            <input
                              type="text"
                              inputMode="numeric"
                              autoComplete="one-time-code"
                              maxLength={6}
                              value={twoFactorVerificationCode}
                              onChange={event => {
                                const nextCode = event.target.value.replace(/\D/g, '').slice(0, 6);
                                setTwoFactorVerificationCode(nextCode);
                                if (twoFactorError) setTwoFactorError('');
                              }}
                              onKeyDown={event => {
                                if (event.key === 'Enter') handleVerifyTwoFactor();
                              }}
                              placeholder="Enter your 6-digit code"
                              className="field-input mfa-input"
                              aria-label="Enter your 6-digit code"
                            />

                            {twoFactorError && (
                              <div className="twofa-error">{twoFactorError}</div>
                            )}

                            <div className="twofa-footer">
                              <button
                                type="button"
                                onClick={handleCancelTwoFactorSetup}
                                className="btn btn-secondary"
                                disabled={isEnrollingTwoFactor}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleVerifyTwoFactor}
                                disabled={!/^\d{6}$/.test(twoFactorVerificationCode) || isEnrollingTwoFactor}
                                className="btn btn-primary"
                              >
                                {isEnrollingTwoFactor ? 'Verifying…' : 'Verify'}
                              </button>
                            </div>
                          </div>
                        )}

                        {twoFactorError && !isSettingUpTwoFactor && (
                          <div className="twofa-error">{twoFactorError}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {settingsSection === 'sessions' && (
                    <div key="sessions" className="settings-panel">
                      <h2 id="settings-modal-title" className="settings-content-title">Active sessions</h2>
                      <div className="sessions-desc">
                        Review recent sessions and trusted devices associated with your account.
                      </div>

                      <div className="sessions-list">
                        {isLoadingSessions && sessions.length === 0 ? (
                          <div className="sessions-empty">Loading sessions…</div>
                        ) : sessions.length === 0 ? (
                          <div className="sessions-empty">No session activity available.</div>
                        ) : (
                          sessions.map(session => {
                            const isCurrent = session.id === sessionIdRef.current;
                            const sessionLocation = [session.city, session.region].filter(Boolean).join(', ');
                            return (
                              <div key={session.id} className="session-row">
                                <div className="session-icon">
                                  <Icon name={session.icon === 'mobile' ? 'mobile' : 'laptop'} size={31} stroke={1.8} />
                                </div>

                                <div className="session-info">
                                  <div className="session-name">AI Legal Counsellor Web</div>
                                  <div className="session-meta">{session.device || 'Device'} · {session.os || 'Unknown OS'}</div>
                                  <div className="session-meta">{formatSessionDate(session.createdAt)}</div>
                                  <div className="session-meta">{sessionLocation || 'Location unavailable'}</div>
                                </div>

                                <div className="session-action">
                                  {isCurrent ? (
                                    <span className="session-badge">CURRENT SESSION</span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleRevokeSession(session)}
                                      disabled={revokingSessionId === session.id}
                                      className="btn btn-secondary"
                                    >
                                      {revokingSessionId === session.id ? 'Logging out…' : 'Log out'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {settingsSection === 'dataControls' && (
                    <div key="dataControls" className="settings-panel data-controls-section" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                      <h2 className="settings-content-title">Data Controls</h2>
                      <div className="data-controls-desc">
                        Manage the conversations saved to your account.
                      </div>

                      <div className="data-controls-list">
                        <div className="data-control-row">
                          <div className="data-control-copy">
                            <div className="data-control-title">Export chats</div>
                            <div className="data-control-desc">Download a copy of your saved conversations.</div>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!userId) return;

                              try {
                                const exportQuery = query(
                                  collection(db, 'chatHistory'),
                                  where('userId', '==', userId),
                                  orderBy('createdAt', 'desc')
                                );

                                const exportSnapshot = await getDocs(exportQuery);
                                const exportChats = exportSnapshot.docs.map(item => {
                                  const data = item.data();

                                  return {
                                    id: item.id,
                                    title: data.title || 'New Chat',
                                    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
                                    messages: data.messages || []
                                  };
                                });

                                const exportData = JSON.stringify({
                                  exportedAt: new Date().toISOString(),
                                  chats: exportChats
                                }, null, 2);

                                const blob = new Blob([exportData], {
                                  type: 'application/json'
                                });

                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `ai-legal-counsellor-chats-${new Date().toISOString().slice(0, 10)}.json`;
                                document.body.appendChild(link);
                                link.click();
                                link.remove();
                                URL.revokeObjectURL(url);

                                setToast({
                                  open: true,
                                  type: 'success',
                                  message: 'Your chats have been exported successfully.'
                                });
                              } catch (error) {
                                console.error('Chat export failed:', error);

                                setToast({
                                  open: true,
                                  type: 'error',
                                  message: 'We could not export your chats. Please try again.'
                                });
                              }
                            }}
                            className="btn btn-secondary"
                          >
                            Export
                          </button>
                        </div>

                        <div className="data-control-row">
                          <div className="data-control-copy">
                            <div className="data-control-title">Delete all chats</div>
                            <div className="data-control-desc">Permanently delete all saved conversations from your account.</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDeleteChatsConsentOpen(true)}
                            className="btn btn-outline-danger"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ConsentModal
        open={deleteChatsConsentOpen}
        title="Delete all chats — are you sure?"
        message="This will permanently delete all of your saved conversations. Your account, profile, sessions, and authentication will not be affected."
        onCancel={() => setDeleteChatsConsentOpen(false)}
        onConfirm={handleDeleteAllChats}
        confirmText="Yes, Delete All Chats"
        loading={deleteChatsLoading}
      />

      <ConsentModal
        open={deleteAccountConsentOpen}
        title="Delete account — are you sure?"
        message="Deleting your account is permanent and cannot be undone. This will permanently remove your Firebase Authentication account, chats, profile, and other stored account data."
        onCancel={() => setDeleteAccountConsentOpen(false)}
        onConfirm={handleDeleteAccount}
        confirmText="Yes, Delete Account"
        loading={deleteAccountLoading}
      />

      <ConsentModal
        open={logoutConsentOpen}
        title="Log out — are you sure?"
        message="You'll need to sign in again to continue using the legal assistant."
        onCancel={() => setLogoutConsentOpen(false)}
        onConfirm={confirmLogout}
        confirmText="Yes, Log Out"
      />

      <ConsentModal
        open={Boolean(chatPendingDeletion)}
        title="Delete conversation — are you sure?"
        message="This will permanently delete this conversation. This action cannot be undone."
        onCancel={() => setChatPendingDeletion(null)}
        onConfirm={confirmDeleteChat}
        confirmText="Yes, Delete Conversation"
        loading={deleteChatLoading}
      />

      <SuccessModal
        open={globalFeedback.type === 'success'}
        title={globalFeedback.title}
        message={globalFeedback.message}
        onClose={() => setGlobalFeedback({ type: null, title: '', message: '' })}
        buttonText="Continue"
      />

      <ErrorModal
        open={globalFeedback.type === 'error'}
        title={globalFeedback.title}
        message={globalFeedback.message}
        onClose={() => setGlobalFeedback({ type: null, title: '', message: '' })}
      />

      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
      />

      <main className="chat-main">
        <header className="chat-topbar">
          <div className="chat-topbar-notice">
            Legal Counsellor can make mistakes, please double-check important information
          </div>
        </header>

        <section className="chat-viewport">
          {isWelcome && (
            <div className="welcome-area">
              <div className="welcome-mark" aria-label="Legal assistance">
                <Icon name="scale" size={30} stroke={1.55} />
              </div>
              <div className="welcome-eyebrow">AI-POWERED LEGAL ASSISTANCE</div>
              <h1 className="welcome-title">
                How can we help<br />with your legal question?
              </h1>
              <p className="welcome-text">
                Ask questions about Pakistani law and receive AI-assisted guidance based on relevant legal frameworks.
              </p>
              <div className="welcome-disclaimer">
                <span className="welcome-disclaimer-icon"><Icon name="info" size={17} /></span>
                <span>
                  For informational purposes only. For specific legal matters,{' '}
                  <a href="/lawyers">Consult a Qualified Lawyer</a>.
                </span>
              </div>
            </div>
          )}

          {!isWelcome && (
            <div className="messages-container">
              {messages.map((msg, index) => (
                <div key={index} className="message-row" style={{ justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                  {msg.sender === 'bot' && (
                    <div className="message-avatar">
                      <img src={headerLogoSrc} alt="AI" />
                    </div>
                  )}
                  <div className={`message-bubble ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                    {msg.sender === 'bot' ? <ReactMarkdown>{msg.text}</ReactMarkdown> : msg.text}
                  </div>
                </div>
              ))}

              {isResponding && !typingMessage && (
                <div className="message-row">
                  <div className="message-avatar">
                    <img src={headerLogoSrc} alt="AI" />
                  </div>
                  <div className="message-bubble bot thinking-bubble">
                    <span>Thinking</span>
                    <span className="thinking-dots"><span></span><span></span><span></span></span>
                  </div>
                </div>
              )}

              {typingMessage && (
                <div className="message-row">
                  <div className="message-avatar">
                    <img src={headerLogoSrc} alt="AI" />
                  </div>
                  <div className="message-bubble bot">
                    <ReactMarkdown>{typingMessage}</ReactMarkdown>
                    <span className="typing-cursor"></span>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="composer-area">
          <div className={`composer-card ${chatLimit.reached ? 'locked' : ''}`}>
            {chatLimit.reached ? (
              <div className="composer-hint composer-hint-warning">
                <Icon name="lock" size={18} />
                <span>You're out of free messages. Access resumes at {formatResetTime(chatLimit.resetAt)}.</span>
              </div>
            ) : (
              <div className="composer-hint">
                <Icon name="spark" size={18} />
                <span>Ask a question about Pakistani law...</span>
              </div>
            )}

            <div className="composer-input-row">
              <input
                ref={inputRef}
                className="composer-input"
                type="text"
                placeholder={chatLimit.reached ? 'Free message limit reached' : 'Describe your legal question...'}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={chatLimit.reached}
              />
              <button
                type="button"
                className={`composer-send-btn ${input.trim() && !chatLimit.reached && !isResponding ? 'active' : 'disabled'}`}
                onClick={handleSend}
                disabled={!input.trim() || chatLimit.reached || isResponding}
                aria-label="Send message"
              >
                <Icon name="send" size={19} stroke={2} />
              </button>
            </div>

            <div className="composer-footer">
              <div className="composer-chip"><Icon name="scale" size={15} /> Pakistani law</div>
              <div className="composer-chip"><Icon name="library" size={15} /> Legal guidance</div>
              <span className="composer-disclaimer">AI responses may not constitute legal advice.</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Chatbot;
