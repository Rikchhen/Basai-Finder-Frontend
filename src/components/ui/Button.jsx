import styled, { css } from 'styled-components';

const variants = {
  primary: css`
    border-color: transparent;
    background: ${({ theme }) => theme.gradients.primary};
    color: #ffffff;
    box-shadow: ${({ theme }) => theme.shadows.primary};

    &:hover:not(:disabled) {
      filter: brightness(1.06);
      box-shadow: 0 10px 22px rgba(26, 79, 157, 0.3);
      transform: translateY(-1px);
    }
  `,
  secondary: css`
    border-color: ${({ theme }) => theme.colors.outline};
    background: ${({ theme }) => theme.colors.surfaceContainerLowest};
    color: ${({ theme }) => theme.colors.primary};

    &:hover:not(:disabled) {
      border-color: ${({ theme }) => theme.colors.primary};
      background: ${({ theme }) => theme.colors.primarySoft};
      transform: translateY(-1px);
    }
  `,
  accent: css`
    border-color: transparent;
    background: ${({ theme }) => theme.colors.accent};
    color: #ffffff;

    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.accentDark};
      transform: translateY(-1px);
    }
  `,
  text: css`
    border-color: transparent;
    background: transparent;
    color: ${({ theme }) => theme.colors.primary};
    padding-inline: ${({ theme }) => theme.spacing(1)};

    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.primarySoft};
    }
  `,
};

export const Button = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'variant',
})`
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(1)};
  border: 1px solid;
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => `${theme.spacing(1.25)} ${theme.spacing(2)}`};
  font-weight: 700;
  letter-spacing: 0.01em;
  transition: transform ${({ theme }) => theme.transitions.base},
    box-shadow ${({ theme }) => theme.transitions.base},
    background ${({ theme }) => theme.transitions.base},
    filter ${({ theme }) => theme.transitions.base};
  white-space: nowrap;

  ${({ variant = 'primary' }) => variants[variant]}

  &:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
  }

  &:focus-visible {
    outline: 3px solid rgba(59, 130, 246, 0.4);
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
    box-shadow: none;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:hover:not(:disabled),
    &:active:not(:disabled) {
      transform: none;
    }
  }
`;
