import { BookmarkPlus, CheckCircle2, Heart, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';
import { listingsApi, savedRoomsApi, savedSearchesApi, toUploadUrl, ApiError } from '../lib/api.js';
import roomPlaceholder from '../assets/room-placeholder.jpg';
import { ListingGridSkeleton } from '../components/ui/Skeleton.jsx';
import { formatPrice } from '../lib/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const ROOM_TYPES = ['Single Room', 'Studio', '1BHK', '2BHK', 'Apartment'];
const SORT_OPTIONS = [
  { value: '', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

export function RoomsPage({ onNavigate, filters = {} }) {
  const { user } = useAuth();
  const toast = useToast();
  const [keyword, setKeyword] = useState(filters.q || '');
  const [location, setLocation] = useState(filters.district || filters.neighborhood || '');
  const [type, setType] = useState(filters.type || '');
  const [minPrice, setMinPrice] = useState(filters.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice || '');
  const [sort, setSort] = useState(filters.sort || '');
  const [showAdvanced, setShowAdvanced] = useState(
    Boolean(filters.minPrice || filters.maxPrice || filters.sort || filters.q),
  );
  const [activeQuery, setActiveQuery] = useState(() =>
    filters.neighborhood
      ? { neighborhood: filters.neighborhood }
      : { district: filters.district || undefined, type: filters.type || undefined },
  );
  const [listings, setListings] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [savedIds, setSavedIds] = useState(() => new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadListings = async (page, query) => {
    setIsLoading(true);
    setError('');
    try {
      const data = await listingsApi.list({ ...query, page, limit: 9 });
      setListings((current) => (page === 1 ? data.listings : [...current, ...data.listings]));
      setMeta(data.meta);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load rooms right now.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadListings(1, activeQuery);
    savedRoomsApi
      .list()
      .then((data) => setSavedIds(new Set(data.savedRooms.map((entry) => entry.listing?._id))))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildQuery = () => ({
    q: keyword.trim() || undefined,
    district: location.trim() || undefined,
    type: type || undefined,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
    sort: sort || undefined,
  });

  const handleSearch = (event) => {
    event.preventDefault();
    const query = buildQuery();
    setActiveQuery(query);
    loadListings(1, query);
  };

  const handleSaveSearch = async () => {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const title = [type || 'Rooms', location.trim() ? `in ${location.trim()}` : 'in Kathmandu Valley']
        .join(' ')
        .trim();
      await savedSearchesApi.create({
        title,
        filters: {
          location: location.trim() || undefined,
          roomType: type || undefined,
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
        },
      });
      toast.success({ title: 'Search saved', body: 'Manage alerts from Saved Searches.' });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save this search.');
    } finally {
      setSaving(false);
    }
  };

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
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not update saved rooms.');
    }
  };

  return (
    <Page>
      <Header>
        <div>
          <h1>Find Your Room</h1>
          <p>Browse verified rooms and apartments across Kathmandu Valley.</p>
        </div>
      </Header>

      <FilterPanel as="form" onSubmit={handleSearch}>
        <FilterBar>
          <Input
            icon={Search}
            placeholder="Search by keyword (e.g. sunny, near Patan)"
            aria-label="Keyword"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Input
            icon={MapPin}
            placeholder="District (e.g. Lalitpur, Kathmandu)"
            aria-label="District"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          />
          <Select value={type} onChange={(event) => setType(event.target.value)} aria-label="Room type">
            <option value="">Any room type</option>
            {ROOM_TYPES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          <Button type="submit">
            <Search size={18} />
            Search
          </Button>
        </FilterBar>

        <FilterMeta>
          <ToggleAdvanced
            type="button"
            $open={showAdvanced}
            onClick={() => setShowAdvanced((value) => !value)}
          >
            <SlidersHorizontal size={16} />
            {showAdvanced ? 'Hide filters' : 'More filters'}
          </ToggleAdvanced>
          {user?.role !== 'landlord' ? (
            <SaveSearchButton type="button" variant="secondary" onClick={handleSaveSearch} disabled={saving}>
              <BookmarkPlus size={16} />
              {saving ? 'Saving...' : 'Save this search'}
            </SaveSearchButton>
          ) : null}
        </FilterMeta>

        {showAdvanced ? (
          <AdvancedRow>
            <PriceField>
              <label htmlFor="minPrice">Min price (NPR)</label>
              <Input
                id="minPrice"
                type="number"
                min="0"
                placeholder="0"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
              />
            </PriceField>
            <PriceField>
              <label htmlFor="maxPrice">Max price (NPR)</label>
              <Input
                id="maxPrice"
                type="number"
                min="0"
                placeholder="Any"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
              />
            </PriceField>
            <PriceField>
              <label htmlFor="sort">Sort by</label>
              <Select id="sort" value={sort} onChange={(event) => setSort(event.target.value)}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </PriceField>
          </AdvancedRow>
        ) : null}
      </FilterPanel>

      {error ? <ErrorText role="alert">{error}</ErrorText> : null}

      {isLoading && listings.length === 0 ? (
        <Grid>
          <ListingGridSkeleton count={6} />
        </Grid>
      ) : listings.length === 0 ? (
        <EmptyState>No rooms match your search yet. Try a different location or room type.</EmptyState>
      ) : (
        <Grid>
          {listings.map((listing) => (
            <ListingCard key={listing._id}>
              <ImageWrap onClick={() => onNavigate('details', { id: listing._id })}>
                <img
                  src={toUploadUrl(listing.images?.[0]) || roomPlaceholder}
                  alt={listing.title}
                  onError={(event) => {
                    event.currentTarget.src = roomPlaceholder;
                  }}
                />
                {listing.status === 'verified' ? (
                  <VerifiedBadge>
                    <CheckCircle2 size={13} />
                    VERIFIED
                  </VerifiedBadge>
                ) : null}
                {user ? (
                  <HeartButton
                    type="button"
                    aria-label={savedIds.has(listing._id) ? 'Remove from saved' : 'Save room'}
                    $saved={savedIds.has(listing._id)}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleSaved(listing._id);
                    }}
                  >
                    <Heart size={18} fill={savedIds.has(listing._id) ? 'currentColor' : 'none'} />
                  </HeartButton>
                ) : null}
              </ImageWrap>
              <Body onClick={() => onNavigate('details', { id: listing._id })}>
                <h3>{listing.title}</h3>
                <LocationLine>
                  <MapPin size={14} />
                  {listing.location.neighborhood}, {listing.location.district}
                </LocationLine>
                <Footer>
                  <Price>{formatPrice(listing.price)}</Price>
                  <Badge tone="muted">{listing.type}</Badge>
                </Footer>
              </Body>
            </ListingCard>
          ))}
        </Grid>
      )}

      {meta.page < meta.totalPages ? (
        <LoadMoreWrap>
          <Button
            variant="secondary"
            type="button"
            disabled={isLoading}
            onClick={() => loadListings(meta.page + 1, activeQuery)}
          >
            {isLoading ? 'Loading...' : 'Load more rooms'}
          </Button>
        </LoadMoreWrap>
      ) : null}
    </Page>
  );
}

const Page = styled.div`
  max-width: 1180px;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing(4)} ${theme.spacing(2)} ${theme.spacing(6)}`};
`;

const Header = styled.header`
  margin-bottom: ${({ theme }) => theme.spacing(3)};

  h1 {
    margin: 0 0 8px;
    color: ${({ theme }) => theme.colors.primary};
    font-size: clamp(2rem, 5vw, 3rem);
    letter-spacing: 0;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
  }
`;

const FilterPanel = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1.5)};
  margin-bottom: ${({ theme }) => theme.spacing(3)};
`;

const FilterBar = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) 200px auto;
  gap: ${({ theme }) => theme.spacing(1.5)};

  @media (max-width: 900px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const FilterMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const ToggleAdvanced = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  border-radius: ${({ theme }) => theme.roundness};
  background: transparent;
  color: ${({ $open, theme }) => ($open ? theme.colors.primary : theme.colors.onSurfaceVariant)};
  padding: 6px 8px;
  font-weight: 800;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const SaveSearchButton = styled(Button)`
  min-height: 40px;
  padding: ${({ theme }) => `${theme.spacing(0.75)} ${theme.spacing(1.5)}`};
  font-size: 0.9rem;
`;

const AdvancedRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing(1.5)};
  border-top: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  padding-top: ${({ theme }) => theme.spacing(1.5)};

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;

const PriceField = styled.div`
  display: grid;
  gap: 5px;

  label {
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    font-size: 0.82rem;
    font-weight: 800;
  }
`;

const Select = styled.select`
  min-height: 46px;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  color: ${({ theme }) => theme.colors.onSurface};
  padding: 0 ${({ theme }) => theme.spacing(1.5)};
`;

const ErrorText = styled.p`
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.errorSoft};
  color: ${({ theme }) => theme.colors.error};
  padding: 10px 12px;
  font-weight: 800;
`;

const EmptyState = styled.p`
  border: 1px dashed ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  padding: ${({ theme }) => theme.spacing(4)};
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  text-align: center;
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

const Body = styled.div`
  padding: 16px;
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

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
`;

const Price = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 900;
`;

const LoadMoreWrap = styled.div`
  display: flex;
  justify-content: center;
  margin-top: ${({ theme }) => theme.spacing(3)};
`;
