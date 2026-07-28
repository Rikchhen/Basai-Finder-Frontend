import {
  ArrowRight,
  Bell,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Star,
  WalletCards,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { dashboardApi, toUploadUrl, ApiError } from '../lib/api.js';
import roomPlaceholder from '../assets/room-placeholder.jpg';
import { formatPrice } from '../lib/format.js';

const STATUS_TONE = {
  visit_confirmed: 'verified',
  document_review: 'primary',
  pending: 'muted',
};

export function TenantDashboard({ onNavigate }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardApi
      .tenant()
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load your dashboard.'));
  }, []);

  const stats = data
    ? [
        {
          label: 'Tenant Score',
          value: String(data.tenantScore),
          meta: data.tenantScore >= 85 ? 'Excellent' : data.tenantScore >= 60 ? 'Good' : 'Building up',
          icon: Star,
          tone: 'success',
        },
        { label: 'Saved Rooms', value: String(data.savedRoomsCount), meta: 'Tap to view', icon: Heart },
        { label: 'Visits Booked', value: String(data.visitsBookedCount), meta: 'Confirmed visits', icon: CalendarCheck2 },
        { label: 'Pending Replies', value: String(data.pendingRepliesCount), meta: 'Unread messages', icon: MessageCircle },
      ]
    : [];

  return (
    <DashboardPage>
      <HeroBand>
        <HeroInner>
          <HeroCopy>
            <Badge tone="verified">
              <ShieldCheck size={14} />
              Verified Tenant
            </Badge>
            <h1>Tenant Dashboard</h1>
            <p>Track your room search, booking requests, visits, and trusted matches from one focused workspace.</p>
          </HeroCopy>
          <SearchCard>
            <SearchField>
              <MapPin size={18} />
              <div>
                <span>Address</span>
                <strong>{user?.address || 'Add your address in profile'}</strong>
              </div>
            </SearchField>
            <SearchField>
              <Home size={18} />
              <div>
                <span>Account</span>
                <strong>{user?.verified ? 'Verified Tenant' : 'Pending verification'}</strong>
              </div>
            </SearchField>
            <Button type="button" onClick={() => onNavigate('rooms')}>
              <Search size={18} />
              Find Rooms
            </Button>
          </SearchCard>
        </HeroInner>
      </HeroBand>

      <Content>
        {error ? <ErrorText role="alert">{error}</ErrorText> : null}
        <StatsGrid>
          {stats.map((stat) => {
            const Icon = stat.icon;
            const isSavedRooms = stat.label === 'Saved Rooms';
            return (
              <StatCard
                key={stat.label}
                as={isSavedRooms ? 'button' : undefined}
                type={isSavedRooms ? 'button' : undefined}
                onClick={isSavedRooms ? () => onNavigate('savedRooms') : undefined}
              >
                <StatIcon $success={stat.tone === 'success'}>
                  <Icon size={20} />
                </StatIcon>
                <StatText>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                  <small>{stat.meta}</small>
                </StatText>
              </StatCard>
            );
          })}
        </StatsGrid>

        <WorkspaceGrid>
          <MainColumn>
            <SectionHeader>
              <div>
                <h2>Active Requests</h2>
                <p>Your bookings, messages, and landlord follow-ups.</p>
              </div>
              <Button variant="text" type="button" onClick={() => onNavigate('rooms')}>
                View all <ArrowRight size={16} />
              </Button>
            </SectionHeader>

            {data?.activeRequests?.length ? (
              <RequestList>
                {data.activeRequests.map((request) => (
                  <RequestItem key={request._id}>
                    <RequestIcon>
                      <FileCheck2 size={20} />
                    </RequestIcon>
                    <RequestCopy>
                      <strong>{request.listing?.title}</strong>
                      <span>{request.landlord?.name}</span>
                    </RequestCopy>
                    <RequestMeta>
                      <Badge tone={STATUS_TONE[request.status] || 'muted'}>
                        {request.status.replace(/_/g, ' ')}
                      </Badge>
                      <small
                        onClick={() => onNavigate('details', { id: request.listing?._id })}
                        style={{ cursor: 'pointer' }}
                      >
                        View details
                      </small>
                    </RequestMeta>
                  </RequestItem>
                ))}
              </RequestList>
            ) : (
              <EmptyNote>No active requests yet.</EmptyNote>
            )}

            <SectionHeader>
              <div>
                <h2>Recommended Rooms</h2>
                <p>Freshly verified rooms picked for you.</p>
              </div>
            </SectionHeader>

            <RoomGrid>
              {(data?.recommendedRooms || []).map((room) => (
                <RoomCard
                  key={room._id}
                  as="button"
                  type="button"
                  onClick={() => onNavigate('details', { id: room._id })}
                >
                  <RoomImage>
                    <img
                        src={toUploadUrl(room.images?.[0]) || roomPlaceholder}
                        alt={room.title}
                        onError={(event) => {
                          if (event.currentTarget.src !== roomPlaceholder) event.currentTarget.src = roomPlaceholder;
                        }}
                      />
                    <MatchBadge>
                      <CheckCircle2 size={13} />
                      Verified
                    </MatchBadge>
                  </RoomImage>
                  <RoomBody>
                    <h3>{room.title}</h3>
                    <RoomLocation>
                      <MapPin size={14} />
                      {room.location.neighborhood}, {room.location.district}
                    </RoomLocation>
                    <strong>{formatPrice(room.price)}</strong>
                  </RoomBody>
                </RoomCard>
              ))}
            </RoomGrid>
          </MainColumn>

          <SideColumn>
            <ScoreCard>
              <ScoreRing>
                <span>{data?.tenantScore ?? '-'}</span>
              </ScoreRing>
              <h2>Tenant Score</h2>
              <p>Profile completion, verified contact, and document readiness.</p>
              <ScoreList>
                <li>
                  <CheckCircle2 size={17} /> {user?.verified ? 'Profile verified' : 'Profile pending verification'}
                </li>
                <li>
                  {user?.tenantProfile?.documentsReady ? <CheckCircle2 size={17} /> : <Clock3 size={17} />}
                  {user?.tenantProfile?.documentsReady ? 'Documents ready' : 'Documents not ready'}
                </li>
                <li>
                  {user?.tenantProfile?.employmentProofSubmitted ? <CheckCircle2 size={17} /> : <Clock3 size={17} />}
                  {user?.tenantProfile?.employmentProofSubmitted ? 'Employment proof submitted' : 'Add employment proof'}
                </li>
              </ScoreList>
            </ScoreCard>

            <NoticeCard as="button" type="button" onClick={() => onNavigate('rooms')}>
              <Bell size={22} />
              <div>
                <strong>{data?.recommendedRooms?.length || 0} verified matches</strong>
                <span>Fresh verified listings picked for your profile.</span>
              </div>
            </NoticeCard>

            <WalletCard as="button" type="button" onClick={() => onNavigate('profile')}>
              <WalletCards size={22} />
              <div>
                <strong>Payout details</strong>
                <span>Add your business/payout info in profile settings.</span>
              </div>
            </WalletCard>
          </SideColumn>
        </WorkspaceGrid>
      </Content>
    </DashboardPage>
  );
}

const DashboardPage = styled.div`
  min-height: 100%;
`;

const ErrorText = styled.p`
  border-radius: ${({ theme }) => theme.roundness};
  background: rgba(197, 31, 45, 0.1);
  color: ${({ theme }) => theme.colors.error};
  padding: 10px 12px;
  font-weight: 800;
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const EmptyNote = styled.p`
  border: 1px dashed ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  padding: ${({ theme }) => theme.spacing(3)};
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  text-align: center;
`;

const HeroBand = styled.section`
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  border-bottom: 1px solid ${({ theme }) => theme.colors.outlineVariant};
`;

const HeroInner = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 420px);
  gap: ${({ theme }) => theme.spacing(3)};
  max-width: 1180px;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing(5)} ${theme.spacing(2)} ${theme.spacing(4)}`};

  @media (max-width: 880px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 420px) {
    padding-top: ${({ theme }) => theme.spacing(3)};
  }
`;

const HeroCopy = styled.div`
  h1 {
    margin: ${({ theme }) => `${theme.spacing(1.25)} 0 ${theme.spacing(1)}`};
    color: ${({ theme }) => theme.colors.primary};
    font-size: clamp(2.2rem, 5vw, 4rem);
    line-height: 1.05;
    letter-spacing: 0;
  }

  p {
    max-width: 650px;
    margin: 0;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    font-size: 1.04rem;
    line-height: 1.65;
  }
`;

const SearchCard = styled(Card)`
  display: grid;
  align-content: start;
  gap: ${({ theme }) => theme.spacing(1.5)};
  padding: ${({ theme }) => theme.spacing(2)};

  @media (max-width: 420px) {
    padding: ${({ theme }) => theme.spacing(1.5)};
  }
`;

const SearchField = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.25)};
  min-height: 58px;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.primary};
  padding: ${({ theme }) => `${theme.spacing(1)} ${theme.spacing(1.25)}`};

  span,
  strong {
    display: block;
  }

  span {
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    font-size: 0.76rem;
    font-weight: 800;
  }
`;

const Content = styled.div`
  max-width: 1180px;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing(3)} ${theme.spacing(2)} ${theme.spacing(6)}`};
`;

const StatsGrid = styled.div`
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

const StatCard = styled(Card)`
  display: flex;
  width: 100%;
  gap: ${({ theme }) => theme.spacing(1.5)};
  padding: ${({ theme }) => theme.spacing(2)};
  color: inherit;
  text-align: left;
  transition: transform 160ms ease, box-shadow 180ms ease, border-color 180ms ease;

  &[type='button'] {
    cursor: pointer;
  }

  &[type='button']:hover {
    border-color: rgba(26, 79, 157, 0.3);
    box-shadow: ${({ theme }) => theme.shadows.md};
    transform: translateY(-2px);
  }

  &[type='button']:active {
    transform: scale(0.98);
  }
`;

const StatIcon = styled.span`
  display: grid;
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 50%;
  background: ${({ $success, theme }) => ($success ? 'rgba(0, 104, 55, 0.12)' : theme.colors.surfaceContainerLow)};
  color: ${({ $success, theme }) => ($success ? theme.colors.success : theme.colors.primary)};
`;

const StatText = styled.div`
  display: grid;
  min-width: 0;
  gap: 2px;

  span,
  small {
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    font-weight: 800;
  }

  strong {
    color: ${({ theme }) => theme.colors.onSurface};
    font-size: 1.55rem;
    line-height: 1.05;
  }
`;

const WorkspaceGrid = styled.div`
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

const RequestList = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1.5)};
`;

const RequestItem = styled(Card)`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.5)};
  padding: ${({ theme }) => theme.spacing(2)};

  @media (max-width: 680px) {
    grid-template-columns: auto minmax(0, 1fr);
  }

  @media (max-width: 420px) {
    padding: ${({ theme }) => theme.spacing(1.5)};
  }
`;

const RequestIcon = styled.span`
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 50%;
  background: rgba(0, 104, 55, 0.1);
  color: ${({ theme }) => theme.colors.success};
`;

const RequestCopy = styled.div`
  min-width: 0;

  strong,
  span {
    display: block;
  }

  span {
    margin-top: 4px;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
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

  @media (max-width: 680px) {
    grid-column: 2;
    justify-items: start;
  }
`;

const RoomGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing(2)};

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
`;

const RoomCard = styled(Card)`
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  padding: 0;
  text-align: left;
  cursor: pointer;
`;

const RoomImage = styled.div`
  position: relative;
  height: 164px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const MatchBadge = styled.span`
  position: absolute;
  top: 12px;
  left: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 999px;
  background: #e6f2ec;
  color: ${({ theme }) => theme.colors.success};
  padding: 5px 9px;
  font-size: 0.72rem;
  font-weight: 900;
`;

const RoomBody = styled.div`
  padding: ${({ theme }) => theme.spacing(2)};

  h3 {
    margin: 0 0 8px;
    font-size: 1rem;
    line-height: 1.3;
  }

  > strong {
    display: block;
    margin-top: 10px;
    color: ${({ theme }) => theme.colors.primary};
    font-size: 1.05rem;
  }
`;

const RoomLocation = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  font-size: 0.84rem;
  font-weight: 800;
`;

const ScoreCard = styled(Card)`
  display: grid;
  justify-items: center;
  padding: ${({ theme }) => theme.spacing(3)};
  text-align: center;

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

const ScoreRing = styled.div`
  display: grid;
  width: 116px;
  height: 116px;
  place-items: center;
  border: 10px solid rgba(0, 104, 55, 0.16);
  border-top-color: ${({ theme }) => theme.colors.success};
  border-radius: 50%;
  color: ${({ theme }) => theme.colors.success};

  span {
    font-size: 2.2rem;
    font-weight: 900;
  }
`;

const ScoreList = styled.ul`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
  width: 100%;
  margin: ${({ theme }) => `${theme.spacing(2)} 0 0`};
  padding: 0;
  list-style: none;
  text-align: left;

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
  width: 100%;
  gap: ${({ theme }) => theme.spacing(1.5)};
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  padding: ${({ theme }) => theme.spacing(2)};
  color: ${({ theme }) => theme.colors.primary};
  text-align: left;

  span {
    display: block;
    margin-top: 4px;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    line-height: 1.45;
  }
`;

const WalletCard = styled(NoticeCard)`
  color: ${({ theme }) => theme.colors.success};
`;
