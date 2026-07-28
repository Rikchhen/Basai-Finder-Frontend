import { ArrowLeft, AtSign, Lock, Phone, ScrollText, ShieldCheck } from 'lucide-react';
import styled from 'styled-components';
import { Button } from '../components/ui/Button.jsx';

const TOPICS = {
  about: {
    icon: ShieldCheck,
    title: 'About Basai Finder',
    intro:
      'Basai Finder helps renters across Nepal find reliable rooms and verified landlords, without the guesswork of scattered listings and unverified contacts.',
    sections: [
      {
        heading: 'What we do',
        body: 'We collect room and apartment listings across the Kathmandu Valley, check landlord details, and give tenants a single place to search, save, message, and request visits.',
      },
      {
        heading: 'How verification works',
        body: 'Listings marked "Basai Verified" have been reviewed by our moderation team. We check landlord identity and listing details before a room earns the badge. Unverified rooms stay visible but are clearly labelled.',
      },
      {
        heading: 'Who it is for',
        body: 'Tenants looking for a room they can trust, and landlords who want serious, document-ready enquiries instead of endless phone calls.',
      },
    ],
  },
  terms: {
    icon: ScrollText,
    title: 'Terms of Use',
    intro:
      'By using Basai Finder you agree to the terms below. This is a plain-language summary intended for a student/demo deployment, not formal legal advice.',
    sections: [
      {
        heading: 'Using the service',
        body: 'You must provide accurate information when registering. You are responsible for activity on your account and for keeping your password secure.',
      },
      {
        heading: 'Listings',
        body: 'Landlords are responsible for the accuracy of their listings, including price, location, and availability. We may reject or remove listings that appear misleading, duplicated, or unsafe.',
      },
      {
        heading: 'Conduct',
        body: 'Do not harass other users, post false listings, or attempt to collect deposits before an in-person viewing. Accounts that do so may be suspended.',
      },
      {
        heading: 'Liability',
        body: 'Basai Finder connects tenants and landlords. We are not a party to any rental agreement and do not guarantee the condition of any property.',
      },
    ],
  },
  privacy: {
    icon: Lock,
    title: 'Privacy',
    intro:
      'We keep the data we collect to the minimum needed to run the service. This page explains what is stored and why.',
    sections: [
      {
        heading: 'What we store',
        body: 'Your name, email, phone number, and role. Landlords may add business and payout details. Tenants may add profile and document-readiness information. Uploaded photos are stored on our server.',
      },
      {
        heading: 'How it is used',
        body: 'Your details are used to authenticate you, show your listings or enquiries to the other party in a conversation, and send you notifications about bookings and messages.',
      },
      {
        heading: 'What we do not do',
        body: 'We do not sell your data. We do not share your contact details publicly — landlords and tenants only see each other through a conversation you have both joined.',
      },
      {
        heading: 'Your control',
        body: 'You can update your profile at any time from Profile settings. Contact support to request account deletion.',
      },
    ],
  },
  support: {
    icon: Phone,
    title: 'Contact Support',
    intro: 'Something broken, a suspicious listing, or a question about verification? Reach out.',
    sections: [
      {
        heading: 'Report a listing',
        body: 'If a listing looks fake, mispriced, or the landlord asks for a deposit before a viewing, report it. Our moderation team reviews reports and can unpublish a listing.',
      },
      {
        heading: 'Verification questions',
        body: 'Verification is manual. If your listing has been pending for a while, or your account verification was revoked, get in touch and we will explain why.',
      },
      {
        heading: 'Safety reminder',
        body: 'Never pay a security deposit before visiting a property in person, and prefer to meet at the property during daylight hours.',
      },
    ],
  },
};

export function InfoPage({ onNavigate, topic = 'about' }) {
  const content = TOPICS[topic] || TOPICS.about;
  const Icon = content.icon;

  return (
    <Wrapper>
      <BackRow>
        <BackButton type="button" onClick={() => onNavigate('landing')} aria-label="Go back">
          <ArrowLeft size={18} />
        </BackButton>
        <TopicNav aria-label="Information pages">
          {Object.entries(TOPICS).map(([key, value]) => (
            <TopicButton
              key={key}
              type="button"
              $active={key === topic}
              onClick={() => onNavigate('info', { topic: key })}
            >
              {value.title.replace('Contact ', '').replace('Basai Finder', 'Us')}
            </TopicButton>
          ))}
        </TopicNav>
      </BackRow>

      <Header>
        <IconTile>
          <Icon size={26} />
        </IconTile>
        <h1>{content.title}</h1>
        <p>{content.intro}</p>
      </Header>

      <Sections>
        {content.sections.map((section) => (
          <Section key={section.heading}>
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
          </Section>
        ))}
      </Sections>

      <ContactCard>
        <AtSign size={20} />
        <div>
          <strong>support@basaifinder.example</strong>
          <span>We aim to reply within two business days.</span>
        </div>
      </ContactCard>

      <Button type="button" onClick={() => onNavigate('rooms')}>
        Browse rooms
      </Button>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  max-width: 760px;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing(3)} ${theme.spacing(2)} ${theme.spacing(7)}`};
`;

const BackRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  margin-bottom: ${({ theme }) => theme.spacing(3)};
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
`;

const TopicNav = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const TopicButton = styled.button`
  border: 1px solid ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.outlineVariant)};
  border-radius: 999px;
  background: ${({ $active, theme }) => ($active ? theme.colors.primary : '#ffffff')};
  color: ${({ $active, theme }) => ($active ? '#ffffff' : theme.colors.onSurfaceVariant)};
  padding: 7px 13px;
  font-size: 0.84rem;
  font-weight: 800;
`;

const Header = styled.header`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
  margin-bottom: ${({ theme }) => theme.spacing(3)};

  h1 {
    margin: 0;
    color: ${({ theme }) => theme.colors.primary};
    font-size: clamp(1.9rem, 4vw, 2.6rem);
    line-height: 1.1;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    font-size: 1.02rem;
    line-height: 1.65;
  }
`;

const IconTile = styled.span`
  display: grid;
  width: 52px;
  height: 52px;
  place-items: center;
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLow};
  color: ${({ theme }) => theme.colors.primary};
`;

const Sections = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-bottom: ${({ theme }) => theme.spacing(3)};
`;

const Section = styled.section`
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  padding: ${({ theme }) => theme.spacing(2)};

  h2 {
    margin: 0 0 6px;
    font-size: 1.05rem;
    letter-spacing: 0;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    line-height: 1.65;
  }
`;

const ContactCard = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.25)};
  margin-bottom: ${({ theme }) => theme.spacing(2.5)};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.primary};
  padding: ${({ theme }) => theme.spacing(2)};
  color: #ffffff;

  strong {
    display: block;
  }

  span {
    color: rgba(255, 255, 255, 0.85);
    font-size: 0.88rem;
  }
`;
