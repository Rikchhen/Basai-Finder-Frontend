import styled from 'styled-components';

// [background token, text-colour token]
const badgeColors = {
  verified: ['successSoft', 'success'],
  primary: ['primarySoft', 'primary'],
  accent: ['accentSoft', 'accent'],
  warning: ['warningSoft', 'warning'],
  danger: ['errorSoft', 'error'],
  muted: ['surfaceContainerHigh', 'onSurfaceVariant'],
};

export const Badge = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'tone',
})`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ tone = 'muted', theme }) =>
    theme.colors[(badgeColors[tone] || badgeColors.muted)[0]]};
  color: ${({ tone = 'muted', theme }) =>
    theme.colors[(badgeColors[tone] || badgeColors.muted)[1]]};
  padding: 6px 11px;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  white-space: nowrap;
`;
