"use client";

import { useMemo, useRef, useState } from "react";
import type { Sighting, SightingStatus } from "./types";
import SightingPreview from "./SightingPreview";

interface VectorCityMapProps {
  sightings: Sighting[];
  globalSightings: Sighting[];
  activeStatuses: Set<SightingStatus>;
  worldMode: boolean;
  onSelectSighting: (sighting: Sighting) => void;
  labelMap: Record<SightingStatus, string>;
}

// Convert (lng, lat) to Mercator pixel coordinates at zoom level 13
function lngToPixel(lng: number, zoom: number = 13) {
  return ((lng + 180) / 360) * Math.pow(2, zoom) * 256;
}

function latToPixel(lat: number, zoom: number = 13) {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * Math.pow(2, zoom) * 256;
}

function pixelToLng(px: number, zoom: number = 13) {
  return (px / (256 * Math.pow(2, zoom))) * 360 - 180;
}

function pixelToLat(py: number, zoom: number = 13) {
  const n = Math.PI - (2 * Math.PI * py) / (256 * Math.pow(2, zoom));
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

export function VectorCityMap({
  sightings,
  globalSightings,
  activeStatuses,
  worldMode,
  onSelectSighting,
  labelMap,
}: VectorCityMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const centerLng = -73.9857;
  const centerLat = 40.7428;
  const zoom = 13;

  const centerPx = useMemo(() => lngToPixel(centerLng, zoom), [centerLng, zoom]);
  const centerPy = useMemo(() => latToPixel(centerLat, zoom), [centerLat, zoom]);

  // Bounded Panning Extent (Prevents dragging off NYC)
  const MAX_PAN_X = 350;
  const MAX_PAN_Y = 380;
  const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  function handleMouseDown(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('.sighting-marker-btn')) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    const newX = Math.min(Math.max(dragStartRef.current.offsetX + dx, -MAX_PAN_X), MAX_PAN_X);
    const newY = Math.min(Math.max(dragStartRef.current.offsetY + dy, -MAX_PAN_Y), MAX_PAN_Y);

    setOffset({ x: newX, y: newY });
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  // Generate OSM tile grid around the center
  const mapTiles = useMemo(() => {
    const tiles: { key: string; url: string; x: number; y: number }[] = [];

    function lngLatToTile(lng: number, lat: number, z: number) {
      const xtile = Math.floor(((lng + 180) / 360) * Math.pow(2, z));
      const radLat = (lat * Math.PI) / 180;
      const ytile = Math.floor(
        ((1 - Math.log(Math.tan(radLat) + 1 / Math.cos(radLat)) / Math.PI) / 2) * Math.pow(2, z)
      );
      return { x: xtile, y: ytile };
    }

    const centerTile = lngLatToTile(centerLng, centerLat, zoom);
    const radius = 3;
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const tx = centerTile.x + dx;
        const ty = centerTile.y + dy;
        const tilePx = tx * 256;
        const tilePy = ty * 256;
        const posX = 500 + (tilePx - centerPx);
        const posY = 400 + (tilePy - centerPy);
        const url = `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`;
        tiles.push({ key: `osm-tile-${tx}-${ty}`, url, x: posX, y: posY });
      }
    }
    return tiles;
  }, [centerPx, centerPy, zoom]);

  // Visible Sightings
  const visibleSightings = useMemo(() => {
    const all = worldMode ? [...sightings, ...globalSightings] : sightings;
    return all.filter((s) => activeStatuses.has(s.status));
  }, [sightings, globalSightings, worldMode, activeStatuses]);

  const [preview, setPreview] = useState<null | { sighting: Sighting; x: number; y: number }>(null);

  return (
    <div
      ref={containerRef}
      className="vector-city-map-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: "#02091f",
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
      }}
    >
      {/* Real NYC Map Tiles Container with Web-Radar Electric Cyan Palette */}
      <div
        className="real-nyc-tiles-layer"
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          transformOrigin: "500px 400px",
          transition: isDragging ? "none" : "transform 0.2s ease-out",
        }}
      >
        {/* PLACE THE INLINE SVG MATRIX FILTER HERE */}
        <svg style={{ position: "absolute", width: 0, height: 0 }}>
          <filter id="neon-map">
            {/* Step 1: Force baseline canvas inversion */}
            <feComponentTransfer>
              <feFuncR type="table" tableValues="1 0" />
              <feFuncG type="table" tableValues="1 0" />
              <feFuncB type="table" tableValues="1 0" />
            </feComponentTransfer>
            
            {/* Step 2: Inject targeted Hex Matrix values (#02091f and #2c88ad) */}
            <feColorMatrix
              type="matrix"
              values="0.16  0 0 0 0.008
                      0.50  0 0 0 0.035
                      0.56  0 0 0 0.121
                      0     0 0 1 0"
            />
            
            {/* Step 3: Sharp line contrast boost */}
            <feComponentTransfer>
              <feFuncR type="linear" slope="3" intercept="-0.1" />
              <feFuncG type="linear" slope="3" intercept="-0.1" />
              <feFuncB type="linear" slope="3" intercept="-0.1" />
            </feComponentTransfer>
          </filter>
        </svg>

        {mapTiles.map((tile) => (
          <img
            key={tile.key}
            src={tile.url}
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute",
              left: `${tile.x}px`,
              top: `${tile.y}px`,
              width: "256px",
              height: "256px",
              display: "block",
              pointerEvents: "none",
              /* Fine-tuned mix to land exactly on #02091f and #2c88ad */
              filter: "brightness(2.1) contrast(1.8) sepia(1) hue-rotate(168deg) saturate(650%)",
            }}
          />
        ))}

        {/* Sighting Markers Overlay */}
        {visibleSightings.map((sighting) => {
          const px = lngToPixel(sighting.longitude, zoom);
          const py = latToPixel(sighting.latitude, zoom);

          const posX = 500 + (px - centerPx);
          const posY = 400 + (py - centerPy);

          return (
            <button
              key={sighting.id}
              className={`sighting-marker sighting-marker-btn ${sighting.status} map-visible`}
              style={{
                position: "absolute",
                left: `${posX}px`,
                top: `${posY}px`,
                transform: "translate(-50%, -50%)",
                pointerEvents: "auto",
                zIndex: 20,
              }}
              onClick={(e) => {
                    e.stopPropagation();
                    window.open('/guess/' + sighting.id, '_blank');
                  }}
              aria-label={`${labelMap[sighting.status]}: ${sighting.title}`}
            >
              <img className="marker-spider asset" src="/assets/spider-marker.png" alt="" aria-hidden="true" />
            </button>
          );
        })}
          {preview && (
            <SightingPreview
              sighting={preview.sighting}
              x={preview.x}
              y={preview.y}
              onClose={() => setPreview(null)}
              onOpenDetails={() => {
                setPreview(null);
                onSelectSighting(preview.sighting);
              }}
            />
          )}
      </div>
    </div>
  );
}
