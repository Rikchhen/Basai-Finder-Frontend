import { ArrowLeft, Eye, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import styled from 'styled-components';
import logoImage from '../assets/basai-finder-logo.jpg';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { authApi, ApiError } from '../lib/api.js';

export function LoginPage({ onNavigate, onBack }) {
  const { login } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      onNavigate(user.role === 'landlord' ? 'landlordHome' : 'home');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email address first, then tap "Forgot password?" again.');
      return;
    }
    try {
      await authApi.forgotPassword(email);
    } finally {
      toast.success('If that email exists, a reset link has been sent.');
    }
  };

  return (
    <LoginShell>
      <TopBar>
        <BrandButton type="button" onClick={() => onNavigate('landing')}>
          <BrandLogo src={logoImage} alt="Basai Finder logo" />
          <span>Basai Finder</span>
        </BrandButton>
        <BackButton type="button" onClick={onBack}>
          <ArrowLeft size={18} />
        </BackButton>
      </TopBar>

      <LoginGrid>
        <FormPanel>
          <TrustBadge>
            <ShieldCheck size={16} />
            Secure tenant access
          </TrustBadge>
          <HeaderCopy>
            <h1>Log in to your account</h1>
            <p>Manage saved rooms, verified landlord contacts, and booking requests from one place.</p>
          </HeaderCopy>

          <Form onSubmit={handleLogin}>
            {error ? <ErrorText role="alert">{error}</ErrorText> : null}
            <Input
              icon={Mail}
              type="email"
              placeholder="Email address"
              aria-label="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <PasswordField>
              <Input
                icon={LockKeyhole}
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                aria-label="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <PasswordToggle
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((value) => !value)}
              >
                <Eye size={18} />
              </PasswordToggle>
            </PasswordField>

            <FormOptions>
              <RememberLabel>
                <input type="checkbox" />
                Remember me
              </RememberLabel>
              <TextButton type="button" onClick={handleForgotPassword}>
                Forgot password?
              </TextButton>
            </FormOptions>

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Logging in...' : 'Login'}
            </Button>
          </Form>

          <SignupPrompt>
            New to Basai Finder?
            <button type="button" onClick={() => onNavigate('register')}>
              Create account
            </button>
          </SignupPrompt>
        </FormPanel>

        <ImagePanel aria-label="Verified room preview">
          <ImageShade />
          <ImageContent>
            <strong>Verified rooms before you visit.</strong>
            <span>Keep landlord details, saved listings, and booking progress ready when you log in.</span>
          </ImageContent>
        </ImagePanel>
      </LoginGrid>
    </LoginShell>
  );
}

const LoginShell = styled.div`
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

const LoginGrid = styled.main`
  display: grid;
  grid-template-columns: minmax(0, 460px) minmax(420px, 1fr);
  gap: 28px;
  max-width: 1120px;
  min-height: 620px;
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

const Form = styled.form`
  display: grid;
  gap: 16px;
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

const PasswordField = styled.div`
  position: relative;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 12px;
  top: 23px;
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 0;
  border-radius: ${({ theme }) => theme.radius.md};
  background: transparent;
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  transform: translateY(-50%);
`;

const FormOptions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  font-size: 0.88rem;
  font-weight: 800;

  @media (max-width: 440px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const RememberLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;

  input {
    width: 16px;
    height: 16px;
    accent-color: ${({ theme }) => theme.colors.primary};
  }
`;

const TextButton = styled.button`
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 900;
`;

const SignupPrompt = styled.p`
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
    url('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80')
      center/cover;

  @media (max-width: 900px) {
    min-height: 320px;
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
