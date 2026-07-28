import {
  CheckCircle2,
  Mail,
  MapPin,
  Minus,
  Navigation,
  Plus,
  Search,
  Globe2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import logoImage from '../assets/basai-finder-logo.jpg';
import { neighborhoodsApi } from '../lib/api.js';
import { formatRentRange } from '../lib/format.js';

export function NeighborhoodsPage({ onNavigate }) {
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    neighborhoodsApi
      .list()
      .then((data) => setNeighborhoods(data.neighborhoods))
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return neighborhoods;
    return neighborhoods.filter((area) => area.name.toLowerCase().includes(query.trim().toLowerCase()));
  }, [neighborhoods, query]);

  const totalListings = neighborhoods.reduce((sum, area) => sum + (area.activeListingsCount || 0), 0);

  return (
    <Page>
      <TopNavBar>
        <NavInner>
          <Brand type="button" onClick={() => onNavigate('home')}>
            <img src={logoImage} alt="Basai Finder logo" />
            <span>Basai Finder</span>
          </Brand>
          <NavLinks aria-label="Neighborhood page navigation">
            <ActiveLink type="button" onClick={() => onNavigate('rooms')}>Find a Room</ActiveLink>
            <button type="button" onClick={() => window.alert('Help center opened.')}>Help</button>
          </NavLinks>
          <SearchBox>
            <Search size={18} />
            <input
              aria-label="Search Kathmandu neighborhoods"
              placeholder="Search Kathmandu..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </SearchBox>
        </NavInner>
      </TopNavBar>

      <main>
        <Hero>
          <h1>Explore Kathmandu Neighborhoods</h1>
          <p>
            Discover the perfect vibe for your next home. From student hubs to quiet residential retreats,
            find the locality that fits your lifestyle and budget.
          </p>
        </Hero>

        <MapSection aria-label="Interactive Kathmandu neighborhood map" tabIndex={0}>
          <MapGrid />
          {filtered.map((marker) => (
            <Marker
              key={marker._id}
              $top={marker.mapPosition.top}
              $left={marker.mapPosition.left}
              $type={marker.mapPosition.type}
              tabIndex={0}
              onClick={() => onNavigate('rooms', { neighborhood: marker.name })}
            >
              <MapPin size={16} fill="currentColor" />
              <span>{marker.name}</span>
            </Marker>
          ))}
          <MapControls aria-label="Map controls">
            <button type="button" aria-label="Zoom in"><Plus size={19} /></button>
            <button type="button" aria-label="Zoom out"><Minus size={19} /></button>
            <button type="button" aria-label="Locate me"><Navigation size={18} /></button>
          </MapControls>
        </MapSection>

        <CardsSection>
          {filtered.map((item) => (
            <NeighborhoodCard
              key={item._id}
              as="button"
              type="button"
              onClick={() => onNavigate('rooms', { neighborhood: item.name })}
            >
              <ImageWrap>
                <img src={item.image} alt={`${item.name} neighborhood`} />
                <VerifiedBadge>
                  <CheckCircle2 size={14} />
                  Verified
                </VerifiedBadge>
              </ImageWrap>
              <CardBody>
                <TitleRow>
                  <h2>{item.name}</h2>
                  <VibePill>{item.vibe}</VibePill>
                </TitleRow>
                <p>{item.description}</p>
                <RentTable>
                  <div><span>Single Room</span><strong>{formatRentRange(item.rentRange.singleMin, item.rentRange.singleMax)}</strong></div>
                  <div><span>Flat (1BHK)</span><strong>{formatRentRange(item.rentRange.flatMin, item.rentRange.flatMax)}</strong></div>
                </RentTable>
                <FeatureRow>
                  {item.features.map((feature) => (
                    <span key={feature}>
                      <CheckCircle2 size={14} />
                      {feature}
                    </span>
                  ))}
                </FeatureRow>
              </CardBody>
            </NeighborhoodCard>
          ))}
        </CardsSection>

        <TrustBanner>
          <TrustCopy>
            <h2>Why trust our neighborhood data?</h2>
            <p>
              Basai Finder combines verified listing activity, local tenant feedback, rent ranges,
              and commute signals so you can compare neighborhoods with confidence.
            </p>
            <Checklist>
              <li><CheckCircle2 size={19} /> Rent ranges reviewed against verified listings</li>
              <li><CheckCircle2 size={19} /> Local safety and access signals checked by our team</li>
              <li><CheckCircle2 size={19} /> Neighborhood vibes updated from tenant behavior</li>
            </Checklist>
          </TrustCopy>
          <MetricGrid>
            <MetricCard><strong>{totalListings}</strong><span>Verified Listings</span></MetricCard>
            <MetricCard><strong>{neighborhoods.length}</strong><span>Neighborhoods</span></MetricCard>
          </MetricGrid>
        </TrustBanner>
      </main>

      <Footer>
        <FooterGrid>
          <FooterBrand>
            <img src={logoImage} alt="Basai Finder logo" />
            <p>Helping tenants discover verified rooms and trusted neighborhoods across Nepal.</p>
          </FooterBrand>
          <FooterColumn><h3>Explore</h3><button type="button" onClick={() => onNavigate('info', { topic: 'about' })}>About Us</button><button type="button" onClick={() => onNavigate('rooms')}>Verified Listings</button></FooterColumn>
          <FooterColumn><h3>Support</h3><button type="button" onClick={() => onNavigate('info', { topic: 'support' })}>Contact</button><button type="button" onClick={() => onNavigate('info', { topic: 'terms' })}>Terms</button><button type="button" onClick={() => onNavigate('info', { topic: 'privacy' })}>Privacy</button></FooterColumn>
          <FooterColumn><h3>Stay Connected</h3><button type="button"><Globe2 size={15} /> Public</button><button type="button"><Mail size={15} /> Email</button></FooterColumn>
        </FooterGrid>
        <Copyright>(c) 2026 Basai Finder Nepal. All rights reserved.</Copyright>
      </Footer>
    </Page>
  );
}

const Page = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.surface};
`;

const TopNavBar = styled.header`
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 4px 18px rgba(26, 79, 157, 0.06);
  backdrop-filter: blur(14px);
`;

const NavInner = styled.div`
  display: flex;
  max-width: 1200px;
  min-height: 74px;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing(2)};

  @media (max-width: 900px) {
    flex-wrap: wrap;
    padding-block: ${({ theme }) => theme.spacing(1)};
  }

  @media (max-width: 520px) {
    gap: ${({ theme }) => theme.spacing(1)};
  }
`;

const Brand = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 1.12rem;
  font-weight: 900;

  img {
    width: 44px;
    height: 44px;
    border-radius: ${({ theme }) => theme.roundness};
    object-fit: cover;
  }
`;

const NavLinks = styled.nav`
  display: flex;
  align-items: center;
  gap: 22px;
  min-width: 0;

  button {
    min-height: 38px;
    border: 0;
    background: transparent;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    font-weight: 900;
  }

  @media (max-width: 720px) {
    order: 3;
    width: 100%;
    overflow-x: auto;
    gap: 16px;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const ActiveLink = styled.button`
  color: ${({ theme }) => theme.colors.primary} !important;
  border-bottom: 3px solid ${({ theme }) => theme.colors.primary} !important;
`;

const SearchBox = styled.label`
  display: flex;
  min-height: 42px;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.primary};
  padding: 0 12px;

  input {
    width: min(220px, 42vw);
    border: 0;
    outline: 0;
    background: transparent;
  }

  @media (max-width: 720px) {
    margin-left: 0;
    flex: 1 1 220px;
  }

  @media (max-width: 420px) {
    flex-basis: 100%;

    input {
      width: 100%;
    }
  }
`;

const Hero = styled.section`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing(6)} ${theme.spacing(2)} ${theme.spacing(3)}`};

  h1 {
    max-width: 760px;
    margin: 0 0 ${({ theme }) => theme.spacing(1.5)};
    color: ${({ theme }) => theme.colors.primary};
    font-family: Georgia, 'Times New Roman', serif;
    font-size: clamp(2.5rem, 6vw, 5rem);
    line-height: 1;
    letter-spacing: 0;
  }

  p {
    max-width: 650px;
    margin: 0;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    font-size: 1.05rem;
    line-height: 1.7;
  }
`;

const MapSection = styled.section`
  position: relative;
  min-height: clamp(360px, 52vw, 560px);
  max-width: 1200px;
  overflow: hidden;
  margin: 0 auto;
  border-radius: 12px;
  background:
    radial-gradient(circle at 24% 32%, rgba(46, 125, 50, 0.22), transparent 18%),
    radial-gradient(circle at 72% 28%, rgba(197, 31, 45, 0.18), transparent 18%),
    linear-gradient(135deg, #0c1d3b, #142b56 52%, #09182f);
  box-shadow: 0 24px 56px rgba(12, 29, 59, 0.24);

  @media (max-width: 520px) {
    border-radius: 0;
    min-height: 420px;
  }

  &:focus {
    outline: 3px solid rgba(26, 79, 157, 0.35);
    outline-offset: 3px;
  }
`;

const MapGrid = styled.div`
  position: absolute;
  inset: 0;
  background:
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px) 0 0 / 72px 72px,
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px) 0 0 / 72px 72px;
`;

const markerColors = {
  blue: '#1a4f9d',
  green: '#2e7d32',
  red: '#c51f2d',
};

const Marker = styled.button`
  position: absolute;
  top: ${({ $top }) => $top};
  left: ${({ $left }) => $left};
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 0;
  border-radius: 999px;
  background: ${({ $type }) => markerColors[$type]};
  color: #ffffff;
  padding: 8px 11px;
  font-weight: 900;
  transform: translate(-50%, -50%);
  transition: transform 180ms ease, box-shadow 180ms ease;

  @media (max-width: 520px) {
    padding: 7px;

    span {
      display: none;
    }
  }

  &:hover,
  &:focus {
    box-shadow: 0 0 0 10px rgba(255, 255, 255, 0.12);
    transform: translate(-50%, -55%) scale(1.04);
    outline: 0;
  }
`;

const MapControls = styled.div`
  position: absolute;
  right: 18px;
  top: 50%;
  display: grid;
  gap: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.95);
  padding: 7px;
  transform: translateY(-50%);

  button {
    display: grid;
    width: 38px;
    height: 38px;
    place-items: center;
    border: 0;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.surfaceContainerLow};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const CardsSection = styled.section`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing(2.5)};
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing(5)} ${theme.spacing(2)}`};

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const NeighborhoodCard = styled.article`
  overflow: hidden;
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  padding: 0;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: transform 200ms ease, box-shadow 200ms ease;

  &:hover {
    transform: translateY(-5px) scale(1.01);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const ImageWrap = styled.div`
  position: relative;
  height: 190px;

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
  gap: 5px;
  border-radius: 999px;
  background: #e8f5e9;
  color: #2e7d32;
  padding: 6px 10px;
  font-size: 0.76rem;
  font-weight: 900;
`;

const CardBody = styled.div`
  padding: ${({ theme }) => theme.spacing(2)};

  p {
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    line-height: 1.55;
  }
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1)};

  h2 {
    margin: 0;
    color: ${({ theme }) => theme.colors.primary};
    font-size: 1.45rem;
  }
`;

const VibePill = styled.span`
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.surfaceContainerLow};
  color: ${({ theme }) => theme.colors.primary};
  padding: 5px 9px;
  font-size: 0.72rem;
  font-weight: 900;
  white-space: nowrap;
`;

const RentTable = styled.div`
  display: grid;
  gap: 8px;
  margin: ${({ theme }) => `${theme.spacing(2)} 0`};

  div {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    border-radius: ${({ theme }) => theme.roundness};
    background: ${({ theme }) => theme.colors.surface};
    padding: 10px 12px;
  }

  span {
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    font-weight: 800;
  }

  strong {
    color: ${({ theme }) => theme.colors.onSurface};
  }
`;

const FeatureRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border-radius: 999px;
    background: ${({ theme }) => theme.colors.surfaceContainerLow};
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    padding: 6px 9px;
    font-size: 0.74rem;
    font-weight: 900;
  }
`;

const TrustBanner = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.55fr);
  gap: ${({ theme }) => theme.spacing(4)};
  max-width: 1200px;
  margin: ${({ theme }) => `0 auto ${theme.spacing(5)}`};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.primary};
  color: #ffffff;
  padding: ${({ theme }) => theme.spacing(4)};

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 520px) {
    border-radius: 0;
    padding: ${({ theme }) => theme.spacing(2.5)};
  }
`;

const TrustCopy = styled.div`
  h2 {
    margin: 0 0 ${({ theme }) => theme.spacing(1)};
    font-family: Georgia, 'Times New Roman', serif;
    font-size: clamp(2rem, 5vw, 3.25rem);
    letter-spacing: 0;
  }

  p {
    max-width: 650px;
    color: rgba(255, 255, 255, 0.82);
    line-height: 1.65;
  }
`;

const Checklist = styled.ul`
  display: grid;
  gap: 12px;
  margin: ${({ theme }) => `${theme.spacing(2)} 0 0`};
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: center;
    gap: 9px;
    font-weight: 900;
  }

  svg {
    color: #64dd73;
  }
`;

const MetricGrid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const MetricCard = styled.div`
  border-radius: ${({ theme }) => theme.roundness};
  background: rgba(255, 255, 255, 0.12);
  padding: ${({ theme }) => theme.spacing(2.5)};

  strong,
  span {
    display: block;
  }

  strong {
    color: #cfe2ff;
    font-size: clamp(2.4rem, 6vw, 4rem);
    line-height: 1;
  }

  span {
    margin-top: 8px;
    color: rgba(255, 255, 255, 0.82);
    font-weight: 900;
  }
`;

const Footer = styled.footer`
  border-top: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
`;

const FooterGrid = styled.div`
  display: grid;
  grid-template-columns: 1.5fr repeat(3, minmax(140px, 1fr));
  gap: ${({ theme }) => theme.spacing(3)};
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing(4)} ${theme.spacing(2)}`};

  @media (max-width: 820px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const FooterBrand = styled.div`
  img {
    width: 62px;
    height: 62px;
    border-radius: ${({ theme }) => theme.roundness};
    object-fit: cover;
  }

  p {
    max-width: 320px;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    line-height: 1.55;
  }
`;

const FooterColumn = styled.div`
  display: grid;
  align-content: start;
  gap: 10px;

  h3 {
    margin: 0 0 8px;
    color: ${({ theme }) => theme.colors.primary};
  }

  button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    width: fit-content;
    border: 0;
    background: transparent;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    padding: 0;
    font-weight: 800;
  }
`;

const Copyright = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  padding: ${({ theme }) => theme.spacing(2)};
  text-align: center;
  font-weight: 800;
`;
