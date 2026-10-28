import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { api, getImageUrl } from '../utils/api';
import {
  MessageSquare,
  Users,
  Send,
  Search,
  Sparkles,
  Smile,
  Shield,
  CheckCheck,
} from 'lucide-react';

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '💡', '🚀', '👏'];

export const Chat = () => {
  const { user } = useAuth();
  const { socket, isUserOnline, decrementUnread } = useSocket();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  // Active channel: { type: 'dm' | 'community', id: string, name: string, avatar: string, is_online?: boolean }
  const [activeChannel, setActiveChannel] = useState(null);

  // Lists
  const [conversations, setConversations] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [activeTab, setActiveTab] = useState('dms'); // 'dms' | 'communities'
  const [search, setSearch] = useState('');

  // Messages
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');

  // Typing indicator state
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isPeerTyping]);

  // Load conversations and communities lists
  const loadSidebarLists = async () => {
    try {
      const [convRes, commRes] = await Promise.all([
        api.get('/chat/conversations'),
        api.get('/communities'),
      ]);
      setConversations(convRes.conversations || []);
      const userComm = (commRes.communities || []).filter((c) => c.is_member);
      setCommunities(userComm);
    } catch (err) {
      console.warn('Failed to load chat lists:', err.message);
    }
  };

  useEffect(() => {
    loadSidebarLists();
  }, []);

  // Handle query params on initial load
  useEffect(() => {
    const targetUserId = searchParams.get('user');
    const targetCommId = searchParams.get('community');

    if (targetUserId) {
      api.get(`/users/${targetUserId}`).then((res) => {
        setActiveChannel({
          type: 'dm',
          id: res.user.id,
          name: res.user.name,
          avatar: res.user.avatar_url,
          is_online: res.user.is_online,
        });
        setActiveTab('dms');
      }).catch(() => {});
    } else if (targetCommId) {
      api.get(`/communities/${targetCommId}`).then((res) => {
        setActiveChannel({
          type: 'community',
          id: res.community.id,
          name: res.community.name,
          avatar: res.community.avatar_url,
        });
        setActiveTab('communities');
      }).catch(() => {});
    }
  }, [searchParams]);

  // Fetch messages whenever active channel changes
  useEffect(() => {
    if (!activeChannel) return;

    setIsPeerTyping(false);
    const fetchHistory = async () => {
      setLoadingMessages(true);
      try {
        if (activeChannel.type === 'dm') {
          const res = await api.get(`/chat/messages/${activeChannel.id}`);
          setMessages(res.messages || []);
          decrementUnread();
        } else {
          const res = await api.get(`/chat/community/${activeChannel.id}`);
          setMessages(res.messages || []);
        }
      } catch (err) {
        showToast(err.message || 'Failed to load messages', 'error');
      } finally {
        setLoadingMessages(false);
        setTimeout(() => scrollToBottom(false), 50);
      }
    };

    fetchHistory();
  }, [activeChannel]);

  // Listen to incoming socket messages & typing indicators
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (
        activeChannel?.type === 'dm' &&
        ((msg.sender_id === activeChannel.id && msg.receiver_id === user.id) ||
         (msg.sender_id === user.id && msg.receiver_id === activeChannel.id))
      ) {
        setMessages((prev) => [...prev, msg]);
        setIsPeerTyping(false);
      }
      loadSidebarLists();
    };

    const handleCommunityMessage = (msg) => {
      if (activeChannel?.type === 'community' && msg.community_id === activeChannel.id) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const handleTypingStart = ({ userId }) => {
      if (activeChannel?.type === 'dm' && activeChannel.id === userId) {
        setIsPeerTyping(true);
      }
    };

    const handleTypingStop = ({ userId }) => {
      if (activeChannel?.type === 'dm' && activeChannel.id === userId) {
        setIsPeerTyping(false);
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('community:message', handleCommunityMessage);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('community:message', handleCommunityMessage);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [socket, activeChannel, user]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (socket && activeChannel?.type === 'dm') {
      socket.emit('typing:start', { receiverId: activeChannel.id });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing:stop', { receiverId: activeChannel.id });
      }, 1500);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChannel || !socket) return;

    const text = inputText.trim();
    setInputText('');

    if (socket && activeChannel.type === 'dm') {
      socket.emit('typing:stop', { receiverId: activeChannel.id });
      socket.emit('message:send', {
        receiverId: activeChannel.id,
        content: text,
      });
    } else if (socket) {
      socket.emit('community:message', {
        communityId: activeChannel.id,
        content: text,
      });
    }
  };

  const handleSendEmoji = (emoji) => {
    if (!activeChannel || !socket) return;
    if (activeChannel.type === 'dm') {
      socket.emit('message:send', {
        receiverId: activeChannel.id,
        content: emoji,
      });
    } else {
      socket.emit('community:message', {
        communityId: activeChannel.id,
        content: emoji,
      });
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCommunities = communities.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '16px',
        height: 'calc(100vh - 84px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        className="glass-panel"
        style={{
          flex: 1,
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          overflow: 'hidden',
          transition: 'all var(--transition-normal)',
        }}
      >
        {/* Left Pane: Channels and Conversations List */}
        <div
          style={{
            width: '320px',
            flexShrink: 0,
            borderRight: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          {/* Header & Tabs */}
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px' }}>
              Messages & Chat
            </h2>

            {/* Tab switch */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                backgroundColor: 'var(--bg-surface-hover)',
                borderRadius: 'var(--radius-md)',
                padding: '3px',
                marginBottom: '12px',
              }}
            >
              <button
                onClick={() => setActiveTab('dms')}
                style={{
                  padding: '8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  fontWeight: activeTab === 'dms' ? 700 : 500,
                  backgroundColor: activeTab === 'dms' ? 'var(--bg-surface)' : 'transparent',
                  color: activeTab === 'dms' ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: activeTab === 'dms' ? 'var(--shadow-xs)' : 'none',
                  transition: 'all var(--transition-fast)',
                }}
              >
                Direct Messages
              </button>
              <button
                onClick={() => setActiveTab('communities')}
                style={{
                  padding: '8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  fontWeight: activeTab === 'communities' ? 700 : 500,
                  backgroundColor: activeTab === 'communities' ? 'var(--bg-surface)' : 'transparent',
                  color: activeTab === 'communities' ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: activeTab === 'communities' ? 'var(--shadow-xs)' : 'none',
                  transition: 'all var(--transition-fast)',
                }}
              >
                My Communities
              </button>
            </div>

            {/* Search filter */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chats..."
                style={{ width: '100%', padding: '7px 12px 7px 32px', fontSize: '0.85rem' }}
              />
              <Search
                size={15}
                color="var(--text-light)"
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          {/* List items */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {activeTab === 'dms' ? (
              filteredConversations.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No conversations yet. Visit a student's profile to start chatting!
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isActive = activeChannel?.type === 'dm' && activeChannel.id === conv.user_id;
                  const isOnline = isUserOnline(conv.user_id) || conv.is_online;

                  return (
                    <div
                      key={conv.user_id}
                      onClick={() =>
                        setActiveChannel({
                          type: 'dm',
                          id: conv.user_id,
                          name: conv.name,
                          avatar: conv.avatar_url,
                          is_online: isOnline,
                        })
                      }
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        cursor: 'pointer',
                        backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                        borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                        transition: 'all 0.18s ease-in-out',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div style={{ position: 'relative' }}>
                        {conv.avatar_url ? (
                          <img src={getImageUrl(conv.avatar_url)} alt={conv.name} className="avatar avatar-md" />
                        ) : (
                          <div className="avatar avatar-md">{conv.name?.charAt(0).toUpperCase()}</div>
                        )}
                        {isOnline && (
                          <div
                            className="online-dot online-pulse-ring"
                            style={{ position: 'absolute', bottom: '0px', right: '0px' }}
                          />
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {conv.name}
                          </span>
                          {conv.unread_count > 0 && (
                            <span
                              style={{
                                backgroundColor: 'var(--primary)',
                                color: 'white',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                borderRadius: 'var(--radius-full)',
                                padding: '2px 7px',
                                animation: 'pulseGlow 2s infinite',
                              }}
                            >
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                          {conv.last_message || 'Start conversation'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )
            ) : filteredCommunities.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                You haven't joined any communities yet. Join one to participate in group discussions!
              </div>
            ) : (
              filteredCommunities.map((comm) => {
                const isActive = activeChannel?.type === 'community' && activeChannel.id === comm.id;

                return (
                  <div
                    key={comm.id}
                    onClick={() =>
                      setActiveChannel({
                        type: 'community',
                        id: comm.id,
                        name: comm.name,
                        avatar: comm.avatar_url,
                      })
                    }
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                      transition: 'all 0.18s ease-in-out',
                    }}
                  >
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: 'var(--radius-md)',
                        background: 'linear-gradient(135deg, var(--secondary) 0%, #3b82f6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 700,
                        boxShadow: '0 2px 8px rgba(6, 182, 212, 0.25)',
                      }}
                    >
                      <Users size={18} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {comm.name}
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {comm.member_count} members • Group Chat
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Chat Window */}
        {activeChannel ? (
          <div
            key={activeChannel.id}
            className="chat-channel-active"
            style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)' }}
          >
            {/* Header */}
            <div
              style={{
                height: '66px',
                padding: '0 24px',
                borderBottom: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ position: 'relative' }}>
                  {activeChannel.avatar ? (
                    <img src={getImageUrl(activeChannel.avatar)} alt={activeChannel.name} className="avatar avatar-sm" />
                  ) : (
                    <div className="avatar avatar-sm">{activeChannel.name?.charAt(0).toUpperCase()}</div>
                  )}
                  {activeChannel.type === 'dm' && (isUserOnline(activeChannel.id) || activeChannel.is_online) && (
                    <div
                      className="online-dot online-pulse-ring"
                      style={{ position: 'absolute', bottom: '-2px', right: '-2px' }}
                    />
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{activeChannel.name}</h3>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {activeChannel.type === 'dm' ? (
                      isUserOnline(activeChannel.id) || activeChannel.is_online ? (
                        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Active Now</span>
                      ) : (
                        <span>Offline</span>
                      )
                    ) : (
                      <span>Community Group Chat • Real-time</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Emojis Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleSendEmoji(emoji)}
                    className="btn-ghost"
                    style={{
                      fontSize: '1.05rem',
                      padding: '4px 6px',
                      borderRadius: 'var(--radius-sm)',
                      transition: 'transform 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.25)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    title={`Send ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages Thread */}
            <div
              ref={messagesContainerRef}
              className="chat-messages-container"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              {loadingMessages ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span style={{ fontSize: '0.88rem', marginLeft: '6px' }}>Loading conversation...</span>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '48px', animation: 'channelFadeIn 0.3s ease-out' }}>
                  <Sparkles size={36} color="var(--primary)" style={{ margin: '0 auto 12px auto' }} />
                  <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                    Beginning of conversation with {activeChannel.name}
                  </p>
                  <p style={{ fontSize: '0.86rem', marginTop: '4px' }}>
                    Say hello or ask a question to start chatting!
                  </p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMine = m.sender_id === user.id;

                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMine ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {!isMine && activeChannel.type === 'community' && (
                        <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px', marginLeft: '6px' }}>
                          {m.sender_name || 'Member'}
                        </span>
                      )}

                      <div
                        className={isMine ? 'chat-bubble-mine' : 'chat-bubble-theirs'}
                        style={{
                          maxWidth: '72%',
                          padding: '11px 18px',
                          borderRadius: isMine
                            ? '18px 18px 4px 18px'
                            : '18px 18px 18px 4px',
                          background: isMine
                            ? 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)'
                            : 'var(--bg-surface)',
                          color: isMine ? '#ffffff' : 'var(--text-main)',
                          boxShadow: isMine
                            ? '0 4px 12px rgba(var(--primary-rgb), 0.2)'
                            : 'var(--shadow-sm)',
                          border: isMine ? 'none' : '1px solid var(--border-subtle)',
                          fontSize: '0.94rem',
                          lineHeight: 1.55,
                          wordBreak: 'break-word',
                          position: 'relative',
                        }}
                      >
                        {m.content}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.68rem',
                          color: 'var(--text-light)',
                          marginTop: '4px',
                          padding: '0 6px',
                        }}
                      >
                        <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMine && <CheckCheck size={13} color="var(--primary)" />}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Animated Typing Indicator */}
              {isPeerTyping && (
                <div
                  className="chat-bubble-theirs"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '10px 16px',
                    borderRadius: '16px 16px 16px 4px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: 'var(--shadow-xs)',
                    width: 'fit-content',
                  }}
                >
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginRight: '6px' }}>
                    {activeChannel.name} is typing
                  </span>
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSendMessage}
              style={{
                padding: '16px 24px',
                backgroundColor: 'var(--bg-surface)',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
              }}
            >
              <input
                type="text"
                className="chat-input-focus"
                value={inputText}
                onChange={handleInputChange}
                placeholder={`Message ${activeChannel.name}...`}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.94rem',
                  transition: 'all var(--transition-fast)',
                }}
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="btn btn-primary"
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: 'var(--radius-full)',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  flexShrink: 0,
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--bg-app)',
              padding: '20px',
              textAlign: 'center',
              animation: 'channelFadeIn 0.3s ease-out',
            }}
          >
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '18px',
                boxShadow: '0 8px 20px rgba(var(--primary-rgb), 0.15)',
              }}
            >
              <MessageSquare size={38} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px' }}>
              Your Campus Messages
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '360px', lineHeight: 1.6 }}>
              Select a direct message conversation from the sidebar or jump into a community group channel.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
