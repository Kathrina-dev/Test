import React, { useEffect, useState } from "react";
import type { Sighting } from "./types";

export default function SightingPreview({
  sighting,
  x,
  y,
  onClose,
  onOpenDetails,
}: {
  sighting: Sighting;
  x: number;
  y: number;
  onClose?: () => void;
  onOpenDetails?: () => void;
}) {
  // simple inline SVG placeholder as data URL
  const placeholder = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='200' viewBox='0 0 320 200'>
      <rect width='100%' height='100%' fill='%23020e32' />
      <g fill='%232c88ad' opacity='0.9'><circle cx='50' cy='50' r='30'/><rect x='110' y='30' width='160' height='100' rx='8'/></g>
      <text x='160' y='180' font-family='Arial' font-size='12' fill='%23ffffff' text-anchor='middle'>Placeholder Image</text>
    </svg>`
  )}`;

  const style: React.CSSProperties = {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 999,
    width: "90%",
    height: "72vh",
    boxShadow: "0 12px 50px rgba(0,0,0,0.7)",
    borderRadius: 12,
    overflow: "hidden",
    background: "#021331",
    color: "#fff",
    transition: "transform 160ms ease, opacity 160ms ease",
  };
  const [imageSrc, setImageSrc] = useState<string>(placeholder);
  // Hardcoded mapping of sighting IDs to frontend images.
  // Place your images under `public/assets/hardcoded/` and reference them here.
  const imageMap: Record<string, string> = {
    'st-01': '/assets/hardcoded/st-01.jpg',
    'st-02': '/assets/hardcoded/st-02.jpg',
    // add more mappings as needed
  };

  useEffect(() => {
    const src = imageMap[sighting.id] || placeholder;
    setImageSrc(src);
  }, [sighting.id]);

  return (
    <div style={style} role="dialog" aria-label={sighting.title}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 8 }}>
        <strong style={{ fontSize: 14 }}>{sighting.title}</strong>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={onOpenDetails} style={{ background: "#1481b0", color: "white", border: 0, padding: "6px 8px", borderRadius: 6 }}>Open</button>
          <button onClick={onClose} aria-label="Close" style={{ background: "transparent", color: "#9fc3da", border: 0 }}>✕</button>
        </div>
      </div>
      <div style={{ display: "flex", height: "100%" }}>
        <div style={{ flex: 1, background: "#011827", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src={imageSrc} alt="placeholder" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
        </div>
        <aside style={{ width: 320, padding: 12, boxSizing: "border-box", background: "#03192a", overflow: "auto" }}>
          <h3 style={{ margin: 0 }}>{sighting.title}</h3>
          <p style={{ color: "#9fc3da", fontSize: 13 }}>{sighting.description}</p>
          <div style={{ marginTop: 12 }}>
            <button onClick={onOpenDetails} style={{ background: "#1481b0", color: "white", border: 0, padding: "8px 12px", borderRadius: 6, marginRight: 8 }}>Open</button>
            <button onClick={onClose} aria-label="Close" style={{ background: "transparent", color: "#9fc3da", border: 0 }}>Close</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
