import {
  ArrowLeft,
  Bell,
  CalendarCheck,
  ChartNoAxesColumn,
  Gauge,
  Heart,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import styled from 'styled-components';
import logoImage from '../assets/basai-finder-logo.jpg';
import { ProfileImageUploader } from '../components/ProfileImageUploader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { IconWrapper } from '../components/ui/IconWrapper.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';

export function MainLayout({ activePage, setActivePage, userRole = 'tenant', onBack, onLogout, children }) {
  const { user } = useAuth();
  const { hasUnreadMessages, unreadNotifications } = useSocket();
  const isLandlord = userRole === 'landlord';
  const isAdmin = userRole === 'admin';
  const dashboardKey = isLandlord ? 'landlordHome' : 'dashboard';
  const homeKey = isLandlord ? 'landlordHome' : 'home';
  const navItems = [
    { key: dashboardKey, label: 'Dashboard', icon: Gauge },
    ...(isLandlord || isAdmin ? [] : [{ key: homeKey, label: 'Home', icon: Home }]),
    { key: 'rooms', label: 'Rooms', icon: Search },
    ...(isLandlord || isAdmin ? [] : [{ key: 'savedRooms', label: 'Saved', icon: Heart }]),
    ...(isLandlord ? [{ key: 'analytics', label: 'Analytics', icon: ChartNoAxesColumn }] : []),
    ...(isAdmin ? [{ key: 'admin', label: 'Admin', icon: ShieldCheck }] : []),
    { key: 'bookings', label: isLandlord ? 'Requests' : 'Bookings', icon: CalendarCheck },
    { key: 'messages', label: 'Messages', icon: MessageCircle, badge: hasUnreadMessages },
    { key: 'profile', label: 'Profile', icon: UserRound },
  ];

  return (
    <Shell>
      <TopNavBar>
        <LeftCluster>
          <BackButton type="button" onClick={onBack} aria-label="Go back to previous page">
            <ArrowLeft size={18} />
          </BackButton>
          <Brand type="button" onClick={() => setActivePage(homeKey)}>
            <BrandLogo src={logoImage} alt="Basai Finder logo" />
            <span>Basai Finder</span>
          </Brand>
        </LeftCluster>
        <DesktopNav aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavButton
              key={item.key}
              type="button"
              $active={activePage === item.key}
              onClick={() => setActivePage(item.key)}
            >
              {item.label}
              {item.badge ? <NavDot aria-label="Unread messages" /> : null}
            </NavButton>
          ))}
        </DesktopNav>
        <NavActions>
          <TrustPill>
            <ShieldCheck size={16} />
            {user?.verified ? 'Basai Verified' : 'Verification Pending'}
          </TrustPill>
          <BellButton
            type="button"
            aria-label={
              unreadNotifications > 0
                ? `Notifications, ${unreadNotifications} unread`
                : 'Notifications'
            }
            $active={activePage === 'notifications'}
            onClick={() => setActivePage('notifications')}
          >
            <Bell size={18} />
            {unreadNotifications > 0 ? (
              <BellCount>{unreadNotifications > 9 ? '9+' : unreadNotifications}</BellCount>
            ) : null}
          </BellButton>
          <ProfileImageUploader
            size={44}
            editable={false}
            label="Open profile settings"
            onClick={() => setActivePage('profile')}
          />
          <MenuButton variant="secondary" aria-label="Open profile menu" onClick={() => setActivePage('profile')}>
            <Menu size={18} />
          </MenuButton>
          <LogoutButton type="button" aria-label="Log out" onClick={onLogout}>
            <LogOut size={18} />
          </LogoutButton>
        </NavActions>
      </TopNavBar>
      <Main>{children}</Main>
      <Footer>
        <FooterInner>
          <strong>Basai Finder</strong>
          <span>Secure rooms, trusted landlords, Nepal-first support.</span>
        </FooterInner>
      </Footer>
      <BottomNavBar aria-label="Mobile navigation" $count={navItems.length}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <BottomNavButton
              key={item.key}
              type="button"
              $active={activePage === item.key}
              onClick={() => setActivePage(item.key)}
            >
              <IconWrapperShell>
                <IconWrapper size={30} rounded $subtle={activePage === item.key}>
                  <Icon size={18} />
                </IconWrapper>
                {item.badge ? <NavDot aria-hidden="true" /> : null}
              </IconWrapperShell>
              <span>{item.label}</span>
            </BottomNavButton>
          );
        })}
      </BottomNavBar>
    </Shell>
  );
}

const Shell = styled.div`
  min-height: 100vh;
  padding-bottom: 0;

  @media (max-width: 760px) {
    padding-bottom: 76px;
  }
`;

const TopNavBar = styled.header`
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  min-height: 72px;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1.25)};
  border-bottom: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  background: rgba(255, 255, 255, 0.92);
  padding: ${({ theme }) => `${theme.spacing(1.25)} clamp(12px, 3vw, 36px)`};
  backdrop-filter: blur(14px);

  @media (max-width: 980px) {
    gap: ${({ theme }) => theme.spacing(0.75)};
  }

  @media (max-width: 520px) {
    padding-inline: 12px;
  }
`;

const LeftCluster = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.25)};
`;

const BackButton = styled.button`
  display: inline-flex;
  width: 40px;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  color: ${({ theme }) => theme.colors.primary};
  padding: 0;
  font-weight: 900;
  transition: transform 160ms ease, background 200ms ease;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceContainerLow};
  }

  &:active {
    transform: scale(0.95);
  }
`;

const Brand = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  min-width: 0;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 1.12rem;
  font-weight: 900;

  span {
    white-space: nowrap;
  }

  /* Drop the wordmark on tighter widths (the logo keeps the branding) so the
     sliding nav gets more room before it needs to scroll. */
  @media (max-width: 900px) {
    span {
      display: none;
    }
  }
`;

const BrandLogo = styled.img`
  width: 42px;
  height: 42px;
  border-radius: ${({ theme }) => theme.roundness};
  object-fit: cover;
`;

const DesktopNav = styled.nav`
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
  /* When the buttons don't fit, the strip slides horizontally instead of
     letting labels collapse into each other. */
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  /* Soft fade at both edges hints there's more to scroll to. */
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 14px, #000 calc(100% - 14px), transparent);
  mask-image: linear-gradient(90deg, transparent, #000 14px, #000 calc(100% - 14px), transparent);

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 760px) {
    display: none;
  }
`;

const NavButton = styled.button`
  position: relative;
  flex: 0 0 auto;
  border: 0;
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ $active, theme }) => ($active ? theme.colors.surfaceContainerLow : 'transparent')};
  color: ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.onSurfaceVariant)};
  padding: ${({ theme }) => `${theme.spacing(1)} ${theme.spacing(1.5)}`};
  font-weight: 800;
  white-space: nowrap;
  transition: all 200ms ease-in-out;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceContainerLow};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const NavDot = styled.span`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.error};
`;

const IconWrapperShell = styled.span`
  position: relative;
  display: inline-flex;
`;

const NavActions = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.25)};

  @media (max-width: 520px) {
    gap: ${({ theme }) => theme.spacing(0.75)};
  }
`;

const BellButton = styled.button`
  position: relative;
  display: inline-flex;
  width: 40px;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ $active, theme }) => ($active ? theme.colors.surfaceContainerLow : '#ffffff')};
  color: ${({ theme }) => theme.colors.primary};
  transition: background 180ms ease, transform 120ms ease;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceContainerLow};
  }

  &:active {
    transform: scale(0.95);
  }
`;

const BellCount = styled.span`
  position: absolute;
  top: -6px;
  right: -6px;
  display: inline-flex;
  min-width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.error};
  color: #ffffff;
  padding: 0 5px;
  font-size: 0.66rem;
  font-weight: 900;
  line-height: 1;
`;

const TrustPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  background: rgba(0, 104, 55, 0.1);
  color: ${({ theme }) => theme.colors.success};
  padding: 8px 12px;
  font-size: 0.82rem;
  font-weight: 800;
  white-space: nowrap;

  /* It's the widest right-side item, so retire it first to give the sliding
     nav room on smaller laptops. */
  @media (max-width: 1120px) {
    display: none;
  }
`;

const MenuButton = styled(Button)`
  display: none;
  width: 42px;
  min-height: 42px;
  padding: 0;

  @media (max-width: 760px) {
    display: inline-flex;
  }
`;

const LogoutButton = styled.button`
  display: inline-flex;
  width: 40px;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  color: ${({ theme }) => theme.colors.error};
  transition: background 180ms ease, transform 120ms ease;

  &:hover {
    background: rgba(197, 31, 45, 0.08);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const Main = styled.main`
  min-height: calc(100vh - 148px);
`;

const Footer = styled.footer`
  border-top: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
`;

const FooterInner = styled.div`
  display: flex;
  max-width: 1180px;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing(3)} ${theme.spacing(2)}`};
  color: ${({ theme }) => theme.colors.onSurfaceVariant};

  strong {
    color: ${({ theme }) => theme.colors.primary};
  }

  @media (max-width: 760px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const BottomNavBar = styled.nav`
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 25;
  display: none;
  grid-template-columns: ${({ $count }) => `repeat(${$count}, 1fr)`};
  border-top: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  padding: 6px 8px 8px;

  @media (max-width: 760px) {
    display: grid;
  }
`;

const BottomNavButton = styled.button`
  display: grid;
  place-items: center;
  gap: 2px;
  border: 0;
  border-radius: ${({ theme }) => theme.roundness};
  background: transparent;
  color: ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.onSurfaceVariant)};
  font-size: 0.74rem;
  font-weight: 800;
  padding: 4px;
`;
