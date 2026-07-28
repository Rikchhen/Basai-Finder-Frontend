import { useEffect, useState } from 'react';
import { BellRing, CheckCircle2, Heart, ImageOff, MapPin, Trash2 } from 'lucide-react';
import styled from 'styled-components';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { savedRoomsApi, toUploadUrl, ApiError } from '../lib/api.js';
import { ListingGridSkeleton } from '../components/ui/Skeleton.jsx';
import { formatPrice } from '../lib/format.js';
import { useToast } from '../context/ToastContext.jsx';

export function SavedRoomsPage({ onNavigate }) {
  const toast = useToast();
  const [savedRooms, setSavedRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    savedRoomsApi
      .list()
      .then((data) => setSavedRooms(data.savedRooms.filter((entry) => entry.listing)))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load your saved rooms.'))
      .finally(() => setIsLoading(false));
  }, []);

  const unsave = async (listingId) => {
    setBusyId(listingId);
    setError('');
    try {
      await savedRoomsApi.unsave(listingId);
      setSavedRooms((current) => current.filter((entry) => entry.listing?._id !== listingId));
      toast.info('Removed from saved rooms.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not remove this room.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <Wrapper>
      <HeaderSection>
        <div>
          <h1>Saved Rooms</h1>
          <p>Rooms you liked. Tap the heart on any room to add it here.</p>
        </div>
        <HeaderActions>
          <CountBadge>{savedRooms.length} saved</CountBadge>
          <Button variant="secondary" type="button" onClick={() => onNavigate('savedSearches')}>
            <BellRing size={16} /> Saved searches
          </Button>
        </HeaderActions>
      </HeaderSection>

      {error ? <ErrorText role="alert">{error}</ErrorText> : null}

      {isLoading ? (
        <Grid>
          <ListingGridSkeleton count={3} />
        </Grid>
      ) : savedRooms.length === 0 ? (
        <EmptyState>
          <Heart size={30} />
          <strong>No saved rooms yet</strong>
          <span>Browse rooms and tap the heart icon to keep them here for later.</span>
          <Button type="button" onClick={() => onNavigate('rooms')}>
            Find a room
          </Button>
        </EmptyState>
      ) : (
        <Grid>
          {savedRooms.map((entry) => {
            const listing = entry.listing;
            const image = toUploadUrl(listing.images?.[0]);
            return (
              <ListingCard key={entry._id}>
                <ImageWrap onClick={() => onNavigate('details', { id: listing._id })}>
                  {image ? <img src={image} alt={listing.title} /> : <NoImage><ImageOff size={22} /></NoImage>}
                  {listing.status === 'verified' ? (
                    <VerifiedBadge>
                      <CheckCircle2 size={13} /> VERIFIED
                    </VerifiedBadge>
                  ) : null}
                  <UnsaveButton
                    type="button"
                    aria-label={`Remove ${listing.title} from saved rooms`}
                    disabled={busyId === listing._id}
                    onClick={(event) => {
                      event.stopPropagation();
                      unsave(listing._id);
                    }}
                  >
                    <Heart size={18} fill="currentColor" />
                  </UnsaveButton>
                </ImageWrap>

                <Body onClick={() => onNavigate('details', { id: listing._id })}>
                  <h3>{listing.title}</h3>
                  <LocationLine>
                    <MapPin size={14} />
                    {listing.location?.neighborhood}, {listing.location?.district}
                  </LocationLine>
                  <FooterRow>
                    <Price>{formatPrice(listing.price)}</Price>
                    <Badge tone="muted">{listing.type}</Badge>
                  </FooterRow>
                </Body>

                <CardActions>
                  <Button type="button" onClick={() => onNavigate('details', { id: listing._id })}>
                    View room
                  </Button>
                  <IconButton
                    type="button"
                    aria-label={`Remove ${listing.title}`}
                    disabled={busyId === listing._id}
                    onClick={() => unsave(listing._id)}
                  >
                    <Trash2 size={18} />
                  </IconButton>
                </CardActions>
              </ListingCard>
            );
          })}
        </Grid>
      )}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  max-width: 1180px;
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
  }

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const CountBadge = styled.span`
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.surfaceContainerLow};
  color: ${({ theme }) => theme.colors.primary};
  padding: 8px 12px;
  font-size: 0.8rem;
  font-weight: 900;
  white-space: nowrap;
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

  svg {
    color: ${({ theme }) => theme.colors.error};
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing(2)};

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;

const ListingCard = styled(Card)`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
`;

const ImageWrap = styled.div`
  position: relative;
  height: 176px;
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const NoImage = styled.div`
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  background: ${({ theme }) => theme.colors.surfaceContainerLow};
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
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

const UnsaveButton = styled.button`
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
  color: #c51f2d;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
  }
`;

const Body = styled.div`
  flex: 1;
  padding: 16px 16px 8px;
  cursor: pointer;

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

const FooterRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
`;

const Price = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 900;
`;

const CardActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  padding: 0 16px 16px;

  ${Button} {
    flex: 1;
  }
`;

const IconButton = styled.button`
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  color: ${({ theme }) => theme.colors.error};

  &:hover {
    background: #fff1f1;
  }

  &:disabled {
    opacity: 0.6;
  }
`;
