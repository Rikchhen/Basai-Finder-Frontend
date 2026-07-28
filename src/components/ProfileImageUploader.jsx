import { Camera, UserRound } from 'lucide-react';
import { useId, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { usersApi, toUploadUrl, ApiError } from '../lib/api.js';
import { AvatarCropper } from './AvatarCropper.jsx';

const MAX_INPUT_BYTES = 20 * 1024 * 1024;

export function ProfileImageUploader({ size = 96, editable = true, onClick, label = 'Open profile' }) {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const inputId = useId();

  // Selecting a file opens the cropper; nothing is uploaded until it is saved.
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a JPG, PNG, or WEBP image.');
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      toast.error('That image is very large. Please choose one under 20MB.');
      return;
    }
    setPendingFile(file);
  };

  const handleCropped = async (croppedFile) => {
    setUploading(true);
    try {
      await usersApi.uploadAvatar(croppedFile);
      await refreshUser();
      setPendingFile(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Uploader $size={size} $clickable={Boolean(onClick)} aria-label="Profile photo">
      <Avatar>
        {user?.avatarUrl ? (
          <img src={toUploadUrl(user.avatarUrl)} alt={user.name} />
        ) : (
          <UserRound size={size * 0.42} />
        )}
      </Avatar>
      {onClick ? <ClickTarget type="button" aria-label={label} onClick={onClick} /> : null}
      {editable ? (
        <>
          <CameraButton
            as="label"
            htmlFor={inputId}
            aria-label="Change profile photo"
            $disabled={uploading}
          >
            <Camera size={18} />
          </CameraButton>
          <HiddenInput
            id={inputId}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {pendingFile ? (
            <AvatarCropper
              file={pendingFile}
              saving={uploading}
              onCancel={() => (uploading ? null : setPendingFile(null))}
              onSave={handleCropped}
            />
          ) : null}
        </>
      ) : null}
    </Uploader>
  );
}

const Uploader = styled.div`
  position: relative;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;

  ${({ $clickable }) =>
    $clickable &&
    `
    &:hover > div:first-child {
      transform: scale(1.05);
    }

    &:focus-within > div:first-child {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }
  `}
`;

const ClickTarget = styled.button`
  position: absolute;
  inset: 0;
  z-index: 1;
  border: 0;
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
`;

const Avatar = styled.div`
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  overflow: hidden;
  border: 3px solid #ffffff;
  border-radius: 999px;
  transition: transform 200ms ease-in-out;

  background:
    linear-gradient(135deg, rgba(26, 79, 157, 0.16), rgba(0, 104, 55, 0.12)),
    ${({ theme }) => theme.colors.surfaceContainerLow};
  box-shadow: ${({ theme }) => theme.shadows.md};
  color: ${({ theme }) => theme.colors.primary};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const CameraButton = styled.button`
  position: absolute;
  right: 0;
  bottom: 2px;
  z-index: 2;
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 2px solid #ffffff;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.primary};
  color: #ffffff;
  cursor: ${({ $disabled }) => ($disabled ? 'wait' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
  transition: transform 200ms ease-in-out, background 200ms ease-in-out;

  &:hover {
    background: ${({ theme }) => theme.colors.secondary};
    transform: translateY(-1px);
  }
`;

const HiddenInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
`;
