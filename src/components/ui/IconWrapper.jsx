import styled from 'styled-components';

export const IconWrapper = styled.span.withConfig({
  shouldForwardProp: (prop) => !['size', 'rounded'].includes(prop),
})`
  display: inline-flex;
  width: ${({ size = 36 }) => size}px;
  height: ${({ size = 36 }) => size}px;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border-radius: ${({ rounded }) => (rounded ? '999px' : '8px')};
  background: ${({ $subtle, theme }) => ($subtle ? theme.colors.surfaceContainerLow : 'transparent')};
  color: ${({ theme }) => theme.colors.primary};
`;
