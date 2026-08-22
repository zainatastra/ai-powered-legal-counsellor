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
  const dropdownRefs = useRef({}); // ✅ Correct useRef syntax

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
    setChatHistoryList(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
    // Update existing chat
    const chatRef = doc(db, 'chatHistory', activeChatId);
    await updateDoc(chatRef, {
      messages: newMessages,
      createdAt: serverTimestamp()
    });
  } else {
    // Create new chat
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
    const chatRef = doc(db, 'chatHistory', chatId);
    await updateDoc(chatRef, { title: newTitle });
    setEditChatId(null);
    setNewTitle('');
    await fetchChatHistoryList(userId);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessage = { sender: 'user', text: input };
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
              content: 'You are an AI-powered legal advisor with expertise in Pakistan Penal Code 1860, Constitution of Pakistan 1973, PECA Act (Cybercrime Laws), Family & Inheritance Laws. Refer to exact sections or articles when possible. Avoid making up laws. If unsure, say "Please consult a qualified lawyer." Do not give any answer to a prompt other than legal query or Pakistan laws.'
            },
            { role: 'user', content: input }
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
          setTypingMessage((prev) => prev + botText[currentIndex]);
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
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Sorry, something went wrong.' }]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  if (!userId) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'Saira' }}>
        <h2>Please log in to use the chatbot.</h2>
      </div>
    );
  }

  return (
    <div style={styles.layout}>
      {/* Hamburger Menu (Mobile Only) */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        style={{
          ...styles.hamburger,
          display: window.innerWidth < 768 ? 'block' : 'none'
        }}
      >
        ☰
      </button>

      {/* Sidebar */}
      {isSidebarOpen && (
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <p>Logged in as: {userEmail}</p>
          </div>
          <button onClick={handleNewChat} style={styles.newChatButton}>
            <img
              src={`${process.env.PUBLIC_URL}/AI-POWERED LEGAL COUNSELLOR FAVICON.png`}
  alt="Favicon"
              style={{ width: '18px', height: '18px', marginRight: '8px', verticalAlign: 'middle' }}
            />
            New Chat
          </button>
          <h3 style={styles.historyTitle}>Chat History</h3>
          <div style={styles.chatHistoryScrollArea}>
            {chatHistoryList.map((chat) => (
              <div
                key={chat.id}
                onClick={() => loadChatById(chat.id)}
                style={{
                  ...styles.historyItem,
                  backgroundColor: activeChatId === chat.id ? '#d1e7fd' : 'transparent'
                }}
              >
                <span>
                  {editChatId === chat.id ? (
                    <>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Enter new title"
                        style={{ marginRight: '5px' }}
                      />
                      <button onClick={() => handleRenameChat(chat.id)}>Save</button>
                    </>
                  ) : (
                    chat.title || chat.messages[0]?.text?.slice(0, 30) || 'New Chat'
                  )}
                </span>
                <div
                  style={{ position: 'relative' }}
                  ref={(el) => (dropdownRefs.current[chat.id] = el)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() =>
                      setOpenDropdownId(openDropdownId === chat.id ? null : chat.id)
                    }
                    style={{
                      background: 'transparent',
                      border: 'none',
                      fontSize: '20px',
                      cursor: 'pointer',
                      color: 'black',
                      fontWeight: 'bold'
                    }}
                  >
                    ⋯
                  </button>
                  {openDropdownId === chat.id && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '28px',
                        right: '0',
                        backgroundColor: '#fff',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        zIndex: 10,
                        width: '160px'
                      }}
                    >
                      <button
                        onClick={() => {
                          setEditChatId(chat.id);
                          setNewTitle(chat.title || '');
                          setOpenDropdownId(null);
                        }}
                        style={{
                          display: 'block',
                          padding: '12px 16px',
                          width: '100%',
                          background: 'transparent',
                          border: 'none',
                          textAlign: 'left',
                          cursor: 'pointer'
                        }}
                      >
                        Edit Chat
                      </button>
                      <button
                        onClick={() => {
                          handleDeleteChat(chat.id);
                          setOpenDropdownId(null);
                        }}
                        style={{
                          display: 'block',
                          padding: '12px 16px',
                          width: '100%',
                          background: 'transparent',
                          border: 'none',
                          textAlign: 'left',
                          color: 'red',
                          cursor: 'pointer'
                        }}
                      >
                        Delete Chat
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={styles.logoutWrapper}>
            <div style={styles.logoutGlow}></div>
            <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div style={styles.container}>
        <div style={styles.logoHeader}>
          <img
            src={`${process.env.PUBLIC_URL}/AI-POWERED LEGAL COUNSELLOR.png`}
  alt="AI-Powered Legal Counsellor Logo"
            style={{ maxWidth: '280px', height: 'auto', margin: '10px auto' }}
          />
        </div>
        <div style={styles.chatBox}>
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                ...styles.message,
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                ...(msg.sender === 'user' ? styles.userMessage : styles.botMessage)
              }}
            >
              {msg.sender === 'bot' ? <ReactMarkdown>{msg.text}</ReactMarkdown> : msg.text}
            </div>
          ))}
          {typingMessage && (
            <div
              style={{
                ...styles.message,
                alignSelf: 'flex-start',
                ...styles.botMessage,
                fontStyle: 'italic'
              }}
            >
              <ReactMarkdown>{typingMessage}</ReactMarkdown>
            </div>
          )}
        </div>
        <div style={styles.inputArea}>
          <input
            style={styles.input}
            type="text"
            placeholder="Ask anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            style={{
              ...styles.sendButton,
              opacity: input.trim() ? '1' : '0.4',
              cursor: input.trim() ? 'pointer' : 'not-allowed'
            }}
            onClick={handleSend}
            disabled={!input.trim()}
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  layout: {
    display: 'flex',
    height: '100vh',
    fontFamily: 'Saira'
  },
  sidebar: {
    width: '250px',
    backgroundColor: '#e4e2dc',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column'
  },
  sidebarHeader: {
    marginBottom: '10px',
    color: 'black',
    fontWeight: 'bold'
  },
  chatHistoryScrollArea: {
    flex: 1,
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 280px)', // prevents overflow beyond Logout button
    marginBottom: '10px'
  },
  logoutContainer: {
    paddingTop: '10px'
  },
  logoutWrapper: {
    position: 'relative',
    width: '100%',
    height: '50px'
  },
  logoutGlow: {
    position: 'absolute',
    top: '-8px',
    left: '-5px',
    right: '-5px',
    bottom: '-1px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #0f5fe8, #4a00e0, #f46b45)',
    filter: 'blur(4px)',
    zIndex: 0,
    opacity: 0.4,
    animation: 'glow 2s ease infinite',
    backgroundSize: '300% 300%'
  },
  logoutButton: {
    position: 'relative',
    background: '#000',
    color: '#fff',
    fontFamily: 'Jost',
    fontWeight: 'bold',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%',
    zIndex: 1,
    overflow: 'hidden'
  },
  newChatButton: {
    padding: '10px 20px',
    marginBottom: '10px',
    backgroundColor: '#fff',
    color: '#6C4AB6',
    border: 'none',
    fontFamily: 'Jost',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  historyTitle: {
    backgroundColor: '#e4e2dc',
    borderRadius: '50px',
    padding: '10px 15px',
    marginBottom: '10px',
    textAlign: 'center',
    fontWeight: 'bold',
    color: 'black',
    boxShadow: '9px 9px 16px #c8c8c8, -9px -9px 16px #ffffff'
  },
  historyItem: {
    padding: '8px',
    cursor: 'pointer',
    borderBottom: '1px solid #ccc',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: 'black',
    fontWeight: 'bold'
  },
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#eee'
  },
  logoHeader: {
    textAlign: 'center',
    padding: '10px',
    backgroundColor: '#ffffff33',
    borderBottom: '1px solid #ccc'
  },
  chatBox: {
    flex: 1,
    padding: '10px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  message: {
    maxWidth: '70%',
    padding: '12px 20px',
    borderRadius: '15px',
    wordBreak: 'break-word',
    boxShadow: '9px 9px 16px #d1d9e6, -9px -9px 16px #ffffff'
  },
  userMessage: {
    backgroundColor: '#e0f5e9',
    boxShadow: 'inset 6px 6px 12px #c8d9ce, inset -6px -6px 12px #f8fff9'
  },
  botMessage: {
    backgroundColor: '#e0ecf5',
    boxShadow: 'inset 6px 6px 12px #c2cfd9, inset -6px -6px 12px #f8fbff'
  },
  inputArea: {
    display: 'flex',
    padding: '15px',
    borderTop: '1px solid #ccc',
    backgroundColor: '#eeeeee',
    justifyContent: 'center',
    alignItems: 'center'
  },
  input: {
    flex: 1,
    padding: '14px 20px',
    fontSize: '16px',
    border: '1px solid #333',
    borderRadius: '20px',
    backgroundColor: '#eeee',
    color: 'black',
    fontFamily: 'Saira',
    outline: 'none',
    marginRight: '10px'
  },
  sendButton: {
    backgroundColor: '#6C4AB6',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    fontSize: '20px',
    lineHeight: '40px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'opacity 0.3s ease'
  }
};

export default Chatbot;