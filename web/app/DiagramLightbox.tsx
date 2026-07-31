"use client";

import { useEffect, useRef } from "react";

type DiagramLightboxProps = {
  svg: string;
  onClose: () => void;
};

export function DiagramLightbox({ svg, onClose }: DiagramLightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div className="diagram-lightbox" role="dialog" aria-modal="true" aria-label="放大的课程流程图">
      <button className="diagram-backdrop" aria-label="关闭放大图" onClick={onClose} />
      <div ref={dialogRef} className="diagram-lightbox-panel">
        <div className="diagram-lightbox-head">
          <strong>课程流程图</strong>
          <span>可横向、纵向滚动查看全部文字</span>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="关闭放大图">关闭 ×</button>
        </div>
        <div className="diagram-lightbox-canvas" dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
    </div>
  );
}
