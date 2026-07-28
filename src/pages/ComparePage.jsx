import { useEffect, useMemo, useState } from 'react';
import { Check, ImageOff, Minus, Trash2 } from 'lucide-react';
import styled from 'styled-components';
import { Button } from '../components/ui/Button.jsx';
import { listingsApi, toUploadUrl } from '../lib/api.js';
import { formatPrice } from '../lib/format.js';
import { clearCompare, getCompareIds, removeCompare } from '../lib/compare.js';

export function ComparePage({ onNavigate }) {
  const [ids, setIds] = useState(() => getCompareIds());
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (ids.length === 0) {
      setListings([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    Promise.all(ids.map((id) => listingsApi.get(id).then((d) => d.listing).catch(() => null)))
      .then((results) => setListings(results.filter(Boolean)))
      .finally(() => setIsLoading(false));
  }, [ids]);

  // Union of every amenity across the compared rooms, so each column can show
  // a tick or a dash for the same row.
  const allAmenities = useMemo(() => {
    const set = new Set();
    listings.forEach((listing) => (listing.amenities || []).forEach((a) => set.add(a)));
    return [...set].sort();
  }, [listings]);

  const drop = (id) => setIds(removeCompare(id));
  const reset = () => setIds(clearCompare());

  if (isLoading) {
    return (
      <Wrapper>
        <EmptyState>Loading comparison...</EmptyState>
      </Wrapper>
    );
  }

  if (listings.length === 0) {
    return (
      <Wrapper>
        <HeaderSection>
          <h1>Compare Rooms</h1>
          <p>Add rooms from any room page to line them up side by side.</p>
        </HeaderSection>
        <EmptyState>
          <strong>Nothing to compare yet</strong>
          <span>Open a room and tap "Compare Room" to add it here.</span>
          <Button type="button" onClick={() => onNavigate('rooms')}>
            Browse rooms
          </Button>
        </EmptyState>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <HeaderSection>
        <div>
          <h1>Compare Rooms</h1>
          <p>Comparing {listings.length} of up to 3 rooms.</p>
        </div>
        <Button type="button" variant="secondary" onClick={reset}>
          <Trash2 size={16} /> Clear all
        </Button>
      </HeaderSection>

      <ScrollArea>
        <Grid $count={listings.length}>
          <HeadCell />
          {listings.map((listing) => {
            const image = toUploadUrl(listing.images?.[0]);
            return (
              <ColumnHead key={listing._id}>
                <Thumb
                  type="button"
                  onClick={() => onNavigate('details', { id: listing._id })}
                  aria-label={`View ${listing.title}`}
                >
                  {image ? <img src={image} alt="" /> : <ImageOff size={20} />}
                </Thumb>
                <h3>{listing.title}</h3>
                <RemoveButton type="button" onClick={() => drop(listing._id)}>
                  Remove
                </RemoveButton>
              </ColumnHead>
            );
          })}

          <Label>Price</Label>
          {listings.map((l) => (
            <Cell key={`price-${l._id}`}>
              <Price>{formatPrice(l.price)}</Price>
              <Muted>/month</Muted>
            </Cell>
          ))}

          <Label>Type</Label>
          {listings.map((l) => (
            <Cell key={`type-${l._id}`}>{l.type}</Cell>
          ))}

          <Label>Location</Label>
          {listings.map((l) => (
            <Cell key={`loc-${l._id}`}>
              {l.location?.neighborhood}, {l.location?.district}
            </Cell>
          ))}

          <Label>Bedrooms</Label>
          {listings.map((l) => (
            <Cell key={`bed-${l._id}`}>{l.bedrooms ?? '—'}</Cell>
          ))}

          <Label>Bathrooms</Label>
          {listings.map((l) => (
            <Cell key={`bath-${l._id}`}>{l.bathrooms ?? '—'}</Cell>
          ))}

          <Label>Area</Label>
          {listings.map((l) => (
            <Cell key={`area-${l._id}`}>{l.areaSqft ? `${l.areaSqft} sqft` : '—'}</Cell>
          ))}

          <Label>Verified</Label>
          {listings.map((l) => (
            <Cell key={`ver-${l._id}`}>
              {l.status === 'verified' ? <Yes><Check size={16} /> Verified</Yes> : <Muted>Pending</Muted>}
            </Cell>
          ))}

          {allAmenities.map((amenity) => (
            <AmenityRow key={amenity}>
              <Label>{amenity}</Label>
              {listings.map((l) => (
                <Cell key={`${amenity}-${l._id}`}>
                  {(l.amenities || []).includes(amenity) ? (
                    <Yes>
                      <Check size={16} />
                    </Yes>
                  ) : (
                    <Muted>
                      <Minus size={16} />
                    </Muted>
                  )}
                </Cell>
              ))}
            </AmenityRow>
          ))}

          <Label />
          {listings.map((l) => (
            <Cell key={`cta-${l._id}`}>
              <Button type="button" onClick={() => onNavigate('details', { id: l._id })}>
                View room
              </Button>
            </Cell>
          ))}
        </Grid>
      </ScrollArea>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing(4)} ${theme.spacing(2)} ${theme.spacing(7)}`};
`;

const HeaderSection = styled.section`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-bottom: ${({ theme }) => theme.spacing(2.5)};

  h1 {
    margin: 0 0 ${({ theme }) => theme.spacing(0.5)};
    color: ${({ theme }) => theme.colors.primary};
    font-size: clamp(1.8rem, 4vw, 2.5rem);
    line-height: 1.1;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
  }
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

// Wide tables must scroll inside their own container, never the page body.
const ScrollArea = styled.div`
  overflow-x: auto;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: ${({ $count }) => `160px repeat(${$count}, minmax(180px, 1fr))`};
  min-width: fit-content;
`;

const AmenityRow = styled.div`
  display: contents;
`;

const HeadCell = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.colors.outlineVariant};
`;

const ColumnHead = styled.div`
  display: grid;
  gap: 8px;
  justify-items: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-left: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  padding: ${({ theme }) => theme.spacing(1.5)};
  text-align: center;

  h3 {
    margin: 0;
    font-size: 0.94rem;
    line-height: 1.3;
  }
`;

const Thumb = styled.button`
  display: grid;
  width: 100%;
  height: 92px;
  place-items: center;
  overflow: hidden;
  border: 0;
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLow};
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  padding: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const RemoveButton = styled.button`
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.error};
  padding: 0;
  font-size: 0.8rem;
  font-weight: 800;
  text-decoration: underline;
`;

const Label = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  background: ${({ theme }) => theme.colors.surfaceContainerLow};
  padding: ${({ theme }) => theme.spacing(1.25)};
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  font-size: 0.84rem;
  font-weight: 800;
`;

const Cell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-left: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  padding: ${({ theme }) => theme.spacing(1.25)};
  text-align: center;
  font-weight: 700;
`;

const Price = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 900;
`;

const Muted = styled.span`
  display: inline-flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  font-weight: 700;
`;

const Yes = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: ${({ theme }) => theme.colors.success};
  font-weight: 800;
`;
