import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Bell,
  Building2,
  CalendarClock,
  Camera,
  CheckCircle2,
  ClipboardList,
  Home,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  ShieldCheck,
  Star,
  TrendingUp,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { UserAvatar } from '../components/ui/UserAvatar.jsx';
import { conversationsApi, dashboardApi, toUploadUrl, ApiError } from '../lib/api.js';
import roomPlaceholder from '../assets/room-placeholder.jpg';
import { formatPrice } from '../lib/format.js';

const REQUEST_ACTION_LABEL = {
  pending: 'New request',
  document_review: 'Document submitted',
  visit_requested: 'Visit request',
  visit_confirmed: 'Visit confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

export function LandlordHomePage({ onNavigate }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [messagingId, setMessagingId] = useState(null);

  useEffect(() => {
    dashboardApi
      .landlord()
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load your dashboard.'));
  }, []);

  const handleMessageTenant = async (request) => {
    if (messagingId) return;
    setMessagingId(request._id);
    try {
      const data = await conversationsApi.create({
        recipient: request.tenant?._id,
        listing: request.listing?._id,
      });
      onNavigate('messages', { conversationId: data.conversation._id });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start a conversation.');
    } finally {
      setMessagingId(null);
    }
  };

  const metrics = data
    ? [
        { label: 'Active Listings', value: String(data.activeListingsCount), note: `${data.listings.length} shown`, icon: Building2 },
        { label: 'Tenant Leads', value: String(data.tenantLeadsCount), note: 'Total requests', icon: UsersRound },
        { label: 'Occupancy', value: `${data.occupancyRate}%`, note: 'Verified vs total listings', icon: TrendingUp, success: true },
        { label: 'Rent Collected', value: formatPrice(data.rentCollected), note: 'From completed bookings', icon: WalletCards },
      ]
    : [];

  const listings = data?.listings || [];
  const tenantRequests = data?.tenantRequests || [];
  const visitsNeedingConfirmation = tenantRequests.filter((request) => request.status === 'visit_requested').length;
  const nextVisit = tenantRequests.find((request) => request.status === 'visit_confirmed');

  return (
    <Page>
      {error ? <ErrorBanner role="alert">{error}</ErrorBanner> : null}
      <Hero>
        <HeroInner>
          <HeroCopy>
            <Badge tone="verified">
              <ShieldCheck size={14} />
              Verified Landlord
            </Badge>
            <h1>Landlord Home</h1>
            <p>Manage listings, tenant leads, visits, rent readiness, and verification tasks from one calm workspace.</p>
          </HeroCopy>
          <HeroActions>
            <Button type="button" onClick={() => onNavigate('createListing')}>
              <Plus size={18} />
              Add Listing
            </Button>
            <Button variant="secondary" type="button" onClick={() => onNavigate('rooms')}>
              <Home size={18} />
              View Rooms
            </Button>
          </HeroActions>
        </HeroInner>
      </Hero>

      <Content>
        <MetricGrid>
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <MetricCard key={metric.label}>
                <MetricIcon $success={metric.success}>
                  <Icon size={20} />
                </MetricIcon>
                <MetricText>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <small>{metric.note}</small>
                </MetricText>
              </MetricCard>
            );
          })}
        </MetricGrid>

        <Workspace>
          <MainColumn>
            <SectionHeader>
              <div>
                <h2>Property Performance</h2>
                <p>Your visible rooms and what needs attention before the next tenant visit.</p>
              </div>
              <Button variant="text" type="button" onClick={() => onNavigate('rooms')}>
                Manage all <ArrowRight size={16} />
              </Button>
            </SectionHeader>

            {listings.length === 0 ? (
              <EmptyNote>You haven't listed any rooms yet. Click "Add Listing" to publish your first one.</EmptyNote>
            ) : (
              <ListingGrid>
                {listings.map((listing) => (
                  <ListingCard key={listing._id}>
                    <ListingOpenButton
                      type="button"
                      onClick={() => onNavigate('details', { id: listing._id })}
                    >
                      <ListingImage>
                        <img
                        src={toUploadUrl(listing.images?.[0]) || roomPlaceholder}
                        alt={listing.title}
                        onError={(event) => {
                          if (event.currentTarget.src !== roomPlaceholder) event.currentTarget.src = roomPlaceholder;
                        }}
                      />
                        <StatusBadge $muted={listing.status !== 'verified'}>
                          {listing.status === 'verified' ? <BadgeCheck size={13} /> : <Camera size={13} />}
                          {listing.status === 'verified' ? 'Verified' : listing.status.replace(/_/g, ' ')}
                        </StatusBadge>
                      </ListingImage>
                      <ListingBody>
                        <h3>{listing.title}</h3>
                        <LocationLine>
                          <MapPin size={14} />
                          {listing.location.neighborhood}, {listing.location.district}
                        </LocationLine>
                        <ListingFooter>
                          <strong>{formatPrice(listing.price)}</strong>
                          <span>{listing.leadsCount} leads</span>
                        </ListingFooter>
                      </ListingBody>
                    </ListingOpenButton>
                    <EditButton
                      type="button"
                      aria-label={`Edit ${listing.title}`}
                      onClick={() => onNavigate('editListing', { id: listing._id })}
                    >
                      <Pencil size={13} />
                      Edit
                    </EditButton>
                  </ListingCard>
                ))}
              </ListingGrid>
            )}

            <SectionHeader>
              <div>
                <h2>Tenant Requests</h2>
                <p>Prioritized by tenant score, visit timing, and document readiness.</p>
              </div>
            </SectionHeader>

            {tenantRequests.length === 0 ? (
              <EmptyNote>No tenant requests yet.</EmptyNote>
            ) : (
              <RequestStack>
                {tenantRequests.map((request) => (
                  <RequestCard key={request._id}>
                    <UserAvatar user={request.tenant} size={44} />
                    <RequestCopy
                      as="button"
                      type="button"
                      onClick={() => onNavigate('details', { id: request.listing?._id })}
                    >
                      <strong>{request.tenant?.name}</strong>
                      <span>{request.listing?.title}</span>
                    </RequestCopy>
                    <TenantScore>
                      <Star size={14} />
                      {request.tenant?.tenantProfile?.score ?? '-'}
                    </TenantScore>
                    <RequestMeta>
                      <Badge tone="primary">{REQUEST_ACTION_LABEL[request.status] || request.status}</Badge>
                      <small>{new Date(request.updatedAt).toLocaleDateString()}</small>
                    </RequestMeta>
                    <MessageButton
                      type="button"
                      aria-label={`Message ${request.tenant?.name}`}
                      onClick={() => handleMessageTenant(request)}
                      disabled={messagingId === request._id}
                    >
                      <MessageCircle size={18} />
                    </MessageButton>
                  </RequestCard>
                ))}
              </RequestStack>
            )}
          </MainColumn>

          <SideColumn>
            <VerificationCard>
              <CheckCircle2 size={30} />
              <h2>Listing Health</h2>
              <p>Complete these tasks to improve ranking and tenant trust.</p>
              <TaskList>
                <li><CheckCircle2 size={17} /> Ownership document verified</li>
                <li><CheckCircle2 size={17} /> Contact number verified</li>
                <li><Camera size={17} /> Add kitchen and bathroom photos</li>
                <li><ClipboardList size={17} /> Update house rules</li>
              </TaskList>
            </VerificationCard>

            <NoticeCard as="button" type="button" onClick={() => onNavigate('bookings')}>
              <Bell size={22} />
              <div>
                <strong>{visitsNeedingConfirmation} visits need confirmation</strong>
                <span>Confirm requested visits to keep your response badge active.</span>
              </div>
            </NoticeCard>

            <NoticeCard>
              <CalendarClock size={22} />
              <div>
                <strong>Next visit</strong>
                <span>
                  {nextVisit
                    ? `${nextVisit.tenant?.name}, ${nextVisit.listing?.title}${nextVisit.requestedVisitTime ? `, ${new Date(nextVisit.requestedVisitTime).toLocaleString()}` : ''}`
                    : 'No upcoming visits scheduled.'}
                </span>
              </div>
            </NoticeCard>

            <PayoutCard>
              <Banknote size={22} />
              <div>
                <strong>Rent payout</strong>
                <span>{formatPrice(data?.rentCollected || 0)} collected from completed bookings.</span>
              </div>
            </PayoutCard>
          </SideColumn>
        </Workspace>
      </Content>
    </Page>
  );
}

const Page = styled.div`
  min-height: 100%;
`;

const ErrorBanner = styled.p`
  max-width: 1180px;
  margin: ${({ theme }) => `${theme.spacing(2)} auto 0`};
  border-radius: ${({ theme }) => theme.roundness};
  background: rgba(197, 31, 45, 0.1);
  color: ${({ theme }) => theme.colors.error};
  padding: 10px 12px;
  font-weight: 800;
`;

const EmptyNote = styled.p`
  border: 1px dashed ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  padding: ${({ theme }) => theme.spacing(3)};
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  text-align: center;
`;

const Hero = styled.section`
  border-bottom: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
`;

const HeroInner = styled.div`
  display: flex;
  max-width: 1180px;
  align-items: flex-end;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(3)};
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing(5)} ${theme.spacing(2)} ${theme.spacing(4)}`};

  @media (max-width: 760px) {
    align-items: flex-start;
    flex-direction: column;
  }

  @media (max-width: 420px) {
    padding-top: ${({ theme }) => theme.spacing(3)};
  }
`;

const HeroCopy = styled.div`
  max-width: 720px;

  h1 {
    margin: ${({ theme }) => `${theme.spacing(1.25)} 0 ${theme.spacing(1)}`};
    color: ${({ theme }) => theme.colors.primary};
    font-size: clamp(2.25rem, 5vw, 4rem);
    line-height: 1.05;
    letter-spacing: 0;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    font-size: 1.04rem;
    line-height: 1.65;
  }
`;

const HeroActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(1)};

  @media (max-width: 420px) {
    width: 100%;

    button {
      width: 100%;
    }
  }
`;

const Content = styled.div`
  max-width: 1180px;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing(3)} ${theme.spacing(2)} ${theme.spacing(6)}`};
`;

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing(2)};

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const MetricCard = styled(Card)`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1.5)};
  padding: ${({ theme }) => theme.spacing(2)};
`;

const MetricIcon = styled.span`
  display: grid;
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 50%;
  background: ${({ $success, theme }) => ($success ? 'rgba(0, 104, 55, 0.12)' : theme.colors.surfaceContainerLow)};
  color: ${({ $success, theme }) => ($success ? theme.colors.success : theme.colors.primary)};
`;

const MetricText = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;

  span,
  small {
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    font-weight: 800;
  }

  strong {
    color: ${({ theme }) => theme.colors.onSurface};
    font-size: 1.42rem;
    line-height: 1.08;
  }
`;

const Workspace = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 0.38fr);
  gap: ${({ theme }) => theme.spacing(3)};
  margin-top: ${({ theme }) => theme.spacing(3)};

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const MainColumn = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2.5)};
  min-width: 0;
`;

const SideColumn = styled.aside`
  display: grid;
  align-content: start;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};

  h2 {
    margin: 0 0 4px;
    color: ${({ theme }) => theme.colors.primary};
    font-size: clamp(1.35rem, 3vw, 2rem);
    letter-spacing: 0;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    line-height: 1.5;
  }

  @media (max-width: 620px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const ListingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing(2)};

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const ListingCard = styled(Card)`
  position: relative;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  padding: 0;
  text-align: left;
`;

const ListingOpenButton = styled.button`
  display: block;
  width: 100%;
  border: 0;
  background: transparent;
  padding: 0;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
`;

const EditButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  color: ${({ theme }) => theme.colors.primary};
  padding: 6px 11px;
  font-size: 0.74rem;
  font-weight: 900;
  cursor: pointer;
  transition: background 180ms ease, transform 120ms ease;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceContainerLow};
  }

  &:active {
    transform: scale(0.95);
  }
`;

const ListingImage = styled.div`
  position: relative;
  height: 210px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const StatusBadge = styled.span`
  position: absolute;
  top: 12px;
  left: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 999px;
  background: ${({ $muted }) => ($muted ? '#eef1f6' : '#e6f2ec')};
  color: ${({ $muted, theme }) => ($muted ? theme.colors.onSurfaceVariant : theme.colors.success)};
  padding: 5px 9px;
  font-size: 0.72rem;
  font-weight: 900;
`;

const ListingBody = styled.div`
  padding: ${({ theme }) => theme.spacing(2)};

  h3 {
    margin: 0 0 8px;
    font-size: 1.05rem;
    line-height: 1.3;
  }
`;

const LocationLine = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  font-size: 0.84rem;
  font-weight: 800;
`;

const ListingFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1)};
  margin-top: ${({ theme }) => theme.spacing(1.5)};

  strong {
    color: ${({ theme }) => theme.colors.primary};
    font-size: 1.08rem;
  }

  span {
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    font-weight: 900;
  }
`;

const RequestStack = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1.5)};
`;

const RequestCard = styled(Card)`
  display: grid;
  width: 100%;
  grid-template-columns: auto minmax(0, 1fr) auto auto auto;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.5)};
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  padding: ${({ theme }) => theme.spacing(2)};
  text-align: left;

  @media (max-width: 760px) {
    grid-template-columns: auto minmax(0, 1fr) auto;
  }

  @media (max-width: 420px) {
    padding: ${({ theme }) => theme.spacing(1.5)};
  }
`;

const RequestCopy = styled.div`
  min-width: 0;
  border: 0;
  background: transparent;
  padding: 0;
  font: inherit;
  text-align: left;
  cursor: pointer;

  strong,
  span {
    display: block;
  }

  span {
    margin-top: 4px;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
  }

  @media (max-width: 760px) {
    grid-row: 1;
    grid-column: 2;
  }
`;

const MessageButton = styled.button`
  display: grid;
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  color: ${({ theme }) => theme.colors.primary};
  transition: background 180ms ease, transform 120ms ease;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceContainerLow};
  }

  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.6;
    cursor: wait;
  }

  @media (max-width: 760px) {
    grid-row: 1;
    grid-column: 3;
  }
`;

const TenantScore = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 999px;
  background: rgba(0, 104, 55, 0.12);
  color: ${({ theme }) => theme.colors.success};
  padding: 7px 10px;
  font-size: 0.82rem;
  font-weight: 900;

  @media (max-width: 760px) {
    grid-row: 2;
    grid-column: 2;
    width: fit-content;
  }
`;

const RequestMeta = styled.div`
  display: grid;
  justify-items: end;
  gap: 7px;

  small {
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    font-weight: 800;
  }

  @media (max-width: 760px) {
    grid-row: 3;
    grid-column: 2;
    justify-items: start;
  }
`;

const VerificationCard = styled(Card)`
  padding: ${({ theme }) => theme.spacing(3)};
  color: ${({ theme }) => theme.colors.success};

  h2 {
    margin: ${({ theme }) => `${theme.spacing(1.5)} 0 ${theme.spacing(0.75)}`};
    color: ${({ theme }) => theme.colors.primary};
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    line-height: 1.55;
  }
`;

const TaskList = styled.ul`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
  margin: ${({ theme }) => `${theme.spacing(2)} 0 0`};
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: center;
    gap: 8px;
    color: ${({ theme }) => theme.colors.onSurface};
    font-weight: 800;
  }

  svg {
    color: ${({ theme }) => theme.colors.success};
  }
`;

const NoticeCard = styled(Card)`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1.5)};
  padding: ${({ theme }) => theme.spacing(2)};
  color: ${({ theme }) => theme.colors.primary};

  span {
    display: block;
    margin-top: 4px;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    line-height: 1.45;
  }
`;

const PayoutCard = styled(NoticeCard)`
  color: ${({ theme }) => theme.colors.success};
`;
