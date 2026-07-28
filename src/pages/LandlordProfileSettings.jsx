import {
  BadgeCheck,
  CheckCircle2,
  HelpCircle,
  Home,
  Landmark,
  LayoutDashboard,
  LockKeyhole,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import styled from 'styled-components';
import { useEffect, useState } from 'react';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';
import { UserAvatar } from '../components/ui/UserAvatar.jsx';
import { ProfileImageUploader } from '../components/ProfileImageUploader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usersApi, ApiError } from '../lib/api.js';

const portalItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'listings', label: 'Manage Listings', icon: Home },
  { key: 'verification', label: 'Verification', icon: ShieldCheck },
  { key: 'profile', label: 'Profile Settings', icon: UserRound },
  { key: 'support', label: 'Support', icon: HelpCircle },
];

export function LandlordProfileSettings({ onNavigate }) {
  const { user, refreshUser } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [organizationName, setOrganizationName] = useState(user?.landlordProfile?.organizationName || '');
  const [businessAddress, setBusinessAddress] = useState(user?.landlordProfile?.businessAddress || '');
  const [bio, setBio] = useState(user?.landlordProfile?.bio || '');

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setPhone(user.phone || '');
    setOrganizationName(user.landlordProfile?.organizationName || '');
    setBusinessAddress(user.landlordProfile?.businessAddress || '');
    setBio(user.landlordProfile?.bio || '');
  }, [user]);

  const notify = (text) => {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 2400);
  };

  const handlePortalNav = (key) => {
    if (key === 'dashboard') onNavigate('landlordHome');
    if (key === 'listings') onNavigate('landlordHome');
    if (key === 'verification') notify('Verification center opens once your account is fully reviewed.');
    if (key === 'support') notify('Support center opened.');
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      await usersApi.updateMe({ name, phone, landlordProfile: { organizationName, businessAddress, bio } });
      await refreshUser();
      notify('Landlord profile saved.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setError('');
    setSavingPassword(true);
    try {
      await usersApi.updatePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setShowPasswordForm(false);
      notify('Password updated.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update your password.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Page>
      {message ? <Toast role="status">{message}</Toast> : null}
      <PortalShell>
        <Sidebar aria-label="Landlord portal navigation">
          <SidebarHeader>
            <h2>Landlord Portal</h2>
            <span>Verified Member</span>
          </SidebarHeader>

          <SidebarNav>
            {portalItems.map((item) => {
              const Icon = item.icon;
              const active = item.key === 'profile';
              return (
                <SidebarButton
                  key={item.key}
                  type="button"
                  $active={active}
                  onClick={() => handlePortalNav(item.key)}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{item.label}</span>
                </SidebarButton>
              );
            })}
          </SidebarNav>

          <HostCard>
            <UserAvatar user={user} size={44} />
            <div>
              <strong>{user?.name}</strong>
              <Badge tone="primary">{user?.landlordProfile?.verified ? 'VERIFIED HOST' : 'HOST'}</Badge>
            </div>
          </HostCard>
        </Sidebar>

        <MainContent>
          <Breadcrumb>Settings &gt; Profile</Breadcrumb>
          <PageHeader>
            <h1>Profile Settings</h1>
            <p>Manage your professional landlord profile, trust signals, and account security.</p>
          </PageHeader>

          {error ? <ErrorText role="alert">{error}</ErrorText> : null}

          <ContentGrid>
            <FormColumn>
              <SettingsCard>
                <CardHeader>
                  <UserRound size={22} />
                  <div>
                    <h2>Personal Information</h2>
                    <p>Keep your contact details accurate for tenant communication.</p>
                  </div>
                </CardHeader>

                <FormGrid>
                  <FieldGroup>
                    <span>Full Name</span>
                    <Input value={name} onChange={(event) => setName(event.target.value)} aria-label="Full Name" />
                  </FieldGroup>
                  <FieldGroup>
                    <span>Email Address</span>
                    <Input
                      icon={LockKeyhole}
                      type="email"
                      value={user?.email || ''}
                      aria-label="Email Address"
                      readOnly
                      hint="Email can't be changed."
                    />
                  </FieldGroup>
                  <FieldGroup>
                    <span>Phone Number</span>
                    <Input
                      prefix="+977"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      aria-label="Phone Number"
                    />
                  </FieldGroup>
                </FormGrid>
              </SettingsCard>

              <SettingsCard>
                <CardHeader>
                  <Landmark size={22} />
                  <div>
                    <h2>Professional Details</h2>
                    <p>Show tenants who they are speaking with before they book a visit.</p>
                  </div>
                </CardHeader>

                <FormGrid>
                  <FieldGroup>
                    <span>Organization Name</span>
                    <Input
                      placeholder="e.g. Kathmandu Rentals Ltd."
                      aria-label="Organization Name"
                      value={organizationName}
                      onChange={(event) => setOrganizationName(event.target.value)}
                    />
                  </FieldGroup>
                  <FieldGroup>
                    <span>Business Address</span>
                    <Input
                      icon={MapPin}
                      aria-label="Business Address"
                      value={businessAddress}
                      onChange={(event) => setBusinessAddress(event.target.value)}
                    />
                  </FieldGroup>
                  <FullWidthField>
                    <span>Bio / Description</span>
                    <TextArea
                      aria-label="Bio / Description"
                      value={bio}
                      onChange={(event) => setBio(event.target.value)}
                    />
                  </FullWidthField>
                </FormGrid>
              </SettingsCard>

              <Actions>
                <Button type="button" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="secondary" type="button" onClick={() => onNavigate('landlordHome')}>Cancel</Button>
              </Actions>
            </FormColumn>

            <UtilityColumn>
              <PhotoCard>
                <ProfileImageUploader size={128} />
                <h2>Profile Photo</h2>
                <p>Upload a clear, professional photo to increase your listing visibility.</p>
              </PhotoCard>

              <VerifiedCard>
                <BadgeCheck size={36} />
                <div>
                  <h2>{user?.landlordProfile?.verified ? 'Verified Landlord' : 'Verification Pending'}</h2>
                  <p>
                    {user?.landlordProfile?.verified
                      ? 'Your identity and properties have been verified by Basai Finder.'
                      : 'Complete your profile so our team can verify your identity and properties.'}
                  </p>
                </div>
              </VerifiedCard>

              <SecurityCard>
                <CardHeader>
                  <ShieldCheck size={22} />
                  <div>
                    <h2>Account Security</h2>
                    <p>Protect tenant messages and listing details.</p>
                  </div>
                </CardHeader>

                <SecurityRow>
                  <span>Two-Factor Auth</span>
                  <SecurityStatus>
                    <CheckCircle2 size={16} />
                    {user?.landlordProfile?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </SecurityStatus>
                </SecurityRow>

                <ProgressBlock>
                  <ProgressTop>
                    <span>Profile completion</span>
                    <strong>{user?.landlordProfile?.profileCompletion ?? 0}%</strong>
                  </ProgressTop>
                  <ProgressTrack aria-label={`Profile completion ${user?.landlordProfile?.profileCompletion ?? 0} percent`}>
                    <ProgressFill $percent={user?.landlordProfile?.profileCompletion ?? 0} />
                  </ProgressTrack>
                </ProgressBlock>

                {showPasswordForm ? (
                  <PasswordForm>
                    <Input
                      type="password"
                      placeholder="Current password"
                      aria-label="Current password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                    />
                    <Input
                      type="password"
                      placeholder="New password"
                      aria-label="New password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                    />
                    <Actions>
                      <Button type="button" onClick={handleChangePassword} disabled={savingPassword}>
                        {savingPassword ? 'Updating...' : 'Update Password'}
                      </Button>
                      <Button variant="secondary" type="button" onClick={() => setShowPasswordForm(false)}>
                        Cancel
                      </Button>
                    </Actions>
                  </PasswordForm>
                ) : (
                  <Button variant="secondary" type="button" onClick={() => setShowPasswordForm(true)}>
                    <LockKeyhole size={17} />
                    Change Password
                  </Button>
                )}
              </SecurityCard>

              <ContactCard>
                <Phone size={20} />
                <div>
                  <strong>Tenant contact ready</strong>
                  <span>Phone and email are visible only after secure tenant requests.</span>
                </div>
              </ContactCard>
            </UtilityColumn>
          </ContentGrid>
        </MainContent>
      </PortalShell>
    </Page>
  );
}

const Page = styled.div`
  background: ${({ theme }) => theme.colors.surface};
`;

const Toast = styled.div`
  position: fixed;
  top: 88px;
  right: 18px;
  z-index: 50;
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.primary};
  color: #ffffff;
  padding: ${({ theme }) => `${theme.spacing(1)} ${theme.spacing(1.5)}`};
  font-weight: 900;
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

const PortalShell = styled.div`
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(3)};
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing(4)} ${theme.spacing(2)} ${theme.spacing(6)}`};

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 520px) {
    padding-top: ${({ theme }) => theme.spacing(2)};
  }
`;

const Sidebar = styled.aside`
  position: sticky;
  top: 96px;
  display: grid;
  align-content: start;
  gap: ${({ theme }) => theme.spacing(2)};
  height: fit-content;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  padding: ${({ theme }) => theme.spacing(2)};
  box-shadow: ${({ theme }) => theme.shadows.sm};

  @media (max-width: 920px) {
    position: static;
  }

  @media (max-width: 520px) {
    padding: ${({ theme }) => theme.spacing(1.5)};
  }
`;

const SidebarHeader = styled.div`
  padding-bottom: ${({ theme }) => theme.spacing(1)};

  h2 {
    margin: 0 0 4px;
    color: ${({ theme }) => theme.colors.primary};
    font-size: 1.2rem;
    letter-spacing: 0;
  }

  span {
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    font-size: 0.84rem;
    font-weight: 800;
  }
`;

const SidebarNav = styled.nav`
  display: grid;
  gap: ${({ theme }) => theme.spacing(0.75)};

  @media (max-width: 640px) {
    display: flex;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const SidebarButton = styled.button`
  display: flex;
  min-height: 46px;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  border: 0;
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ $active, theme }) => ($active ? theme.colors.primary : 'transparent')};
  color: ${({ $active, theme }) => ($active ? '#ffffff' : theme.colors.onSurfaceVariant)};
  padding: ${({ theme }) => `${theme.spacing(1)} ${theme.spacing(1.25)}`};
  font-weight: 900;
  transition: transform 160ms ease, background 200ms ease, color 200ms ease;

  &:hover {
    background: ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.surfaceContainerLow)};
    color: ${({ $active, theme }) => ($active ? '#ffffff' : theme.colors.primary)};
  }

  &:active {
    transform: scale(0.95);
  }

  @media (max-width: 640px) {
    justify-content: center;
    min-width: 74px;

    span {
      display: none;
    }
  }
`;

const HostCard = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLow};
  padding: ${({ theme }) => theme.spacing(1.25)};

  > div {
    display: grid;
    gap: 5px;
    min-width: 0;
  }

  strong {
    color: ${({ theme }) => theme.colors.onSurface};
  }
`;

const MainContent = styled.main`
  min-width: 0;
`;

const Breadcrumb = styled.div`
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  font-size: 0.82rem;
  font-weight: 800;
`;

const PageHeader = styled.header`
  margin: ${({ theme }) => `${theme.spacing(1)} 0 ${theme.spacing(3)}`};

  h1 {
    margin: 0 0 ${({ theme }) => theme.spacing(1)};
    color: ${({ theme }) => theme.colors.primary};
    font-size: clamp(2.15rem, 5vw, 3.6rem);
    line-height: 1.05;
    letter-spacing: 0;
  }

  p {
    max-width: 720px;
    margin: 0;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    line-height: 1.6;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: ${({ theme }) => theme.spacing(3)};

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const FormColumn = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  min-width: 0;
`;

const UtilityColumn = styled.aside`
  display: grid;
  align-content: start;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const SettingsCard = styled(Card)`
  padding: ${({ theme }) => theme.spacing(3)};

  @media (max-width: 520px) {
    padding: ${({ theme }) => theme.spacing(2)};
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing(1.25)};
  margin-bottom: ${({ theme }) => theme.spacing(2.5)};
  color: ${({ theme }) => theme.colors.primary};

  h2 {
    margin: 0 0 4px;
    color: ${({ theme }) => theme.colors.onSurface};
    font-size: 1.24rem;
    letter-spacing: 0;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    line-height: 1.5;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing(2)};

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const FieldGroup = styled.div`
  display: grid;
  gap: 7px;

  > span {
    color: ${({ theme }) => theme.colors.onSurface};
    font-size: 0.88rem;
    font-weight: 900;
  }
`;

const FullWidthField = styled(FieldGroup)`
  grid-column: 1 / -1;
`;

const TextArea = styled.textarea`
  min-height: 148px;
  width: 100%;
  resize: vertical;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  color: ${({ theme }) => theme.colors.onSurface};
  padding: ${({ theme }) => theme.spacing(1.5)};
  line-height: 1.6;
  outline: 0;
  transition: border 200ms ease, box-shadow 200ms ease;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(26, 79, 157, 0.12);
  }
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const PhotoCard = styled(Card)`
  display: grid;
  justify-items: center;
  padding: ${({ theme }) => theme.spacing(3)};
  text-align: center;

  @media (max-width: 520px) {
    padding: ${({ theme }) => theme.spacing(2)};
  }

  h2 {
    margin: ${({ theme }) => `${theme.spacing(2)} 0 ${theme.spacing(0.75)}`};
    color: ${({ theme }) => theme.colors.primary};
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    line-height: 1.55;
  }
`;

const ErrorText = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing(2)};
  border-radius: ${({ theme }) => theme.roundness};
  background: rgba(197, 31, 45, 0.1);
  color: ${({ theme }) => theme.colors.error};
  padding: 10px 12px;
  font-weight: 800;
`;

const PasswordForm = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1.25)};
`;

const VerifiedCard = styled(Card)`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1.5)};
  border-color: rgba(46, 125, 50, 0.22);
  background: ${({ theme }) => theme.colors.surfaceContainerLow};
  color: #2e7d32;
  padding: ${({ theme }) => theme.spacing(2.25)};

  h2 {
    margin: 0 0 6px;
    color: #2e7d32;
    font-size: 1.1rem;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    line-height: 1.5;
  }
`;

const SecurityCard = styled(Card)`
  padding: ${({ theme }) => theme.spacing(2.5)};
`;

const SecurityRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1)};
  margin-bottom: ${({ theme }) => theme.spacing(2)};
  color: ${({ theme }) => theme.colors.onSurface};
  font-weight: 900;
`;

const SecurityStatus = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #2e7d32;
  font-size: 0.86rem;
`;

const ProgressBlock = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(0.8)};
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const ProgressTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1)};
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  font-size: 0.88rem;
  font-weight: 900;

  strong {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const ProgressTrack = styled.div`
  overflow: hidden;
  height: 9px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.surfaceContainerLow};
`;

const ProgressFill = styled.div`
  width: ${({ $percent }) => $percent}%;
  height: 100%;
  border-radius: inherit;
  background: ${({ theme }) => theme.colors.primary};
`;

const ContactCard = styled(Card)`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1.25)};
  padding: ${({ theme }) => theme.spacing(2)};
  color: ${({ theme }) => theme.colors.primary};

  strong,
  span {
    display: block;
  }

  span {
    margin-top: 4px;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    line-height: 1.45;
  }
`;
