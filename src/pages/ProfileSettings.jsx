import { Building2, KeyRound, LockKeyhole, MapPin, ShieldCheck, UserRound, WalletCards } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { ProfileImageUploader } from '../components/ProfileImageUploader.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';
import { DashboardLayout } from '../layout/DashboardLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usersApi, ApiError } from '../lib/api.js';

const navItems = [
  { key: 'personal', label: 'Personal Info', icon: UserRound },
  { key: 'security', label: 'Security', icon: KeyRound },
  { key: 'payouts', label: 'Payouts', icon: WalletCards },
];

export function ProfileSettings() {
  const { user, refreshUser } = useAuth();
  const [activeItem, setActiveItem] = useState('personal');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [savingPayouts, setSavingPayouts] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [businessName, setBusinessName] = useState(user?.landlordProfile?.businessName || '');
  const [bankAccountHolder, setBankAccountHolder] = useState(user?.landlordProfile?.bankAccountHolder || '');
  const [bankName, setBankName] = useState(user?.landlordProfile?.bankName || '');
  const [taxNumber, setTaxNumber] = useState(user?.landlordProfile?.taxNumber || '');

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setPhone(user.phone || '');
    setAddress(user.address || '');
    setBusinessName(user.landlordProfile?.businessName || '');
    setBankAccountHolder(user.landlordProfile?.bankAccountHolder || '');
    setBankName(user.landlordProfile?.bankName || '');
    setTaxNumber(user.landlordProfile?.taxNumber || '');
  }, [user]);

  const phoneError = useMemo(() => {
    if (!phone) return 'Phone number is required.';
    return /^9\d{9}$/.test(phone) ? '' : 'Enter a valid 10-digit Nepal mobile number.';
  }, [phone]);

  const notify = (text) => {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 2400);
  };

  const handleSavePersonal = async () => {
    if (phoneError) {
      setError(phoneError);
      return;
    }
    setError('');
    setSavingPersonal(true);
    try {
      await usersApi.updateMe({ name, phone, address });
      await refreshUser();
      notify('Profile saved.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your profile.');
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleUpdatePassword = async () => {
    setError('');
    setSavingSecurity(true);
    try {
      await usersApi.updatePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      notify('Password updated.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update your password.');
    } finally {
      setSavingSecurity(false);
    }
  };

  const handleSavePayouts = async () => {
    setError('');
    setSavingPayouts(true);
    try {
      await usersApi.updateMe({ landlordProfile: { businessName, bankAccountHolder, bankName, taxNumber } });
      await refreshUser();
      notify('Business details saved.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save business details.');
    } finally {
      setSavingPayouts(false);
    }
  };

  return (
    <DashboardLayout navItems={navItems} activeItem={activeItem} onChange={setActiveItem}>
      {message ? <Toast role="status">{message}</Toast> : null}
      <HeaderCard elevated>
        <ProfileImageUploader size={112} />
        <HeaderCopy>
          <Badge tone="verified">
            <ShieldCheck size={14} />
            {user?.verified ? 'Verified Tenant' : 'Tenant'}
          </Badge>
          <h1>Profile Settings</h1>
          <p>Manage your contact details, security preferences, and landlord payout readiness.</p>
        </HeaderCopy>
      </HeaderCard>

      {error ? <ErrorText role="alert">{error}</ErrorText> : null}

      {activeItem === 'personal' && (
        <FormCard>
          <FormHeader>
            <h2>Contact Info</h2>
            <Button variant="secondary" type="button" onClick={handleSavePersonal} disabled={savingPersonal}>
              {savingPersonal ? 'Saving...' : 'Save Changes'}
            </Button>
          </FormHeader>
          <FormGrid>
            <Input placeholder="Full name" value={name} onChange={(event) => setName(event.target.value)} aria-label="Full name" />
            <Input
              prefix="+977"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              error={phoneError}
              aria-label="Phone number"
            />
            <Input
              icon={LockKeyhole}
              value={user?.email || ''}
              readOnly
              aria-label="Email address"
              hint="Email can't be changed."
            />
            <Input
              icon={MapPin}
              placeholder="Address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              aria-label="Address"
            />
          </FormGrid>
        </FormCard>
      )}

      {activeItem === 'security' && (
        <FormCard>
          <FormHeader>
            <h2>Security</h2>
            <Button variant="secondary" type="button" onClick={handleUpdatePassword} disabled={savingSecurity}>
              {savingSecurity ? 'Updating...' : 'Update'}
            </Button>
          </FormHeader>
          <FormGrid>
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
          </FormGrid>
        </FormCard>
      )}

      {activeItem === 'payouts' && (
        <FormCard>
          <FormHeader>
            <h2>Business Details</h2>
            <Button variant="secondary" type="button" onClick={handleSavePayouts} disabled={savingPayouts}>
              {savingPayouts ? 'Saving...' : 'Save'}
            </Button>
          </FormHeader>
          <FormGrid>
            <Input
              icon={Building2}
              placeholder="Landlord business name"
              aria-label="Business name"
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
            />
            <Input
              placeholder="Bank account holder"
              aria-label="Bank account holder"
              value={bankAccountHolder}
              onChange={(event) => setBankAccountHolder(event.target.value)}
            />
            <Input
              placeholder="Bank name"
              aria-label="Bank name"
              value={bankName}
              onChange={(event) => setBankName(event.target.value)}
            />
            <Input
              placeholder="PAN/VAT number"
              aria-label="Tax number"
              value={taxNumber}
              onChange={(event) => setTaxNumber(event.target.value)}
            />
          </FormGrid>
        </FormCard>
      )}
    </DashboardLayout>
  );
}

const HeaderCard = styled(Card)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2.5)};
  margin-bottom: ${({ theme }) => theme.spacing(3)};
  padding: ${({ theme }) => theme.spacing(3)};

  @media (max-width: 620px) {
    align-items: flex-start;
    flex-direction: column;
  }
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

const ErrorText = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing(2)};
  border-radius: ${({ theme }) => theme.roundness};
  background: rgba(197, 31, 45, 0.1);
  color: ${({ theme }) => theme.colors.error};
  padding: 10px 12px;
  font-weight: 800;
`;

const HeaderCopy = styled.div`
  h1 {
    margin: ${({ theme }) => `${theme.spacing(1)} 0 ${theme.spacing(0.5)}`};
    font-size: clamp(2rem, 5vw, 3rem);
    letter-spacing: 0;
  }

  p {
    max-width: 620px;
    margin: 0;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    line-height: 1.65;
  }
`;

const FormCard = styled(Card)`
  padding: ${({ theme }) => theme.spacing(3)};
`;

const FormHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-bottom: ${({ theme }) => theme.spacing(2.5)};

  h2 {
    margin: 0;
    font-size: 1.35rem;
    letter-spacing: 0;
  }

  @media (max-width: 560px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing(2)};

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;
