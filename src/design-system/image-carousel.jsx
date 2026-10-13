import React, { useEffect } from "react";

export function ImageCarousel({ files = [], index = 0, onClose, onIndexChange }) {
  const current = files[index];
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && files.length > 1) onIndexChange((index - 1 + files.length) % files.length);
      if (event.key === "ArrowRight" && files.length > 1) onIndexChange((index + 1) % files.length);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [files.length, index, onClose, onIndexChange]);
  if (!current) return null;
  return (
    <div className="ds-image-carousel-backdrop" role="dialog" aria-modal="true" aria-label="Attachment preview" onClick={onClose}>
      <div className="ds-image-carousel" onClick={(event) => event.stopPropagation()}>
        <div className="ds-image-carousel-header">
          <strong>{current.name}</strong>
          <button type="button" onClick={onClose} aria-label="Close attachment preview">×</button>
        </div>
        <img src={current.data} alt={current.name} />
        {files.length > 1 && <div className="ds-image-carousel-controls">
          <button type="button" onClick={() => onIndexChange((index - 1 + files.length) % files.length)}>Previous</button>
          <span>{index + 1} / {files.length}</span>
          <button type="button" onClick={() => onIndexChange((index + 1) % files.length)}>Next</button>
        </div>}
      </div>
    </div>
  );
}
