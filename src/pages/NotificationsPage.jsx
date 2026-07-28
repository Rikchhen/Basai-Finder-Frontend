import { useCallback, useEffect, useState } from 'react';
import {
  BellRing,
  CalendarClock,
  CheckCheck,
  Home,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import styled from 'styled-components';
import { Button } from '../components/ui/Button.jsx';
import { notificationsApi, ApiError } from '../lib/api.js';
import { useSocket } from '../context/SocketContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ListRowsSkeleton } from '../components/ui/Skeleton.jsx';

const TYPE_ICON = {
  new_match: Sparkles,
  visit_reminder: CalendarClock,
  message: MessageCircle,
  booking_update: Home,
  verification: ShieldCheck,
  system: BellRing,
};

function timeAgo(dateString) {
  const date = new Date(dateString);
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function NotificationsPage({ onNavigate }) {
  const { clearUnreadNotifications, refreshNotifications } = useSocket();
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setIsLoading(true);
    notificationsApi
      .list({ limit: 50 })
      .then((data) => setNotifications(data.notifications))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load notifications.'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const followLink = (notification) => {
    const link = notification.link || '';
    if (link.startsWith('/bookings')) {
      onNavigate('bookings');
    } else if (link.startsWith('/messages') || link.startsWith('/conversations')) {
      onNavigate('messages');
    } else if (link.startsWith('/listings/')) {
      onNavigate('details', { id: link.split('/').pop() });
    }
  };

  const openNotification = async (notification) => {
    if (!notification.read) {
      try {
        await notificationsApi.markRead(notification._id);
        setNotifications((current) =>
          current.map((item) => (item._id === notification._id ? { ...item, read: true } : item)),
        );
        refreshNotifications();
      } catch {
        // non-blocking
      }
    }
    followLink(notification);
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
      clearUnreadNotifications();
      toast.success('All notifications marked as read.');
    } catch {
      toast.error('Could not mark notifications as read.');
    }
  };

  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <Wrapper>
      <HeaderSection>
        <div>
          <h1>Notifications</h1>
          <p>Visit requests, verified matches, and account updates in one place.</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={markAllRead}
          disabled={unreadCount === 0}
        >
          <CheckCheck size={18} /> Mark all read
        </Button>
      </HeaderSection>

      {error ? <ErrorText role="alert">{error}</ErrorText> : null}

      {isLoading ? (
        <ListRowsSkeleton count={4} height="84px" />
      ) : notifications.length === 0 ? (
        <EmptyState>
          <BellRing size={30} />
          <strong>You're all caught up</strong>
          <span>New matches and booking updates will show up here.</span>
        </EmptyState>
      ) : (
        <List>
          {notifications.map((notification) => {
            const Icon = TYPE_ICON[notification.type] || BellRing;
            const clickable = Boolean(notification.link);
            return (
              <Item
                key={notification._id}
                type="button"
                $unread={!notification.read}
                $clickable={clickable}
                onClick={() => openNotification(notification)}
              >
                <IconTile $unread={!notification.read}>
                  <Icon size={20} />
                </IconTile>
                <Body>
                  <Title>
                    {notification.title}
                    {!notification.read ? <Dot aria-label="Unread" /> : null}
                  </Title>
                  <Text>{notification.body}</Text>
                  <Time>{timeAgo(notification.createdAt)}</Time>
                </Body>
              </Item>
            );
          })}
        </List>
      )}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  max-width: 820px;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing(4)} ${theme.spacing(2)} ${theme.spacing(7)}`};
`;

const HeaderSection = styled.section`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-bottom: ${({ theme }) => theme.spacing(3)};

  h1 {
    margin: 0 0 ${({ theme }) => theme.spacing(0.5)};
    color: ${({ theme }) => theme.colors.primary};
    font-size: clamp(1.8rem, 4vw, 2.6rem);
    line-height: 1.1;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    line-height: 1.5;
  }

  @media (max-width: 560px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const ErrorText = styled.p`
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.errorSoft};
  color: ${({ theme }) => theme.colors.error};
  padding: 10px 12px;
  font-weight: 800;
`;

const EmptyState = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
  justify-items: center;
  border: 1px dashed ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  padding: ${({ theme }) => theme.spacing(5)};
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  text-align: center;

  strong {
    color: ${({ theme }) => theme.colors.onSurface};
    font-size: 1.1rem;
  }
`;

const List = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1.25)};
`;

const Item = styled.button`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing(1.5)};
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ $unread, theme }) => ($unread ? 'rgba(26, 79, 157, 0.05)' : theme.colors.surfaceContainerLowest)};
  padding: ${({ theme }) => theme.spacing(2)};
  text-align: left;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  transition: background 180ms ease, border-color 180ms ease, transform 120ms ease;

  &:hover {
    border-color: rgba(26, 79, 157, 0.28);
    background: ${({ theme }) => theme.colors.surfaceContainerLow};
  }

  &:active {
    transform: ${({ $clickable }) => ($clickable ? 'scale(0.995)' : 'none')};
  }
`;

const IconTile = styled.span`
  display: grid;
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ $unread, theme }) => ($unread ? theme.colors.primary : theme.colors.surfaceContainerLow)};
  color: ${({ $unread, theme }) => ($unread ? '#ffffff' : theme.colors.primary)};
`;

const Body = styled.div`
  min-width: 0;
`;

const Title = styled.strong`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.75)};
  color: ${({ theme }) => theme.colors.onSurface};
  font-size: 1rem;
`;

const Dot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.error};
`;

const Text = styled.p`
  margin: 4px 0 6px;
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  line-height: 1.5;
`;

const Time = styled.span`
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  font-size: 0.8rem;
  font-weight: 800;
`;
