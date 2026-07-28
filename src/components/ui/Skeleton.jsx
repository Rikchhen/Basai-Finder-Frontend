import styled, { keyframes } from 'styled-components';

const shimmer = keyframes`
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

/** Grey shimmer block. Give it a width/height via props or styled(). */
export const Skeleton = styled.div`
  width: ${({ $w = '100%' }) => $w};
  height: ${({ $h = '14px' }) => $h};
  border-radius: ${({ $radius, theme }) => $radius || theme.roundness};
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.surfaceContainerLow} 25%,
    #e8edf5 37%,
    ${({ theme }) => theme.colors.surfaceContainerLow} 63%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.4s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/**
 * Placeholder that matches the shape of a room card, so the layout does not
 * jump when the real listings arrive.
 */
export function ListingCardSkeleton() {
  return (
    <CardShell>
      <Skeleton $h="176px" $radius="0" />
      <CardBody>
        <Skeleton $h="16px" $w="80%" />
        <Skeleton $h="12px" $w="55%" />
        <Row>
          <Skeleton $h="14px" $w="40%" />
          <Skeleton $h="20px" $w="26%" $radius="999px" />
        </Row>
      </CardBody>
    </CardShell>
  );
}

/** Renders `count` listing skeletons inside the caller's grid. */
export function ListingGridSkeleton({ count = 6 }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <ListingCardSkeleton key={index} />
      ))}
    </>
  );
}

/** Placeholder rows for list-style screens (bookings, notifications, admin). */
export function ListRowsSkeleton({ count = 4, height = '92px' }) {
  return (
    <Rows>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} $h={height} />
      ))}
    </Rows>
  );
}

const CardShell = styled.div`
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
`;

const CardBody = styled.div`
  display: grid;
  gap: 10px;
  padding: 16px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const Rows = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1.5)};
`;
