"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type ZoomableImageProps = {
  src?: string;
  alt: string;
};

export function ZoomableImage({ src, alt }: ZoomableImageProps) {
  const [expanded, setExpanded] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!expanded) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [expanded]);

  if (!src) return null;

  return (
    <>
      <span className="zoomable-image">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" />
        <button type="button" onClick={() => setExpanded(true)} aria-label={`放大查看：${alt}`}>放大查看</button>
      </span>
      {expanded && createPortal(
        <div className="image-lightbox" role="dialog" aria-modal="true" aria-label={`放大的图片：${alt}`}>
          <button className="diagram-backdrop" aria-label="关闭放大图" onClick={() => setExpanded(false)} />
          <div className="image-lightbox-panel">
            <div className="diagram-lightbox-head">
              <strong>{alt}</strong>
              <span>图片按原始比例显示，可滚动查看细节</span>
              <button ref={closeRef} type="button" onClick={() => setExpanded(false)}>关闭 ×</button>
            </div>
            <div className="image-lightbox-canvas">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={alt} />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
