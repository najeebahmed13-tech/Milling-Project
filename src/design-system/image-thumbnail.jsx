import React, { useState } from "react";

export function ImageThumbnail({ src, alt = "", fallback = "No image", size = "sm", className = "" }) {
  const [failed, setFailed] = useState(false);
  const hasSource = typeof src === "string" && src.trim().length > 0;
  const showImage = hasSource && !failed;
  const classes = ["ds-image-thumbnail", `ds-image-thumbnail-${size}`, className].filter(Boolean).join(" ");

  return <span className={classes} aria-label={showImage ? alt : undefined}>
    {showImage ? <img src={src} alt={alt} width="40" height="40" loading="lazy" onError={() => setFailed(true)} /> : <span className="ds-image-thumbnail-placeholder" aria-hidden={fallback ? undefined : "true"}>{fallback || "Image unavailable"}</span>}
  </span>;
}
