import styled from 'styled-components';

export const Card = styled.section.withConfig({
  shouldForwardProp: (prop) => prop !== 'elevated' && prop !== 'interactive',
})`
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.radius.card};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  box-shadow: ${({ elevated, theme }) => (elevated ? theme.shadows.md : theme.shadows.sm)};
  transition: transform ${({ theme }) => theme.transitions.base},
    box-shadow ${({ theme }) => theme.transitions.base},
    border-color ${({ theme }) => theme.transitions.base};

  ${({ interactive, theme }) =>
    interactive &&
    `
    &:hover {
      border-color: rgba(26, 79, 157, 0.3);
      box-shadow: ${theme.shadows.lg};
      transform: translateY(-3px);
    }
  `}

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:hover {
      transform: none;
    }
  }
`;
