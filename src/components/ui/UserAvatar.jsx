import { UserRound } from 'lucide-react';
import { useState } from 'react';
import styled from 'styled-components';
import { toUploadUrl } from '../../lib/api.js';

// Shows any user's uploaded photo, falling back to their initial. Use this for
// other people; ProfileImageUploader only ever renders the logged-in user.
export function UserAvatar({ user, size = 44, className }) {
  const [failed, setFailed] = useState(false);

  const photo = failed ? null : toUploadUrl(user?.avatarUrl);
  const initial = user?.name?.trim()?.charAt(0)?.toUpperCase();

  return (
    <Avatar $size={size} className={className}>
      {photo ? (
        <img src={photo} alt={user?.name || 'Profile photo'} onError={() => setFailed(true)} />
      ) : initial ? (
        <span aria-hidden="true">{initial}</span>
      ) : (
        <UserRound size={size * 0.5} aria-hidden="true" />
      )}
    </Avatar>
  );
}

const Avatar = styled.span`
  display: grid;
  flex: 0 0 ${({ $size }) => $size}px;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
  color: #ffffff;
  font-size: ${({ $size }) => $size * 0.4}px;
  font-weight: 900;
  line-height: 1;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;
