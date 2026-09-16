import React, { useCallback, useRef, useState } from "react";
import { Layers, Maximize2, Minus, Plus, RotateCcw } from "lucide-react";

import AuthenticatedImage from "./AuthenticatedImage";

/**
 * Primary reading surface for a retinal image.
 *
 * The audience is ophthalmologists, who form their own read from the image
 * before consulting the model. The image was previously a 256px thumbnail beside
 * a full-bleed banner announcing the model's answer — the largest element on the
 * page was the thing being verified rather than the evidence.
 *
 * The layer stack is the reason this is a component rather than an <img>. The
 * model pipeline is classification -> segmentation -> XAI, and segmentation
 * masks and XAI heatmaps only mean anything registered over the *same* pixels at
 * the *same* zoom as the base image. Rendering them in a separate card below
 * would leave the clinician eyeballing correspondence between two viewports.
 *
 * `layers` is empty until the pipeline lands. Each future layer:
 *   { id, label, path, color, defaultOn }
 */
const ZOOM_STEPS = [1, 1.75, 2.5, 4];

const FundusViewer = ({ imagePath, alt, layers = [], className = "" }) => {
  const [zoomIndex, setZoomIndex] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [activeLayers, setActiveLayers] = useState(() =>
    layers.filter((l) => l.defaultOn).map((l) => l.id)
  );
  // Drag origin lives in a ref (it must not trigger renders); whether a drag is
  // in progress is state, because the cursor and transition read it at render
  // time and a ref read there would never update.
  const dragOrigin = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const zoom = ZOOM_STEPS[zoomIndex];
  const canPan = zoom > 1;

  const reset = useCallback(() => {
    setZoomIndex(0);
    setOffset({ x: 0, y: 0 });
  }, []);

  // Recentring happens in the zoom handler rather than an effect watching zoom:
  // returning to fit is a known transition, so there is nothing to synchronise
  // after the fact.
  const zoomOut = () =>
    setZoomIndex((i) => {
      const next = Math.max(0, i - 1);
      if (ZOOM_STEPS[next] === 1) setOffset({ x: 0, y: 0 });
      return next;
    });

  const zoomIn = () => setZoomIndex((i) => Math.min(ZOOM_STEPS.length - 1, i + 1));

  const onPointerDown = (e) => {
    if (!canPan) return;
    dragOrigin.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragOrigin.current) return;
    setOffset({
      x: e.clientX - dragOrigin.current.x,
      y: e.clientY - dragOrigin.current.y,
    });
  };

  const onPointerUp = (e) => {
    dragOrigin.current = null;
    setIsDragging(false);
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const toggleLayer = (id) =>
    setActiveLayers((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );

  const transform = `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`;

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div
        className="relative overflow-hidden rounded-card bg-black"
        style={{ aspectRatio: "4 / 3" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="absolute inset-0 origin-center"
          style={{
            transform,
            cursor: canPan ? (isDragging ? "grabbing" : "grab") : "default",
            // Panning is a direct manipulation; animating it fights the pointer.
            transition: isDragging ? "none" : "transform 150ms ease-out",
          }}
        >
          <AuthenticatedImage
            path={imagePath}
            alt={alt}
            className="h-full w-full object-contain"
          />

          {/* Overlays share this transformed box, so they stay registered to the
              base image through every zoom and pan. */}
          {layers
            .filter((layer) => activeLayers.includes(layer.id))
            .map((layer) => (
              <img
                key={layer.id}
                src={layer.path}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full object-contain mix-blend-screen"
              />
            ))}
        </div>

        <div className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-2xs font-medium text-white">
          {zoom === 1 ? "Fit" : `${zoom}×`}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-control border border-gray-300 bg-white p-0.5">
          <button
            type="button"
            onClick={zoomOut}
            disabled={zoomIndex === 0}
            aria-label="Zoom out"
            className="rounded p-1.5 text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-30"
          >
            <Minus size={15} />
          </button>
          <button
            type="button"
            onClick={zoomIn}
            disabled={zoomIndex === ZOOM_STEPS.length - 1}
            aria-label="Zoom in"
            className="rounded p-1.5 text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-30"
          >
            <Plus size={15} />
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={zoom === 1 && offset.x === 0 && offset.y === 0}
            aria-label="Reset view"
            className="rounded p-1.5 text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-30"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {canPan && (
          <span className="flex items-center gap-1.5 text-xs text-gray-600">
            <Maximize2 size={13} aria-hidden="true" /> Drag to pan
          </span>
        )}

        {layers.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {layers.map((layer) => {
              const on = activeLayers.includes(layer.id);
              return (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => toggleLayer(layer.id)}
                  aria-pressed={on}
                  className={`flex items-center gap-1.5 rounded-control border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    on
                      ? "border-cyprus bg-cyprus text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-accent"
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: layer.color }}
                    aria-hidden="true"
                  />
                  {layer.label}
                </button>
              );
            })}
          </div>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-gray-600">
            <Layers size={13} aria-hidden="true" />
            Lesion and explanation layers appear here once a model is connected
          </span>
        )}
      </div>
    </div>
  );
};

export default FundusViewer;
