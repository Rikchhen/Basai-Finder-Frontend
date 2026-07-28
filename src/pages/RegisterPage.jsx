import { ArrowLeft, LockKeyhole, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { useState } from 'react';
import styled from 'styled-components';
import logoImage from '../assets/basai-finder-logo.jpg';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { ApiError } from '../lib/api.js';

export function RegisterPage({ onNavigate, onBack }) {
  const { register } = useAuth();
  const [accountType, setAccountType] = useState('tenant');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!agreed) {
      setError('Please agree to the verified contact checks and terms to continue.');
      return;
    }
    setSubmitting(true);
    try {
      const user = await register({ name, email, phone, password, role: accountType });
      onNavigate(user.role === 'landlord' ? 'landlordHome' : 'home');
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) {
        setError(err.details.map((detail) => detail.message).join(' '));
      } else {
        setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RegisterShell>
      <TopBar>
        <BrandButton type="button" onClick={() => onNavigate('landing')}>
          <BrandLogo src={logoImage} alt="Basai Finder logo" />
          <span>Basai Finder</span>
        </BrandButton>
        <BackButton type="button" onClick={onBack}>
          <ArrowLeft size={18} />
        </BackButton>
      </TopBar>

      <RegisterGrid>
        <ImagePanel aria-label="Tenant registration preview">
          <ImageShade />
          <ImageContent>
            <strong>Start with a verified profile.</strong>
            <span>Create your tenant account to save rooms, contact landlords, and keep your visits organized.</span>
          </ImageContent>
        </ImagePanel>

        <FormPanel>
          <TrustBadge>
            <ShieldCheck size={16} />
            Nepal-first housing access
          </TrustBadge>
          <HeaderCopy>
            <h1>Create your account</h1>
            <p>Join Basai Finder to discover verified rooms and connect with trusted landlords faster.</p>
          </HeaderCopy>

          <Form onSubmit={handleSubmit}>
            {error ? <ErrorText role="alert">{error}</ErrorText> : null}
            <Input
              icon={UserRound}
              placeholder="Full name"
              aria-label="Full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
            <Input
              icon={Mail}
              type="email"
              placeholder="Email address"
              aria-label="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <Input
              icon={Phone}
              prefix="+977"
              placeholder="Mobile number"
              aria-label="Mobile number"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              hint="10 digits, starting with 9"
              required
            />
            <Input
              icon={LockKeyhole}
              type="password"
              placeholder="Password"
              aria-label="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
            />

            <AccountType aria-label="Account type">
              <AccountOption>
                <input
                  type="radio"
                  name="accountType"
                  checked={accountType === 'tenant'}
                  onChange={() => setAccountType('tenant')}
                />
                Tenant
              </AccountOption>
              <AccountOption>
                <input
                  type="radio"
                  name="accountType"
                  checked={accountType === 'landlord'}
                  onChange={() => setAccountType('landlord')}
                />
                Landlord
              </AccountOption>
            </AccountType>

            <TermsLabel>
              <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
              I agree to verified contact checks and Basai Finder terms.
            </TermsLabel>

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating account...' : 'Register'}
            </Button>
          </Form>

          <SigninPrompt>
            Already have an account?
            <button type="button" onClick={() => onNavigate('login')}>
              Log in
            </button>
          </SigninPrompt>
        </FormPanel>
      </RegisterGrid>
    </RegisterShell>
  );
}

const RegisterShell = styled.div`
  min-height: 100vh;
  background: #f7f9ff;
  color: ${({ theme }) => theme.colors.onSurface};
  padding: 24px clamp(16px, 5vw, 56px) 48px;
`;

const TopBar = styled.header`
  display: flex;
  max-width: 1120px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 0 auto 40px;

  @media (max-width: 520px) {
    margin-bottom: 24px;
  }
`;

const BrandButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 1.12rem;
  font-weight: 900;

  @media (max-width: 420px) {
    span {
      display: none;
    }
  }
`;

const BrandLogo = styled.img`
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.radius.md};
  object-fit: cover;
`;

const BackButton = styled.button`
  display: inline-flex;
  width: 40px;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  color: ${({ theme }) => theme.colors.primary};
  padding: 0;
  font-weight: 800;
`;

const RegisterGrid = styled.main`
  display: grid;
  grid-template-columns: minmax(420px, 1fr) minmax(0, 460px);
  gap: 28px;
  max-width: 1120px;
  min-height: 650px;
  align-items: stretch;
  margin: 0 auto;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    min-height: auto;
  }
`;

const FormPanel = styled.section`
  display: flex;
  flex-direction: column;
  justify-content: center;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  padding: clamp(28px, 5vw, 48px);
  box-shadow: 0 18px 42px rgba(26, 79, 157, 0.1);
`;

const TrustBadge = styled.span`
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  background: rgba(0, 104, 55, 0.12);
  color: ${({ theme }) => theme.colors.success};
  padding: 7px 11px;
  font-size: 0.78rem;
  font-weight: 900;
`;

const HeaderCopy = styled.div`
  margin: 22px 0 28px;

  h1 {
    margin: 0 0 10px;
    color: ${({ theme }) => theme.colors.primary};
    font-size: clamp(2rem, 5vw, 3rem);
    line-height: 1.08;
    letter-spacing: 0;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    line-height: 1.65;
  }
`;

const ErrorText = styled.p`
  margin: 0;
  border-radius: ${({ theme }) => theme.radius.md};
  background: rgba(197, 31, 45, 0.1);
  color: ${({ theme }) => theme.colors.error};
  padding: 10px 12px;
  font-size: 0.86rem;
  font-weight: 800;
`;

const Form = styled.form`
  display: grid;
  gap: 16px;
`;

const AccountType = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 420px) {
    grid-template-columns: 1fr;
  }
`;

const AccountOption = styled.label`
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: 8px;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  padding: 0 12px;
  font-weight: 900;

  input {
    width: 16px;
    height: 16px;
    accent-color: ${({ theme }) => theme.colors.primary};
  }
`;

const TermsLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  font-size: 0.86rem;
  font-weight: 800;
  line-height: 1.45;

  input {
    width: 16px;
    height: 16px;
    margin-top: 2px;
    accent-color: ${({ theme }) => theme.colors.primary};
  }
`;

const SigninPrompt = styled.p`
  margin: 24px 0 0;
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  text-align: center;
  font-weight: 700;

  button {
    border: 0;
    background: transparent;
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 900;
    margin-left: 6px;
  }
`;

const ImagePanel = styled.aside`
  position: relative;
  min-height: 420px;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radius.md};
  background:
    url('https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=1200&q=80')
      center/cover;

  @media (max-width: 900px) {
    min-height: 320px;
    order: 2;
  }

  @media (max-width: 520px) {
    min-height: 260px;
  }
`;

const ImageShade = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 56, 123, 0.08), rgba(0, 0, 0, 0.72));
`;

const ImageContent = styled.div`
  position: absolute;
  right: 28px;
  bottom: 28px;
  left: 28px;
  color: #ffffff;

  strong,
  span {
    display: block;
  }

  strong {
    max-width: 520px;
    margin-bottom: 10px;
    font-size: clamp(1.8rem, 4vw, 3rem);
    line-height: 1.05;
  }

  span {
    max-width: 480px;
    color: rgba(255, 255, 255, 0.88);
    line-height: 1.6;
  }
`;
