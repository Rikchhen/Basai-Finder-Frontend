import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Check, FileCheck2, FileText, ImageOff, MapPin, MessageSquare, X } from 'lucide-react';
import styled from 'styled-components';
import { Button } from '../components/ui/Button.jsx';
import { bookingsApi, toUploadUrl, ApiError } from '../lib/api.js';
import { formatPrice } from '../lib/format.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ListRowsSkeleton } from '../components/ui/Skeleton.jsx';

// Friendly confirmation shown after a status change.
const STATUS_TOAST = {
  document_review: 'Documents requested.',
  visit_confirmed: 'Visit confirmed.',
  completed: 'Marked completed.',
  cancelled: 'Request cancelled.',
  rejected: 'Request rejected.',
};

const STATUS_META = {
  pending: { label: 'Pending', tone: 'warning' },
  document_review: { label: 'Document review', tone: 'info' },
  visit_requested: { label: 'Visit requested', tone: 'info' },
  visit_confirmed: { label: 'Visit confirmed', tone: 'success' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'muted' },
  rejected: { label: 'Rejected', tone: 'error' },
};

const TERMINAL = new Set(['completed', 'cancelled', 'rejected']);

function formatDateTime(value) {
  if (!value) return null;
  return new Date(value).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function BookingsPage({ onNavigate }) {
  const { user } = useAuth();
  const toast = useToast();
  const isLandlord = user?.role === 'landlord';
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(() => {
    setIsLoading(true);
    bookingsApi
      .mine({ limit: 50 })
      .then((data) => setBookings(data.bookings))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load booking requests.'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (booking, status) => {
    setBusyId(booking._id);
    setError('');
    try {
      const data = await bookingsApi.updateStatus(booking._id, status);
      setBookings((current) =>
        current.map((item) => (item._id === booking._id ? { ...item, status: data.booking.status } : item)),
      );
      const tone = status === 'rejected' || status === 'cancelled' ? 'info' : 'success';
      toast.notify(STATUS_TOAST[status] || 'Request updated.', tone);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not update this request.';
      setError(message);
      toast.error(message);
    } finally {
      setBusyId('');
    }
  };

  const renderActions = (booking) => {
    if (TERMINAL.has(booking.status)) return null;
    const disabled = busyId === booking._id;

    if (isLandlord) {
      return (
        <Actions>
          {booking.status === 'pending' ? (
            <SubtleButton
              type="button"
              variant="secondary"
              onClick={() => changeStatus(booking, 'document_review')}
              disabled={disabled}
            >
              <FileText size={16} /> Request documents
            </SubtleButton>
          ) : null}
          {booking.status !== 'visit_confirmed' ? (
            <Button type="button" onClick={() => changeStatus(booking, 'visit_confirmed')} disabled={disabled}>
              <Check size={16} /> Confirm visit
            </Button>
          ) : (
            <Button type="button" onClick={() => changeStatus(booking, 'completed')} disabled={disabled}>
              <Check size={16} /> Mark completed
            </Button>
          )}
          <GhostButton type="button" onClick={() => changeStatus(booking, 'rejected')} disabled={disabled}>
            <X size={16} /> Reject
          </GhostButton>
        </Actions>
      );
    }

    return (
      <Actions>
        {booking.status === 'document_review' && !booking.documentsSubmitted ? (
          <Button type="button" onClick={() => changeStatus(booking, 'document_review')} disabled={disabled}>
            <FileCheck2 size={16} /> Submit documents
          </Button>
        ) : null}
        <GhostButton type="button" onClick={() => changeStatus(booking, 'cancelled')} disabled={disabled}>
          <X size={16} /> Cancel request
        </GhostButton>
      </Actions>
    );
  };

  return (
    <Wrapper>
      <HeaderSection>
        <h1>{isLandlord ? 'Visit Requests' : 'My Bookings'}</h1>
        <p>
          {isLandlord
            ? 'Review and respond to tenants who want to visit your listings.'
            : 'Track the visit requests you have sent to landlords.'}
        </p>
      </HeaderSection>

      {error ? <ErrorText role="alert">{error}</ErrorText> : null}

      {isLoading ? (
        <ListRowsSkeleton count={3} height="140px" />
      ) : bookings.length === 0 ? (
        <EmptyState>
          <CalendarClock size={30} />
          <strong>No requests yet</strong>
          <span>
            {isLandlord
              ? 'Visit requests from interested tenants will appear here.'
              : 'Browse rooms and request a visit to get started.'}
          </span>
          {!isLandlord ? (
            <Button type="button" onClick={() => onNavigate('rooms')}>
              Find a room
            </Button>
          ) : null}
        </EmptyState>
      ) : (
        <List>
          {bookings.map((booking) => {
            const meta = STATUS_META[booking.status] || { label: booking.status, tone: 'muted' };
            const listing = booking.listing || {};
            const counterparty = isLandlord ? booking.tenant : booking.landlord;
            const image = toUploadUrl(listing.images?.[0]);
            const visitTime = formatDateTime(booking.requestedVisitTime);
            return (
              <Card key={booking._id}>
                <Thumb
                  type="button"
                  onClick={() => listing._id && onNavigate('details', { id: listing._id })}
                  aria-label={`View ${listing.title || 'listing'}`}
                >
                  {image ? <img src={image} alt="" /> : <ImageOff size={22} />}
                </Thumb>

                <Content>
                  <TopRow>
                    <h3>{listing.title || 'Listing'}</h3>
                    <StatusBadge $tone={meta.tone}>{meta.label}</StatusBadge>
                  </TopRow>

                  <MetaRow>
                    {listing.location ? (
                      <span>
                        <MapPin size={15} /> {listing.location.neighborhood}, {listing.location.district}
                      </span>
                    ) : null}
                    {listing.price ? <Price>{formatPrice(listing.price)}/mo</Price> : null}
                  </MetaRow>

                  <PartyLine>
                    {isLandlord ? 'From' : 'Landlord'}: <strong>{counterparty?.name || 'Unknown'}</strong>
                  </PartyLine>

                  {visitTime ? (
                    <InfoLine>
                      <CalendarClock size={15} /> Requested visit: {visitTime}
                    </InfoLine>
                  ) : null}

                  {booking.message ? (
                    <MessageBox>
                      <MessageSquare size={15} /> {booking.message}
                    </MessageBox>
                  ) : null}

                  {booking.status === 'document_review' || booking.documentsSubmitted ? (
                    <DocBox $done={booking.documentsSubmitted}>
                      {booking.documentsSubmitted ? <FileCheck2 size={15} /> : <FileText size={15} />}
                      <span>
                        {booking.documentsSubmitted
                          ? 'Documents submitted and under review.'
                          : isLandlord
                            ? 'Waiting for the tenant to submit documents.'
                            : 'The landlord asked for your documents before confirming a visit.'}
                      </span>
                    </DocBox>
                  ) : null}

                  <FooterRow>
                    <Requested>Requested {new Date(booking.createdAt).toLocaleDateString()}</Requested>
                    {renderActions(booking)}
                  </FooterRow>
                </Content>
              </Card>
            );
          })}
        </List>
      )}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  max-width: 920px;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing(4)} ${theme.spacing(2)} ${theme.spacing(7)}`};
`;

const HeaderSection = styled.section`
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
    line-height: 1.5;
  }
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
`;

const List = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
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
  flex: 0 0 128px;
  width: 128px;
  height: 108px;
  place-items: center;
  overflow: hidden;
  border: 0;
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLow};
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  padding: 0;
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 560px) {
    width: 100%;
    flex-basis: auto;
    height: 160px;
  }
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
`;

const TopRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1.5)};

  h3 {
    margin: 0;
    font-size: 1.1rem;
    line-height: 1.3;
  }
`;

const StatusBadge = styled.span`
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 5px 11px;
  font-size: 0.76rem;
  font-weight: 900;
  white-space: nowrap;
  ${({ $tone }) => {
    const tones = {
      success: 'background: rgba(0, 113, 60, 0.12); color: #00713c;',
      info: 'background: rgba(26, 79, 157, 0.12); color: #1a4f9d;',
      warning: 'background: rgba(198, 128, 0, 0.14); color: #854d00;',
      error: 'background: rgba(186, 26, 26, 0.12); color: #ba1a1a;',
      muted: 'background: rgba(73, 69, 79, 0.12); color: #49454f;',
    };
    return tones[$tone] || tones.muted;
  }}
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.5)};
  margin-top: 6px;
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

const PartyLine = styled.p`
  margin: 8px 0 0;
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  font-size: 0.92rem;

  strong {
    color: ${({ theme }) => theme.colors.onSurface};
  }
`;

const InfoLine = styled.p`
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 6px 0 0;
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  font-size: 0.9rem;
  font-weight: 700;
`;

const MessageBox = styled.p`
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 10px 0 0;
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLow};
  padding: 10px 12px;
  color: ${({ theme }) => theme.colors.onSurface};
  line-height: 1.5;

  svg {
    flex: 0 0 auto;
    margin-top: 3px;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
  }
`;

const DocBox = styled.p`
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 10px 0 0;
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ $done, theme }) => ($done ? theme.colors.successSoft : theme.colors.warningSoft)};
  padding: 10px 12px;
  color: ${({ $done, theme }) => ($done ? theme.colors.success : theme.colors.warning)};
  font-weight: 700;
  line-height: 1.5;

  svg {
    flex: 0 0 auto;
    margin-top: 3px;
  }
`;

const SubtleButton = styled(Button)`
  border-color: ${({ theme }) => theme.colors.outlineVariant};
`;

const FooterRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1.5)};
  margin-top: ${({ theme }) => theme.spacing(1.5)};

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Requested = styled.span`
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  font-size: 0.82rem;
  font-weight: 800;
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};

  @media (max-width: 480px) {
    width: 100%;

    ${Button} {
      flex: 1;
    }
  }
`;

const GhostButton = styled(Button)`
  border-color: ${({ theme }) => theme.colors.outlineVariant};
  background: transparent;
  color: ${({ theme }) => theme.colors.error};

  &:hover {
    background: rgba(186, 26, 26, 0.08);
    border-color: ${({ theme }) => theme.colors.error};
  }
`;
