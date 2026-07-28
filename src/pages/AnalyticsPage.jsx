import { useEffect, useMemo, useState } from 'react';
import { Eye, ImageOff, TrendingUp, Users } from 'lucide-react';
import styled from 'styled-components';
import { Button } from '../components/ui/Button.jsx';
import { listingsApi, toUploadUrl, ApiError } from '../lib/api.js';
import { formatPrice } from '../lib/format.js';
import { ListRowsSkeleton } from '../components/ui/Skeleton.jsx';

function conversionRate(listing) {
  if (!listing.viewsCount) return 0;
  return Math.round((listing.leadsCount / listing.viewsCount) * 100);
}

export function AnalyticsPage({ onNavigate }) {
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listingsApi
      .mine({ limit: 50 })
      .then((data) => setListings(data.listings))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load your listings.'))
      .finally(() => setIsLoading(false));
  }, []);

  const totals = useMemo(
    () =>
      listings.reduce(
        (acc, listing) => ({
          views: acc.views + (listing.viewsCount || 0),
          leads: acc.leads + (listing.leadsCount || 0),
        }),
        { views: 0, leads: 0 },
      ),
    [listings],
  );

  const maxViews = useMemo(
    () => Math.max(1, ...listings.map((listing) => listing.viewsCount || 0)),
    [listings],
  );

  const ranked = useMemo(
    () => [...listings].sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0)),
    [listings],
  );

  return (
    <Wrapper>
      <HeaderSection>
        <h1>Listing Analytics</h1>
        <p>See which rooms attract views and which convert those views into visit requests.</p>
      </HeaderSection>

      {error ? <ErrorText role="alert">{error}</ErrorText> : null}

      <StatRow>
        <Stat>
          <StatIcon>
            <Eye size={20} />
          </StatIcon>
          <div>
            <strong>{totals.views}</strong>
            <span>Total views</span>
          </div>
        </Stat>
        <Stat>
          <StatIcon>
            <Users size={20} />
          </StatIcon>
          <div>
            <strong>{totals.leads}</strong>
            <span>Visit requests</span>
          </div>
        </Stat>
        <Stat>
          <StatIcon>
            <TrendingUp size={20} />
          </StatIcon>
          <div>
            <strong>{totals.views ? Math.round((totals.leads / totals.views) * 100) : 0}%</strong>
            <span>View → request rate</span>
          </div>
        </Stat>
      </StatRow>

      {isLoading ? (
        <ListRowsSkeleton count={3} height="120px" />
      ) : ranked.length === 0 ? (
        <EmptyState>
          <strong>No listings yet</strong>
          <span>Publish a room to start collecting view and lead data.</span>
          <Button type="button" onClick={() => onNavigate('createListing')}>
            Add a listing
          </Button>
        </EmptyState>
      ) : (
        <List>
          {ranked.map((listing) => {
            const image = toUploadUrl(listing.images?.[0]);
            const views = listing.viewsCount || 0;
            const leads = listing.leadsCount || 0;
            return (
              <Card key={listing._id}>
                <Thumb
                  type="button"
                  onClick={() => onNavigate('details', { id: listing._id })}
                  aria-label={`View ${listing.title}`}
                >
                  {image ? <img src={image} alt="" /> : <ImageOff size={20} />}
                </Thumb>
                <Body>
                  <TopRow>
                    <h3>{listing.title}</h3>
                    <StatusPill $status={listing.status}>{listing.status}</StatusPill>
                  </TopRow>
                  <SubRow>
                    {listing.location?.neighborhood}, {listing.location?.district} ·{' '}
                    <strong>{formatPrice(listing.price)}</strong>
                  </SubRow>

                  <BarTrack aria-hidden="true">
                    <BarFill style={{ width: `${Math.round((views / maxViews) * 100)}%` }} />
                  </BarTrack>

                  <Numbers>
                    <span>
                      <Eye size={14} /> {views} views
                    </span>
                    <span>
                      <Users size={14} /> {leads} requests
                    </span>
                    <Rate $good={conversionRate(listing) >= 10}>{conversionRate(listing)}% convert</Rate>
                  </Numbers>
                </Body>
              </Card>
            );
          })}
        </List>
      )}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing(4)} ${theme.spacing(2)} ${theme.spacing(7)}`};
`;

const HeaderSection = styled.section`
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

const ErrorText = styled.p`
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.errorSoft};
  color: ${({ theme }) => theme.colors.error};
  padding: 10px 12px;
  font-weight: 800;
`;

const StatRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing(1.5)};
  margin-bottom: ${({ theme }) => theme.spacing(2.5)};

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;

const Stat = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.25)};
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  padding: ${({ theme }) => theme.spacing(1.75)};

  strong {
    display: block;
    color: ${({ theme }) => theme.colors.primary};
    font-size: 1.5rem;
    line-height: 1.1;
  }

  span {
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    font-size: 0.84rem;
    font-weight: 800;
  }
`;

const StatIcon = styled.span`
  display: grid;
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLow};
  color: ${({ theme }) => theme.colors.primary};
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
  gap: ${({ theme }) => theme.spacing(1.5)};
`;

const Card = styled.article`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1.75)};
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  padding: ${({ theme }) => theme.spacing(1.75)};

  @media (max-width: 560px) {
    flex-direction: column;
  }
`;

const Thumb = styled.button`
  display: grid;
  flex: 0 0 92px;
  width: 92px;
  height: 78px;
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

  @media (max-width: 560px) {
    width: 100%;
    flex-basis: auto;
    height: 140px;
  }
`;

const Body = styled.div`
  flex: 1;
  min-width: 0;
`;

const TopRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1)};

  h3 {
    margin: 0;
    font-size: 1rem;
    line-height: 1.3;
  }
`;

const StatusPill = styled.span`
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 4px 9px;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: capitalize;
  ${({ $status }) =>
    $status === 'verified'
      ? 'background: rgba(0,113,60,0.12); color:#00713c;'
      : $status === 'rejected'
        ? 'background: rgba(186,26,26,0.12); color:#ba1a1a;'
        : 'background: rgba(198,128,0,0.14); color:#854d00;'}
`;

const SubRow = styled.p`
  margin: 4px 0 10px;
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  font-size: 0.86rem;
`;

const BarTrack = styled.div`
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.surfaceContainerLow};
`;

const BarFill = styled.div`
  height: 100%;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.primary};
  transition: width 300ms ease;
`;

const Numbers = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.5)};
  margin-top: 8px;
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  font-size: 0.84rem;
  font-weight: 800;

  span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
`;

const Rate = styled.span`
  color: ${({ $good, theme }) => ($good ? theme.colors.success : theme.colors.onSurfaceVariant)};
`;
