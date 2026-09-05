"use client";

import { useMemo, useRef, useState } from "react";
import type { Sighting, SightingStatus } from "./types";

interface VectorCityMapProps {
  sightings: Sighting[];
  activeStatuses: Set<SightingStatus>;
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

export function VectorCityMap({
  sightings,
  activeStatuses,
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
        const posX = 500 + (tx * 256 - centerPx);
        const posY = 400 + (ty * 256 - centerPy);
        // Esri World Dark Gray Base (free, no API key, high rate-limit raster tiles)
        const url = `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/${zoom}/${ty}/${tx}`;
        tiles.push({ key: `esri-tile-${tx}-${ty}`, url, x: posX, y: posY });
      }
    }
    return tiles;
  }, [centerPx, centerPy, zoom]);

  // Visible sightings (filtered by the active status toggles)
  const visibleSightings = useMemo(
    () => sightings.filter((s) => activeStatuses.has(s.status)),
    [sightings, activeStatuses],
  );

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
              filter: "brightness(1.5) contrast(1.3) hue-rotate(165deg) saturate(300%)",
            }}
          />
        ))}

        {/* Sighting markers overlay */}
        {visibleSightings.map((sighting) => {
          const posX = 500 + (lngToPixel(sighting.longitude, zoom) - centerPx);
          const posY = 400 + (latToPixel(sighting.latitude, zoom) - centerPy);

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
                onSelectSighting(sighting);
              }}
              aria-label={`${labelMap[sighting.status]}: ${sighting.title}`}
            >
              <img className="marker-spider asset" src="/assets/spider-marker.png" alt="" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
