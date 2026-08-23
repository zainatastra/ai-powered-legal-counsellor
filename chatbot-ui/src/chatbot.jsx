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
    eyeOff: <><path d="m3 3 18 18" /><path d="M10.6 6.3C11.05 6.2 11.51 6.14 12 6.14c6.3 0 9.5 5.86 9.5 5.86a16.3 16.3 0 0 1-2.65 3.25" /><path d="M6.15 6.8C3.75 8.1 2.5 12 2.5 12s3.2 5.86 9.5 5.86c1.02 0 1.95-.15 2.8-.4" /><path d="M10.3 10.3a2.5 2.5 0 0 0 3.4 3.4" /></>
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

const sortSessions = (items) => [...items].sort((a, b) => {
  const aTime = a.createdAt?.toMillis?.() || new Date(a.createdAt || 0).getTime() || 0;
  const bTime = b.createdAt?.toMillis?.() || new Date(b.createdAt || 0).getTime() || 0;
  return bTime - aTime;
});

const Chatbot = ({ onLogout }) => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [typingMessage, setTypingMessage] = useState('');
  const [userId, setUserId] = useState(null);
  const [chatHistoryList, setChatHistoryList] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [editChatId, setEditChatId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
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
  const qrCodeRef = useRef(null);
  const sessionIdRef = useRef(null);


  const dropdownRefs = useRef({});
  const accountMenuRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          await user.reload();
          await user.getIdToken(true);
        } catch (error) {
          console.error('Authentication refresh failed:', error);
          setUserId(null);
          return;
        }

        if (!auth.currentUser?.emailVerified) {
          setUserId(null);
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
        setProfileNameInput(resolvedName);
        setProfileAvatarUrl(profileData.photoURL || user.photoURL || '');
        await fetchChatHistoryList(user.uid);
      } else {
        setUserId(null);
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
  }, []);

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
      console.error('Delete all chats failed:', error);

      setDeleteChatsConsentOpen(false);
      setGlobalFeedback({
        type: 'error',
        title: 'Chats could not be deleted',
        message: error?.message || 'We could not delete your chats. Please try again.'
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
      setMessages([{ sender: 'bot', text: 'Hello! How can I help you today?' }]);
      setActiveChatId(null);
      setAccountDeleted(true);
      setGlobalFeedback({
        type: 'success',
        title: 'Account deleted',
        message: 'Your account, chats, and stored profile data have been permanently deleted.'
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

  const handleLogout = async () => {
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
      const newChatRef = await addDoc(collection(db, 'chatHistory'), {
        userId,
        messages: newMessages,
        createdAt: serverTimestamp(),
        title: 'New Chat'
      });
      setActiveChatId(newChatRef.id);
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

  const handleDeleteChat = async (chatId) => {
    if (window.confirm('Are you sure you want to delete this chat?')) {
      await deleteDoc(doc(db, 'chatHistory', chatId));
      await fetchChatHistoryList(userId);

      if (activeChatId === chatId) {
        setMessages([{ sender: 'bot', text: 'Hello! How can I help you today?' }]);
        setActiveChatId(null);
      }
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
    if (!userMessage) return;

    const newMessage = { sender: 'user', text: userMessage };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput('');
    setTypingMessage('');

    try {
      const response = await fetch('/api/legal-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'The legal assistant could not process the request.');

      const botText = data?.text;
      if (!botText) throw new Error('The legal assistant returned an empty response.');

      let currentIndex = 0;
      const typingInterval = setInterval(() => {
        if (currentIndex < botText.length) {
          setTypingMessage(prev => prev + botText[currentIndex]);
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          const finalMessages = [...updatedMessages, { sender: 'bot', text: botText }];
          setMessages(finalMessages);
          setTypingMessage('');
          saveChatHistory(finalMessages);
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

  if (!userId) {
    return (
      <>
        <div style={styles.loginRequired}>
          <div style={styles.loginRequiredCard}>
            <div style={styles.loginRequiredIcon}><Icon name="scale" size={27} /></div>
            <h2 style={styles.loginRequiredTitle}>{accountDeleted ? 'Account deleted' : 'Login required'}</h2>
            <p style={styles.loginRequiredText}>
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
    <div style={styles.appShell}>
      {isSidebarOpen && (
        <aside style={styles.sidebar}>
          <div style={styles.sidebarInner}>
            <div style={styles.brandRow}>
              <div style={styles.brandLogoBox}>
                <img src={sidebarLogoSrc} alt="AI Legal Counsellor" style={styles.brandLogo} />
              </div>
              <div style={styles.brandCopy}>
                <div style={styles.brandTitle}>AI Legal Counsellor</div>
                <div style={styles.brandSubtitle}>Pakistani legal assistance</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { window.location.href = '/lawyers'; }}
              style={styles.lawyersButton}
            >
              <Icon name="scale" size={18} />
              <span>Lawyers</span>
            </button>

            <div style={styles.searchBox}>
              <Icon name="search" size={18} />
              <input
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                placeholder="Search conversations"
                style={styles.searchInput}
              />
            </div>



            <button type="button" onClick={() => { handleNewChat(); setHistorySearch(''); }} style={styles.newChatButton}>
              <span style={styles.newChatIcon}><Icon name="plus" size={17} /></span>
              <span>New conversation</span>
            </button>

            <div id="chat-history" style={styles.historyHeader}>
              <span>Recent conversations</span>
              <span style={styles.historyCount}>{filteredHistory.length}</span>
            </div>

            <div style={styles.chatHistoryScrollArea}>
              {filteredHistory.length === 0 ? (
                <div style={styles.emptyHistory}>
                  <div style={styles.emptyHistoryIcon}><Icon name="clock" size={23} /></div>
                  <div style={styles.emptyHistoryTitle}>{historySearch ? 'No matches found' : 'No conversations yet'}</div>
                  <div style={styles.emptyHistoryText}>{historySearch ? 'Try another search.' : 'Start a new legal conversation.'}</div>
                </div>
              ) : (
                filteredHistory.map(chat => (
                  <div
                    key={chat.id}
                    onClick={() => loadChatById(chat.id)}
                    style={{ ...styles.historyItem, ...(activeChatId === chat.id ? styles.activeHistoryItem : {}) }}
                  >
                    <div style={styles.historyItemMain}>
                      <div style={styles.historyItemIcon}><Icon name="library" size={16} /></div>
                      <div style={styles.historyItemContent}>
                        {editChatId === chat.id ? (
                          <div style={styles.renameArea}>
                            <input
                              type="text"
                              value={newTitle}
                              onChange={e => setNewTitle(e.target.value)}
                              onClick={e => e.stopPropagation()}
                              autoFocus
                              style={styles.renameInput}
                            />
                            <button type="button" onClick={e => { e.stopPropagation(); handleRenameChat(chat.id); }} style={styles.renameSaveButton}>Save</button>
                          </div>
                        ) : (
                          <span style={styles.historyItemTitle}>{chat.title || chat.messages?.[0]?.text?.slice(0, 34) || 'New Chat'}</span>
                        )}
                      </div>
                    </div>

                    <div
                      style={styles.dropdownWrapper}
                      ref={el => { dropdownRefs.current[chat.id] = el; }}
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenDropdownId(openDropdownId === chat.id ? null : chat.id)}
                        style={{ ...styles.moreButton, ...(openDropdownId === chat.id ? styles.moreButtonActive : {}) }}
                        aria-label="Conversation options"
                      >
                        <Icon name="more" size={17} />
                      </button>

                      {openDropdownId === chat.id && (
                        <div style={styles.dropdown}>
                          <button type="button" onClick={() => { setEditChatId(chat.id); setNewTitle(chat.title || ''); setOpenDropdownId(null); }} style={styles.dropdownButton}>
                            <Icon name="edit" size={16} />
                            <span>Edit conversation</span>
                          </button>
                          <button type="button" onClick={() => { handleDeleteChat(chat.id); setOpenDropdownId(null); }} style={{ ...styles.dropdownButton, ...styles.deleteDropdownButton }}>
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

            <div style={styles.sidebarFooter}>
              <div style={styles.accountMenuWrapper} ref={accountMenuRef}>
                <div
                  style={{
                    ...styles.accountDropup,
                    ...(isAccountMenuOpen ? styles.accountDropupOpen : styles.accountDropupClosed)
                  }}
                  aria-hidden={!isAccountMenuOpen}
                >
                  <div style={styles.accountDropupUser}>
                    <div style={styles.accountIconLarge}><Icon name="user" size={21} /></div>
                    <div style={styles.accountDropupIdentity}>
                      <div style={styles.accountDropupName}>{displayName}</div>
                      <div style={styles.accountDropupEmail}>{userEmail || 'No email available'}</div>
                    </div>
                  </div>

                  <div style={styles.accountDivider}></div>

                  <div style={styles.accountActions}>
                    <button type="button" onClick={handleOpenProfile} style={styles.accountActionButton}>
                      <Icon name="user" size={17} />
                      <span>Profile</span>
                    </button>
                    <button type="button" onClick={handleOpenSettings} style={styles.accountActionButton}>
                      <Icon name="settings" size={17} />
                      <span>Settings</span>
                    </button>
                  </div>

                  <div style={styles.accountDividerSmall}></div>

                  <button type="button" onClick={handleLogout} className="account-logout-button" style={styles.accountLogoutButton}>
                    <Icon name="logout" size={18} />
                    <span>Log out</span>
                  </button>
                </div>

                <button type="button" onClick={() => setIsAccountMenuOpen(prev => !prev)} style={styles.accountTrigger} aria-expanded={isAccountMenuOpen}>
                  <div style={styles.accountIcon}><Icon name="user" size={19} /></div>
                  <div style={styles.accountTriggerIdentity}>
                    <div style={styles.accountTriggerName}>{displayName}</div>
                    <div style={styles.accountTriggerEmail}>{userEmail || 'No email available'}</div>
                  </div>
                  <Icon name={isAccountMenuOpen ? 'chevronDown' : 'chevronUp'} size={18} />
                </button>
              </div>
              <div style={styles.footerNote}>AI assistance for Pakistani law</div>
            </div>
          </div>
        </aside>
      )}

      {!isSidebarOpen && (
        <button type="button" onClick={() => setIsSidebarOpen(true)} style={styles.mobileMenuButton} aria-label="Open navigation">
          <Icon name="menu" size={20} />
        </button>
      )}

      {activeAccountModal && (
        <div
          style={styles.modalOverlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) handleCloseAccountModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={activeAccountModal === 'profile' ? 'profile-modal-title' : 'settings-modal-title'}
            style={{
              ...styles.accountModal,
              ...(activeAccountModal === 'profile' ? styles.profileModal : styles.settingsModal)
            }}
          >
            <button
              type="button"
              onClick={handleCloseAccountModal}
              style={styles.modalCloseButton}
              aria-label="Close"
            >
              <Icon name="close" size={25} stroke={1.8} />
            </button>

            {activeAccountModal === 'profile' ? (
              <>
                <h2 id="profile-modal-title" style={styles.modalTitle}>Edit profile</h2>

                <div style={styles.profileAvatarLarge}>
                  {profileAvatarUrl ? (
                    <img src={profileAvatarUrl} alt={displayName} style={styles.profileAvatarImage} />
                  ) : (
                    <Icon name="user" size={62} stroke={1.55} />
                  )}
                </div>

                <div style={styles.profileForm}>
                  <label style={styles.profileField}>
                    <span style={styles.profileFieldLabel}>Name</span>
                    <input
                      type="text"
                      value={profileNameInput}
                      onChange={event => setProfileNameInput(event.target.value)}
                      style={styles.profileNameInput}
                      autoComplete="name"
                    />
                  </label>
                </div>

                <div style={styles.modalFooter}>
                  <button type="button" onClick={handleCloseAccountModal} style={styles.modalCancelButton}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={!profileNameInput.trim()}
                    style={{
                      ...styles.modalSaveButton,
                      ...(!profileNameInput.trim() ? styles.modalSaveButtonDisabled : {})
                    }}
                  >
                    Save
                  </button>
                </div>
              </>
            ) : (
              <div style={styles.settingsLayout}>
                <div style={styles.settingsSidebar}>
                  <div style={styles.settingsHeading}>Settings</div>
                  <button
                    type="button"
                    onClick={() => setSettingsSection('account')}
                    style={{
                      ...styles.settingsNavButton,
                      ...(settingsSection === 'account' ? styles.settingsNavButtonActive : {})
                    }}
                  >
                    <Icon name="user" size={18} />
                    <span>Account</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsSection('security')}
                    style={{
                      ...styles.settingsNavButton,
                      ...(settingsSection === 'security' ? styles.settingsNavButtonActive : {})
                    }}
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
                    style={{
                      ...styles.settingsNavButton,
                      ...(settingsSection === 'authentication' ? styles.settingsNavButtonActive : {})
                    }}
                  >
                    <Icon name="shield" size={18} />
                    <span>Authentication</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsSection('sessions')}
                    style={{
                      ...styles.settingsNavButton,
                      ...(settingsSection === 'sessions' ? styles.settingsNavButtonActive : {})
                    }}
                  >
                    <Icon name="laptop" size={18} />
                    <span>Sessions</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsSection('dataControls')}
                    style={{
                      ...styles.settingsNavButton,
                      ...(settingsSection === 'dataControls' ? styles.settingsNavButtonActive : {})
                    }}
                  >
                    <Icon name="library" size={18} />
                    <span>Data Controls</span>
                  </button>
                </div>

                <div style={styles.settingsContent}>
                  {settingsSection === 'account' && (
                    <>
                      <h2 id="settings-modal-title" style={styles.settingsContentTitle}>Account</h2>
                      <div style={styles.settingsRows}>
                        <div style={styles.settingsRow}>
                          <span style={styles.settingsRowLabel}>Name</span>
                          <span style={styles.settingsRowValue}>{displayName}</span>
                        </div>
                        <div style={styles.settingsRow}>
                          <span style={styles.settingsRowLabel}>Email</span>
                          <span style={styles.settingsRowValue}>{userEmail || 'No email available'}</span>
                        </div>
                        <div style={{ ...styles.settingsRow, ...styles.deleteAccountRow }}>
                          <span style={styles.settingsRowLabel}>Delete account</span>
                          <button
                            type="button"
                            onClick={() => setDeleteAccountConsentOpen(true)}
                            style={styles.deleteAccountButton}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {settingsSection === 'security' && (
                    <div style={styles.securitySection}>
                      <h2 id="settings-modal-title" style={styles.settingsContentTitle}>Security</h2>
                      <div style={styles.securityCard}>
                        <div style={styles.securityIntro}>
                          <div style={styles.securityIntroTitle}>Change Password</div>
                          <div style={styles.securityIntroText}>Update your password to keep your account secure.</div>
                        </div>

                        <div style={styles.passwordFieldGroup}>
                          <label style={styles.passwordFieldLabel}>Old Password</label>
                          <div style={{ ...styles.passwordInputWrap, ...(passwordForm.oldPassword ? styles.passwordInputValid : {}) }}>
                            <input
                              type={showOldPassword ? 'text' : 'password'}
                              value={passwordForm.oldPassword}
                              onChange={event => setPasswordForm(prev => ({ ...prev, oldPassword: event.target.value }))}
                              style={styles.passwordInput}
                              placeholder="Enter your old password"
                              autoComplete="current-password"
                            />
                            <button type="button" onClick={() => setShowOldPassword(prev => !prev)} style={styles.passwordToggle} aria-label={showOldPassword ? 'Hide old password' : 'Show old password'}>
                              <Icon name={showOldPassword ? 'eyeOff' : 'eye'} size={20} />
                            </button>
                            {passwordForm.oldPassword && <span style={styles.passwordValidMark}>✓</span>}
                          </div>
                        </div>

                        <div style={styles.passwordFieldGroup}>
                          <label style={styles.passwordFieldLabel}>New Password</label>
                          <div style={{ ...styles.passwordInputWrap, ...(passwordForm.newPassword && !isNewPasswordValid ? styles.passwordInputInvalid : {}), ...(isNewPasswordValid ? styles.passwordInputValid : {}) }}>
                            <input
                              type={showNewPassword ? 'text' : 'password'}
                              value={passwordForm.newPassword}
                              onChange={event => setPasswordForm(prev => ({ ...prev, newPassword: event.target.value }))}
                              style={styles.passwordInput}
                              placeholder="Enter your new password"
                              autoComplete="new-password"
                            />
                            <button type="button" onClick={() => setShowNewPassword(prev => !prev)} style={styles.passwordToggle} aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}>
                              <Icon name={showNewPassword ? 'eyeOff' : 'eye'} size={20} />
                            </button>
                          </div>

                          {passwordForm.newPassword && !isNewPasswordValid && (
                            <div style={styles.passwordValidationError}>Please add all necessary characters to create a safe password.</div>
                          )}
                          <div style={styles.passwordRules}>
                            {[
                              ['minLength', 'Minimum characters 12'],
                              ['uppercase', 'One uppercase character'],
                              ['lowercase', 'One lowercase character'],
                              ['special', 'One special character'],
                              ['number', 'One number']
                            ].map(([key, label]) => (
                              <div key={key} style={{ ...styles.passwordRule, ...(passwordRules[key] ? styles.passwordRuleValid : {}) }}>
                                <span style={styles.passwordRuleDot}>{passwordRules[key] ? '✓' : '•'}</span>
                                <span>{label}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div style={styles.passwordFieldGroup}>
                          <label style={styles.passwordFieldLabel}>Confirm New Password</label>
                          <div style={{ ...styles.passwordInputWrap, ...(passwordForm.confirmPassword && !passwordsMatch ? styles.passwordInputInvalid : {}), ...(passwordsMatch ? styles.passwordInputValid : {}) }}>
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={passwordForm.confirmPassword}
                              onChange={event => setPasswordForm(prev => ({ ...prev, confirmPassword: event.target.value }))}
                              style={styles.passwordInput}
                              placeholder="Enter your confirm new password"
                              autoComplete="new-password"
                            />
                            <button type="button" onClick={() => setShowConfirmPassword(prev => !prev)} style={styles.passwordToggle} aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}>
                              <Icon name={showConfirmPassword ? 'eyeOff' : 'eye'} size={20} />
                            </button>
                          </div>
                          {passwordForm.confirmPassword && !passwordsMatch && (
                            <div style={styles.passwordValidationError}>Passwords do not match.</div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={handleChangePassword}
                          disabled={!canChangePassword}
                          style={{
                            ...styles.changePasswordButton,
                            ...(!canChangePassword ? styles.changePasswordButtonDisabled : {})
                          }}
                        >
                          {isChangingPassword ? 'Changing Password…' : 'Change Password'}
                        </button>
                      </div>
                    </div>
                  )}

                  {settingsSection === 'authentication' && (
                    <div style={styles.authenticationSection}>
                      <h2 id="settings-modal-title" style={styles.settingsContentTitle}>Authentication</h2>

                      <div style={styles.authenticationCard}>
                        <div style={styles.authenticationRow}>
                          <div style={styles.authenticationCopy}>
                            <div style={styles.authenticationTitle}>Authenticator app</div>
                            <div style={styles.authenticationDescription}>
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
                            style={{
                              ...styles.twoFactorToggle,
                              ...((isTwoFactorEnabled || isSettingUpTwoFactor) ? styles.twoFactorToggleOn : {}),
                              ...(isLoadingTwoFactor ? styles.twoFactorToggleDisabled : {})
                            }}
                          >
                            <span
                              style={{
                                ...styles.twoFactorToggleKnob,
                                ...(isTwoFactorEnabled ? styles.twoFactorToggleKnobOn : {})
                              }}
                            />
                          </button>
                        </div>

                        {isSettingUpTwoFactor && (
                          <div style={styles.twoFactorSetup}>
                            <div style={styles.twoFactorSetupStep}>
                              <div style={styles.twoFactorStepTitle}>Step 1:</div>
                              <div style={styles.twoFactorStepText}>
                                Scan the QR code using your authenticator app, then enter the 6-digit code from the app.
                              </div>
                            </div>

                            <div style={styles.twoFactorQrCard}>
                              <div ref={qrCodeRef} style={styles.twoFactorQrCode} aria-label="Authenticator app QR code" />
                            </div>

                            <div style={styles.twoFactorSetupStepSecond}>
                              <div style={styles.twoFactorStepTitle}>Step 2:</div>
                              <div style={styles.twoFactorStepText}>Enter your 6-digit code</div>
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
                              style={styles.twoFactorCodeInput}
                              aria-label="Enter your 6-digit code"
                            />

                            {twoFactorError && (
                              <div style={styles.twoFactorError}>{twoFactorError}</div>
                            )}

                            <div style={styles.twoFactorSetupFooter}>
                              <button
                                type="button"
                                onClick={handleCancelTwoFactorSetup}
                                style={styles.twoFactorCancelButton}
                                disabled={isEnrollingTwoFactor}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleVerifyTwoFactor}
                                disabled={!/^\d{6}$/.test(twoFactorVerificationCode) || isEnrollingTwoFactor}
                                style={{
                                  ...styles.twoFactorVerifyButton,
                                  ...((!/^\d{6}$/.test(twoFactorVerificationCode) || isEnrollingTwoFactor)
                                    ? styles.twoFactorVerifyButtonDisabled
                                    : {})
                                }}
                              >
                                {isEnrollingTwoFactor ? 'Verifying…' : 'Verify'}
                              </button>
                            </div>
                          </div>
                        )}

                        {twoFactorError && !isSettingUpTwoFactor && (
                          <div style={styles.twoFactorError}>{twoFactorError}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {settingsSection === 'sessions' && (
                    <div style={styles.securitySection}>
                      <h2 id="settings-modal-title" style={styles.settingsContentTitle}>Active sessions</h2>
                      <div style={styles.sessionsDescription}>
                        Review recent sessions and trusted devices associated with your account.
                      </div>

                      <div style={styles.sessionsList}>
                        {isLoadingSessions && sessions.length === 0 ? (
                          <div style={styles.sessionsEmpty}>Loading sessions…</div>
                        ) : sessions.length === 0 ? (
                          <div style={styles.sessionsEmpty}>No session activity available.</div>
                        ) : (
                          sessions.map(session => {
                            const isCurrent = session.id === sessionIdRef.current;
                            const sessionLocation = [session.city, session.region].filter(Boolean).join(', ');
                            return (
                              <div key={session.id} style={styles.sessionRow}>
                                <div style={styles.sessionIcon}>
                                  <Icon name={session.icon === 'mobile' ? 'mobile' : 'laptop'} size={31} stroke={1.8} />
                                </div>

                                <div style={styles.sessionInfo}>
                                  <div style={styles.sessionName}>AI Legal Counsellor Web</div>
                                  <div style={styles.sessionMeta}>{session.device || 'Device'} · {session.os || 'Unknown OS'}</div>
                                  <div style={styles.sessionMeta}>{formatSessionDate(session.createdAt)}</div>
                                  <div style={styles.sessionMeta}>{sessionLocation || 'Location unavailable'}</div>
                                </div>

                                <div style={styles.sessionAction}>
                                  {isCurrent ? (
                                    <span style={styles.currentSessionBadge}>CURRENT SESSION</span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleRevokeSession(session)}
                                      disabled={revokingSessionId === session.id}
                                      style={{
                                        ...styles.sessionLogoutButton,
                                        ...(revokingSessionId === session.id ? styles.sessionLogoutButtonDisabled : {})
                                      }}
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
                    <div style={styles.dataControlsSection}>
                      <h2 style={styles.settingsContentTitle}>Data Controls</h2>
                      <div style={styles.dataControlsDescription}>
                        Manage the conversations saved to your account.
                      </div>

                      <div style={styles.dataControlsList}>
                        <div style={styles.dataControlRow}>
                          <div style={styles.dataControlCopy}>
                            <div style={styles.dataControlTitle}>Export chats</div>
                            <div style={styles.dataControlDescription}>Download a copy of your saved conversations.</div>
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
                            style={styles.dataControlSecondaryButton}
                          >
                            Export
                          </button>
                        </div>

                        <div style={styles.dataControlRow}>
                          <div style={styles.dataControlCopy}>
                            <div style={styles.dataControlTitle}>Delete all chats</div>
                            <div style={styles.dataControlDescription}>Permanently delete all saved conversations from your account.</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDeleteChatsConsentOpen(true)}
                            style={styles.dataControlDeleteButton}
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

      <main style={styles.main}>
        <header style={styles.topbar}>
          <div style={styles.topbarNotice}>
            Legal Counsellor can make mistakes, please double-check important information
          </div>
        </header>

        <section style={styles.chatViewport}>
          {isWelcome && (
            <div style={styles.welcomeArea}>
              <div style={styles.welcomeMark} aria-label="Legal assistance">
                <Icon name="scale" size={42} stroke={1.55} />
              </div>
              <div style={styles.welcomeEyebrow}>AI-POWERED LEGAL ASSISTANCE</div>
              <h1 style={styles.welcomeTitle}>
                How can we help<br />with your legal question?
              </h1>
              <p style={styles.welcomeText}>
                Ask questions about Pakistani law and receive AI-assisted guidance based on relevant legal frameworks.
              </p>
              <div style={styles.disclaimer}>
                <span style={styles.disclaimerIcon}><Icon name="info" size={17} /></span>
                <span>
                  For informational purposes only. For specific legal matters,{' '}
                  <a href="/lawyers" style={styles.disclaimerLink}>Consult a Qualified Lawyer</a>.
                </span>
              </div>
            </div>
          )}

          {!isWelcome && (
            <div style={styles.messagesContainer}>
              {messages.map((msg, index) => (
                <div key={index} style={{ ...styles.messageRow, justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                  {msg.sender === 'bot' && (
                    <div style={styles.messageAvatar}>
                      <img src={headerLogoSrc} alt="AI" style={styles.messageAvatarImage} />
                    </div>
                  )}
                  <div style={{ ...styles.message, ...(msg.sender === 'user' ? styles.userMessage : styles.botMessage) }}>
                    {msg.sender === 'bot' ? <ReactMarkdown>{msg.text}</ReactMarkdown> : msg.text}
                  </div>
                </div>
              ))}

              {typingMessage && (
                <div style={styles.messageRow}>
                  <div style={styles.messageAvatar}>
                    <img src={headerLogoSrc} alt="AI" style={styles.messageAvatarImage} />
                  </div>
                  <div style={{ ...styles.message, ...styles.botMessage }}>
                    <ReactMarkdown>{typingMessage}</ReactMarkdown>
                    <span style={styles.typingCursor}></span>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <section style={styles.composerArea}>
          <div style={styles.composerCard}>
            <div style={styles.composerHint}>
              <Icon name="spark" size={18} />
              <span>Ask a question about Pakistani law...</span>
            </div>

            <div style={styles.composerInputRow}>
              <input
                ref={inputRef}
                style={styles.input}
                type="text"
                placeholder="Describe your legal question..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                type="button"
                style={{ ...styles.sendButton, ...(input.trim() ? styles.sendButtonActive : styles.sendButtonDisabled) }}
                onClick={handleSend}
                disabled={!input.trim()}
                aria-label="Send message"
              >
                <Icon name="send" size={19} stroke={2} />
              </button>
            </div>

            <div style={styles.composerFooter}>
              <div style={styles.composerChip}><Icon name="scale" size={15} /> Pakistani law</div>
              <div style={styles.composerChip}><Icon name="library" size={15} /> Legal guidance</div>
              <span style={styles.composerDisclaimer}>AI responses may not constitute legal advice.</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

const colors = {
  navy: '#0B172A',
  navySoft: '#15243A',
  gold: '#B8924A',
  goldLight: '#D0AE6B',
  page: '#F5F7FA',
  surface: '#FFFFFF',
  border: '#E7E9ED',
  text: '#172033',
  muted: '#7A808A',
  sidebarText: '#69717D',
  soft: '#F2F4F7'
};

const styles = {
  appShell: {
    display: 'flex',
    width: '100%',
    height: '100vh',
    overflow: 'hidden',
    background: colors.page,
    color: colors.text,
    fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif"
  },

  sidebar: {
    width: '300px',
    minWidth: '300px',
    height: '100vh',
    padding: '24px 18px 16px',
    boxSizing: 'border-box',
    background: '#FBFCFD',
    borderRight: `1px solid ${colors.border}`,
    boxShadow: '3px 0 12px rgba(20,28,40,0.045)',
    position: 'relative',
    zIndex: 20
  },

  sidebarInner: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },

  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '4px 8px 20px'
  },

  brandLogoBox: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    background: colors.navy,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0
  },

  brandLogo: {
    width: '31px',
    height: '31px',
    objectFit: 'contain'
  },

  brandCopy: { minWidth: 0 },

  brandTitle: {
    fontSize: '14px',
    lineHeight: 1.1,
    fontWeight: '700',
    color: colors.navy,
    letterSpacing: '-0.2px'
  },

  brandSubtitle: {
    marginTop: '3px',
    fontSize: '12px',
    lineHeight: 1.2,
    color: colors.muted
  },

  searchBox: {
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    padding: '0 13px',
    margin: '0 4px 17px',
    background: '#FFFFFF',
    border: `1px solid ${colors.border}`,
    borderRadius: '999px',
    color: '#9AA0A8',
    boxShadow: '0 4px 16px rgba(25,35,50,0.045)'
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: colors.text,
    fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif",
    fontSize: '14px'
  },

  navList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '0 4px',
    marginBottom: '16px'
  },

  navItem: {
    width: '100%',
    minHeight: '44px',
    border: 'none',
    borderRadius: '999px',
    background: 'transparent',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '0 12px',
    color: colors.sidebarText,
    fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif",
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'left',
    cursor: 'pointer'
  },

  navItemActive: {
    background: '#F0F2F5',
    color: colors.text,
    fontWeight: '600'
  },

  newChatButton: {
    width: '100%',
    minHeight: '48px',
    borderRadius: '999px',
    border: `1px solid ${colors.border}`,
    background: '#FFFFFF',
    color: colors.text,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '9px',
    fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif",
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 3px 12px rgba(25,35,50,0.04)',
    marginBottom: '10px'
  },

  newChatIcon: {
    width: '25px',
    height: '25px',
    borderRadius: '8px',
    background: '#F1F3F6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.navy
  },

  lawyersButton: {
    width: 'calc(100% - 8px)',
    minHeight: '46px',
    border: `1px solid ${colors.border}`,
    borderRadius: '16px',
    background: '#FFFFFF',
    color: colors.sidebarText,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '0 14px',
    margin: '0 4px 17px',
    fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif",
    fontSize: '14px',
    fontWeight: '600',
    textAlign: 'left',
    cursor: 'pointer',
    boxShadow: '0 3px 12px rgba(25,35,50,0.04)'
  },

  historyHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 10px 9px',
    color: '#8B929C',
    fontSize: '13px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },

  historyCount: {
    minWidth: '22px',
    height: '22px',
    padding: '0 6px',
    borderRadius: '999px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#EEF0F3',
    color: '#8B929C',
    fontSize: '12px'
  },

  chatHistoryScrollArea: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '0 3px'
  },

  emptyHistory: {
    padding: '45px 15px',
    textAlign: 'center',
    color: colors.muted
  },

  emptyHistoryIcon: {
    width: '48px',
    height: '48px',
    margin: '0 auto 13px',
    borderRadius: '15px',
    background: '#F1F3F6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#A0A6AE'
  },

  emptyHistoryTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#707781',
    marginBottom: '3px'
  },

  emptyHistoryText: {
    fontSize: '14px',
    lineHeight: 1.45,
    color: '#9AA0A8'
  },

  historyItem: {
    minHeight: '49px',
    padding: '7px 8px',
    marginBottom: '3px',
    borderRadius: '999px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    color: '#727983',
    position: 'relative'
  },

  activeHistoryItem: {
    background: '#F0F2F5',
    color: colors.text
  },

  historyItemMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: 0,
    flex: 1
  },

  historyItemIcon: {
    width: '30px',
    height: '30px',
    borderRadius: '999px',
    background: '#F1F3F6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#89919B',
    flexShrink: 0
  },

  historyItemContent: {
    minWidth: 0,
    flex: 1
  },

  historyItemTitle: {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '13px',
    lineHeight: 1.25,
    fontWeight: '500'
  },

  dropdownWrapper: {
    position: 'relative',
    flexShrink: 0
  },

  moreButton: {
    width: '32px',
    height: '32px',
    border: 'none',
    borderRadius: '8px',
    background: 'transparent',
    color: '#9AA0A8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },

  moreButtonActive: {
    background: '#E7EAF0',
    color: colors.text
  },

  dropdown: {
    position: 'absolute',
    top: '35px',
    right: 0,
    width: '195px',
    padding: '6px',
    background: '#FFFFFF',
    border: `1px solid ${colors.border}`,
    borderRadius: '999px',
    boxShadow: '0 18px 45px rgba(20,28,40,0.14)',
    zIndex: 100
  },

  dropdownButton: {
    width: '100%',
    minHeight: '39px',
    border: 'none',
    borderRadius: '8px',
    background: 'transparent',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '0 10px',
    color: colors.text,
    fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif",
    fontSize: '14px',
    textAlign: 'left',
    cursor: 'pointer'
  },

  deleteDropdownButton: { color: '#A34343' },

  renameArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    width: '100%'
  },

  renameInput: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '7px 8px',
    borderRadius: '999px',
    border: `1px solid ${colors.border}`,
    background: '#FFFFFF',
    color: colors.text,
    outline: 'none',
    fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif",
    fontSize: '14px'
  },

  renameSaveButton: {
    alignSelf: 'flex-start',
    padding: '5px 10px',
    border: 'none',
    borderRadius: '999px',
    background: colors.navy,
    color: '#FFFFFF',
    fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif",
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  sidebarFooter: {
    marginTop: '10px',
    paddingTop: '10px',
    borderTop: `1px solid ${colors.border}`,
    position: 'relative'
  },

  accountMenuWrapper: { position: 'relative' },

  accountTrigger: {
    width: '100%',
    minHeight: '66px',
    border: 'none',
    borderRadius: '999px',
    background: 'transparent',
    display: 'flex',
    alignItems: 'center',
    gap: '11px',
    padding: '8px 8px',
    color: colors.text,
    textAlign: 'left',
    cursor: 'pointer'
  },

  accountIcon: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    border: '1px solid #D7DAE0',
    background: '#F3F5F7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#5F6772',
    flexShrink: 0
  },

  accountTriggerIdentity: { minWidth: 0, flex: 1 },

  accountTriggerName: {
    fontSize: '14px',
    lineHeight: 1.15,
    fontWeight: '600',
    color: colors.text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },

  accountTriggerEmail: {
    marginTop: '3px',
    fontSize: '12px',
    lineHeight: 1.2,
    color: '#8A9098',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },

  accountDropup: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '68px',
    padding: '16px',
    background: '#FFFFFF',
    border: `1px solid #E4E7EC`,
    borderRadius: '24px',
    boxShadow: '0 18px 45px rgba(20,28,40,0.13)',
    zIndex: 120,
    opacity: 0,
    transform: 'translateY(12px) scale(0.985)',
    transformOrigin: 'bottom center',
    visibility: 'hidden',
    pointerEvents: 'none',
    transition: 'opacity 220ms cubic-bezier(0.22, 1, 0.36, 1), transform 260ms cubic-bezier(0.22, 1, 0.36, 1), visibility 0s linear 260ms'
  },

  accountDropupOpen: {
    opacity: 1,
    transform: 'translateY(0) scale(1)',
    visibility: 'visible',
    pointerEvents: 'auto',
    transition: 'opacity 220ms cubic-bezier(0.22, 1, 0.36, 1), transform 260ms cubic-bezier(0.22, 1, 0.36, 1), visibility 0s linear 0s'
  },

  accountDropupClosed: {
    opacity: 0,
    transform: 'translateY(12px) scale(0.985)',
    visibility: 'hidden',
    pointerEvents: 'none'
  },

  accountDropupUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '2px 2px 4px'
  },

  accountIconLarge: {
    width: '54px',
    height: '54px',
    borderRadius: '50%',
    border: '1px solid #D7DAE0',
    background: '#F3F5F7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#5F6772',
    flexShrink: 0
  },

  accountDropupIdentity: { minWidth: 0, flex: 1 },

  accountDropupName: {
    fontSize: '16px',
    lineHeight: 1.2,
    fontWeight: '600',
    color: colors.text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },

  accountDropupEmail: {
    marginTop: '4px',
    fontSize: '13px',
    lineHeight: 1.2,
    color: colors.muted,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },

  accountDivider: {
    height: '1px',
    background: '#E4E7EC',
    margin: '14px 2px 8px'
  },

  accountActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },

  accountActionButton: {
    width: '100%',
    minHeight: '40px',
    border: 'none',
    borderRadius: '12px',
    background: 'transparent',
    color: '#454C56',
    display: 'flex',
    alignItems: 'center',
    gap: '11px',
    padding: '0 10px',
    fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif",
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 160ms ease, color 160ms ease'
  },

  accountDividerSmall: {
    height: '1px',
    background: '#E4E7EC',
    margin: '6px 2px 5px'
  },

  modalOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 500,
    background: 'rgba(11,23,42,0.18)',
    backdropFilter: 'blur(3px)',
    WebkitBackdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '22px',
    animation: 'accountModalOverlayIn 220ms cubic-bezier(0.22, 1, 0.36, 1)'
  },

  accountModal: {
    width: '100%',
    maxHeight: 'calc(100vh - 44px)',
    overflow: 'auto',
    position: 'relative',
    background: '#FFFFFF',
    border: `1px solid #DCE0E6`,
    borderRadius: '18px',
    boxShadow: '0 28px 80px rgba(11,23,42,0.18)',
    animation: 'accountModalIn 280ms cubic-bezier(0.22, 1, 0.36, 1)'
  },

  profileModal: {
    maxWidth: '560px',
    padding: '30px'
  },

  settingsModal: {
    maxWidth: '900px',
    minHeight: '520px',
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'stretch',
    alignItems: 'stretch'
  },

  modalCloseButton: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    width: '42px',
    height: '42px',
    border: 'none',
    borderRadius: '50%',
    background: 'transparent',
    color: '#111827',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },

  modalTitle: {
    margin: '0',
    color: '#111827',
    fontSize: '30px',
    lineHeight: 1.15,
    fontWeight: '500'
  },

  profileAvatarLarge: {
    width: '170px',
    height: '170px',
    margin: '42px auto 30px',
    borderRadius: '50%',
    background: '#F3F5F7',
    border: '1px solid #D7DAE0',
    color: '#69717C',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },

  profileAvatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },

  profileForm: {
    width: '100%'
  },

  profileField: {
    display: 'block',
    width: '100%',
    border: '1px solid #D7DAE0',
    borderRadius: '15px',
    padding: '13px 18px 10px',
    background: '#FFFFFF'
  },

  profileFieldLabel: {
    display: 'block',
    color: '#4E5661',
    fontSize: '13px',
    lineHeight: 1.2,
    marginBottom: '4px'
  },

  profileNameInput: {
    width: '100%',
    border: 'none',
    outline: 'none',
    padding: 0,
    background: 'transparent',
    color: '#111827',
    fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif",
    fontSize: '18px',
    lineHeight: 1.35
  },

  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '24px'
  },

  modalCancelButton: {
    minWidth: '104px',
    height: '44px',
    padding: '0 18px',
    border: '1px solid #D7DAE0',
    borderRadius: '999px',
    background: '#FFFFFF',
    color: '#111827',
    fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif",
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  modalSaveButton: {
    minWidth: '88px',
    height: '44px',
    padding: '0 20px',
    border: 'none',
    borderRadius: '999px',
    background: '#111111',
    color: '#FFFFFF',
    fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif",
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  modalSaveButtonDisabled: {
    opacity: 0.45,
    cursor: 'not-allowed'
  },

  dataControlsSection: {
    width: '100%',
    maxWidth: '760px',
    marginTop: '36px',
    paddingTop: '30px',
    borderTop: '1px solid #E4E7EC'
  },

  dataControlsDescription: {
    color: '#8A9098',
    fontSize: '15px',
    lineHeight: 1.5,
    marginBottom: '22px'
  },

  dataControlsList: {
    width: '100%',
    borderTop: '1px solid #E4E7EC'
  },

  dataControlRow: {
    minHeight: '86px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '24px',
    borderBottom: '1px solid #E4E7EC',
    padding: '12px 0'
  },

  dataControlCopy: {
    minWidth: 0,
    flex: 1
  },

  dataControlTitle: {
    color: '#172033',
    fontSize: '17px',
    lineHeight: 1.25,
    fontWeight: '600'
  },

  dataControlDescription: {
    marginTop: '4px',
    color: '#8A9098',
    fontSize: '14px',
    lineHeight: 1.45
  },

  dataControlSecondaryButton: {
    minWidth: '104px',
    height: '42px',
    padding: '0 18px',
    border: '1.5px solid #D7DAE0',
    borderRadius: '999px',
    background: '#FFFFFF',
    color: '#111827',
    fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif",
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    flexShrink: 0
  },

  dataControlDeleteButton: {
    minWidth: '104px',
    height: '42px',
    padding: '0 18px',
    border: '1.5px solid #D92D20',
    borderRadius: '999px',
    background: '#FFFFFF',
    color: '#D92D20',
    fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif",
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    flexShrink: 0
  },

  settingsLayout: {
    display: 'flex',
    minHeight: '464px',
    paddingTop: '8px'
  },

  settingsSidebar: {
    width: '190px',
    flexShrink: 0,
    padding: '38px 16px 10px 4px',
    borderRight: '1px solid #E4E7EC'
  },

  settingsHeading: {
    color: '#111827',
    fontSize: '28px',
    lineHeight: 1.15,
    fontWeight: '500',
    marginBottom: '26px',
    padding: '0 10px'
  },

  settingsNavButton: {
    width: '100%',
    minHeight: '44px',
    border: 'none',
    borderRadius: '12px',
    background: 'transparent',
    color: '#69717C',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '0 12px',
    fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif",
    fontSize: '14px',
    fontWeight: '600',
    textAlign: 'left',
    cursor: 'pointer'
  },

  settingsNavButtonActive: {
    background: '#F0F2F5',
    color: '#172033'
  },

  authenticationSection: {
    width: '100%',
    maxWidth: '760px'
  },

  authenticationCard: {
    width: '100%',
    borderTop: '1px solid #E4E7EC'
  },

  authenticationRow: {
    minHeight: '92px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '24px',
    borderBottom: '1px solid #E4E7EC',
    padding: '0 0'
  },

  authenticationCopy: {
    minWidth: 0,
    flex: 1
  },

  authenticationTitle: {
    color: '#172033',
    fontSize: '18px',
    lineHeight: 1.2,
    fontWeight: '600'
  },

  authenticationDescription: {
    marginTop: '5px',
    color: '#8A9098',
    fontSize: '15px',
    lineHeight: 1.45
  },

  twoFactorToggle: {
    width: '64px',
    height: '36px',
    padding: '3px',
    border: 'none',
    borderRadius: '999px',
    background: '#D9DDE3',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background 180ms ease, opacity 180ms ease'
  },

  twoFactorToggleOn: {
    background: '#0B172A',
    justifyContent: 'flex-end'
  },

  twoFactorToggleDisabled: {
    opacity: 0.55,
    cursor: 'wait'
  },

  twoFactorToggleKnob: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    background: '#FFFFFF',
    boxShadow: '0 1px 4px rgba(11,23,42,0.18)',
    transition: 'transform 180ms ease'
  },

  twoFactorToggleKnobOn: {
    transform: 'translateX(0)'
  },

  twoFactorSetup: {
    padding: '26px 0 4px',
    borderBottom: '1px solid #E4E7EC'
  },

  twoFactorSetupStep: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
    color: '#172033',
    fontSize: '17px',
    lineHeight: 1.45
  },

  twoFactorSetupStepSecond: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
    color: '#172033',
    fontSize: '17px',
    lineHeight: 1.45,
    marginTop: '26px',
    marginBottom: '13px'
  },

  twoFactorStepTitle: {
    fontWeight: '700',
    flexShrink: 0
  },

  twoFactorStepText: {
    fontWeight: '400'
  },

  twoFactorQrCard: {
    width: '100%',
    minHeight: '286px',
    marginTop: '20px',
    border: '1px solid #E4E7EC',
    borderRadius: '18px',
    background: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },

  twoFactorQrCode: {
    width: '220px',
    height: '220px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#FFFFFF'
  },

  twoFactorCodeInput: {
    width: '100%',
    height: '54px',
    boxSizing: 'border-box',
    border: '1.5px solid #D7DAE0',
    borderRadius: '15px',
    outline: 'none',
    background: '#FFFFFF',
    color: '#172033',
    padding: '0 16px',
    fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif",
    fontSize: '16px',
    letterSpacing: '2px'
  },

  twoFactorError: {
    marginTop: '9px',
    color: '#DC2626',
    fontSize: '13px',
    lineHeight: 1.45,
    fontWeight: '500'
  },

  twoFactorSetupFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '20px',
    paddingBottom: '10px'
  },

  twoFactorCancelButton: {
    minWidth: '104px',
    height: '44px',
    padding: '0 18px',
    border: '1px solid #D7DAE0',
    borderRadius: '999px',
    background: '#FFFFFF',
    color: '#111827',
    fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif",
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  twoFactorVerifyButton: {
    minWidth: '104px',
    height: '44px',
    padding: '0 20px',
    border: 'none',
    borderRadius: '999px',
    background: '#111111',
    color: '#FFFFFF',
    fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif",
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  twoFactorVerifyButtonDisabled: {
    opacity: 0.42,
    cursor: 'not-allowed'
  },

  securitySection: {
    width: '100%'
  },

  securityCard: {
    width: '100%',
    maxWidth: '720px',
    paddingTop: '2px'
  },

  securityIntro: {
    marginBottom: '26px'
  },

  securityIntroTitle: {
    color: '#111827',
    fontSize: '22px',
    lineHeight: 1.2,
    fontWeight: '600'
  },

  securityIntroText: {
    marginTop: '5px',
    color: '#7A808A',
    fontSize: '14px',
    lineHeight: 1.45
  },

  passwordFieldGroup: {
    marginBottom: '22px'
  },

  passwordFieldLabel: {
    display: 'block',
    marginBottom: '8px',
    color: '#172033',
    fontSize: '16px',
    fontWeight: '500'
  },

  passwordInputWrap: {
    width: '100%',
    minHeight: '54px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: '1.5px solid #D7DAE0',
    borderRadius: '15px',
    background: '#FFFFFF',
    padding: '0 10px 0 16px',
    transition: 'border-color 180ms ease, box-shadow 180ms ease, background 180ms ease'
  },

  passwordInputValid: {
    borderColor: '#16A34A',
    boxShadow: '0 0 0 1px rgba(22,163,74,0.05), 0 5px 18px rgba(22,163,74,0.06)'
  },

  passwordInputInvalid: {
    borderColor: '#DC2626',
    boxShadow: '0 0 0 1px rgba(220,38,38,0.04), 0 5px 18px rgba(220,38,38,0.05)'
  },

  passwordInput: {
    flex: 1,
    minWidth: 0,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: '#172033',
    fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif",
    fontSize: '16px',
    padding: '13px 0'
  },

  passwordToggle: {
    width: '38px',
    height: '38px',
    border: 'none',
    borderRadius: '50%',
    background: 'transparent',
    color: '#5F6772',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0
  },

  passwordValidMark: {
    width: '21px',
    height: '21px',
    borderRadius: '50%',
    background: '#16A34A',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '700',
    flexShrink: 0
  },

  passwordValidationError: {
    marginTop: '7px',
    color: '#DC2626',
    fontSize: '13px',
    lineHeight: 1.4,
    fontWeight: '500'
  },

  passwordRules: {
    marginTop: '9px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },

  passwordRule: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#8A9098',
    fontSize: '13px',
    lineHeight: 1.35,
    transition: 'color 180ms ease'
  },

  passwordRuleValid: {
    color: '#16A34A'
  },

  passwordRuleDot: {
    width: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '700'
  },

  changePasswordButton: {
    width: '100%',
    minHeight: '50px',
    border: 'none',
    borderRadius: '999px',
    background: '#0B172A',
    color: '#FFFFFF',
    fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif",
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 8px 22px rgba(11,23,42,0.12)',
    transition: 'transform 180ms ease, opacity 180ms ease, box-shadow 180ms ease'
  },

  changePasswordButtonDisabled: {
    opacity: 0.42,
    cursor: 'not-allowed',
    boxShadow: 'none'
  },

  settingsContent: {
    flex: 1,
    minWidth: 0,
    padding: '38px 12px 20px 38px'
  },

  settingsContentTitle: {
    margin: '0 0 22px',
    color: '#111827',
    fontSize: '30px',
    lineHeight: 1.15,
    fontWeight: '500'
  },

  settingsRows: {
    width: '100%'
  },

  settingsRow: {
    minHeight: '76px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '25px',
    borderTop: '1px solid #E4E7EC',
    padding: '0 0'
  },

  settingsRowLabel: {
    color: '#172033',
    fontSize: '17px',
    fontWeight: '500'
  },

  settingsRowValue: {
    color: '#626872',
    fontSize: '16px',
    fontWeight: '400',
    textAlign: 'right',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },

  deleteAccountRow: {
    minHeight: '88px'
  },

  deleteAccountButton: {
    minWidth: '106px',
    height: '42px',
    padding: '0 20px',
    border: '1.5px solid #D92D20',
    borderRadius: '999px',
    background: '#FFFFFF',
    color: '#D92D20',
    fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif",
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  sessionsDescription: {
    color: '#8A9098',
    fontSize: '15px',
    lineHeight: 1.5,
    maxWidth: '720px',
    marginBottom: '24px'
  },

  sessionsList: {
    width: '100%',
    maxWidth: '760px',
    borderTop: '1px solid #E4E7EC'
  },

  sessionRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '20px',
    padding: '22px 0',
    borderBottom: '1px solid #E4E7EC'
  },

  sessionIcon: {
    width: '54px',
    height: '54px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#111827'
  },

  sessionInfo: {
    minWidth: 0,
    flex: 1,
    position: 'relative'
  },

  sessionAction: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: '150px'
  },

  sessionName: {
    color: '#111827',
    fontSize: '19px',
    lineHeight: 1.2,
    fontWeight: '600'
  },

  sessionMeta: {
    marginTop: '5px',
    color: '#6F7680',
    fontSize: '15px',
    lineHeight: 1.35
  },

  currentSessionBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: '34px',
    padding: '0 13px',
    marginTop: '10px',
    borderRadius: '999px',
    background: '#ECFDF3',
    color: '#16803A',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.45px'
  },

  sessionLogoutButton: {
    minWidth: '128px',
    height: '44px',
    padding: '0 20px',
    marginTop: '0',
    border: '1.5px solid #D7DAE0',
    borderRadius: '999px',
    background: '#FFFFFF',
    color: '#111827',
    fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif",
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  sessionLogoutButtonDisabled: {
    opacity: 0.55,
    cursor: 'wait'
  },

  sessionsEmpty: {
    padding: '30px 0',
    color: '#8A9098',
    fontSize: '15px'
  },

  settingsComingSoon: {
    width: '100%',
    textAlign: 'center'
  },

  comingSoonText: {
    marginTop: '18px',
    color: '#8A9098',
    fontSize: '18px',
    fontWeight: '500'
  },

  accountLogoutButton: {
    width: '100%',
    minHeight: '48px',
    border: 'none',
    borderRadius: '14px',
    background: 'transparent',
    color: '#454C56',
    display: 'flex',
    alignItems: 'center',
    gap: '11px',
    padding: '0 10px',
    fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif",
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 160ms ease, color 160ms ease'
  },

  footerNote: {
    textAlign: 'center',
    color: '#A0A6AE',
    fontSize: '12px',
    padding: '5px 0 0'
  },

  mobileMenuButton: {
    position: 'fixed',
    top: '14px',
    left: '14px',
    width: '42px',
    height: '42px',
    border: `1px solid ${colors.border}`,
    borderRadius: '999px',
    background: '#FFFFFF',
    color: colors.navy,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    boxShadow: '0 6px 20px rgba(20,28,40,0.10)'
  },

  main: {
    flex: 1,
    minWidth: 0,
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#FFFFFF'
  },

  topbar: {
    height: '60px',
    minHeight: '60px',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.96)',
    borderBottom: `1px solid ${colors.border}`,
    position: 'relative',
    zIndex: 10
  },

  topbarNotice: {
    color: '#858C96',
    fontSize: '12px',
    lineHeight: 1.3,
    fontWeight: '400',
    letterSpacing: '0.05px',
    textAlign: 'center'
  },

  chatViewport: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    background: 'radial-gradient(circle at 64% 33%, rgba(212,220,255,0.17), transparent 24%), radial-gradient(circle at 46% 78%, rgba(222,238,230,0.16), transparent 28%), #FFFFFF'
  },

  welcomeArea: {
    width: '100%',
    maxWidth: '1060px',
    margin: 'auto',
    padding: '45px 30px 55px',
    boxSizing: 'border-box',
    textAlign: 'center'
  },

  welcomeMark: {
    width: '66px',
    height: '66px',
    margin: '0 auto 20px',
    borderRadius: '50%',
    background: colors.navy,
    color: colors.goldLight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 14px 30px rgba(11,23,42,0.11)'
  },

  welcomeMarkImage: { width: '48px', height: '48px', objectFit: 'contain' },

  welcomeEyebrow: {
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '3px',
    color: colors.gold,
    marginBottom: '18px'
  },

  welcomeTitle: {
    margin: 0,
    fontSize: 'clamp(42px, 5vw, 68px)',
    lineHeight: 1.04,
    letterSpacing: '-1.8px',
    fontWeight: '700',
    color: colors.navy
  },

  welcomeText: {
    maxWidth: '900px',
    margin: '24px auto 0',
    fontSize: '16px',
    lineHeight: 1.5,
    fontWeight: '400',
    color: '#737B86'
  },

  disclaimer: {
    maxWidth: '850px',
    minHeight: '70px',
    margin: '30px auto 0',
    padding: '12px 22px',
    boxSizing: 'border-box',
    border: `1px solid #E3DDCF`,
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.88)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    color: '#7A7A78',
    fontSize: '14px',
    lineHeight: 1.4,
    textAlign: 'left'
  },

  disclaimerLink: {
    color: colors.navy,
    fontWeight: '700',
    textDecoration: 'none'
  },

  disclaimerIcon: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    border: `1.5px solid ${colors.gold}`,
    color: colors.gold,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },

  messagesContainer: {
    width: '100%',
    maxWidth: '1050px',
    margin: '0 auto',
    padding: '38px 28px 40px',
    boxSizing: 'border-box'
  },

  messageRow: {
    width: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '18px'
  },

  messageAvatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: colors.navy,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0
  },

  messageAvatarImage: { width: '27px', height: '27px', objectFit: 'contain' },

  message: {
    maxWidth: 'min(820px, 82%)',
    padding: '15px 19px',
    borderRadius: '999px',
    wordBreak: 'break-word',
    fontSize: '14px',
    lineHeight: 1.6
  },

  userMessage: {
    background: colors.navy,
    color: '#FFFFFF',
    borderBottomRightRadius: '999px',
    boxShadow: '0 8px 22px rgba(11,23,42,0.10)'
  },

  botMessage: {
    background: '#FFFFFF',
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderBottomLeftRadius: '999px',
    boxShadow: '0 5px 20px rgba(20,28,40,0.045)'
  },

  typingCursor: {
    display: 'inline-block',
    width: '5px',
    height: '18px',
    background: colors.gold,
    marginLeft: '4px',
    verticalAlign: 'middle',
    animation: 'blink 0.8s infinite'
  },

  composerArea: {
    padding: '12px 30px 23px',
    background: '#FFFFFF',
    flexShrink: 0
  },

  composerCard: {
    width: '100%',
    maxWidth: '980px',
    margin: '0 auto',
    padding: '14px 15px 10px',
    boxSizing: 'border-box',
    background: '#FFFFFF',
    border: `1px solid #E1E4E8`,
    borderRadius: '24px',
    boxShadow: '0 10px 35px rgba(20,28,40,0.07)'
  },

  composerHint: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    color: '#4E5661',
    fontSize: '14px',
    fontWeight: '500',
    padding: '2px 6px 8px'
  },

  composerInputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },

  input: {
    flex: 1,
    minWidth: 0,
    height: '52px',
    border: '1px solid rgba(102, 118, 255, 0.22)',
    outline: 'none',
    background: '#FAFBFC',
    borderRadius: '18px',
    padding: '0 15px',
    boxShadow: '0 0 0 1px rgba(184, 146, 74, 0.05), 0 0 9px rgba(102, 118, 255, 0.08)',
    color: colors.text,
    fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif",
    fontSize: '14px'
  },

  sendButton: {
    width: '48px',
    height: '48px',
    borderRadius: '999px',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.2s ease'
  },

  sendButtonActive: {
    background: colors.navy,
    color: '#FFFFFF',
    cursor: 'pointer',
    boxShadow: '0 7px 16px rgba(11,23,42,0.15)'
  },

  sendButtonDisabled: {
    background: '#ECEEF1',
    color: '#A7ACB4',
    cursor: 'not-allowed'
  },

  composerFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 4px 0',
    minHeight: '31px'
  },

  composerChip: {
    height: '31px',
    padding: '0 10px',
    borderRadius: '999px',
    background: '#F5F6F8',
    color: '#69717C',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: '500'
  },

  composerDisclaimer: {
    marginLeft: 'auto',
    color: '#A0A5AC',
    fontSize: '13px'
  },

  loginRequired: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#F5F7FA',
    fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif",
    padding: '20px',
    boxSizing: 'border-box'
  },

  loginRequiredCard: {
    width: '100%',
    maxWidth: '420px',
    padding: '40px',
    textAlign: 'center',
    background: '#FFFFFF',
    border: `1px solid ${colors.border}`,
    borderRadius: '20px',
    boxShadow: '0 20px 55px rgba(11,23,42,0.08)'
  },

  loginRequiredIcon: {
    width: '60px',
    height: '60px',
    margin: '0 auto 16px',
    borderRadius: '999px',
    background: colors.navy,
    color: colors.goldLight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  loginRequiredTitle: {
    margin: '0 0 7px',
    color: colors.navy,
    fontSize: '25px',
    fontWeight: '700'
  },

  loginRequiredText: {
    margin: 0,
    color: colors.muted,
    fontSize: '16px'
  }
};

if (typeof document !== 'undefined') {
  const styleId = 'legal-chatbot-global-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      @keyframes blink {
        0%, 45% { opacity: 1; }
        46%, 100% { opacity: 0; }
      }

      * { box-sizing: border-box; }
      html, body, #root { margin: 0; min-height: 100%; }
      body { font-family: 'Titillium Web', Geneva, Tahoma, sans-serif; }
      button, input { font: inherit; }
      button { -webkit-tap-highlight-color: transparent; }
      input::placeholder { color: #A3A8AF; }
      .account-logout-button:hover { background: #F5F6F8 !important; }
      .accountActionButton:hover { background: #F5F6F8 !important; }
      .deleteAccountButton:hover { background: #FEF3F2 !important; }
      @keyframes accountModalOverlayIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes accountModalIn {
        from { opacity: 0; transform: translateY(12px) scale(0.985); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      input:focus {
        border-color: rgba(102, 118, 255, 0.34) !important;
        box-shadow: 0 0 0 1px rgba(184, 146, 74, 0.07), 0 0 10px rgba(102, 118, 255, 0.11) !important;
      }
      ::selection { background: rgba(184, 146, 74, 0.20); }
      ::-webkit-scrollbar { width: 7px; height: 7px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(20, 28, 40, 0.14); border-radius: 10px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(20, 28, 40, 0.22); }

      @media (max-width: 899px) {
        .legal-chatbot-desktop-only { display: none !important; }
      }

      @media (max-width: 700px) {
        .legal-chatbot-welcome-title { font-size: 40px !important; }
      }

      @media (max-width: 600px) {
        .accountModal { max-height: calc(100vh - 24px) !important; }
        .profileModal { padding: 24px !important; }
        .settingsModal { min-height: 360px !important; padding: 20px !important; }
        .settingsLayout { flex-direction: column !important; min-height: 0 !important; }
        .settingsSidebar { width: 100% !important; padding: 28px 0 12px !important; border-right: none !important; border-bottom: 1px solid #E4E7EC !important; }
        .settingsHeading { margin-bottom: 12px !important; }
        .settingsContent { padding: 24px 0 8px !important; }
        .securityCard { max-width: none !important; }
        .authenticationSection { max-width: none !important; }
        .authenticationRow { min-height: 82px !important; }
        .twoFactorSetupStep { align-items: flex-start !important; }
        .twoFactorQrCard { min-height: 270px !important; }
        .settingsRow { align-items: flex-start !important; flex-direction: column !important; justify-content: center !important; gap: 5px !important; padding: 14px 0 !important; }
        .settingsRowValue { text-align: left !important; white-space: normal !important; }
        .deleteAccountRow { flex-direction: row !important; align-items: center !important; }
        .profileAvatarLarge { width: 140px !important; height: 140px !important; }
        .sessionRow { gap: 12px !important; }
        .sessionName { font-size: 17px !important; }
        .sessionMeta { font-size: 14px !important; }
        .sessionAction { min-width: 0 !important; width: 100% !important; justify-content: flex-start !important; }
        .sessionLogoutButton { width: 100% !important; margin-top: 10px !important; }
        .dataControlsSection { margin-top: 28px !important; padding-top: 24px !important; }
        .dataControlRow { align-items: flex-start !important; flex-direction: column !important; gap: 12px !important; padding: 16px 0 !important; }
        .dataControlSecondaryButton, .dataControlDeleteButton { width: 100% !important; }

      }
    `;
    document.head.appendChild(style);
  }
}

export default Chatbot;
