import { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, Check, ImageOff, MapPin, ShieldCheck, X } from 'lucide-react';
import styled from 'styled-components';
import { Button } from '../components/ui/Button.jsx';
import { UserAvatar } from '../components/ui/UserAvatar.jsx';
import { adminApi, listingsApi, toUploadUrl, ApiError } from '../lib/api.js';
import { formatPrice } from '../lib/format.js';
import { ListRowsSkeleton } from '../components/ui/Skeleton.jsx';
import { useToast } from '../context/ToastContext.jsx';

const TABS = [
  { key: 'pending', label: 'Pending listings' },
  { key: 'verified', label: 'Verified listings' },
  { key: 'rejected', label: 'Rejected listings' },
  { key: 'users', label: 'Users' },
];

export function AdminPage({ onNavigate }) {
  const toast = useToast();
  const [tab, setTab] = useState('pending');
  const [listings, setListings] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(() => {
    setIsLoading(true);
    setError('');
    if (tab === 'users') {
      adminApi
        .listUsers({ limit: 50 })
        .then((data) => setUsers(data.users))
        .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load users.'))
        .finally(() => setIsLoading(false));
      return;
    }
    listingsApi
      .list({ status: tab, limit: 50 })
      .then((data) => setListings(data.listings))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load listings.'))
      .finally(() => setIsLoading(false));
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const moderate = async (listing, status) => {
    setBusyId(listing._id);
    setError('');
    try {
      await adminApi.setListingStatus(listing._id, status);
      setListings((current) => current.filter((item) => item._id !== listing._id));
      toast.notify(`"${listing.title}" ${status === 'verified' ? 'approved' : status}.`,
        status === 'verified' ? 'success' : 'info');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not update this listing.');
    } finally {
      setBusyId('');
    }
  };

  const toggleVerified = async (person) => {
    setBusyId(person._id);
    setError('');
    try {
      const data = await adminApi.setUserVerified(person._id, !person.verified);
      setUsers((current) =>
        current.map((item) => (item._id === person._id ? { ...item, verified: data.user.verified } : item)),
      );
      toast.notify(`${person.name} ${data.user.verified ? 'verified' : 'unverified'}.`,
        data.user.verified ? 'success' : 'info');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not update this user.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <Wrapper>
      <HeaderSection>
        <div>
          <h1>Admin Moderation</h1>
          <p>Approve listings and verify accounts. Approved listings show the Basai Verified badge.</p>
        </div>
        <ShieldCheck size={30} />
      </HeaderSection>

      <Tabs role="tablist">
        {TABS.map((item) => (
          <TabButton
            key={item.key}
            type="button"
            role="tab"
            $active={tab === item.key}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </TabButton>
        ))}
      </Tabs>

      {error ? <ErrorText role="alert">{error}</ErrorText> : null}

      {isLoading ? (
        <ListRowsSkeleton count={3} height="132px" />
      ) : tab === 'users' ? (
        users.length === 0 ? (
          <EmptyState>No users found.</EmptyState>
        ) : (
          <List>
            {users.map((person) => (
              <Row key={person._id}>
                <UserAvatar user={person} size={44} />
                <RowBody>
                  <strong>{person.name}</strong>
                  <span>
                    {person.email} · {person.role}
                  </span>
                </RowBody>
                {person.verified ? (
                  <VerifiedPill>
                    <BadgeCheck size={14} /> Verified
                  </VerifiedPill>
                ) : (
                  <MutedPill>Unverified</MutedPill>
                )}
                <Button
                  type="button"
                  variant={person.verified ? 'secondary' : 'primary'}
                  disabled={busyId === person._id}
                  onClick={() => toggleVerified(person)}
                >
                  {person.verified ? 'Revoke' : 'Verify'}
                </Button>
              </Row>
            ))}
          </List>
        )
      ) : listings.length === 0 ? (
        <EmptyState>No {tab} listings right now.</EmptyState>
      ) : (
        <List>
          {listings.map((listing) => {
            const image = toUploadUrl(listing.images?.[0]);
            return (
              <Card key={listing._id}>
                <Thumb
                  type="button"
                  onClick={() => onNavigate('details', { id: listing._id })}
                  aria-label={`View ${listing.title}`}
                >
                  {image ? <img src={image} alt="" /> : <ImageOff size={22} />}
                </Thumb>
                <CardBody>
                  <h3>{listing.title}</h3>
                  <MetaRow>
                    <span>
                      <MapPin size={15} /> {listing.location?.neighborhood}, {listing.location?.district}
                    </span>
                    <Price>{formatPrice(listing.price)}/mo</Price>
                    <MutedPill>{listing.type}</MutedPill>
                  </MetaRow>
                  <Landlord>Landlord: {listing.landlord?.name || 'Unknown'}</Landlord>
                  <Actions>
                    {tab !== 'verified' ? (
                      <Button
                        type="button"
                        disabled={busyId === listing._id}
                        onClick={() => moderate(listing, 'verified')}
                      >
                        <Check size={16} /> Approve
                      </Button>
                    ) : null}
                    {tab !== 'rejected' ? (
                      <DangerButton
                        type="button"
                        variant="secondary"
                        disabled={busyId === listing._id}
                        onClick={() => moderate(listing, 'rejected')}
                      >
                        <X size={16} /> Reject
                      </DangerButton>
                    ) : null}
                  </Actions>
                </CardBody>
              </Card>
            );
          })}
        </List>
      )}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing(4)} ${theme.spacing(2)} ${theme.spacing(7)}`};
`;

const HeaderSection = styled.section`
  display: flex;
  align-items: center;
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

  svg {
    flex: 0 0 auto;
    color: ${({ theme }) => theme.colors.success};
  }
`;

const Tabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(1)};
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const TabButton = styled.button`
  min-height: 40px;
  border: 1px solid ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.outlineVariant)};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ $active, theme }) => ($active ? theme.colors.primary : '#ffffff')};
  color: ${({ $active, theme }) => ($active ? '#ffffff' : theme.colors.onSurfaceVariant)};
  padding: 0 ${({ theme }) => theme.spacing(1.5)};
  font-weight: 800;
`;

const Notice = styled.p`
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.successSoft};
  color: ${({ theme }) => theme.colors.success};
  padding: 10px 12px;
  font-weight: 800;
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
  padding: ${({ theme }) => theme.spacing(5)};
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  text-align: center;
`;

const List = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1.5)};
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.5)};
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  padding: ${({ theme }) => theme.spacing(1.5)};

  @media (max-width: 560px) {
    flex-wrap: wrap;
  }
`;

const RowBody = styled.div`
  display: grid;
  flex: 1;
  min-width: 0;
  gap: 2px;

  span {
    overflow: hidden;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    font-size: 0.86rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const VerifiedPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 999px;
  background: rgba(0, 104, 55, 0.12);
  color: ${({ theme }) => theme.colors.success};
  padding: 5px 10px;
  font-size: 0.76rem;
  font-weight: 900;
`;

const MutedPill = styled.span`
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.surfaceContainerLow};
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  padding: 5px 10px;
  font-size: 0.76rem;
  font-weight: 900;
`;

const Card = styled.article`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  padding: ${({ theme }) => theme.spacing(2)};
  box-shadow: ${({ theme }) => theme.shadows.sm};

  @media (max-width: 560px) {
    flex-direction: column;
  }
`;

const Thumb = styled.button`
  display: grid;
  flex: 0 0 120px;
  width: 120px;
  height: 100px;
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
    height: 150px;
  }
`;

const CardBody = styled.div`
  flex: 1;
  min-width: 0;

  h3 {
    margin: 0 0 6px;
    font-size: 1.05rem;
    line-height: 1.3;
  }
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.25)};
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  font-size: 0.9rem;
  font-weight: 700;

  span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
`;

const Price = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 900;
`;

const Landlord = styled.p`
  margin: 8px 0 0;
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  font-size: 0.9rem;
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  margin-top: ${({ theme }) => theme.spacing(1.5)};
`;

const DangerButton = styled(Button)`
  border-color: ${({ theme }) => theme.colors.outlineVariant};
  color: ${({ theme }) => theme.colors.error};

  &:hover {
    background: rgba(186, 26, 26, 0.08);
    border-color: ${({ theme }) => theme.colors.error};
  }
`;
