import {
  CalendarClock,
  CheckCircle2,
  Expand,
  Heart,
  MapPin,
  MessageCircle,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { UserAvatar } from '../components/ui/UserAvatar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { bookingsApi, conversationsApi, listingsApi, toUploadUrl, ApiError } from '../lib/api.js';
import { formatPrice } from '../lib/format.js';
import { getCompareIds, toggleCompare } from '../lib/compare.js';
import { Lightbox } from '../components/Lightbox.jsx';
import roomPlaceholder from '../assets/room-placeholder.jpg';

const tabs = ['Description', 'Amenities', 'Location', 'Landlord Info'];

export function RoomDetails({ onNavigate, listingId }) {
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('Description');
  const [listing, setListing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [booked, setBooked] = useState(false);
  const [booking, setBooking] = useState(false);
  const [compareIds, setCompareIds] = useState(() => getCompareIds());
  const [lightboxAt, setLightboxAt] = useState(-1);
  const [messaging, setMessaging] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [visitTime, setVisitTime] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');

  useEffect(() => {
    if (!listingId) {
      setError('No room selected.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError('');
    listingsApi
      .get(listingId)
      .then((data) => setListing(data.listing))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load this room.'))
      .finally(() => setIsLoading(false));
  }, [listingId]);

  const submitBooking = async (event) => {
    event?.preventDefault();
    if (!listing || booking) return;
    setBooking(true);
    setError('');
    try {
      await bookingsApi.create({
        listing: listing._id,
        message: bookingMessage.trim() || undefined,
        requestedVisitTime: visitTime ? new Date(visitTime).toISOString() : undefined,
      });
      setBooked(true);
      setShowBookingModal(false);
      toast.success({ title: 'Visit requested', body: 'The landlord will get back to you soon.' });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not submit the booking request.';
      setError(message);
      toast.error(message);
    } finally {
      setBooking(false);
    }
  };

  // Local datetime string (YYYY-MM-DDTHH:mm) for the min attribute on the picker.
  const minVisit = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  const handleMessageLandlord = async () => {
    if (!listing || messaging) return;
    setMessaging(true);
    try {
      const data = await conversationsApi.create({
        recipient: listing.landlord?._id,
        listing: listing._id,
      });
      onNavigate?.('messages', { conversationId: data.conversation._id });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not start a conversation.';
      setError(message);
      toast.error(message);
    } finally {
      setMessaging(false);
    }
  };

  if (isLoading) {
    return (
      <Page>
        <StatusNote>Loading room...</StatusNote>
      </Page>
    );
  }

  if (!listing) {
    return (
      <Page>
        <StatusNote>{error || 'Room not found.'}</StatusNote>
        <ActionRow>
          <Button type="button" onClick={() => onNavigate?.('rooms')}>
            Browse rooms
          </Button>
        </ActionRow>
      </Page>
    );
  }

  // Resolved, ready-to-render URLs. Falls back to the placeholder so a listing
  // without photos shows something instead of a broken image.
  const photos = (listing.images?.length ? listing.images : []).map(toUploadUrl).filter(Boolean);
  const gallery = photos.length ? photos : [roomPlaceholder];
  const extras = gallery.slice(1);
  const hiddenCount = Math.max(0, extras.length - 3);

  return (
    <Page>
      <Gallery>
        <MainPhotoButton
          type="button"
          aria-label={`View photos of ${listing.title}`}
          onClick={() => setLightboxAt(0)}
        >
          <MainPhoto
            src={gallery[0]}
            alt={listing.title}
            onError={(event) => {
              if (event.currentTarget.src !== roomPlaceholder) event.currentTarget.src = roomPlaceholder;
            }}
          />
          <ViewAll>
            <Expand size={16} /> {gallery.length} photo{gallery.length === 1 ? '' : 's'}
          </ViewAll>
        </MainPhotoButton>
        <ThumbGrid>
          {extras.slice(0, 3).map((image, index) => (
            <ThumbButton
              key={image}
              type="button"
              aria-label={`View photo ${index + 2}`}
              onClick={() => setLightboxAt(index + 1)}
            >
              <img
                src={image}
                alt={`Room view ${index + 2}`}
                onError={(event) => {
                  if (event.currentTarget.src !== roomPlaceholder) event.currentTarget.src = roomPlaceholder;
                }}
              />
              {index === 2 && hiddenCount > 0 ? <MoreOverlay>+{hiddenCount}</MoreOverlay> : null}
            </ThumbButton>
          ))}
        </ThumbGrid>
      </Gallery>

      {lightboxAt >= 0 ? (
        <Lightbox
          images={gallery}
          startIndex={lightboxAt}
          title={listing.title}
          fallback={roomPlaceholder}
          onClose={() => setLightboxAt(-1)}
        />
      ) : null}
      <DetailsGrid>
        <Content>
          <TitleRow>
            <div>
              {listing.status === 'verified' ? (
                <Badge tone="verified">
                  <ShieldCheck size={14} />
                  Basai Verified
                </Badge>
              ) : null}
              <h1>{listing.title}</h1>
              <LocationLine>
                <MapPin size={18} />
                {listing.location.address}, {listing.location.neighborhood}, {listing.location.district}
              </LocationLine>
            </div>
          </TitleRow>
          <Tabs role="tablist" aria-label="Room information">
            {tabs.map((tab) => (
              <TabButton
                key={tab}
                type="button"
                role="tab"
                $active={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </TabButton>
            ))}
          </Tabs>
          <TabPanel>
            {activeTab === 'Description' && (
              <p>{listing.description || 'No description provided yet for this listing.'}</p>
            )}
            {activeTab === 'Amenities' && (
              <AmenityGrid>
                {listing.amenities?.length ? (
                  listing.amenities.map((amenity) => (
                    <Amenity key={amenity}>
                      <CheckCircle2 size={18} />
                      {amenity}
                    </Amenity>
                  ))
                ) : (
                  <span>No amenities listed yet.</span>
                )}
              </AmenityGrid>
            )}
            {activeTab === 'Location' && (
              <MapPreview>
                <MapPin size={30} />
                <strong>{listing.location.address}</strong>
                <span>{listing.location.neighborhood}, {listing.location.district}</span>
              </MapPreview>
            )}
            {activeTab === 'Landlord Info' && (
              <LandlordPanel>
                <UserAvatar user={listing.landlord} size={46} />
                <div>
                  <strong>{listing.landlord?.name}</strong>
                  <span>{listing.landlord?.landlordProfile?.bio || 'Verified landlord on Basai Finder.'}</span>
                </div>
              </LandlordPanel>
            )}
          </TabPanel>
        </Content>
        <ActionSidebar elevated>
          <Price>{formatPrice(listing.price)}<span>/month</span></Price>
          <Meta>{listing.type}</Meta>
          {error ? <ErrorText role="alert">{error}</ErrorText> : null}
          {user?.role !== 'landlord' ? (
            booked ? (
              <BookedNote>
                <CheckCircle2 size={18} />
                <div>
                  <strong>Visit requested</strong>
                  <button type="button" onClick={() => onNavigate?.('bookings')}>
                    View my bookings
                  </button>
                </div>
              </BookedNote>
            ) : (
              <Button type="button" onClick={() => setShowBookingModal(true)} disabled={booking}>
                <CalendarClock size={18} />
                Request a Visit
              </Button>
            )
          ) : null}
          <Button
            variant="secondary"
            type="button"
            onClick={() => {
              const added = !compareIds.includes(listing._id);
              setCompareIds(toggleCompare(listing._id));
              toast.info(added ? 'Added to comparison.' : 'Removed from comparison.');
            }}
          >
            <Heart size={18} />
            {compareIds.includes(listing._id) ? 'Remove from Compare' : 'Compare Room'}
          </Button>
          {compareIds.length > 0 ? (
            <CompareLink type="button" onClick={() => onNavigate?.('compare')}>
              View comparison ({compareIds.length})
            </CompareLink>
          ) : null}
          {user?.role !== 'landlord' ? (
            <Button variant="secondary" type="button" onClick={handleMessageLandlord} disabled={messaging}>
              <MessageCircle size={18} />
              {messaging ? 'Starting chat...' : 'Chat with Landlord'}
            </Button>
          ) : null}
          <SidebarNote>
            Booking confirmation reserves your viewing slot and keeps landlord contact details verified.
          </SidebarNote>
        </ActionSidebar>
      </DetailsGrid>

      {showBookingModal ? (
        <ModalOverlay
          role="dialog"
          aria-modal="true"
          aria-label="Request a visit"
          onClick={() => setShowBookingModal(false)}
        >
          <ModalCard as="form" onClick={(event) => event.stopPropagation()} onSubmit={submitBooking}>
            <ModalHeader>
              <h2>Request a Visit</h2>
              <CloseButton type="button" aria-label="Close" onClick={() => setShowBookingModal(false)}>
                <X size={18} />
              </CloseButton>
            </ModalHeader>
            <ModalSub>{listing.title}</ModalSub>

            <FieldGroup>
              <label htmlFor="visitTime">Preferred visit time (optional)</label>
              <ModalInput
                id="visitTime"
                type="datetime-local"
                min={minVisit}
                value={visitTime}
                onChange={(event) => setVisitTime(event.target.value)}
              />
            </FieldGroup>

            <FieldGroup>
              <label htmlFor="bookingMessage">Message to landlord (optional)</label>
              <ModalTextarea
                id="bookingMessage"
                rows={4}
                placeholder="Introduce yourself and mention any questions about the room."
                value={bookingMessage}
                onChange={(event) => setBookingMessage(event.target.value)}
                maxLength={1000}
              />
            </FieldGroup>

            {error ? <ErrorText role="alert">{error}</ErrorText> : null}

            <ModalActions>
              <Button variant="secondary" type="button" onClick={() => setShowBookingModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={booking}>
                {booking ? 'Submitting...' : 'Send Request'}
              </Button>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      ) : null}
    </Page>
  );
}

const Page = styled.div`
  max-width: 1180px;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing(4)} ${theme.spacing(2)} ${theme.spacing(6)}`};

  @media (max-width: 520px) {
    padding-top: ${({ theme }) => theme.spacing(2)};
  }
`;

const Gallery = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(240px, 1fr);
  gap: ${({ theme }) => theme.spacing(1.5)};
  margin-bottom: ${({ theme }) => theme.spacing(3)};

  img {
    width: 100%;
    object-fit: cover;
  }

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const MainPhotoButton = styled.button`
  position: relative;
  display: block;
  overflow: hidden;
  border: 0;
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLow};
  padding: 0;
  cursor: zoom-in;

  &:hover img {
    transform: scale(1.03);
  }
`;

const MainPhoto = styled.img`
  height: 440px;
  width: 100%;
  border-radius: ${({ theme }) => theme.roundness};
  transition: transform 300ms ease;

  @media (max-width: 760px) {
    height: 300px;
  }
`;

const ViewAll = styled.span`
  position: absolute;
  right: 14px;
  bottom: 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  background: rgba(6, 14, 26, 0.72);
  color: #ffffff;
  padding: 8px 13px;
  font-size: 0.82rem;
  font-weight: 800;
`;

const ThumbButton = styled.button`
  position: relative;
  display: block;
  overflow: hidden;
  border: 0;
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLow};
  padding: 0;
  cursor: zoom-in;

  &:hover img {
    transform: scale(1.05);
  }

  img {
    transition: transform 300ms ease;
  }
`;

const MoreOverlay = styled.span`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(6, 14, 26, 0.58);
  color: #ffffff;
  font-size: 1.3rem;
  font-weight: 900;
`;

const ThumbGrid = styled.div`
  display: grid;
  grid-template-rows: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing(1.5)};

  img {
    height: 136px;
    border-radius: ${({ theme }) => theme.roundness};
  }

  @media (max-width: 760px) {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: none;

    img {
      height: 92px;
    }
  }

  @media (max-width: 420px) {
    grid-template-columns: 1fr;

    img {
      height: 120px;
    }
  }
`;

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: ${({ theme }) => theme.spacing(3)};

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Content = styled.div`
  min-width: 0;
`;

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};

  h1 {
    margin: ${({ theme }) => `${theme.spacing(1)} 0`};
    font-size: clamp(2rem, 5vw, 3rem);
    line-height: 1.08;
    letter-spacing: 0;
  }

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const LocationLine = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  font-weight: 700;
`;

const StatusNote = styled.p`
  border: 1px dashed ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  padding: ${({ theme }) => theme.spacing(4)};
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  text-align: center;
`;

const ActionRow = styled.div`
  display: flex;
  justify-content: center;
`;

const ErrorText = styled.p`
  margin: 0;
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.errorSoft};
  color: ${({ theme }) => theme.colors.error};
  padding: 10px 12px;
  font-size: 0.86rem;
  font-weight: 800;
`;

const Tabs = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  margin: ${({ theme }) => `${theme.spacing(3)} 0 ${theme.spacing(2)}`};
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const TabButton = styled.button`
  min-height: 42px;
  border: 1px solid ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.outlineVariant)};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.surfaceContainerLowest)};
  color: ${({ $active, theme }) => ($active ? '#ffffff' : theme.colors.onSurfaceVariant)};
  padding: 0 ${({ theme }) => theme.spacing(1.5)};
  font-weight: 800;
  transition: all 200ms ease-in-out;
  white-space: nowrap;
`;

const TabPanel = styled(Card)`
  min-height: 190px;
  padding: ${({ theme }) => theme.spacing(2.5)};
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  line-height: 1.7;
`;

const AmenityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing(1.25)};

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const Amenity = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.colors.onSurface};
  font-weight: 800;

  svg {
    color: ${({ theme }) => theme.colors.success};
  }
`;

const MapPreview = styled.div`
  display: grid;
  min-height: 150px;
  place-items: center;
  border-radius: ${({ theme }) => theme.roundness};
  background:
    linear-gradient(135deg, rgba(26, 79, 157, 0.15), rgba(0, 104, 55, 0.08)),
    ${({ theme }) => theme.colors.surfaceContainerLow};
  text-align: center;
`;

const LandlordPanel = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1.5)};
  align-items: center;

  strong,
  span {
    display: block;
  }
`;

const ActionSidebar = styled(Card)`
  position: sticky;
  top: 96px;
  display: grid;
  align-content: start;
  gap: ${({ theme }) => theme.spacing(1.5)};
  height: fit-content;
  padding: ${({ theme }) => theme.spacing(2)};

  @media (max-width: 900px) {
    position: static;
  }

  @media (max-width: 420px) {
    padding: ${({ theme }) => theme.spacing(1.5)};
  }
`;

const Price = styled.div`
  color: ${({ theme }) => theme.colors.primary};
  font-size: 2rem;
  font-weight: 900;

  span {
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    font-size: 0.95rem;
    font-weight: 700;
  }
`;

const Meta = styled.div`
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  font-weight: 800;
`;

const SidebarNote = styled.p`
  margin: ${({ theme }) => theme.spacing(1)} 0 0;
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  font-size: 0.9rem;
  line-height: 1.55;
`;

const CompareLink = styled.button`
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.primary};
  padding: 0;
  font-size: 0.88rem;
  font-weight: 800;
  text-decoration: underline;
`;

const BookedNote = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  border: 1px solid rgba(0, 104, 55, 0.3);
  border-radius: ${({ theme }) => theme.roundness};
  background: rgba(0, 104, 55, 0.08);
  padding: ${({ theme }) => theme.spacing(1.5)};
  color: ${({ theme }) => theme.colors.success};

  strong {
    display: block;
  }

  button {
    border: 0;
    background: transparent;
    color: ${({ theme }) => theme.colors.primary};
    padding: 0;
    font-weight: 800;
    text-decoration: underline;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  background: rgba(15, 23, 42, 0.55);
  padding: ${({ theme }) => theme.spacing(2)};
`;

const ModalCard = styled(Card)`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1.5)};
  width: 100%;
  max-width: 460px;
  padding: ${({ theme }) => theme.spacing(3)};
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  h2 {
    margin: 0;
    color: ${({ theme }) => theme.colors.primary};
    font-size: 1.4rem;
    letter-spacing: 0;
  }
`;

const CloseButton = styled.button`
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  color: ${({ theme }) => theme.colors.onSurfaceVariant};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceContainerLow};
  }
`;

const ModalSub = styled.p`
  margin: -6px 0 0;
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  font-weight: 700;
`;

const FieldGroup = styled.div`
  display: grid;
  gap: 6px;

  label {
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    font-size: 0.86rem;
    font-weight: 800;
  }
`;

const ModalInput = styled.input`
  min-height: 46px;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  color: ${({ theme }) => theme.colors.onSurface};
  padding: 0 ${({ theme }) => theme.spacing(1.5)};

  &:focus {
    outline: 0;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(26, 79, 157, 0.12);
  }
`;

const ModalTextarea = styled.textarea`
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  color: ${({ theme }) => theme.colors.onSurface};
  padding: ${({ theme }) => theme.spacing(1.25)};
  font: inherit;
  resize: vertical;

  &:focus {
    outline: 0;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(26, 79, 157, 0.12);
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing(1)};

  @media (max-width: 420px) {
    ${Button} {
      flex: 1;
    }
  }
`;
