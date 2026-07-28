import { useEffect, useState } from 'react';
import {
  AtSign,
  ArrowLeft,
  ArrowRight,
  Lock,
  MapPin,
  Share2,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import styled from 'styled-components';
import { Button } from '../components/ui/Button.jsx';
import { neighborhoodsApi, savedSearchesApi, ApiError } from '../lib/api.js';
import { formatPrice } from '../lib/format.js';
import { useToast } from '../context/ToastContext.jsx';

function toFilterChips(filters = {}) {
  const chips = [];
  if (filters.roomType) chips.push(filters.roomType);
  if (filters.location) chips.push(filters.location);
  if (filters.minPrice) chips.push(`Min ${formatPrice(filters.minPrice)}`);
  if (filters.maxPrice) chips.push(`Max ${formatPrice(filters.maxPrice)}`);
  (filters.amenities || []).forEach((amenity) => chips.push(amenity));
  return chips;
}

export function SavedSearchesPage({ onNavigate, onBack }) {
  const toast = useToast();
  const [savedSearches, setSavedSearches] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsLoading(true);
    savedSearchesApi
      .list()
      .then((data) => setSavedSearches(data.savedSearches))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load saved searches.'))
      .finally(() => setIsLoading(false));
    neighborhoodsApi
      .list()
      .then((data) => setSuggestions(data.neighborhoods.slice(0, 3)))
      .catch(() => {});
  }, []);

  const toggleAlert = async (search) => {
    try {
      const data = await savedSearchesApi.update(search._id, { emailAlertsEnabled: !search.emailAlertsEnabled });
      setSavedSearches((current) => current.map((item) => (item._id === search._id ? data.savedSearch : item)));
      toast.info(data.savedSearch.emailAlertsEnabled ? 'Email alerts on.' : 'Email alerts off.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not update alerts.');
    }
  };

  const deleteSearch = async (search) => {
    try {
      await savedSearchesApi.remove(search._id);
      setSavedSearches((current) => current.filter((item) => item._id !== search._id));
      toast.info('Saved search removed.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not remove this search.');
    }
  };

  return (
    <PageShell>
      <TopNavBar>
        <LeftCluster>
          <BackButton type="button" onClick={onBack} aria-label="Go back to previous page">
            <ArrowLeft size={18} />
          </BackButton>
          <Brand type="button" onClick={() => onNavigate('home')}>Basai Finder</Brand>
        </LeftCluster>
        <NavLinks aria-label="Primary navigation">
          <button type="button" onClick={() => onNavigate('rooms')}>Find a Room</button>
          <button type="button">Help</button>
        </NavLinks>
      </TopNavBar>

      <Main>
        <HeaderSection>
          <h1>Saved Searches & Alerts</h1>
          <p>Manage your property notifications and find your perfect home faster.</p>
        </HeaderSection>

        <ContentGrid>
          <LeftColumn>
            <SectionTitle>
              <h2>Active Searches</h2>
              <CountBadge>{savedSearches.length} Saved</CountBadge>
            </SectionTitle>

            {error ? <ErrorText role="alert">{error}</ErrorText> : null}

            {!isLoading && savedSearches.length === 0 ? (
              <EmptyState>You haven't saved any searches yet. Save filters while browsing rooms to get alerts here.</EmptyState>
            ) : (
              <SearchList>
                {savedSearches.map((search) => (
                  <SearchCard key={search._id}>
                    <CardHeader>
                      <TitleWrap>
                        <IconTile>
                          <MapPin size={20} />
                        </IconTile>
                        <h3>{search.title}</h3>
                      </TitleWrap>
                      <ToggleWrap>
                        <span>Email Alerts</span>
                        <ToggleButton
                          type="button"
                          role="switch"
                          aria-checked={search.emailAlertsEnabled}
                          aria-label={`Email alerts for ${search.title} are ${search.emailAlertsEnabled ? 'on' : 'off'}`}
                          $checked={search.emailAlertsEnabled}
                          onClick={() => toggleAlert(search)}
                        >
                          <span />
                        </ToggleButton>
                      </ToggleWrap>
                    </CardHeader>

                    <ChipRow>
                      {toFilterChips(search.filters).map((filter) => (
                        <FilterChip key={filter}>{filter}</FilterChip>
                      ))}
                    </ChipRow>

                    <CardFooter>
                      <LastChecked>
                        Last checked {new Date(search.lastCheckedAt).toLocaleDateString()}
                      </LastChecked>
                      <Actions>
                        <Button
                          type="button"
                          onClick={() =>
                            onNavigate('rooms', {
                              district: search.filters.location,
                              type: search.filters.roomType,
                            })
                          }
                        >
                          View Results <ArrowRight size={16} />
                        </Button>
                        <IconButton
                          type="button"
                          aria-label={`Delete ${search.title}`}
                          onClick={() => deleteSearch(search)}
                        >
                          <Trash2 size={19} />
                        </IconButton>
                      </Actions>
                    </CardFooter>
                  </SearchCard>
                ))}
              </SearchList>
            )}
          </LeftColumn>

          <Sidebar>
            <UtilityCard>
              <h2>Suggested for You</h2>
              <DistrictList>
                {suggestions.map((area) => (
                  <DistrictCard
                    key={area._id}
                    type="button"
                    onClick={() => onNavigate('rooms', { neighborhood: area.name })}
                  >
                    <img src={area.image} alt="" />
                    <DistrictOverlay>
                      <strong>{area.name}</strong>
                      <span>{area.activeListingsCount || 0} Active Listings</span>
                    </DistrictOverlay>
                  </DistrictCard>
                ))}
              </DistrictList>
              <Button variant="secondary" type="button" onClick={() => onNavigate('neighborhoods')}>
                Explore All Areas
              </Button>
            </UtilityCard>

            <VerifiedCard>
              <VerifiedHeader>
                <ShieldCheck size={24} />
                <h2>Verified Search</h2>
              </VerifiedHeader>
              <p>Look for the Verified badge on listings where Basai Finder has checked landlord details and room information.</p>
              <TipBox>
                <Lock size={19} />
                <span>Never pay any security deposit before visiting the property in person.</span>
              </TipBox>
            </VerifiedCard>
          </Sidebar>
        </ContentGrid>
      </Main>

      <Footer>
        <FooterGrid>
          <FooterColumn>
            <strong>Basai Finder</strong>
            <p>Helping renters find reliable rooms and verified landlords across Nepal.</p>
          </FooterColumn>
          <FooterColumn>
            <h3>Quick Links</h3>
            <button type="button" onClick={() => onNavigate('info', { topic: 'about' })}>About Us</button>
            <button type="button" onClick={() => onNavigate('info', { topic: 'terms' })}>Terms</button>
            <button type="button" onClick={() => onNavigate('info', { topic: 'privacy' })}>Privacy</button>
          </FooterColumn>
          <FooterColumn>
            <h3>Support</h3>
            <button type="button" onClick={() => onNavigate('info', { topic: 'support' })}>Contact Support</button>
            <button type="button" onClick={() => onNavigate('rooms')}>Verified Listings</button>
          </FooterColumn>
          <FooterColumn>
            <h3>Follow Us</h3>
            <SocialRow>
              <SocialButton type="button" aria-label="Share Basai Finder">
                <Share2 size={18} />
              </SocialButton>
              <SocialButton type="button" aria-label="Email Basai Finder">
                <AtSign size={18} />
              </SocialButton>
            </SocialRow>
          </FooterColumn>
        </FooterGrid>
        <Copyright>© 2026 Basai Finder. All rights reserved.</Copyright>
      </Footer>
    </PageShell>
  );
}

const PageShell = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.onSurface};
`;

const TopNavBar = styled.header`
  position: sticky;
  top: 0;
  z-index: 30;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  min-height: 72px;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  border-bottom: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  padding: ${({ theme }) => `${theme.spacing(1.25)} clamp(16px, 5vw, 56px)`};

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const Brand = styled.button`
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 1.16rem;
  font-weight: 900;
`;

const LeftCluster = styled.div`
  display: flex;
  align-items: center;
  justify-self: start;
  gap: ${({ theme }) => theme.spacing(1)};
  min-width: 0;
`;

const BackButton = styled.button`
  display: inline-flex;
  width: 40px;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
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

const NavLinks = styled.nav`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(0.75)};

  button {
    border: 0;
    border-radius: ${({ theme }) => theme.roundness};
    background: transparent;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    padding: ${({ theme }) => `${theme.spacing(1)} ${theme.spacing(1.25)}`};
    font-weight: 800;
    transition: background 180ms ease, color 180ms ease, transform 120ms ease;
  }

  button:hover {
    background: ${({ theme }) => theme.colors.surfaceContainerLow};
    color: ${({ theme }) => theme.colors.primary};
  }

  button:active {
    transform: scale(0.95);
  }

  @media (max-width: 760px) {
    display: none;
  }
`;

const Main = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing(5)} ${theme.spacing(2)} ${theme.spacing(7)}`};

  @media (max-width: 560px) {
    padding-top: ${({ theme }) => theme.spacing(3)};
  }
`;

const HeaderSection = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing(4)};

  h1 {
    margin: 0 0 ${({ theme }) => theme.spacing(1)};
    color: ${({ theme }) => theme.colors.primary};
    font-size: clamp(2.1rem, 5vw, 3.4rem);
    line-height: 1.08;
    letter-spacing: 0;
  }

  p {
    max-width: 640px;
    margin: 0;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    font-size: 1.04rem;
    line-height: 1.6;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr);
  gap: ${({ theme }) => theme.spacing(3)};

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
  }
`;

const LeftColumn = styled.section`
  min-width: 0;
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-bottom: ${({ theme }) => theme.spacing(2)};

  h2 {
    margin: 0;
    color: ${({ theme }) => theme.colors.primary};
    font-size: 1.55rem;
    letter-spacing: 0;
  }
`;

const CountBadge = styled.span`
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.surfaceContainerLow};
  color: ${({ theme }) => theme.colors.primary};
  padding: 7px 11px;
  font-size: 0.78rem;
  font-weight: 900;
`;

const SearchList = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const ErrorText = styled.p`
  border-radius: ${({ theme }) => theme.roundness};
  background: rgba(197, 31, 45, 0.1);
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

const SearchCard = styled.article`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  padding: ${({ theme }) => theme.spacing(2.25)};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;

  &:hover {
    border-color: rgba(26, 79, 157, 0.28);
    box-shadow: ${({ theme }) => theme.shadows.md};
    transform: translateY(-2px);
  }

  @media (max-width: 520px) {
    padding: ${({ theme }) => theme.spacing(1.5)};
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const TitleWrap = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.25)};
  min-width: 0;

  h3 {
    margin: 0;
    font-size: 1.08rem;
    line-height: 1.35;
  }
`;

const IconTile = styled.span`
  display: grid;
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLow};
  color: ${({ theme }) => theme.colors.primary};
`;

const ToggleWrap = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  font-size: 0.86rem;
  font-weight: 900;
`;

const ToggleButton = styled.button`
  position: relative;
  width: 48px;
  height: 28px;
  border: 0;
  border-radius: 999px;
  background: ${({ $checked, theme }) => ($checked ? theme.colors.primary : theme.colors.surfaceDim)};
  padding: 3px;
  transition: background 180ms ease, transform 120ms ease;

  span {
    position: absolute;
    top: 4px;
    left: ${({ $checked }) => ($checked ? '24px' : '4px')};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.surfaceContainerLowest};
    box-shadow: ${({ theme }) => theme.shadows.sm};
    transition: left 180ms ease;
  }

  &:active {
    transform: scale(0.95);
  }
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const FilterChip = styled.span`
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.surfaceContainerHigh || theme.colors.surfaceContainerLow};
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  padding: 7px 11px;
  font-size: 0.82rem;
  font-weight: 800;
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
  border-top: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  padding-top: ${({ theme }) => theme.spacing(1.5)};

  @media (max-width: 640px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const LastChecked = styled.span`
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  font-size: 0.88rem;
  font-weight: 800;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};

  ${Button}:active {
    transform: scale(0.95);
  }

  @media (max-width: 420px) {
    width: 100%;

    ${Button} {
      flex: 1;
    }
  }
`;

const IconButton = styled.button`
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  color: ${({ theme }) => theme.colors.error};
  transition: background 180ms ease, transform 120ms ease;

  &:hover {
    background: #fff1f1;
  }

  &:active {
    transform: scale(0.95);
  }
`;

const Sidebar = styled.aside`
  display: grid;
  align-content: start;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const UtilityCard = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1.5)};
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  padding: ${({ theme }) => theme.spacing(2)};
  box-shadow: ${({ theme }) => theme.shadows.sm};

  h2 {
    margin: 0;
    color: ${({ theme }) => theme.colors.primary};
    font-size: 1.25rem;
    letter-spacing: 0;
  }
`;

const DistrictList = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1.25)};
`;

const DistrictCard = styled.button`
  position: relative;
  min-height: 118px;
  overflow: hidden;
  border: 0;
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLow};
  padding: 0;
  text-align: left;
  transition: transform 180ms ease, filter 180ms ease;

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &::after {
    position: absolute;
    inset: 0;
    content: '';
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.68));
  }

  &:hover {
    filter: saturate(1.05);
    transform: translateY(-2px);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const DistrictOverlay = styled.span`
  position: absolute;
  right: 14px;
  bottom: 14px;
  left: 14px;
  z-index: 1;
  color: #ffffff;

  strong,
  span {
    display: block;
  }

  strong {
    font-size: 1rem;
    line-height: 1.25;
  }

  span {
    margin-top: 4px;
    font-size: 0.82rem;
    font-weight: 800;
  }
`;

const VerifiedCard = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1.5)};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.primary};
  color: #ffffff;
  padding: ${({ theme }) => theme.spacing(2.25)};
  box-shadow: ${({ theme }) => theme.shadows.md};

  p {
    margin: 0;
    color: rgba(255, 255, 255, 0.86);
    line-height: 1.6;
  }
`;

const VerifiedHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};

  svg {
    color: #2e7d32;
    fill: rgba(46, 125, 50, 0.2);
  }

  h2 {
    margin: 0;
    font-size: 1.28rem;
    letter-spacing: 0;
  }
`;

const TipBox = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  border-radius: ${({ theme }) => theme.roundness};
  background: #10386f;
  padding: ${({ theme }) => theme.spacing(1.5)};
  font-weight: 800;
  line-height: 1.45;

  svg {
    flex: 0 0 auto;
    margin-top: 2px;
  }
`;

const Footer = styled.footer`
  border-top: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
`;

const FooterGrid = styled.div`
  display: grid;
  grid-template-columns: 1.4fr repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing(3)};
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing(4)} ${theme.spacing(2.5)}`};

  @media (max-width: 780px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const FooterColumn = styled.div`
  display: grid;
  align-content: start;
  gap: ${({ theme }) => theme.spacing(0.75)};

  strong,
  h3 {
    margin: 0;
    color: ${({ theme }) => theme.colors.primary};
    font-size: 1rem;
    letter-spacing: 0;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    line-height: 1.55;
  }

  button {
    width: fit-content;
    border: 0;
    background: transparent;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    padding: 0;
    text-align: left;
    font-weight: 800;
  }
`;

const SocialRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const SocialButton = styled.button`
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  color: ${({ theme }) => theme.colors.primary};
`;

const Copyright = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  padding: ${({ theme }) => theme.spacing(2)};
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  text-align: center;
  font-size: 0.88rem;
  font-weight: 800;
`;
