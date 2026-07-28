import React, { useEffect, useState } from "react";
import styled, { ThemeProvider, createGlobalStyle } from "styled-components";
import { listingsApi, neighborhoodsApi, toUploadUrl } from "../lib/api.js";
import { formatPrice } from "../lib/format.js";
import { theme } from "../styles/theme.js";
import heroImage from "../assets/hero-kathmandu.jpg";
import roomPlaceholder from "../assets/room-placeholder.jpg";

// Photos live in public/art so the same paths also work from the database.
// Used as a fallback when a neighbourhood has no image of its own.
const NEIGHBOURHOOD_ART = [
  "/art/nb-baneshwor.jpg",
  "/art/nb-lalitpur.jpg",
  "/art/nb-koteshwor.jpg",
  "/art/nb-jhamsikhel.jpg",
  "/art/nb-boudha.jpg",
  "/art/nb-maharajgunj.jpg",
];
const artFor = (index) => NEIGHBOURHOOD_ART[index % NEIGHBOURHOOD_ART.length];
import {
  FaBath,
  FaBed,
  FaCheckCircle,
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaRegBuilding,
  FaSearch,
  FaShieldAlt,
  FaStar,
  FaUserCheck,
  FaUserCircle,
} from "react-icons/fa";
import { MdCompareArrows, MdOutlineSupportAgent } from "react-icons/md";

const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    background: ${({ theme }) => theme.colors.bg};
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.fonts.body};
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button,
  input,
  select {
    font: inherit;
  }
`;

const features = [
  { icon: <FaCheckCircle />, label: "Verified Listings" },
  { icon: <FaUserCheck />, label: "No Brokers" },
  { icon: <FaPhoneAlt />, label: "Direct Contact" },
  { icon: <FaShieldAlt />, label: "Secure" },
];

const workSteps = [
  {
    icon: <FaSearch />,
    title: "Search",
    text: "Browse rooms, flats, and apartments by neighborhood, price, and living preferences.",
  },
  {
    icon: <MdCompareArrows />,
    title: "Compare",
    text: "Review photos, amenities, rent, and verified details side by side before shortlisting.",
  },
  {
    icon: <MdOutlineSupportAgent />,
    title: "Contact",
    text: "Reach owners directly, ask questions, and schedule visits without unnecessary middlemen.",
  },
];

const testimonials = [
  {
    quote:
      "Basai Finder helped me find a clean room near my college in just two days. The verified badge made the search feel much safer.",
    name: "Aayush Shrestha",
    role: "Student, Kathmandu",
  },
  {
    quote:
      "I compared several listings before calling owners directly. The whole process felt clear, quick, and transparent.",
    name: "Pratiksha Karki",
    role: "Working Professional",
  },
  {
    quote:
      "As a landlord, listing my room was simple. I received genuine tenant inquiries without broker calls.",
    name: "Suman Maharjan",
    role: "Property Owner",
  },
];

function scrollToListings(event) {
  event?.preventDefault();
  document.getElementById("listings")?.scrollIntoView({ behavior: "smooth" });
}

function AuthLayout({ onNavigate }) {
  const navigate = (page) => {
    onNavigate?.(page);
  };

  const [listings, setListings] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);

  useEffect(() => {
    let cancelled = false;

    listingsApi
      .list({ status: "verified", limit: 3 })
      .then((data) => {
        if (!cancelled) setListings(data.listings);
      })
      .catch(() => {});

    neighborhoodsApi
      .list()
      .then((data) => {
        if (!cancelled) setNeighborhoods(data.neighborhoods.slice(0, 3));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Page>
        <Header>
          <Nav aria-label="Primary navigation">
            <Logo href="#" onClick={(event) => event.preventDefault()}>
              Basai Finder
            </Logo>
            <NavSearch aria-label="Quick district search">
              <FaSearch />
              <input type="search" placeholder="Search districts" />
            </NavSearch>
            <NavLinks>
              <NavButtonLink type="button" onClick={scrollToListings}>
                Find Rooms
              </NavButtonLink>
              <NavButtonLink type="button" onClick={() => navigate("register")}>
                List Property
              </NavButtonLink>
              <a href="#footer">Help</a>
            </NavLinks>
            <ProfileActions>
              <LoginButton type="button" onClick={() => navigate("login")}>
                Login / Register
              </LoginButton>
              <ProfileButton type="button" aria-label="Open profile" onClick={() => navigate("login")}>
                <FaUserCircle />
              </ProfileButton>
            </ProfileActions>
          </Nav>
        </Header>

        <main>
          <Hero>
            <HeroOverlay>
              <HeroInner>
                <HeroTitle>Find Your Perfect Home in Nepal</HeroTitle>
                <SearchPanel aria-label="Property search" onSubmit={scrollToListings}>
                  <Field>
                    <label htmlFor="location">Location</label>
                    <input
                      id="location"
                      type="text"
                      placeholder="e.g., Kathmandu"
                    />
                  </Field>
                  <Field>
                    <label htmlFor="roomType">Room Type</label>
                    <select id="roomType" defaultValue="">
                      <option value="" disabled>
                        Select type
                      </option>
                      <option>Single Room</option>
                      <option>1BHK</option>
                      <option>2BHK</option>
                      <option>Apartment</option>
                    </select>
                  </Field>
                  <Field>
                    <label htmlFor="priceRange">Price Range</label>
                    <select id="priceRange" defaultValue="">
                      <option value="" disabled>
                        Select budget
                      </option>
                      <option>Under Rs. 15,000</option>
                      <option>Rs. 15,000 - 30,000</option>
                      <option>Rs. 30,000 - 50,000</option>
                      <option>Above Rs. 50,000</option>
                    </select>
                  </Field>
                  <SearchButton type="submit">
                    <FaSearch />
                    Search
                  </SearchButton>
                </SearchPanel>
                <FeatureList>
                  {features.map((feature) => (
                    <FeatureItem key={feature.label}>
                      {feature.icon}
                      <span>{feature.label}</span>
                    </FeatureItem>
                  ))}
                </FeatureList>
              </HeroInner>
            </HeroOverlay>
          </Hero>

          <Section>
            <SectionIntro>
              <SectionTitle>How Basai Finder Works</SectionTitle>
              <SectionText>
                A simpler way for tenants and property owners in Nepal to find,
                compare, and connect with confidence.
              </SectionText>
            </SectionIntro>
            <WorkGrid>
              {workSteps.map((step) => (
                <WorkCard key={step.title}>
                  <IconCircle>{step.icon}</IconCircle>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </WorkCard>
              ))}
            </WorkGrid>
          </Section>

          <Section id="listings">
            <ListingHeader>
              <div>
                <SectionTitle>Featured Verified Listings</SectionTitle>
                <SectionText>
                  Handpicked rooms and apartments checked for trustworthy
                  details.
                </SectionText>
              </div>
              <TextLink
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  navigate("login");
                }}
              >
                View All Listings -&gt;
              </TextLink>
            </ListingHeader>
            <ListingGrid>
              {listings.map((listing) => (
                <PropertyCard key={listing._id}>
                  <ImageWrap>
                    <img
                      src={toUploadUrl(listing.images?.[0]) || roomPlaceholder}
                      alt={listing.title}
                      onError={(event) => {
                        event.currentTarget.src = roomPlaceholder;
                      }}
                    />
                    <VerifiedBadge>
                    <FaShieldAlt />
                    Verified
                  </VerifiedBadge>
                    <PriceTag>{formatPrice(listing.price)}/mo</PriceTag>
                  </ImageWrap>
                  <CardBody>
                    <h3>{listing.title}</h3>
                    <LocationLine>
                      <FaMapMarkerAlt />
                      {listing.location.address}, {listing.location.district}
                    </LocationLine>
                    <DetailsRow>
                      <span>
                        <FaBed />
                        {listing.bedrooms} Bed
                      </span>
                      <span>
                        <FaBath />
                        {listing.bathrooms} Bath
                      </span>
                      {listing.areaSqft ? (
                        <span>
                          <FaRegBuilding />
                          {listing.areaSqft} sq ft
                        </span>
                      ) : null}
                    </DetailsRow>
                  </CardBody>
                </PropertyCard>
              ))}
            </ListingGrid>
          </Section>

          <NeighborhoodSection>
            <SectionIntro>
              <SectionTitle>Explore Popular Neighborhoods</SectionTitle>
              <SectionText>
                Discover high-demand rental areas across Kathmandu Valley.
              </SectionText>
            </SectionIntro>
            <NeighborhoodGrid>
              {neighborhoods.map((area, index) => (
                <NeighborhoodCard key={area._id} $image={area.image || artFor(index)}>
                  <span>{area.name}</span>
                </NeighborhoodCard>
              ))}
            </NeighborhoodGrid>
          </NeighborhoodSection>

          <Section>
            <SectionIntro>
              <SectionTitle>Trusted by Thousands of Tenants</SectionTitle>
              <SectionText>
                Real stories from renters and owners using Basai Finder.
              </SectionText>
            </SectionIntro>
            <TestimonialGrid>
              {testimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.name}>
                  <Stars aria-label="5 star rating">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <FaStar key={index} />
                    ))}
                  </Stars>
                  <Quote>"{testimonial.quote}"</Quote>
                  <Profile>
                    <Avatar>{testimonial.name.charAt(0)}</Avatar>
                    <div>
                      <strong>{testimonial.name}</strong>
                      <span>{testimonial.role}</span>
                    </div>
                  </Profile>
                </TestimonialCard>
              ))}
            </TestimonialGrid>
          </Section>

          <CtaSection id="cta">
            <CtaContent>
              <div>
                <CtaTitle>Have a room to rent out?</CtaTitle>
                <CtaText>
                  Reach serious tenants faster with verified listing support,
                  direct inquiries, and simple property management tools.
                </CtaText>
                <CtaButton type="button" onClick={() => navigate("register")}>
                  List Your Room Now
                </CtaButton>
              </div>
              <PhoneMockup aria-label="Basai Finder mobile app preview">
                <PhoneTop />
                <PhoneCard>
                  <small>Featured</small>
                  <strong>2BHK in Lalitpur</strong>
                  <span>Rs. 36,000/mo</span>
                </PhoneCard>
                <PhoneList>
                  <span />
                  <span />
                  <span />
                </PhoneList>
              </PhoneMockup>
            </CtaContent>
          </CtaSection>
        </main>

        <Footer id="footer">
          <FooterGrid>
            <FooterBrand>
              <Logo href="#">Basai Finder</Logo>
              <p>
                Helping Nepal find verified rooms, apartments, and trusted
                rental connections.
              </p>
            </FooterBrand>
            <FooterColumn>
              <h3>Platform</h3>
              <a href="#">About Us</a>
              <a href="#">Find a Room</a>
              <a href="#">Explore</a>
            </FooterColumn>
            <FooterColumn>
              <h3>Legal</h3>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms &amp; Conditions</a>
            </FooterColumn>
            <FooterColumn>
              <h3>Contact</h3>
              <span>
                <FaPhoneAlt /> +977 980-0000000
              </span>
              <span>
                <FaEnvelope /> hello@basaifinder.com
              </span>
              <span>Support: Sun-Fri, 9 AM - 6 PM</span>
            </FooterColumn>
          </FooterGrid>
        </Footer>
      </Page>
    </ThemeProvider>
  );
}

export default AuthLayout;

const Page = styled.div`
  min-height: 100vh;
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid #e9ecef;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(14px);
  box-shadow: ${({ theme }) => theme.shadows.nav};
`;

const Nav = styled.nav`
  width: min(1200px, calc(100% - 32px));
  min-height: 76px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;

  @media (max-width: 768px) {
    min-height: auto;
    padding: 16px 0;
    flex-wrap: wrap;
    gap: 14px;
  }
`;

const Logo = styled.a`
  color: ${({ theme }) => theme.colors.primary};
  font-size: 1.35rem;
  font-weight: 800;
  white-space: nowrap;
`;

const NavSearch = styled.div`
  width: min(320px, 32vw);
  min-height: 44px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surfaceLow};
  color: ${({ theme }) => theme.colors.muted};
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;

  input {
    min-width: 0;
    width: 100%;
    border: 0;
    outline: 0;
    background: transparent;
    color: ${({ theme }) => theme.colors.text};
  }

  @media (max-width: 980px) {
    width: 100%;
    order: 3;
  }
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  color: ${({ theme }) => theme.colors.text};
  font-weight: 600;

  a:hover {
    color: ${({ theme }) => theme.colors.primary};
  }

  button:hover {
    color: ${({ theme }) => theme.colors.primary};
  }

  @media (max-width: 768px) {
    width: 100%;
    order: 4;
    justify-content: space-between;
    gap: 12px;
    font-size: 0.92rem;
  }
`;

const NavButtonLink = styled.button`
  border: 0;
  background: transparent;
  color: inherit;
  padding: 0;
  font-weight: inherit;
`;

const ProfileActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const LoginButton = styled.button`
  border: 0;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  padding: 14px 24px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 180ms ease, background 180ms ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
    transform: translateY(-1px);
  }

  @media (max-width: 420px) {
    padding: 10px 14px;
    font-size: 0.88rem;
  }
`;

const ProfileButton = styled.button`
  width: 44px;
  height: 44px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.primary};
  display: grid;
  place-items: center;
  font-size: 1.55rem;
  cursor: pointer;
`;

const Hero = styled.section`
  min-height: 640px;
  /* Local artwork: no external hotlink, so the hero never fails to load. */
  background-image: url(${heroImage});
  background-position: center bottom;
  background-size: cover;
`;

const HeroOverlay = styled.div`
  min-height: 640px;
  display: flex;
  align-items: center;
  background:
    linear-gradient(180deg, rgba(4, 20, 38, 0.62), rgba(4, 20, 38, 0.48)),
    linear-gradient(90deg, rgba(15, 76, 129, 0.36), rgba(217, 37, 52, 0.12));
`;

const HeroInner = styled.div`
  width: min(1080px, calc(100% - 32px));
  margin: 0 auto;
  padding: 108px 0 60px;
  text-align: center;
`;

const HeroTitle = styled.h1`
  max-width: 920px;
  margin: 0 auto 44px;
  color: white;
  font-size: clamp(2.1rem, 5vw, 3rem);
  line-height: 1.16;
  letter-spacing: 0;
`;

const SearchPanel = styled.form`
  display: grid;
  grid-template-columns: 1.35fr 1fr 1fr auto;
  gap: 14px;
  align-items: end;
  padding: 24px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.cardHover};
  text-align: left;

  @media (max-width: 900px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
    padding: 14px;
  }
`;

const Field = styled.div`
  display: grid;
  gap: 8px;

  label {
    color: ${({ theme }) => theme.colors.text};
    font-size: 0.82rem;
    font-weight: 800;
  }

  input,
  select {
    width: 100%;
    min-height: 50px;
    border: 1px solid #dee2e6;
    border-radius: ${({ theme }) => theme.radius.md};
    background: white;
    color: ${({ theme }) => theme.colors.text};
    padding: 0 14px;
    outline: none;
  }

  input:focus,
  select:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(15, 76, 129, 0.14);
  }
`;

const SearchButton = styled.button`
  min-height: 50px;
  border: 0;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  padding: 0 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-weight: 800;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark};
  }
`;

const FeatureList = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(120px, 1fr));
  gap: 14px;
  margin-top: 24px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const FeatureItem = styled.div`
  min-height: 58px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: ${({ theme }) => theme.radius.md};
  background: rgba(255, 255, 255, 0.13);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-weight: 700;
  backdrop-filter: blur(10px);

  svg {
    color: ${({ theme }) => theme.colors.accent};
  }
`;

const Section = styled.section`
  width: min(1200px, calc(100% - 32px));
  margin: 0 auto;
  padding: 88px 0;

  @media (max-width: 768px) {
    padding: 64px 0;
  }
`;

const SectionIntro = styled.div`
  max-width: 720px;
  margin: 0 auto 38px;
  text-align: center;
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: clamp(1.75rem, 4vw, 2rem);
  line-height: 1.25;
  letter-spacing: 0;
`;

const SectionText = styled.p`
  margin: 12px 0 0;
  color: ${({ theme }) => theme.colors.muted};
  font-size: 1rem;
  line-height: 1.7;
`;

const WorkGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const WorkCard = styled.article`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.card};
  background: ${({ theme }) => theme.colors.surfaceLow};
  padding: 32px;
  box-shadow: ${({ theme }) => theme.shadows.card};
  transition: transform 200ms ease-in-out, box-shadow 200ms ease-in-out;

  h3 {
    margin: 20px 0 10px;
    font-size: 1.3rem;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.muted};
    line-height: 1.7;
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: ${({ theme }) => theme.shadows.cardHover};
  }
`;

const IconCircle = styled.div`
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  display: grid;
  place-items: center;
  font-size: 1.45rem;
`;

const ListingHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 30px;

  ${SectionText} {
    max-width: 600px;
  }

  @media (max-width: 700px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const TextLink = styled.a`
  color: ${({ theme }) => theme.colors.accent};
  font-weight: 800;
  white-space: nowrap;
`;

const ListingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

const PropertyCard = styled.article`
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radius.card};
  background: white;
  box-shadow: ${({ theme }) => theme.shadows.card};
  transition: transform 200ms ease-in-out, box-shadow 200ms ease-in-out;

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.cardHover};
  }
`;

const ImageWrap = styled.div`
  position: relative;
  aspect-ratio: 1.45 / 1;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }
`;

const BadgeBase = styled.span`
  position: absolute;
  left: 14px;
  border-radius: ${({ theme }) => theme.radius.pill};
  color: white;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.8rem;
  font-weight: 800;
`;

const VerifiedBadge = styled(BadgeBase)`
  top: 14px;
  background: ${({ theme }) => theme.colors.verified};
  padding: 8px 10px;
`;

const PriceTag = styled(BadgeBase)`
  bottom: 14px;
  background: ${({ theme }) => theme.colors.primary};
  padding: 9px 12px;
`;

const CardBody = styled.div`
  padding: 22px;

  h3 {
    margin: 0 0 12px;
    font-size: 1.15rem;
    line-height: 1.35;
  }
`;

const LocationLine = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    color: ${({ theme }) => theme.colors.accent};
  }
`;

const DetailsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 18px;
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.9rem;
  font-weight: 700;

  span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }

  svg {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const NeighborhoodSection = styled(Section)`
  width: 100%;
  max-width: none;
  background: white;
  padding-left: max(16px, calc((100% - 1200px) / 2));
  padding-right: max(16px, calc((100% - 1200px) / 2));
`;

const NeighborhoodGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
`;

const NeighborhoodCard = styled.article`
  min-height: 280px;
  position: relative;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radius.card};
  background-image:
    linear-gradient(180deg, rgba(8, 24, 40, 0.05), rgba(8, 24, 40, 0.72)),
    url("${({ $image }) => $image}");
  background-position: center;
  background-size: cover;

  span {
    position: absolute;
    left: 24px;
    bottom: 22px;
    color: white;
    font-size: 1.55rem;
    font-weight: 800;
  }
`;

const TestimonialGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const TestimonialCard = styled.article`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.card};
  background: white;
  padding: 28px;
  box-shadow: ${({ theme }) => theme.shadows.card};
  display: flex;
  flex-direction: column;
  gap: 22px;
`;

const Stars = styled.div`
  display: flex;
  gap: 5px;
  color: ${({ theme }) => theme.colors.gold};
`;

const Quote = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.75;
`;

const Profile = styled.div`
  display: flex;
  align-items: center;
  gap: 13px;
  margin-top: auto;

  div {
    display: grid;
    gap: 3px;
  }

  span {
    color: ${({ theme }) => theme.colors.muted};
    font-size: 0.9rem;
  }
`;

const Avatar = styled.div`
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  display: grid;
  place-items: center;
  font-weight: 800;
`;

const CtaSection = styled.section`
  width: min(1200px, calc(100% - 32px));
  margin: 0 auto 88px;
`;

const CtaContent = styled.div`
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radius.card};
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.1) 25%, transparent 25%) 0 0 / 42px 42px,
    linear-gradient(135deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.primaryDark});
  padding: clamp(34px, 6vw, 64px);
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 36px;
  align-items: center;

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
`;

const CtaTitle = styled.h2`
  margin: 0;
  color: white;
  font-size: clamp(2rem, 5vw, 3.3rem);
  line-height: 1.1;
  letter-spacing: 0;
`;

const CtaText = styled.p`
  max-width: 620px;
  margin: 16px 0 28px;
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.75;
`;

const CtaButton = styled.button`
  border: 0;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.accent};
  color: white;
  padding: 15px 24px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.18);
`;

const PhoneMockup = styled.div`
  width: min(100%, 280px);
  min-height: 430px;
  margin: 0 auto;
  border: 10px solid rgba(255, 255, 255, 0.24);
  border-radius: 34px;
  background: ${({ theme }) => theme.colors.bg};
  padding: 22px;
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.28);
`;

const PhoneTop = styled.div`
  width: 88px;
  height: 8px;
  margin: 0 auto 26px;
  border-radius: 99px;
  background: #c7d5e6;
`;

const PhoneCard = styled.div`
  border-radius: ${({ theme }) => theme.radius.card};
  background: white;
  padding: 18px;
  box-shadow: 0 12px 28px rgba(15, 76, 129, 0.14);
  display: grid;
  gap: 8px;

  small {
    color: ${({ theme }) => theme.colors.accent};
    font-weight: 800;
  }

  strong {
    color: ${({ theme }) => theme.colors.text};
  }

  span {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 800;
  }
`;

const PhoneList = styled.div`
  display: grid;
  gap: 14px;
  margin-top: 20px;

  span {
    height: 54px;
    border-radius: ${({ theme }) => theme.radius.md};
    background: white;
    opacity: 0.78;
  }
`;

const Footer = styled.footer`
  background: #eaf0f7;
  padding: 56px 0;
`;

const FooterGrid = styled.div`
  width: min(1200px, calc(100% - 32px));
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.4fr repeat(3, 1fr);
  gap: 34px;

  @media (max-width: 860px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const FooterBrand = styled.div`
  p {
    max-width: 330px;
    color: ${({ theme }) => theme.colors.muted};
    line-height: 1.7;
  }
`;

const FooterColumn = styled.div`
  display: grid;
  align-content: start;
  gap: 12px;
  color: ${({ theme }) => theme.colors.muted};

  h3 {
    margin: 0 0 6px;
    color: ${({ theme }) => theme.colors.text};
    font-size: 1rem;
  }

  a:hover {
    color: ${({ theme }) => theme.colors.primary};
  }

  span {
    display: inline-flex;
    align-items: center;
    gap: 9px;
  }
`;
