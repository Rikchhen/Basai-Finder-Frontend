import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Maximize2, RotateCcw, RotateCw, X, ZoomIn, ZoomOut } from 'lucide-react';
import styled from 'styled-components';
import { Button } from './ui/Button.jsx';

const VIEW = 280; // on-screen crop viewport, in CSS pixels
const OUTPUT = 512; // exported avatar size, in device pixels
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

// Avatars are displayed as circles with object-fit: cover, so an off-centre
// photo would otherwise be cropped arbitrarily. This dialog lets the user pick
// exactly which part of the image becomes their avatar.
export function AvatarCropper({ file, onCancel, onSave, saving = false }) {
  const [src, setSrc] = useState('');
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [error, setError] = useState('');
  const imgRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Scale at which the (possibly rotated) image exactly covers the viewport.
  const isQuarterTurn = rotation === 90 || rotation === 270;
  const rotW = isQuarterTurn ? natural.h : natural.w;
  const rotH = isQuarterTurn ? natural.w : natural.h;
  const baseScale = rotW && rotH ? VIEW / Math.min(rotW, rotH) : 1;

  // Keep the image covering the circle: clamp panning to the overflow.
  const clamp = useCallback(
    (next, zoomValue = zoom) => {
      const boundW = rotW * baseScale * zoomValue;
      const boundH = rotH * baseScale * zoomValue;
      const maxX = Math.max(0, (boundW - VIEW) / 2);
      const maxY = Math.max(0, (boundH - VIEW) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, next.x)),
        y: Math.min(maxY, Math.max(-maxY, next.y)),
      };
    },
    [rotW, rotH, baseScale, zoom],
  );

  useEffect(() => {
    setOffset((current) => clamp(current));
  }, [clamp]);

  const handleLoad = (event) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    setNatural({ w: naturalWidth, h: naturalHeight });
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  const startDrag = (event) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, start: offset };
  };

  const onDrag = (event) => {
    const drag = dragRef.current;
    if (!drag) return;
    setOffset(
      clamp({
        x: drag.start.x + (event.clientX - drag.x),
        y: drag.start.y + (event.clientY - drag.y),
      }),
    );
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const changeZoom = (value) => {
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
    setZoom(next);
    setOffset((current) => clamp(current, next));
  };

  const onWheel = (event) => {
    changeZoom(zoom + (event.deltaY < 0 ? 0.12 : -0.12));
  };

  const rotate = (delta) => {
    setRotation((current) => (current + delta + 360) % 360);
    setOffset({ x: 0, y: 0 });
  };

  const reset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  const handleSave = async () => {
    const img = imgRef.current;
    if (!img || !natural.w) return;
    setError('');

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d');
    const k = OUTPUT / VIEW; // viewport pixels -> output pixels

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, OUTPUT, OUTPUT);
    ctx.imageSmoothingQuality = 'high';

    // Mirror the on-screen transform order: centre -> pan -> rotate -> scale.
    ctx.translate(OUTPUT / 2 + offset.x * k, OUTPUT / 2 + offset.y * k);
    ctx.rotate((rotation * Math.PI) / 180);
    const drawW = natural.w * baseScale * zoom * k;
    const drawH = natural.h * baseScale * zoom * k;
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    if (!blob) {
      setError('Could not process this image. Try a different photo.');
      return;
    }
    // Backend derives the stored extension from the filename, so name it .jpg.
    onSave(new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
  };

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <Overlay role="dialog" aria-modal="true" aria-label="Crop profile photo" onClick={onCancel}>
      <Panel onClick={(event) => event.stopPropagation()}>
        <Header>
          <h2>Adjust your photo</h2>
          <CloseButton type="button" aria-label="Cancel" onClick={onCancel}>
            <X size={18} />
          </CloseButton>
        </Header>
        <Hint>Drag to reposition, scroll or use the slider to zoom.</Hint>

        <Stage
          $size={VIEW}
          onPointerDown={startDrag}
          onPointerMove={onDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onWheel={onWheel}
        >
          {src ? (
            <StageImage
              ref={imgRef}
              src={src}
              alt="Selected profile"
              onLoad={handleLoad}
              draggable={false}
              style={{
                width: natural.w * baseScale,
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${zoom})`,
              }}
            />
          ) : null}
          <CircleMask aria-hidden="true" />
        </Stage>

        <Controls>
          <IconButton type="button" aria-label="Zoom out" onClick={() => changeZoom(zoom - 0.2)}>
            <ZoomOut size={17} />
          </IconButton>
          <Slider
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step="0.01"
            value={zoom}
            aria-label="Zoom"
            onChange={(event) => changeZoom(Number(event.target.value))}
          />
          <IconButton type="button" aria-label="Zoom in" onClick={() => changeZoom(zoom + 0.2)}>
            <ZoomIn size={17} />
          </IconButton>
        </Controls>

        <Controls>
          <IconButton type="button" aria-label="Rotate left" onClick={() => rotate(-90)}>
            <RotateCcw size={17} />
          </IconButton>
          <IconButton type="button" aria-label="Rotate right" onClick={() => rotate(90)}>
            <RotateCw size={17} />
          </IconButton>
          <IconButton type="button" aria-label="Reset adjustments" onClick={reset}>
            <Maximize2 size={17} />
          </IconButton>
        </Controls>

        {error ? <ErrorText role="alert">{error}</ErrorText> : null}

        <Actions>
          <Button variant="secondary" type="button" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || !natural.w}>
            <Check size={16} /> {saving ? 'Uploading...' : 'Save photo'}
          </Button>
        </Actions>
      </Panel>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 90;
  display: grid;
  place-items: center;
  background: rgba(10, 22, 40, 0.62);
  padding: ${({ theme }) => theme.spacing(2)};
`;

const Panel = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1.25)};
  width: 100%;
  max-width: 360px;
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  padding: ${({ theme }) => theme.spacing(2.5)};
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  h2 {
    margin: 0;
    color: ${({ theme }) => theme.colors.primary};
    font-size: 1.25rem;
    letter-spacing: 0;
  }
`;

const CloseButton = styled.button`
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
`;

const Hint = styled.p`
  margin: -4px 0 0;
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  font-size: 0.86rem;
`;

const Stage = styled.div`
  position: relative;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  justify-self: center;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLow};
  cursor: grab;
  touch-action: none;
  user-select: none;

  &:active {
    cursor: grabbing;
  }
`;

const StageImage = styled.img`
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: center center;
  pointer-events: none;
  max-width: none;
`;

// Dim everything outside the circle so the crop area is obvious.
const CircleMask = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  box-shadow: 0 0 0 9999px rgba(255, 255, 255, 0.55);
  border-radius: 50%;
  border: 2px solid ${({ theme }) => theme.colors.primary};
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const IconButton = styled.button`
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  color: ${({ theme }) => theme.colors.primary};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceContainerLow};
  }
`;

const Slider = styled.input`
  flex: 1;
  accent-color: ${({ theme }) => theme.colors.primary};
`;

const ErrorText = styled.p`
  margin: 0;
  border-radius: ${({ theme }) => theme.roundness};
  background: rgba(186, 26, 26, 0.1);
  color: ${({ theme }) => theme.colors.error};
  padding: 8px 10px;
  font-size: 0.86rem;
  font-weight: 800;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing(1)};
`;
