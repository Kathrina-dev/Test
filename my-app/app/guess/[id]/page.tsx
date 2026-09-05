"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function GuessPage() {
  const params = useParams();
  const id = params.id as string;

  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guessCoords, setGuessCoords] = useState<[number, number] | null>(null);
  const [result, setResult] = useState<{ correct: boolean; distance: number; message: string; flag?: string } | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  // Fetch challenge data
  useEffect(() => {
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/$/, '');
    fetch(`${apiBase}/api/cet/challenge/${encodeURIComponent(id)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Challenge not found");
        return res.json();
      })
      .then((data) => setImage(data.image))
      .catch((err) => setError(err.message));
  }, [id]);

  // Initialize Map
  useEffect(() => {
    if (!mapNode.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapNode.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
          },
        ],
      },
      center: [0, 20],
      zoom: 1,
      attributionControl: false,
    });

    // Add zoom and rotation controls to the map.
    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on("click", (e) => {
      const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      setGuessCoords(coords);

      if (!markerRef.current) {
        markerRef.current = new maplibregl.Marker({ color: "#ff0000" })
          .setLngLat(coords)
          .addTo(map);
      } else {
        markerRef.current.setLngLat(coords);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // No resize needed - using CSS transform scale instead

  async function submitGuess() {
    if (!guessCoords) return;
    try {
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/$/, '');
      const res = await fetch(`${apiBase}/api/cet/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationID: id,
          lat: guessCoords[1],
          lng: guessCoords[0],
        }),
      });
      const data = await res.json();
      setResult(data);
      if (!data.correct) {
        setTimeout(() => setResult(null), 5000);
      }
    } catch (e) {
      console.error(e);
      alert("Error verifying guess.");
    }
  }

  if (error) {
    return <div style={{ color: "white", padding: 20 }}>{error}</div>;
  }

  return (
    <main style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", backgroundColor: "#000" }}>
      {/* Background Image */}
      {image && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage: `url(/${image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}

      {/* Mini Map - expands from bottom-right corner using scale transform */}
      <div
        onMouseEnter={() => setIsMapExpanded(true)}
        onMouseLeave={() => setIsMapExpanded(false)}
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          width: 400,
          height: 300,
          borderRadius: 8,
          overflow: "hidden",
          boxShadow: isMapExpanded ? "0 8px 32px rgba(0,0,0,0.7)" : "0 2px 12px rgba(0,0,0,0.5)",
          border: isMapExpanded ? "2px solid rgba(255,255,255,0.9)" : "2px solid rgba(255,255,255,0.5)",
          transformOrigin: "bottom right",
          transform: isMapExpanded ? "scale(1)" : "scale(0.625)",
          transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.35s ease, border-color 0.35s ease",
          zIndex: 10,
          cursor: "crosshair",
        }}
      >
        <div ref={mapNode} style={{ width: "100%", height: "100%" }} />
        {!isMapExpanded && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.15)", pointerEvents: "none",
            fontSize: 13, color: "white", fontWeight: "bold", letterSpacing: 1,
            textShadow: "0 1px 4px rgba(0,0,0,0.8)",
          }}>
            HOVER TO EXPAND
          </div>
        )}
      </div>

      {/* Submit Button - hidden only when correct */}
      {guessCoords && !(result?.correct) && (
        <button
          onClick={submitGuess}
          style={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "12px 24px",
            fontSize: "18px",
            fontWeight: "bold",
            backgroundColor: "#28c7dc",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
            zIndex: 10,
          }}
        >
          SUBMIT GUESS
        </button>
      )}

      {/* Result Toast */}
      {result && (
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 24,
            zIndex: 20,
            background: result.correct ? "rgba(20,60,30,0.95)" : "rgba(60,20,20,0.95)",
            border: `2px solid ${result.correct ? "#41d67a" : "#ff4444"}`,
            borderRadius: 8,
            padding: "16px 20px",
            color: "white",
            minWidth: 220,
            maxWidth: 340,
            boxShadow: `0 4px 24px ${result.correct ? "rgba(65,214,122,0.25)" : "rgba(255,68,68,0.25)"}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: result.flag ? 12 : 0 }}>
            <span style={{ fontSize: 20 }}>{result.correct ? "✓" : "✗"}</span>
            <strong style={{ fontSize: 15, letterSpacing: 1 }}>{result.correct ? "CORRECT" : "INCORRECT"}</strong>
            <button
              onClick={() => setResult(null)}
              style={{ marginLeft: "auto", background: "none", border: "none", color: "white", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 2px" }}
            >×</button>
          </div>
          {result.flag && (
            <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: 4, padding: "8px 10px", fontFamily: "monospace", fontSize: 13, wordBreak: "break-all", color: "#41d67a" }}>
              {result.flag}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
