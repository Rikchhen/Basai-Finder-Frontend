import { Check, CheckCheck, MessageCircle, Send, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Card } from '../components/ui/Card.jsx';
import { UserAvatar } from '../components/ui/UserAvatar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { conversationsApi, ApiError } from '../lib/api.js';

function otherParticipant(conversation, userId) {
  return conversation.participants?.find((p) => p._id !== userId) || conversation.participants?.[0];
}

export function MessagesPage({ conversationId }) {
  const { user } = useAuth();
  const { socket, clearUnread, onlineUsers } = useSocket();
  const toast = useToast();
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(conversationId || null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [typingByConversation, setTypingByConversation] = useState({});
  const [otherReadAt, setOtherReadAt] = useState(null);
  const [messagesMeta, setMessagesMeta] = useState({ page: 1, totalPages: 1 });
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const threadEndRef = useRef(null);
  const skipScrollRef = useRef(false);
  const selectedIdRef = useRef(selectedId);
  const typingStopTimer = useRef(null);
  const isEmittingTyping = useRef(false);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    clearUnread();
    conversationsApi
      .list()
      .then((data) => {
        setConversations(data.conversations);
        if (!selectedId && data.conversations.length) {
          setSelectedId(data.conversations[0]._id);
        }
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load conversations.'))
      .finally(() => setLoadingConversations(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (conversationId) setSelectedId(conversationId);
  }, [conversationId]);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingMessages(true);
    setOtherReadAt(null);
    setConfirmDelete(false);
    conversationsApi
      .getMessages(selectedId)
      .then((data) => {
        setMessages(data.messages);
        setMessagesMeta(data.meta || { page: 1, totalPages: 1 });
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load messages.'))
      .finally(() => setLoadingMessages(false));
    conversationsApi.markRead(selectedId).catch(() => {});
    clearUnread();
    // Opening a thread clears its unread badge.
    setConversations((current) =>
      current.map((conversation) =>
        conversation._id === selectedId ? { ...conversation, unreadCount: 0 } : conversation,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    // Prepending older history shouldn't yank the view back to the newest message.
    if (skipScrollRef.current) {
      skipScrollRef.current = false;
      return;
    }
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => () => {
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    const handleNewMessage = (message) => {
      const isOpen = message.conversation === selectedIdRef.current;
      if (isOpen) {
        setMessages((current) => [...current, message]);
        conversationsApi.markRead(selectedIdRef.current).catch(() => {});
        clearUnread();
      }
      // A message ends the sender's "typing" state.
      setTypingByConversation((current) => ({ ...current, [message.conversation]: false }));
      setConversations((current) => {
        const next = current.map((conversation) =>
          conversation._id === message.conversation
            ? {
                ...conversation,
                lastMessage: message.text,
                lastMessageAt: message.createdAt,
                unreadCount: isOpen ? 0 : (conversation.unreadCount || 0) + 1,
              }
            : conversation,
        );
        return next.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
      });
    };

    const handleTyping = ({ conversationId: convId, userId: fromId, isTyping }) => {
      if (fromId === user?.id) return;
      setTypingByConversation((current) => ({ ...current, [convId]: Boolean(isTyping) }));
    };

    const handleRead = ({ conversationId: convId, userId: readerId, readAt }) => {
      if (convId !== selectedIdRef.current || readerId === user?.id) return;
      // Timestamp-based so it's immune to races with the local message append:
      // any of our messages sent at/before readAt count as "Seen".
      const at = readAt || new Date().toISOString();
      setOtherReadAt((prev) => (!prev || new Date(at) > new Date(prev) ? at : prev));
    };

    // A brand-new thread started by someone else should appear without a refresh.
    const handleNewConversation = (conversation) => {
      if (!conversation?._id) return;
      setConversations((current) =>
        current.some((item) => item._id === conversation._id) ? current : [conversation, ...current],
      );
    };

    socket.on('message:new', handleNewMessage);
    socket.on('typing', handleTyping);
    socket.on('conversation:read', handleRead);
    socket.on('conversation:new', handleNewConversation);
    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('typing', handleTyping);
      socket.off('conversation:read', handleRead);
      socket.off('conversation:new', handleNewConversation);
    };
  }, [socket, clearUnread, user?.id]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation._id === selectedId),
    [conversations, selectedId],
  );

  const otherUser = selectedConversation ? otherParticipant(selectedConversation, user?.id) : null;
  const otherId = otherUser?._id;
  const otherIsOnline = otherId ? onlineUsers?.has(otherId) : false;
  const lastOwnMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].sender === user?.id) return messages[i]._id;
    }
    return null;
  }, [messages, user?.id]);

  // Seed "seen" state from persisted readBy when a thread first loads.
  useEffect(() => {
    if (!otherId || messages.length === 0) return;
    let latest = null;
    for (const message of messages) {
      if (message.sender === user?.id && message.readBy?.includes(otherId)) {
        if (!latest || new Date(message.createdAt) > new Date(latest)) latest = message.createdAt;
      }
    }
    if (latest) setOtherReadAt((prev) => (!prev || new Date(latest) > new Date(prev) ? latest : prev));
  }, [messages, otherId, user?.id]);

  // "Delete for me": clears this thread from our own list and history only.
  const handleDelete = async () => {
    if (!selectedId || deleting) return;
    setDeleting(true);
    setError('');
    try {
      await conversationsApi.remove(selectedId);
      const remaining = conversations.filter((item) => item._id !== selectedId);
      setConversations(remaining);
      setMessages([]);
      setConfirmDelete(false);
      setSelectedId(remaining[0]?._id || null);
      toast.info('Chat deleted.');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not delete this chat.';
      setError(message);
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const loadOlder = async () => {
    if (loadingOlder || messagesMeta.page >= messagesMeta.totalPages) return;
    setLoadingOlder(true);
    try {
      const data = await conversationsApi.getMessages(selectedId, { page: messagesMeta.page + 1 });
      // Older page: prepend, keeping chronological order.
      skipScrollRef.current = true;
      setMessages((current) => [...data.messages, ...current]);
      setMessagesMeta(data.meta || messagesMeta);
    } catch {
      // leave the thread as-is on failure
    } finally {
      setLoadingOlder(false);
    }
  };

  const emitTyping = (isTyping) => {
    if (!socket || !selectedId || !otherId) return;
    socket.emit('typing', { conversationId: selectedId, toUserId: otherId, isTyping });
  };

  const handleMessageChange = (event) => {
    setMessageText(event.target.value);
    if (!isEmittingTyping.current) {
      isEmittingTyping.current = true;
      emitTyping(true);
    }
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
    typingStopTimer.current = setTimeout(() => {
      isEmittingTyping.current = false;
      emitTyping(false);
    }, 1800);
  };

  const stopTyping = () => {
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
    if (isEmittingTyping.current) {
      isEmittingTyping.current = false;
      emitTyping(false);
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();
    const text = messageText.trim();
    if (!text || !selectedId || sending) return;

    stopTyping();
    setSending(true);
    setMessageText('');
    try {
      const data = await conversationsApi.sendMessage(selectedId, text);
      setMessages((current) => [...current, data.message]);
      setConversations((current) => {
        const next = current.map((conversation) =>
          conversation._id === selectedId
            ? { ...conversation, lastMessage: text, lastMessageAt: data.message.createdAt }
            : conversation,
        );
        return next.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Page>
      <Header>
        <h1>Messages</h1>
        <p>Chat directly with {user?.role === 'landlord' ? 'tenants' : 'landlords'} about your rooms.</p>
      </Header>

      {error ? <ErrorText role="alert">{error}</ErrorText> : null}

      <Layout>
        <ConversationList>
          {loadingConversations ? (
            <EmptyState>Loading conversations...</EmptyState>
          ) : conversations.length === 0 ? (
            <EmptyState>
              No conversations yet. Start one from a room's Landlord Info tab or a tenant request.
            </EmptyState>
          ) : (
            conversations.map((conversation) => {
              const other = otherParticipant(conversation, user?.id);
              const isTyping = typingByConversation[conversation._id];
              const online = other?._id ? onlineUsers?.has(other._id) : false;
              return (
                <ConversationItem
                  key={conversation._id}
                  type="button"
                  $active={conversation._id === selectedId}
                  onClick={() => setSelectedId(conversation._id)}
                >
                  <AvatarWrap>
                    <UserAvatar user={other} size={40} />
                    {online ? <PresenceDot $size={11} title="Online" /> : null}
                  </AvatarWrap>
                  <ConversationCopy>
                    <strong>{other?.name || 'Unknown user'}</strong>
                    {conversation.listing?.title ? <small>{conversation.listing.title}</small> : null}
                    {isTyping ? (
                      <Typing>typing…</Typing>
                    ) : (
                      <span>{conversation.lastMessage || 'No messages yet'}</span>
                    )}
                  </ConversationCopy>
                  {conversation.unreadCount > 0 && conversation._id !== selectedId ? (
                    <UnreadBadge>{conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}</UnreadBadge>
                  ) : null}
                </ConversationItem>
              );
            })
          )}
        </ConversationList>

        <Thread elevated>
          {!selectedConversation ? (
            <ThreadEmpty>
              <MessageCircle size={32} />
              <p>Select a conversation to see messages.</p>
            </ThreadEmpty>
          ) : (
            <>
              <ThreadHeader>
                <AvatarWrap>
                  <UserAvatar user={otherUser} size={38} />
                  {otherIsOnline ? <PresenceDot $size={11} title="Online" /> : null}
                </AvatarWrap>
                <ThreadHeaderCopy>
                  <strong>{otherUser?.name}</strong>
                  {typingByConversation[selectedId] ? (
                    <Status $accent>typing…</Status>
                  ) : otherIsOnline ? (
                    <Status $accent>Online</Status>
                  ) : selectedConversation.listing?.title ? (
                    <span>{selectedConversation.listing.title}</span>
                  ) : (
                    <Status>Offline</Status>
                  )}
                </ThreadHeaderCopy>

                {confirmDelete ? (
                  <ConfirmRow>
                    <ConfirmText>Delete this chat for you?</ConfirmText>
                    <DangerButton type="button" onClick={handleDelete} disabled={deleting}>
                      {deleting ? 'Deleting...' : 'Delete'}
                    </DangerButton>
                    <QuietButton type="button" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                      Cancel
                    </QuietButton>
                  </ConfirmRow>
                ) : (
                  <DeleteButton
                    type="button"
                    aria-label="Delete this chat"
                    title="Delete this chat"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 size={17} />
                  </DeleteButton>
                )}
              </ThreadHeader>

              <ThreadBody>
                {!loadingMessages && messagesMeta.page < messagesMeta.totalPages ? (
                  <LoadOlderRow>
                    <LoadOlderButton type="button" onClick={loadOlder} disabled={loadingOlder}>
                      {loadingOlder ? 'Loading...' : 'Load older messages'}
                    </LoadOlderButton>
                  </LoadOlderRow>
                ) : null}
                {loadingMessages ? (
                  <EmptyState>Loading messages...</EmptyState>
                ) : (
                  messages.map((message) => {
                    const own = message.sender === user?.id;
                    const isLastOwn = own && message._id === lastOwnMessageId;
                    const seen =
                      isLastOwn && otherReadAt && new Date(message.createdAt) <= new Date(otherReadAt);
                    return (
                      <BubbleRow key={message._id} $own={own}>
                        <Bubble $own={own}>
                          <p>{message.text}</p>
                          <time>
                            {new Date(message.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </time>
                        </Bubble>
                        {isLastOwn ? (
                          <Receipt>
                            {seen ? (
                              <>
                                <CheckCheck size={13} /> Seen
                              </>
                            ) : (
                              <>
                                <Check size={13} /> Sent
                              </>
                            )}
                          </Receipt>
                        ) : null}
                      </BubbleRow>
                    );
                  })
                )}
                {typingByConversation[selectedId] ? (
                  <TypingBubble aria-label={`${otherUser?.name || 'User'} is typing`}>
                    <span />
                    <span />
                    <span />
                  </TypingBubble>
                ) : null}
                <div ref={threadEndRef} />
              </ThreadBody>

              <ThreadForm onSubmit={handleSend}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  aria-label="Message"
                  value={messageText}
                  onChange={handleMessageChange}
                  onBlur={stopTyping}
                />
                <SendButton type="submit" aria-label="Send message" disabled={sending || !messageText.trim()}>
                  <Send size={18} />
                </SendButton>
              </ThreadForm>
            </>
          )}
        </Thread>
      </Layout>
    </Page>
  );
}

const Page = styled.div`
  max-width: 1180px;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing(4)} ${theme.spacing(2)} ${theme.spacing(6)}`};
`;

const Header = styled.header`
  margin-bottom: ${({ theme }) => theme.spacing(2)};

  h1 {
    margin: 0 0 6px;
    color: ${({ theme }) => theme.colors.primary};
    font-size: clamp(1.8rem, 4vw, 2.6rem);
    letter-spacing: 0;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
  }
`;

const ErrorText = styled.p`
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.errorSoft};
  color: ${({ theme }) => theme.colors.error};
  padding: 10px 12px;
  font-weight: 800;
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(2)};
  height: 68vh;
  min-height: 480px;

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
    height: auto;
  }
`;

const ConversationList = styled.div`
  display: grid;
  align-content: start;
  gap: ${({ theme }) => theme.spacing(1)};
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  padding: ${({ theme }) => theme.spacing(1)};
`;

const EmptyState = styled.p`
  padding: ${({ theme }) => theme.spacing(2)};
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  text-align: center;
`;

const ConversationItem = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.25)};
  border: 0;
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ $active, theme }) => ($active ? theme.colors.surfaceContainerLow : 'transparent')};
  padding: ${({ theme }) => theme.spacing(1.25)};
  text-align: left;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceContainerLow};
  }
`;

const ConversationCopy = styled.div`
  display: grid;
  flex: 1;
  min-width: 0;
  gap: 2px;

  strong {
    color: ${({ theme }) => theme.colors.onSurface};
  }

  small {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 800;
  }

  span {
    overflow: hidden;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.86rem;
  }
`;

const Thread = styled(Card)`
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-width: 0;
  padding: 0;
`;

const ThreadEmpty = styled.div`
  display: grid;
  place-items: center;
  gap: 10px;
  height: 100%;
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
`;

const ThreadHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.25)};
  border-bottom: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(2)};
`;

const DeleteButton = styled.button`
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  color: ${({ theme }) => theme.colors.onSurfaceVariant};

  &:hover {
    border-color: ${({ theme }) => theme.colors.error};
    background: rgba(186, 26, 26, 0.08);
    color: ${({ theme }) => theme.colors.error};
  }
`;

const ConfirmRow = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
`;

const ConfirmText = styled.span`
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  font-size: 0.82rem;
  font-weight: 800;

  @media (max-width: 620px) {
    display: none;
  }
`;

const DangerButton = styled.button`
  border: 0;
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.error};
  color: #ffffff;
  padding: 7px 12px;
  font-size: 0.82rem;
  font-weight: 800;

  &:disabled {
    opacity: 0.6;
  }
`;

const QuietButton = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  padding: 7px 12px;
  font-size: 0.82rem;
  font-weight: 800;
`;

const ThreadHeaderCopy = styled.div`
  display: grid;
  flex: 1;
  min-width: 0;
  gap: 2px;

  strong {
    color: ${({ theme }) => theme.colors.onSurface};
  }

  span {
    overflow: hidden;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    font-size: 0.86rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const ThreadBody = styled.div`
  display: grid;
  align-content: start;
  gap: 10px;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing(2)};
`;

const LoadOlderRow = styled.div`
  display: flex;
  justify-content: center;
`;

const LoadOlderButton = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  color: ${({ theme }) => theme.colors.primary};
  padding: 6px 14px;
  font-size: 0.8rem;
  font-weight: 800;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceContainerLow};
  }

  &:disabled {
    opacity: 0.6;
  }
`;

const BubbleRow = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${({ $own }) => ($own ? 'flex-end' : 'flex-start')};
  gap: 3px;
`;

const Bubble = styled.div`
  max-width: 70%;
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ $own, theme }) => ($own ? theme.colors.primary : theme.colors.surfaceContainerLow)};
  color: ${({ $own }) => ($own ? '#ffffff' : 'inherit')};
  padding: 10px 14px;

  p {
    margin: 0;
    line-height: 1.5;
  }

  time {
    display: block;
    margin-top: 4px;
    opacity: 0.75;
    font-size: 0.72rem;
  }
`;

const Receipt = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  font-size: 0.72rem;
  font-weight: 800;

  svg {
    color: ${({ theme }) => theme.colors.secondary};
  }
`;

const bounce = keyframes`
  0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
  30% { transform: translateY(-4px); opacity: 1; }
`;

const TypingBubble = styled.div`
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: fit-content;
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLow};
  padding: 12px 14px;

  span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.onSurfaceVariant};
    animation: ${bounce} 1.2s infinite ease-in-out;
  }

  span:nth-child(2) {
    animation-delay: 0.15s;
  }

  span:nth-child(3) {
    animation-delay: 0.3s;
  }
`;

const AvatarWrap = styled.span`
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
`;

const PresenceDot = styled.span`
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: ${({ $size }) => $size || 11}px;
  height: ${({ $size }) => $size || 11}px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.success};
`;

const UnreadBadge = styled.span`
  display: inline-flex;
  flex: 0 0 auto;
  min-width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  align-self: center;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.primary};
  color: #ffffff;
  padding: 0 6px;
  font-size: 0.72rem;
  font-weight: 900;
`;

const Typing = styled.span`
  overflow: hidden;
  color: ${({ theme }) => theme.colors.success} !important;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.86rem;
  font-weight: 800;
`;

const Status = styled.span`
  overflow: hidden;
  color: ${({ $accent, theme }) => ($accent ? theme.colors.success : theme.colors.onSurfaceVariant)};
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.86rem;
  font-weight: ${({ $accent }) => ($accent ? 800 : 600)};
`;

const ThreadForm = styled.form`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  border-top: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  padding: ${({ theme }) => theme.spacing(1.5)};

  input {
    flex: 1;
    min-height: 44px;
    border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
    border-radius: ${({ theme }) => theme.roundness};
    padding: 0 ${({ theme }) => theme.spacing(1.5)};
    outline: 0;

    &:focus {
      border-color: ${({ theme }) => theme.colors.primary};
    }
  }
`;

const SendButton = styled.button`
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 0;
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.primary};
  color: #ffffff;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
