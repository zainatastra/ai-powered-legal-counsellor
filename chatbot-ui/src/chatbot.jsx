import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
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
  updateDoc
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

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
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  const dropdownRefs = useRef({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setUserEmail(user.email);
        await fetchChatHistoryList(user.uid);
      } else {
        setUserId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const refs = Object.values(dropdownRefs.current);

      if (refs.every(ref => ref && !ref.contains(event.target))) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  const fetchChatHistoryList = async (uid) => {
    const q = query(
      collection(db, 'chatHistory'),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    setChatHistoryList(
      querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    );
  };

  const loadChatById = async (docId) => {
    const q = query(
      collection(db, 'chatHistory'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const docData = querySnapshot.docs.find(d => d.id === docId);

    if (docData) {
      setMessages(docData.data().messages || []);
      setActiveChatId(docId);
    }
  };

  const saveChatHistory = async (newMessages) => {
    if (!userId) return;

    if (activeChatId) {
      const chatRef = doc(db, 'chatHistory', activeChatId);

      await updateDoc(chatRef, {
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
      messages: [
        {
          sender: 'bot',
          text: 'Hello! How can I help you today?'
        }
      ],
      createdAt: serverTimestamp(),
      title: 'New Chat'
    });

    setMessages([
      {
        sender: 'bot',
        text: 'Hello! How can I help you today?'
      }
    ]);

    setActiveChatId(newChat.id);

    await fetchChatHistoryList(userId);
  };

  const handleDeleteChat = async (chatId) => {
    if (window.confirm('Are you sure you want to delete this chat?')) {
      await deleteDoc(doc(db, 'chatHistory', chatId));
      await fetchChatHistoryList(userId);

      if (activeChatId === chatId) {
        setMessages([
          {
            sender: 'bot',
            text: 'Hello! How can I help you today?'
          }
        ]);

        setActiveChatId(null);
      }
    }
  };

  const handleRenameChat = async (chatId) => {
    if (!newTitle.trim()) return;

    const chatRef = doc(db, 'chatHistory', chatId);

    await updateDoc(chatRef, {
      title: newTitle
    });

    setEditChatId(null);
    setNewTitle('');

    await fetchChatHistoryList(userId);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessage = {
      sender: 'user',
      text: input
    };

    const updatedMessages = [...messages, newMessage];

    setMessages(updatedMessages);
    setInput('');
    setTypingMessage('');

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content:
                'You are an AI-powered legal advisor with expertise in Pakistan Penal Code 1860, Constitution of Pakistan 1973, PECA Act (Cybercrime Laws), Family & Inheritance Laws. Refer to exact sections or articles when possible. Avoid making up laws. If unsure, say "Please consult a qualified lawyer." Do not give any answer to a prompt other than legal query or Pakistan laws.'
            },
            {
              role: 'user',
              content: input
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
          }
        }
      );

      const botText = response.data.choices[0].message.content;

      let currentIndex = 0;

      const typingInterval = setInterval(() => {
        if (currentIndex < botText.length) {
          setTypingMessage(prev => prev + botText[currentIndex]);
          currentIndex++;
        } else {
          clearInterval(typingInterval);

          const finalMessages = [
            ...updatedMessages,
            {
              sender: 'bot',
              text: botText
            }
          ];

          setMessages(finalMessages);
          setTypingMessage('');
          saveChatHistory(finalMessages);
        }
      }, 30);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: 'Sorry, something went wrong.'
        }
      ]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  if (!userId) {
    return (
      <div style={styles.loginRequired}>
        <div style={styles.loginRequiredCard}>
          <div style={styles.loginRequiredIcon}>⚖</div>
          <h2 style={styles.loginRequiredTitle}>Login required</h2>
          <p style={styles.loginRequiredText}>
            Please log in to use the legal counsellor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.layout}>

      {/* Mobile Menu */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        style={{
          ...styles.hamburger,
          display: window.innerWidth < 768 ? 'flex' : 'none'
        }}
        aria-label="Toggle navigation"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Sidebar */}
      {isSidebarOpen && (
        <aside style={styles.sidebar}>

          {/* Brand */}
          <div style={styles.sidebarBrand}>
            <div style={styles.brandMark}>
              <img
                src={`${process.env.PUBLIC_URL}/AI-POWERED LEGAL COUNSELLOR FAVICON.png`}
                alt="AI Legal Counsellor"
                style={styles.brandMarkImage}
              />
            </div>

            <div>
              <div style={styles.brandTitle}>Legal Counsellor</div>
              <div style={styles.brandSubtitle}>AI Legal Assistant</div>
            </div>
          </div>

          {/* User */}
          <div style={styles.userCard}>
            <div style={styles.userAvatar}>
              {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
            </div>

            <div style={styles.userInfo}>
              <span style={styles.userLabel}>Signed in as</span>
              <span style={styles.userEmail}>{userEmail}</span>
            </div>
          </div>

          {/* New Chat */}
          <button
            onClick={handleNewChat}
            style={styles.newChatButton}
          >
            <span style={styles.newChatIcon}>+</span>
            <span>New conversation</span>
          </button>

          {/* History */}
          <div style={styles.historyHeader}>
            <span>Recent conversations</span>
            <span style={styles.historyCount}>
              {chatHistoryList.length}
            </span>
          </div>

          <div style={styles.chatHistoryScrollArea}>
            {chatHistoryList.length === 0 ? (
              <div style={styles.emptyHistory}>
                <div style={styles.emptyHistoryIcon}>◌</div>
                <div style={styles.emptyHistoryTitle}>
                  No conversations yet
                </div>
                <div style={styles.emptyHistoryText}>
                  Start a new legal conversation.
                </div>
              </div>
            ) : (
              chatHistoryList.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => loadChatById(chat.id)}
                  style={{
                    ...styles.historyItem,
                    ...(activeChatId === chat.id
                      ? styles.activeHistoryItem
                      : {})
                  }}
                >
                  <div style={styles.historyItemMain}>
                    <span
                      style={{
                        ...styles.historyItemIcon,
                        ...(activeChatId === chat.id
                          ? styles.activeHistoryItemIcon
                          : {})
                      }}
                    >
                      ◇
                    </span>

                    <span style={styles.historyItemContent}>
                      {editChatId === chat.id ? (
                        <span style={styles.renameArea}>
                          <input
                            type="text"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="Conversation title"
                            style={styles.renameInput}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRenameChat(chat.id);
                            }}
                            style={styles.renameSaveButton}
                          >
                            Save
                          </button>
                        </span>
                      ) : (
                        <span style={styles.historyItemTitle}>
                          {chat.title ||
                            chat.messages[0]?.text?.slice(0, 30) ||
                            'New Chat'}
                        </span>
                      )}
                    </span>
                  </div>

                  <div
                    style={styles.dropdownWrapper}
                    ref={(el) => (dropdownRefs.current[chat.id] = el)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() =>
                        setOpenDropdownId(
                          openDropdownId === chat.id
                            ? null
                            : chat.id
                        )
                      }
                      style={{
                        ...styles.moreButton,
                        ...(openDropdownId === chat.id
                          ? styles.moreButtonActive
                          : {})
                      }}
                      aria-label="Conversation options"
                    >
                      •••
                    </button>

                    {openDropdownId === chat.id && (
                      <div style={styles.dropdown}>
                        <button
                          onClick={() => {
                            setEditChatId(chat.id);
                            setNewTitle(chat.title || '');
                            setOpenDropdownId(null);
                          }}
                          style={styles.dropdownButton}
                        >
                          <span>✎</span>
                          Edit conversation
                        </button>

                        <button
                          onClick={() => {
                            handleDeleteChat(chat.id);
                            setOpenDropdownId(null);
                          }}
                          style={{
                            ...styles.dropdownButton,
                            ...styles.deleteDropdownButton
                          }}
                        >
                          <span>⌫</span>
                          Delete conversation
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sidebar Footer */}
          <div style={styles.sidebarFooter}>
            <div style={styles.footerDivider}></div>

            <button
              onClick={handleLogout}
              style={styles.logoutButton}
            >
              <span style={styles.logoutIcon}>↪</span>
              <span>Sign out</span>
            </button>

            <div style={styles.sidebarFooterNote}>
              AI assistance for Pakistani law
            </div>
          </div>
        </aside>
      )}

      {/* Main Area */}
      <main style={styles.container}>

        {/* Header */}
        <header style={styles.logoHeader}>

          <div style={styles.headerLeft}>
            {window.innerWidth < 768 && (
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                style={styles.mobileHeaderButton}
              >
                ☰
              </button>
            )}

            <div style={styles.headerIdentity}>
              <div style={styles.headerLogoMark}>
                <img
                  src={`${process.env.PUBLIC_URL}/AI-POWERED LEGAL COUNSELLOR FAVICON.png`}
                  alt=""
                  style={styles.headerLogoImage}
                />
              </div>

              <div>
                <div style={styles.headerTitle}>
                  AI Legal Counsellor
                </div>
                <div style={styles.headerSubtitle}>
                  Pakistan legal assistance
                </div>
              </div>
            </div>
          </div>

          <div style={styles.headerStatus}>
            <span style={styles.statusDot}></span>
            <span>Assistant online</span>
          </div>
        </header>

        {/* Chat */}
        <div style={styles.chatBox}>

          {messages.length === 1 &&
            messages[0].sender === 'bot' && (
              <div style={styles.welcomeArea}>
                <div style={styles.welcomeMark}>
                  <img
                    src={`${process.env.PUBLIC_URL}/AI-POWERED LEGAL COUNSELLOR FAVICON.png`}
                    alt="AI Legal Counsellor"
                    style={styles.welcomeMarkImage}
                  />
                </div>

                <div style={styles.welcomeEyebrow}>
                  AI-POWERED LEGAL ASSISTANCE
                </div>

                <h1 style={styles.welcomeTitle}>
                  How can we help
                  <br />
                  with your legal question?
                </h1>

                <p style={styles.welcomeText}>
                  Ask questions about Pakistani law and receive
                  AI-assisted guidance based on relevant legal
                  frameworks.
                </p>

                <div style={styles.disclaimer}>
                  <span style={styles.disclaimerIcon}>i</span>
                  <span>
                    For informational purposes only. For specific
                    legal matters, consult a qualified lawyer.
                  </span>
                </div>
              </div>
            )}

          {messages.map((msg, index) => {

            if (
              messages.length === 1 &&
              index === 0 &&
              msg.sender === 'bot'
            ) {
              return null;
            }

            return (
              <div
                key={index}
                style={{
                  ...styles.messageRow,
                  justifyContent:
                    msg.sender === 'user'
                      ? 'flex-end'
                      : 'flex-start'
                }}
              >
                {msg.sender === 'bot' && (
                  <div style={styles.messageAvatar}>
                    <img
                      src={`${process.env.PUBLIC_URL}/AI-POWERED LEGAL COUNSELLOR FAVICON.png`}
                      alt="AI"
                      style={styles.messageAvatarImage}
                    />
                  </div>
                )}

                <div
                  style={{
                    ...styles.message,
                    ...(msg.sender === 'user'
                      ? styles.userMessage
                      : styles.botMessage)
                  }}
                >
                  {msg.sender === 'bot' ? (
                    <ReactMarkdown>
                      {msg.text}
                    </ReactMarkdown>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            );
          })}

          {typingMessage && (
            <div style={styles.messageRow}>
              <div style={styles.messageAvatar}>
                <img
                  src={`${process.env.PUBLIC_URL}/AI-POWERED LEGAL COUNSELLOR FAVICON.png`}
                  alt="AI"
                  style={styles.messageAvatarImage}
                />
              </div>

              <div
                style={{
                  ...styles.message,
                  ...styles.botMessage
                }}
              >
                <ReactMarkdown>
                  {typingMessage}
                </ReactMarkdown>

                <span style={styles.typingCursor}></span>
              </div>
            </div>
          )}

        </div>

        {/* Composer */}
        <div style={styles.inputArea}>
          <div style={styles.composerWrapper}>

            <div style={styles.composerHint}>
              <span style={styles.composerHintIcon}>⚖</span>
              <span>
                Ask about Pakistani law
              </span>
            </div>

            <div style={styles.composer}>
              <input
                style={styles.input}
                type="text"
                placeholder="Describe your legal question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />

              <button
                style={{
                  ...styles.sendButton,
                  ...(input.trim()
                    ? styles.sendButtonActive
                    : styles.sendButtonDisabled)
                }}
                onClick={handleSend}
                disabled={!input.trim()}
                aria-label="Send message"
              >
                ↑
              </button>
            </div>

            <div style={styles.composerDisclaimer}>
              AI responses may not constitute legal advice.
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

const colors = {
  navy: '#0B172A',
  navyLight: '#12233D',
  gold: '#B8924A',
  goldLight: '#D0AE6B',
  ivory: '#F7F5F0',
  paper: '#FCFBF8',
  border: '#E6E0D5',
  text: '#172033',
  muted: '#6D7480',
  soft: '#F0ECE4',
  white: '#FFFFFF'
};

const styles = {

  layout: {
    display: 'flex',
    height: '100vh',
    width: '100%',
    overflow: 'hidden',
    fontFamily: "'Saira', 'Segoe UI', sans-serif",
    background: colors.paper,
    color: colors.text
  },

  /* =========================
     SIDEBAR
  ========================= */

  sidebar: {
    width: '280px',
    minWidth: '280px',
    height: '100vh',
    boxSizing: 'border-box',
    background: colors.navy,
    color: colors.white,
    display: 'flex',
    flexDirection: 'column',
    padding: '22px 16px 16px',
    position: 'relative',
    zIndex: 20,
    borderRight: '1px solid rgba(255,255,255,0.06)'
  },

  sidebarBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '11px',
    padding: '4px 8px 22px'
  },

  brandMark: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },

  brandMarkImage: {
    width: '28px',
    height: '28px',
    objectFit: 'contain'
  },

  brandTitle: {
    fontFamily: "'Jost', sans-serif",
    fontSize: '15px',
    fontWeight: '700',
    letterSpacing: '-0.2px',
    color: '#FFFFFF'
  },

  brandSubtitle: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.52)',
    marginTop: '2px'
  },

  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '11px',
    marginBottom: '14px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.055)',
    border: '1px solid rgba(255,255,255,0.07)'
  },

  userAvatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    background: '#C7A66A',
    color: colors.navy,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Jost', sans-serif",
    fontWeight: '700',
    fontSize: '14px',
    flexShrink: 0
  },

  userInfo: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column'
  },

  userLabel: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    color: 'rgba(255,255,255,0.42)',
    marginBottom: '2px'
  },

  userEmail: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.8)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },

  newChatButton: {
    width: '100%',
    minHeight: '46px',
    borderRadius: '10px',
    border: '1px solid rgba(208,174,107,0.55)',
    background: 'rgba(184,146,74,0.12)',
    color: '#F1D8A5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '9px',
    fontFamily: "'Jost', sans-serif",
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginBottom: '22px'
  },

  newChatIcon: {
    width: '20px',
    height: '20px',
    borderRadius: '6px',
    border: '1px solid rgba(208,174,107,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    lineHeight: 1
  },

  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 8px 9px',
    fontFamily: "'Jost', sans-serif",
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.9px',
    color: 'rgba(255,255,255,0.42)'
  },

  historyCount: {
    minWidth: '20px',
    height: '20px',
    padding: '0 5px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.07)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    color: 'rgba(255,255,255,0.55)'
  },

  chatHistoryScrollArea: {
    flex: 1,
    overflowY: 'auto',
    minHeight: 0,
    paddingRight: '2px'
  },

  emptyHistory: {
    padding: '30px 14px',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.42)'
  },

  emptyHistoryIcon: {
    fontSize: '27px',
    color: 'rgba(208,174,107,0.65)',
    marginBottom: '8px'
  },

  emptyHistoryTitle: {
    fontFamily: "'Jost', sans-serif",
    fontSize: '12px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.65)',
    marginBottom: '4px'
  },

  emptyHistoryText: {
    fontSize: '11px',
    lineHeight: 1.5
  },

  historyItem: {
    minHeight: '43px',
    boxSizing: 'border-box',
    padding: '7px 8px',
    marginBottom: '3px',
    borderRadius: '9px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: 'rgba(255,255,255,0.67)',
    transition: 'background 0.18s ease, color 0.18s ease',
    position: 'relative'
  },

  activeHistoryItem: {
    background: 'rgba(255,255,255,0.09)',
    color: '#FFFFFF',
    border: '1px solid rgba(208,174,107,0.18)'
  },

  historyItemMain: {
    minWidth: 0,
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '9px'
  },

  historyItemIcon: {
    width: '25px',
    height: '25px',
    borderRadius: '7px',
    background: 'rgba(255,255,255,0.045)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.4)',
    flexShrink: 0
  },

  activeHistoryItemIcon: {
    background: 'rgba(184,146,74,0.16)',
    color: '#D0AE6B'
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
    fontSize: '12px'
  },

  dropdownWrapper: {
    position: 'relative',
    flexShrink: 0
  },

  moreButton: {
    width: '27px',
    height: '27px',
    border: 'none',
    borderRadius: '7px',
    background: 'transparent',
    color: 'rgba(255,255,255,0.38)',
    cursor: 'pointer',
    fontSize: '11px',
    letterSpacing: '1px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  moreButtonActive: {
    background: 'rgba(255,255,255,0.08)',
    color: '#FFFFFF'
  },

  dropdown: {
    position: 'absolute',
    top: '31px',
    right: 0,
    width: '174px',
    padding: '5px',
    background: '#FFFFFF',
    border: `1px solid ${colors.border}`,
    borderRadius: '10px',
    boxShadow: '0 14px 35px rgba(0,0,0,0.18)',
    zIndex: 100
  },

  dropdownButton: {
    width: '100%',
    border: 'none',
    background: 'transparent',
    borderRadius: '7px',
    padding: '9px 10px',
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    textAlign: 'left',
    color: colors.text,
    fontFamily: "'Jost', sans-serif",
    fontSize: '12px',
    cursor: 'pointer'
  },

  deleteDropdownButton: {
    color: '#A43D3D'
  },

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
    borderRadius: '6px',
    border: '1px solid rgba(208,174,107,0.6)',
    background: 'rgba(255,255,255,0.08)',
    color: '#FFFFFF',
    outline: 'none',
    fontFamily: "'Jost', sans-serif",
    fontSize: '11px'
  },

  renameSaveButton: {
    alignSelf: 'flex-start',
    padding: '4px 9px',
    border: 'none',
    borderRadius: '5px',
    background: '#C7A66A',
    color: colors.navy,
    fontFamily: "'Jost', sans-serif",
    fontSize: '10px',
    fontWeight: '700',
    cursor: 'pointer'
  },

  sidebarFooter: {
    marginTop: '12px'
  },

  footerDivider: {
    height: '1px',
    background: 'rgba(255,255,255,0.07)',
    marginBottom: '12px'
  },

  logoutButton: {
    width: '100%',
    minHeight: '42px',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '9px',
    background: 'rgba(255,255,255,0.035)',
    color: 'rgba(255,255,255,0.68)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '9px',
    fontFamily: "'Jost', sans-serif",
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  logoutIcon: {
    fontSize: '16px',
    transform: 'rotate(180deg)'
  },

  sidebarFooterNote: {
    textAlign: 'center',
    marginTop: '9px',
    color: 'rgba(255,255,255,0.25)',
    fontSize: '9px',
    letterSpacing: '0.2px'
  },

  /* =========================
     MAIN AREA
  ========================= */

  container: {
    flex: 1,
    minWidth: 0,
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: colors.paper
  },

  logoHeader: {
    minHeight: '70px',
    boxSizing: 'border-box',
    padding: '0 30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(252,251,248,0.96)',
    borderBottom: `1px solid ${colors.border}`,
    flexShrink: 0
  },

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0
  },

  headerIdentity: {
    display: 'flex',
    alignItems: 'center',
    gap: '11px'
  },

  headerLogoMark: {
    width: '35px',
    height: '35px',
    borderRadius: '9px',
    background: colors.navy,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },

  headerLogoImage: {
    width: '25px',
    height: '25px',
    objectFit: 'contain'
  },

  headerTitle: {
    fontFamily: "'Jost', sans-serif",
    fontWeight: '700',
    fontSize: '14px',
    color: colors.navy,
    letterSpacing: '-0.2px'
  },

  headerSubtitle: {
    marginTop: '1px',
    fontSize: '10px',
    color: colors.muted
  },

  headerStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    color: colors.muted,
    fontSize: '11px',
    whiteSpace: 'nowrap'
  },

  statusDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#4E8B67',
    boxShadow: '0 0 0 3px rgba(78,139,103,0.10)'
  },

  mobileHeaderButton: {
    width: '34px',
    height: '34px',
    marginRight: '9px',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    background: '#FFFFFF',
    color: colors.navy,
    cursor: 'pointer',
    fontSize: '17px'
  },

  chatBox: {
    flex: 1,
    minHeight: 0,
    padding: '36px clamp(18px, 7vw, 100px)',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    background:
      'radial-gradient(circle at 50% 0%, rgba(184,146,74,0.055), transparent 34%), #FCFBF8'
  },

  /* =========================
     WELCOME
  ========================= */

  welcomeArea: {
    width: '100%',
    maxWidth: '700px',
    margin: 'auto',
    textAlign: 'center',
    padding: '30px 10px 45px',
    boxSizing: 'border-box'
  },

  welcomeMark: {
    width: '62px',
    height: '62px',
    margin: '0 auto 18px',
    borderRadius: '17px',
    background: colors.navy,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 25px rgba(11,23,42,0.13)'
  },

  welcomeMarkImage: {
    width: '43px',
    height: '43px',
    objectFit: 'contain'
  },

  welcomeEyebrow: {
    fontFamily: "'Jost', sans-serif",
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '2px',
    color: colors.gold,
    marginBottom: '11px'
  },

  welcomeTitle: {
    margin: 0,
    fontFamily: "'Jost', sans-serif",
    fontSize: 'clamp(28px, 4vw, 43px)',
    lineHeight: 1.1,
    letterSpacing: '-1.4px',
    fontWeight: '700',
    color: colors.navy
  },

  welcomeText: {
    maxWidth: '520px',
    margin: '17px auto 0',
    fontSize: '14px',
    lineHeight: 1.7,
    color: colors.muted
  },

  disclaimer: {
    maxWidth: '520px',
    margin: '22px auto 0',
    padding: '10px 13px',
    boxSizing: 'border-box',
    border: `1px solid ${colors.border}`,
    borderRadius: '9px',
    background: 'rgba(255,255,255,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: '#7B7B78',
    fontSize: '10px',
    lineHeight: 1.45
  },

  disclaimerIcon: {
    width: '17px',
    height: '17px',
    borderRadius: '50%',
    border: `1px solid ${colors.gold}`,
    color: colors.gold,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontFamily: "'Jost', sans-serif",
    fontSize: '10px',
    fontWeight: '700'
  },

  /* =========================
     MESSAGES
  ========================= */

  messageRow: {
    width: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px'
  },

  messageAvatar: {
    width: '30px',
    height: '30px',
    borderRadius: '9px',
    background: colors.navy,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '2px'
  },

  messageAvatarImage: {
    width: '21px',
    height: '21px',
    objectFit: 'contain'
  },

  message: {
    maxWidth: 'min(760px, 78%)',
    padding: '13px 17px',
    borderRadius: '13px',
    wordBreak: 'break-word',
    fontSize: '14px',
    lineHeight: 1.7
  },

  userMessage: {
    background: colors.navy,
    color: '#FFFFFF',
    borderBottomRightRadius: '4px',
    boxShadow: '0 5px 16px rgba(11,23,42,0.10)'
  },

  botMessage: {
    background: '#FFFFFF',
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderBottomLeftRadius: '4px',
    boxShadow: '0 4px 15px rgba(20,28,40,0.035)'
  },

  typingCursor: {
    display: 'inline-block',
    width: '5px',
    height: '16px',
    background: colors.gold,
    marginLeft: '3px',
    verticalAlign: 'middle',
    animation: 'blink 0.8s infinite'
  },

  /* =========================
     COMPOSER
  ========================= */

  inputArea: {
    padding: '12px clamp(18px, 7vw, 100px) 17px',
    background: colors.paper,
    flexShrink: 0
  },

  composerWrapper: {
    width: '100%',
    maxWidth: '900px',
    margin: '0 auto'
  },

  composerHint: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#8B8E94',
    fontSize: '10px',
    marginBottom: '6px',
    paddingLeft: '4px'
  },

  composerHintIcon: {
    color: colors.gold,
    fontSize: '12px'
  },

  composer: {
    minHeight: '54px',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    padding: '6px 7px 6px 16px',
    background: '#FFFFFF',
    border: `1px solid #DAD4C9`,
    borderRadius: '15px',
    boxShadow: '0 7px 25px rgba(20,28,40,0.055)',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
  },

  input: {
    flex: 1,
    minWidth: 0,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: colors.text,
    fontFamily: "'Saira', sans-serif",
    fontSize: '14px',
    padding: '10px 4px'
  },

  sendButton: {
    width: '40px',
    height: '40px',
    borderRadius: '11px',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Jost', sans-serif",
    fontSize: '22px',
    lineHeight: 1,
    transition: 'all 0.2s ease'
  },

  sendButtonActive: {
    background: colors.navy,
    color: '#FFFFFF',
    cursor: 'pointer',
    boxShadow: '0 5px 13px rgba(11,23,42,0.15)'
  },

  sendButtonDisabled: {
    background: '#ECE9E3',
    color: '#A7A49E',
    cursor: 'not-allowed'
  },

  composerDisclaimer: {
    textAlign: 'center',
    marginTop: '7px',
    color: '#A1A09B',
    fontSize: '9px'
  },

  /* =========================
     LOGIN REQUIRED
  ========================= */

  loginRequired: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: colors.paper,
    fontFamily: "'Saira', sans-serif",
    padding: '20px',
    boxSizing: 'border-box'
  },

  loginRequiredCard: {
    width: '100%',
    maxWidth: '390px',
    padding: '38px',
    boxSizing: 'border-box',
    textAlign: 'center',
    background: '#FFFFFF',
    border: `1px solid ${colors.border}`,
    borderRadius: '18px',
    boxShadow: '0 20px 55px rgba(11,23,42,0.08)'
  },

  loginRequiredIcon: {
    width: '54px',
    height: '54px',
    margin: '0 auto 15px',
    borderRadius: '15px',
    background: colors.navy,
    color: colors.goldLight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '25px'
  },

  loginRequiredTitle: {
    margin: '0 0 8px',
    fontFamily: "'Jost', sans-serif",
    color: colors.navy,
    fontSize: '21px'
  },

  loginRequiredText: {
    margin: 0,
    color: colors.muted,
    fontSize: '13px'
  },

  /* =========================
     MOBILE
  ========================= */

  hamburger: {
    position: 'fixed',
    top: '15px',
    left: '15px',
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: colors.navy,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    cursor: 'pointer',
    zIndex: 100
  }
};

if (typeof document !== 'undefined') {
  const styleId = 'premium-legal-chatbot-animations';

  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');

    style.id = styleId;

    style.innerHTML = `
      @keyframes blink {
        0%, 45% { opacity: 1; }
        46%, 100% { opacity: 0; }
      }

      * {
        box-sizing: border-box;
      }

      ::selection {
        background: rgba(184, 146, 74, 0.22);
      }

      ::-webkit-scrollbar {
        width: 7px;
        height: 7px;
      }

      ::-webkit-scrollbar-track {
        background: transparent;
      }

      ::-webkit-scrollbar-thumb {
        background: rgba(11, 23, 42, 0.16);
        border-radius: 10px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: rgba(11, 23, 42, 0.25);
      }

      input::placeholder {
        color: #A5A39D;
      }

      button {
        -webkit-tap-highlight-color: transparent;
      }

      @media (max-width: 767px) {
        .premium-legal-mobile-sidebar {
          width: 285px !important;
        }
      }
    `;

    document.head.appendChild(style);
  }
}

export default Chatbot;