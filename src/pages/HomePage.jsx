import {
  ArrowRight,
  ArrowLeft,
  Bell,
  CheckCircle2,
  ClipboardCheck,
  Droplets,
  FileCheck2,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import logoImage from '../assets/basai-finder-logo.jpg';
import { ProfileImageUploader } from '../components/ProfileImageUploader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { bookingsApi, listingsApi, neighborhoodsApi, savedRoomsApi, toUploadUrl } from '../lib/api.js';
import roomPlaceholder from '../assets/room-placeholder.jpg';
import { formatPrice } from '../lib/format.js';

export function HomePage({ onNavigate, onBack }) {
  const { user } = useAuth();
  const { unreadNotifications } = useSocket();
  const toast = useToast();
  const [savedListings, setSavedListings] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [activeRequests, setActiveRequests] = useState([]);
  const [savedIds, setSavedIds] = useState(() => new Set());
  const [location, setLocation] = useState('');
  const [roomType, setRoomType] = useState('Single Room');

  useEffect(() => {
    listingsApi
      .list({ limit: 3 })
      .then((data) => setSavedListings(data.listings))
      .catch(() => {});
    neighborhoodsApi
      .list()
      .then((data) => setNeighborhoods(data.neighborhoods.slice(0, 4)))
      .catch(() => {});
    savedRoomsApi
      .list()
      .then((data) => setSavedIds(new Set(data.savedRooms.map((entry) => entry.listing?._id))))
      .catch(() => {});
    bookingsApi
      .mine({ limit: 2 })
      .then((data) => setActiveRequests(data.bookings))
      .catch(() => {});
  }, []);

  const toggleSaved = async (listingId) => {
    const isSaved = savedIds.has(listingId);
    try {
      if (isSaved) {
        await savedRoomsApi.unsave(listingId);
        setSavedIds((current) => {
          const next = new Set(current);
          next.delete(listingId);
          return next;
        });
        toast.info('Removed from saved rooms.');
      } else {
        await savedRoomsApi.save(listingId);
        setSavedIds((current) => new Set(current).add(listingId));
        toast.success('Room saved.');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  };

  const handleSearch = () => {
    onNavigate('rooms', { district: location || undefined, type: roomType || undefined });
  };

  return (
    <Page>
      <TopNavBar>
        <NavInner>
          <LeftCluster>
            <BackButton type="button" onClick={onBack} aria-label="Go back to previous page">
              <ArrowLeft size={18} />
            </BackButton>
            <Brand type="button" onClick={() => onNavigate('home')}>
              <BrandLogo src={logoImage} alt="Basai Finder logo" />
              <span>Basai Finder</span>
            </Brand>
          </LeftCluster>

          <NavSlider aria-label="Primary navigation">
            <NavLinks>
              <button type="button" onClick={() => onNavigate('dashboard')}>Dashboard</button>
              <button type="button" onClick={() => onNavigate('rooms')}>Find Rooms</button>
              <button type="button" onClick={() => onNavigate('savedRooms')}>Saved</button>
              <button type="button" onClick={() => onNavigate('compare')}>Compare</button>
              <button type="button" onClick={() => onNavigate('neighborhoods')}>Neighborhoods</button>
            </NavLinks>
          </NavSlider>

          <RightCluster>
            <HomeBellButton
              type="button"
              aria-label={
                unreadNotifications > 0
                  ? `Notifications, ${unreadNotifications} unread`
                  : 'Notifications'
              }
              onClick={() => onNavigate('notifications')}
            >
              <Bell size={20} />
              {unreadNotifications > 0 ? (
                <HomeBellCount>{unreadNotifications > 9 ? '9+' : unreadNotifications}</HomeBellCount>
              ) : null}
            </HomeBellButton>
            <AccountButton type="button" onClick={() => onNavigate('profile')} aria-label="My Account">
              <ProfileImageUploader size={42} editable={false} />
            </AccountButton>
          </RightCluster>
        </NavInner>
      </TopNavBar>

      <main>
        <Hero>
          <HeroInner>
            <HeroCopy>
              <Kicker>Tenant dashboard</Kicker>
              <h1>Welcome back, {user?.name?.split(' ')[0] || 'there'}!</h1>
              <p>Explore verified rooms in your preferred neighborhoods, saved for you below.</p>
              <HeroActions>
                <DashboardButton type="button" onClick={() => onNavigate('dashboard')}>
                  Open Tenant Dashboard
                  <ArrowRight size={18} />
                </DashboardButton>
              </HeroActions>
            </HeroCopy>

            <SearchPanel aria-label="Search rooms">
              <SearchSegment>
                <MapPin size={20} />
                <div>
                  <span>District</span>
                  <input
                    type="text"
                    placeholder="Lalitpur, Kathmandu..."
                    aria-label="District"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                  />
                </div>
              </SearchSegment>
              <SearchSegment>
                <Home size={20} />
                <div>
                  <span>Room type</span>
                  <select value={roomType} onChange={(event) => setRoomType(event.target.value)} aria-label="Room type">
                    <option>Single Room</option>
                    <option>Studio</option>
                    <option>1BHK</option>
                    <option>2BHK</option>
                    <option>Apartment</option>
                  </select>
                </div>
              </SearchSegment>
              <SearchButton type="button" onClick={handleSearch}>
                <Search size={18} />
                Search Rooms
              </SearchButton>
            </SearchPanel>
          </HeroInner>
        </Hero>

        <MainArea>
          <ContentColumn>
            <Section>
              <SectionTop>
                <div>
                  <h2>Ongoing Requests</h2>
                  <p>Track your bookings, messages, and landlord replies.</p>
                </div>
                <TextLink type="button" onClick={() => onNavigate('dashboard')}>View all <ArrowRight size={16} /></TextLink>
              </SectionTop>

              {activeRequests.length === 0 ? (
                <EmptyNote>No active requests yet. Save a room and request a visit to get started.</EmptyNote>
              ) : (
                <RequestStack>
                  {activeRequests.map((booking) => (
                    <RequestCard key={booking._id}>
                      <StatusIcon $green={booking.status === 'visit_confirmed'}>
                        {booking.status === 'visit_confirmed' ? (
                          <ClipboardCheck size={22} />
                        ) : (
                          <MessageCircle size={22} />
                        )}
                      </StatusIcon>
                      <RequestCopy>
                        <strong>{booking.listing?.title}</strong>
                        <span>Status: {booking.status.replace(/_/g, ' ')}</span>
                      </RequestCopy>
                      <ButtonGhost
                        type="button"
                        onClick={() => onNavigate('details', { id: booking.listing?._id })}
                      >
                        Details
                      </ButtonGhost>
                    </RequestCard>
                  ))}
                </RequestStack>
              )}
            </Section>

            <Section>
              <SectionTop>
                <div>
                  <h2>Saved for You</h2>
                  <p>Rooms matched to your saved filters and neighborhoods.</p>
                </div>
                <TextLink type="button" onClick={() => onNavigate('savedRooms')}>See all saved <ArrowRight size={16} /></TextLink>
              </SectionTop>

              <ListingGrid>
                {savedListings.map((listing) => (
                  <ListingCard
                    key={listing._id}
                    onClick={() => onNavigate('details', { id: listing._id })}
                  >
                    <ListingImage>
                      <img
                        src={toUploadUrl(listing.images?.[0]) || roomPlaceholder}
                        alt={listing.title}
                        onError={(event) => {
                          if (event.currentTarget.src !== roomPlaceholder) {
                            event.currentTarget.src = roomPlaceholder;
                          }
                        }}
                      />
                      {listing.status === 'verified' ? (
                        <VerifiedBadge>
                          <CheckCircle2 size={13} />
                          VERIFIED
                        </VerifiedBadge>
                      ) : null}
                      <HeartButton
                        type="button"
                        aria-label={`${savedIds.has(listing._id) ? 'Remove' : 'Save'} ${listing.title}`}
                        $saved={savedIds.has(listing._id)}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleSaved(listing._id);
                        }}
                      >
                        <Heart size={18} fill={savedIds.has(listing._id) ? 'currentColor' : 'none'} />
                      </HeartButton>
                    </ListingImage>
                    <ListingBody>
                      <h3>{listing.title}</h3>
                      <LocationLine>
                        <MapPin size={15} />
                        {listing.location.neighborhood}, {listing.location.district}
                      </LocationLine>
                      <Price>{formatPrice(listing.price)}</Price>
                      <AmenityRow>
                        {listing.amenities.slice(0, 3).map((amenity) => (
                          <span key={amenity}>{amenity}</span>
                        ))}
                      </AmenityRow>
                    </ListingBody>
                  </ListingCard>
                ))}
              </ListingGrid>
            </Section>
          </ContentColumn>

          <Sidebar>
            <TrustCard>
              <ShieldIcon>
                <ShieldCheck size={28} />
              </ShieldIcon>
              <h2>Verified Listings Only</h2>
              <p>Every recommended room passes Basai Finder's tenant safety checklist.</p>
              <TrustList>
                <li><FileCheck2 size={18} /> Physical Site Inspection</li>
                <li><UserRoundCheck size={18} /> Landlord Identity Check</li>
                <li><Droplets size={18} /> Water & Utility Audit</li>
              </TrustList>
            </TrustCard>

            <AlertCard>
              <Bell size={22} />
              <div>
                <strong>{neighborhoods.reduce((sum, n) => sum + (n.activeListingsCount || 0), 0)} active listings</strong>
                <span>Across your top neighborhoods right now.</span>
              </div>
            </AlertCard>
          </Sidebar>
        </MainArea>

        <NeighborhoodSection id="neighborhoods">
          <Container>
            <SectionTop>
              <div>
                <h2>Top Neighborhoods for You</h2>
                <p>Based on your saved areas, commute, and room budget.</p>
              </div>
            </SectionTop>
            <NeighborhoodGrid>
              {neighborhoods.map((neighborhood) => (
                <NeighborhoodCard
                  key={neighborhood._id}
                  as="button"
                  type="button"
                  onClick={() => onNavigate('rooms', { neighborhood: neighborhood.name })}
                >
                  <img src={neighborhood.image} alt={`${neighborhood.name} neighborhood`} />
                  <NeighborhoodOverlay>
                    <strong>{neighborhood.name}</strong>
                    <span>{neighborhood.activeListingsCount}+ Active Rooms</span>
                  </NeighborhoodOverlay>
                </NeighborhoodCard>
              ))}
            </NeighborhoodGrid>
          </Container>
        </NeighborhoodSection>
      </main>

      <Footer>
        <FooterInner>
          <FooterBrand>
            <strong>Basai Finder</strong>
            <p>(c) 2026 Basai Finder Nepal. Helping tenants find verified rooms with less stress and more trust.</p>
          </FooterBrand>
          <FooterLinks>
            <div>
              <h3>Explore</h3>
              <a href="#about" onClick={(event) => { event.preventDefault(); onNavigate('info', { topic: 'about' }); }}>About Us</a>
              <a href="#contact" onClick={(event) => { event.preventDefault(); onNavigate('info', { topic: 'support' }); }}>Contact</a>
            </div>
            <div>
              <h3>Legal</h3>
              <a href="#terms" onClick={(event) => { event.preventDefault(); onNavigate('info', { topic: 'terms' }); }}>Terms</a>
              <a href="#privacy" onClick={(event) => { event.preventDefault(); onNavigate('info', { topic: 'privacy' }); }}>Privacy</a>
            </div>
          </FooterLinks>
        </FooterInner>
      </Footer>
    </Page>
  );
}

const Page = styled.div`
  min-height: 100vh;
  background: #f7f9ff;
  color: ${({ theme }) => theme.colors.onSurface};
`;

const Container = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 clamp(16px, 4vw, 32px);
`;

const TopNavBar = styled.header`
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(14px);
`;

const NavInner = styled(Container)`
  display: flex;
  min-height: 72px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  @media (max-width: 980px) {
    flex-wrap: wrap;
    padding-top: 10px;
    padding-bottom: 10px;
  }
`;

const LeftCluster = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

const BackButton = styled.button`
  display: inline-flex;
  width: 40px;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  color: #1a4f9d;
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
  gap: 10px;
  min-width: 0;
  border: 0;
  background: transparent;
  color: #1a4f9d;
  font-size: 1.16rem;
  font-weight: 900;

  span {
    white-space: nowrap;
  }

  @media (max-width: 420px) {
    span {
      display: none;
    }
  }
`;

const BrandLogo = styled.img`
  width: 42px;
  height: 42px;
  border-radius: ${({ theme }) => theme.radius.md};
  object-fit: cover;
`;

const NavSlider = styled.nav`
  min-width: 0;
  max-width: min(58vw, 650px);
  overflow: hidden;

  @media (max-width: 980px) {
    order: 3;
    width: 100%;
    max-width: none;
  }
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 26px;
  min-width: 0;
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: none;
  scroll-snap-type: x proximity;
  -webkit-overflow-scrolling: touch;
  padding: 6px 2px;

  &::-webkit-scrollbar {
    display: none;
  }

  button {
    flex: 0 0 auto;
    min-height: 48px;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    padding: 0 4px;
    font-size: 1rem;
    font-weight: 900;
    scroll-snap-align: center;
    white-space: nowrap;
    transition: transform 160ms ease, color 200ms ease;
  }

  button:hover {
    color: #1a4f9d;
  }

  button:active {
    transform: scale(0.95);
  }
`;

const RightCluster = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 12px;
`;

const HomeBellButton = styled.button`
  position: relative;
  display: inline-flex;
  width: 42px;
  height: 42px;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  color: ${({ theme }) => theme.colors.primary};
  padding: 0;
  transition: background 180ms ease, transform 120ms ease;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceContainerLow};
  }

  &:active {
    transform: scale(0.95);
  }
`;

const HomeBellCount = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
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

const AccountButton = styled.button`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 999px;
  background: transparent;
  padding: 0;
  transition: transform 160ms ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const Hero = styled.section`
  background:
    radial-gradient(circle at 18% 20%, rgba(59, 130, 246, 0.5), transparent 28%),
    ${({ theme }) => theme.gradients.primary};
  color: #ffffff;
`;

const HeroInner = styled(Container)`
  display: grid;
  gap: 34px;
  padding-top: clamp(54px, 8vw, 86px);
  padding-bottom: 74px;

  @media (max-width: 520px) {
    padding-top: 44px;
    padding-bottom: 52px;
  }
`;

const HeroCopy = styled.div`
  max-width: 780px;

  h1 {
    margin: 8px 0 12px;
    font-size: clamp(2.6rem, 6vw, 5rem);
    line-height: 1;
    letter-spacing: 0;
  }

  p {
    max-width: 690px;
    margin: 0;
    color: rgba(255, 255, 255, 0.86);
    font-size: 1.1rem;
    line-height: 1.7;
  }
`;

const HeroActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
`;

const DashboardButton = styled.button`
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  color: #1a4f9d;
  padding: 0 18px;
  font-weight: 900;
  transition: transform 160ms ease, filter 160ms ease;

  &:hover {
    filter: brightness(0.96);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const Kicker = styled.span`
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const SearchPanel = styled.div`
  display: grid;
  grid-template-columns: minmax(240px, 1fr) minmax(220px, 0.8fr) auto;
  gap: 12px;
  width: min(100%, 980px);
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  padding: 12px;
  box-shadow: 0 24px 54px rgba(0, 0, 0, 0.22);

  @media (max-width: 780px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 420px) {
    padding: 8px;
  }
`;

const SearchSegment = styled.label`
  display: flex;
  min-height: 58px;
  align-items: center;
  gap: 12px;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.radius.md};
  background: #f7f9ff;
  color: #1a4f9d;
  padding: 0 14px;

  div {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  span {
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    font-size: 0.75rem;
    font-weight: 900;
  }

  input,
  select {
    width: 100%;
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: ${({ theme }) => theme.colors.onSurface};
    font-weight: 900;
  }
`;

const SearchButton = styled.button`
  display: inline-flex;
  min-height: 58px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: ${({ theme }) => theme.radius.md};
  background: #c51f2d;
  color: #ffffff;
  padding: 0 26px;
  font-weight: 900;
  transition: transform 160ms ease, filter 160ms ease;

  &:hover {
    filter: brightness(1.06);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const MainArea = styled(Container)`
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(300px, 0.86fr);
  gap: 28px;
  padding-top: 42px;
  padding-bottom: 34px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const ContentColumn = styled.div`
  display: grid;
  gap: 32px;
  min-width: 0;
`;

const Section = styled.section`
  min-width: 0;
`;

const SectionTop = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;

  h2 {
    margin: 0 0 6px;
    color: #1a4f9d;
    font-size: clamp(1.6rem, 4vw, 2.25rem);
    letter-spacing: 0;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    line-height: 1.55;
  }

  @media (max-width: 560px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const TextLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 0;
  background: transparent;
  color: #1a4f9d;
  font-weight: 900;
  white-space: nowrap;
`;

const RequestStack = styled.div`
  display: grid;
  gap: 14px;
`;

const EmptyNote = styled.p`
  border: 1px dashed ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 18px;
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  text-align: center;
`;

const RequestCard = styled.article`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  padding: 18px;
  box-shadow: 0 10px 28px rgba(26, 79, 157, 0.07);

  @media (max-width: 620px) {
    grid-template-columns: auto minmax(0, 1fr);

    button {
      grid-column: 2;
      width: fit-content;
    }
  }

  @media (max-width: 420px) {
    padding: 14px;
  }
`;

const StatusIcon = styled.span`
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 50%;
  background: ${({ $green }) => ($green ? 'rgba(0, 104, 55, 0.12)' : 'rgba(59, 130, 246, 0.12)')};
  color: ${({ $green, theme }) => ($green ? theme.colors.success : theme.colors.primary)};
`;

const RequestCopy = styled.div`
  min-width: 0;

  strong,
  span {
    display: block;
  }

  strong {
    margin-bottom: 4px;
    color: ${({ theme }) => theme.colors.onSurface};
  }

  span {
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    line-height: 1.5;
  }
`;

const ButtonGhost = styled.button`
  min-height: 40px;
  border: 1px solid #1a4f9d;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  color: #1a4f9d;
  padding: 0 14px;
  font-weight: 900;
`;

const ListingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;

  @media (max-width: 760px) {
    display: flex;
    overflow-x: auto;
    padding-bottom: 12px;
    scroll-snap-type: x mandatory;
  }
`;

const ListingCard = styled.article`
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  transition: transform 180ms ease, box-shadow 180ms ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 18px 34px rgba(0, 0, 0, 0.11);
  }

  @media (max-width: 760px) {
    flex: 0 0 82vw;
    max-width: 340px;
    scroll-snap-align: start;
  }
`;

const ListingImage = styled.div`
  position: relative;
  height: 176px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const VerifiedBadge = styled.span`
  position: absolute;
  top: 12px;
  left: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 999px;
  background: #e8f5e9;
  color: ${({ theme }) => theme.colors.success};
  padding: 5px 9px;
  font-size: 0.7rem;
  font-weight: 900;
`;

const HeartButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: ${({ $saved }) => ($saved ? '#c51f2d' : '#1a4f9d')};
`;

const ListingBody = styled.div`
  padding: 16px;

  h3 {
    margin: 0 0 8px;
    font-size: 1rem;
    line-height: 1.3;
  }
`;

const LocationLine = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  font-size: 0.82rem;
  font-weight: 800;
`;

const Price = styled.div`
  margin-top: 10px;
  color: #1a4f9d;
  font-size: 1.08rem;
  font-weight: 900;
`;

const AmenityRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    font-size: 0.76rem;
    font-weight: 800;
  }
`;

const Sidebar = styled.aside`
  display: grid;
  align-content: start;
  gap: 16px;
`;

const TrustCard = styled.section`
  border-radius: ${({ theme }) => theme.radius.md};
  background: #e2e8f0;
  padding: 24px;

  h2 {
    margin: 18px 0 8px;
    color: #1a4f9d;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    line-height: 1.6;
  }
`;

const ShieldIcon = styled.span`
  display: grid;
  width: 58px;
  height: 58px;
  place-items: center;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  color: #1a4f9d;
`;

const TrustList = styled.ul`
  display: grid;
  gap: 12px;
  margin: 20px 0 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: center;
    gap: 9px;
    color: ${({ theme }) => theme.colors.onSurface};
    font-weight: 900;
  }

  svg {
    color: ${({ theme }) => theme.colors.success};
  }
`;

const AlertCard = styled.section`
  display: flex;
  gap: 12px;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  padding: 18px;
  color: #1a4f9d;

  strong,
  span {
    display: block;
  }

  span {
    margin-top: 4px;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    line-height: 1.45;
  }
`;

const NeighborhoodSection = styled.section`
  padding: 36px 0 78px;
`;

const NeighborhoodGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 540px) {
    grid-template-columns: 1fr;
  }
`;

const NeighborhoodCard = styled.article`
  position: relative;
  display: block;
  width: 100%;
  min-height: 210px;
  overflow: hidden;
  border: 0;
  border-radius: ${({ theme }) => theme.radius.md};
  background: #e2e8f0;
  padding: 0;
  text-align: left;

  img {
    width: 100%;
    height: 100%;
    min-height: 210px;
    object-fit: cover;
    transition: transform 300ms ease;
  }

  &:hover img {
    transform: scale(1.05);
  }
`;

const NeighborhoodOverlay = styled.div`
  position: absolute;
  inset: auto 0 0;
  display: grid;
  gap: 4px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.78));
  color: #ffffff;
  padding: 74px 16px 18px;

  strong {
    font-size: 1.35rem;
  }

  span {
    color: rgba(255, 255, 255, 0.85);
    font-weight: 800;
  }
`;

const Footer = styled.footer`
  border-top: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
`;

const FooterInner = styled(Container)`
  display: flex;
  justify-content: space-between;
  gap: 32px;
  padding-top: 36px;
  padding-bottom: 36px;

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

const FooterBrand = styled.div`
  max-width: 430px;

  strong {
    color: #1a4f9d;
    font-size: 1.15rem;
  }

  p {
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    line-height: 1.6;
  }
`;

const FooterLinks = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(120px, 1fr));
  gap: 32px;

  div {
    display: grid;
    align-content: start;
    gap: 10px;
  }

  h3 {
    margin: 0;
    color: #1a4f9d;
    font-size: 0.92rem;
  }

  a {
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    font-weight: 800;
  }
`;
