import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import styled from 'styled-components';

/**
 * Full-screen photo viewer with keyboard, click and swipe navigation.
 * `images` is an array of ready-to-use URLs; `startIndex` is the one clicked.
 */
export function Lightbox({ images = [], startIndex = 0, onClose, title, fallback }) {
  const onImgError = (event) => {
    if (fallback && event.currentTarget.src !== fallback) event.currentTarget.src = fallback;
  };
  const [index, setIndex] = useState(startIndex);
  const [touchStart, setTouchStart] = useState(null);
  const count = images.length;

  const go = useCallback(
    (delta) => setIndex((current) => (current + delta + count) % count),
    [count],
  );

  useEffect(() => setIndex(startIndex), [startIndex]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') go(1);
      if (event.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    // Stop the page behind the overlay from scrolling.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [go, onClose]);

  if (count === 0) return null;

  const onTouchEnd = (event) => {
    if (touchStart === null) return;
    const delta = event.changedTouches[0].clientX - touchStart;
    if (Math.abs(delta) > 50) go(delta < 0 ? 1 : -1);
    setTouchStart(null);
  };

  return (
    <Overlay
      role="dialog"
      aria-modal="true"
      aria-label={title ? `Photos of ${title}` : 'Photo viewer'}
      onClick={onClose}
    >
      <TopBar onClick={(event) => event.stopPropagation()}>
        <Counter>
          {index + 1} / {count}
        </Counter>
        <IconButton type="button" aria-label="Close photo viewer" onClick={onClose}>
          <X size={20} />
        </IconButton>
      </TopBar>

      <Stage
        onClick={(event) => event.stopPropagation()}
        onTouchStart={(event) => setTouchStart(event.touches[0].clientX)}
        onTouchEnd={onTouchEnd}
      >
        {count > 1 ? (
          <NavButton
            type="button"
            aria-label="Previous photo"
            $side="left"
            onClick={() => go(-1)}
          >
            <ChevronLeft size={26} />
          </NavButton>
        ) : null}

        <BigImage
          src={images[index]}
          alt={`${title || 'Room'} photo ${index + 1}`}
          onError={onImgError}
        />

        {count > 1 ? (
          <NavButton type="button" aria-label="Next photo" $side="right" onClick={() => go(1)}>
            <ChevronRight size={26} />
          </NavButton>
        ) : null}
      </Stage>

      {count > 1 ? (
        <Filmstrip onClick={(event) => event.stopPropagation()}>
          {images.map((image, position) => (
            <Thumb
              key={image}
              type="button"
              $active={position === index}
              aria-label={`Show photo ${position + 1}`}
              aria-current={position === index}
              onClick={() => setIndex(position)}
            >
              <img src={image} alt="" onError={onImgError} />
            </Thumb>
          ))}
        </Filmstrip>
      ) : null}
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 95;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 12px;
  background: rgba(6, 14, 26, 0.94);
  padding: 14px;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Counter = styled.span`
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
  padding: 6px 12px;
  font-size: 0.84rem;
  font-weight: 800;
`;

const IconButton = styled.button`
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;

  &:hover {
    background: rgba(255, 255, 255, 0.26);
  }
`;

const Stage = styled.div`
  position: relative;
  display: grid;
  min-height: 0;
  place-items: center;
`;

const BigImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  border-radius: 10px;
  object-fit: contain;
`;

const NavButton = styled.button`
  position: absolute;
  top: 50%;
  ${({ $side }) => ($side === 'left' ? 'left: 8px;' : 'right: 8px;')}
  display: grid;
  width: 46px;
  height: 46px;
  place-items: center;
  transform: translateY(-50%);
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const Filmstrip = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
`;

const Thumb = styled.button`
  width: 72px;
  height: 54px;
  flex: 0 0 auto;
  overflow: hidden;
  border: 2px solid ${({ $active }) => ($active ? '#ffffff' : 'transparent')};
  border-radius: ${({ theme }) => theme.radius.md};
  background: rgba(255, 255, 255, 0.1);
  padding: 0;
  opacity: ${({ $active }) => ($active ? 1 : 0.55)};
  transition: opacity 160ms ease, border-color 160ms ease;

  &:hover {
    opacity: 1;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;
