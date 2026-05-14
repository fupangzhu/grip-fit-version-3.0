import { type KeyboardEvent, type PointerEvent, type ReactNode, type WheelEvent, useMemo, useRef, useState } from 'react';
import './workbench.css';

export type WorkbenchPreviewTransform = {
  rotateX: number;
  rotateY: number;
  zoom: number;
};

type WorkbenchPreviewProps = {
  children?: ReactNode;
  title?: string;
  minZoom?: number;
  maxZoom?: number;
  initialTransform?: Partial<WorkbenchPreviewTransform>;
  onTransformChange?: (transform: WorkbenchPreviewTransform) => void;
  className?: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const finiteOr = (value: number | undefined, fallback: number) => (
  Number.isFinite(value) ? Number(value) : fallback
);
const normalizeZoomBounds = (minZoom: number, maxZoom: number) => {
  const safeMin = finiteOr(minZoom, 0.5);
  const safeMax = finiteOr(maxZoom, 2.2);

  return safeMin <= safeMax
    ? { min: safeMin, max: safeMax }
    : { min: safeMax, max: safeMin };
};

const createTransform = (
  next: Partial<WorkbenchPreviewTransform>,
  minZoom: number,
  maxZoom: number,
): WorkbenchPreviewTransform => ({
  rotateX: clamp(finiteOr(next.rotateX, -10), -72, 72),
  rotateY: clamp(finiteOr(next.rotateY, 18), -180, 180),
  zoom: clamp(finiteOr(next.zoom, 1), minZoom, maxZoom),
});

export function WorkbenchPreview({
  children,
  title = 'Preview',
  minZoom = 0.5,
  maxZoom = 2.2,
  initialTransform,
  onTransformChange,
  className = '',
}: WorkbenchPreviewProps) {
  const zoomBounds = useMemo(() => normalizeZoomBounds(minZoom, maxZoom), [minZoom, maxZoom]);
  const initial = useMemo(
    () => createTransform(initialTransform ?? {}, zoomBounds.min, zoomBounds.max),
    [initialTransform, zoomBounds.max, zoomBounds.min],
  );
  const [transform, setTransform] = useState<WorkbenchPreviewTransform>(initial);
  const dragState = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    rotateX: number;
    rotateY: number;
  } | null>(null);

  const applyTransform = (updater: (current: WorkbenchPreviewTransform) => WorkbenchPreviewTransform) => {
    setTransform((current) => {
      const updated = updater(current);
      const next = createTransform(updated, zoomBounds.min, zoomBounds.max);
      onTransformChange?.(next);
      return next;
    });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !event.isPrimary) {
      return;
    }

    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      rotateX: transform.rotateX,
      rotateY: transform.rotateY,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    applyTransform((current) => ({
      ...current,
      rotateX: clamp(drag.rotateX - deltaY * 0.35, -72, 72),
      rotateY: clamp(drag.rotateY + deltaX * 0.35, -180, 180),
    }));
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragState.current?.pointerId === event.pointerId) {
      dragState.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const step = event.deltaY > 0 ? -0.08 : 0.08;
    applyTransform((current) => ({
      ...current,
      zoom: Number(clamp(current.zoom + step, zoomBounds.min, zoomBounds.max).toFixed(2)),
    }));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const rotateStep = event.shiftKey ? 15 : 5;
    const zoomStep = event.shiftKey ? 0.2 : 0.1;
    let handled = true;

    switch (event.key) {
      case 'ArrowLeft':
        applyTransform((current) => ({ ...current, rotateY: current.rotateY - rotateStep }));
        break;
      case 'ArrowRight':
        applyTransform((current) => ({ ...current, rotateY: current.rotateY + rotateStep }));
        break;
      case 'ArrowUp':
        applyTransform((current) => ({ ...current, rotateX: current.rotateX - rotateStep }));
        break;
      case 'ArrowDown':
        applyTransform((current) => ({ ...current, rotateX: current.rotateX + rotateStep }));
        break;
      case '+':
      case '=':
        applyTransform((current) => ({ ...current, zoom: Number((current.zoom + zoomStep).toFixed(2)) }));
        break;
      case '-':
      case '_':
        applyTransform((current) => ({ ...current, zoom: Number((current.zoom - zoomStep).toFixed(2)) }));
        break;
      case 'Home':
        reset();
        break;
      default:
        handled = false;
    }

    if (handled) {
      event.preventDefault();
    }
  };

  const reset = () => {
    setTransform(initial);
    onTransformChange?.(initial);
  };

  return (
    <section className={`workbench-preview ${className}`} aria-label={title}>
      <div className="workbench-preview__bar">
        <span className="workbench-preview__title">{title}</span>
        <div className="workbench-preview__metrics" aria-live="polite">
          <span>{Math.round(transform.zoom * 100)}%</span>
          <span>{Math.round(transform.rotateY)} deg</span>
        </div>
        <button className="workbench-preview__reset" type="button" onClick={reset}>
          Reset
        </button>
      </div>
      <div
        className="workbench-preview__stage"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onLostPointerCapture={handlePointerUp}
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="application"
        aria-label={`${title}: drag to rotate, use mouse wheel or plus and minus keys to zoom, arrow keys rotate, Home resets`}
        aria-roledescription="interactive 3D preview"
      >
        <div className="workbench-preview__floor" />
        <div
          className="workbench-preview__model"
          style={{
            transform: `scale(${transform.zoom}) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg)`,
          }}
        >
          {children ?? (
            <div className="workbench-preview__placeholder">
              <span className="workbench-preview__placeholder-top" />
              <span className="workbench-preview__placeholder-mid" />
              <span className="workbench-preview__placeholder-bottom" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
