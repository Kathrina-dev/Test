"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { setWorkerCount, type GeoJSONSource, type Map as MapLibreMap, type Marker, type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { VectorCityMap } from "./VectorCityMap";
import { generateCityGeoJSON } from "./mapData";
import { seedSightings } from "./seed";
import type { Sighting, SightingStatus } from "./types";

setWorkerCount(Math.min(3, Math.max(1, Math.floor((navigator.hardwareConcurrency || 4) / 2))));

const cityGeoJSON = generateCityGeoJSON();

const mapStyle: StyleSpecification = {
  version: 8 as const,
  sources: {
    "city-vector": {
      type: "geojson",
      data: cityGeoJSON,
    },
  },
  layers: [
    {
      id: "tracker-background",
      type: "background" as const,
      paint: { "background-color": "#020e32" },
    },
    {
      id: "tracker-land",
      type: "fill" as const,
      source: "city-vector",
      filter: ["==", ["get", "kind"], "land"],
      paint: { "fill-color": "#062248", "fill-opacity": 0.95 },
    },
    {
      id: "tracker-world-land",
      type: "fill" as const,
      source: "city-vector",
      filter: ["==", ["get", "kind"], "world_land"],
      paint: { "fill-color": "#09506d", "fill-opacity": 0.75 },
    },
    {
      id: "tracker-landcover",
      type: "fill" as const,
      source: "city-vector",
      filter: ["==", ["get", "kind"], "park"],
      paint: { "fill-color": "#0a4738", "fill-opacity": 0.85 },
    },
    {
      id: "tracker-landuse",
      type: "fill" as const,
      source: "city-vector",
      filter: ["==", ["get", "kind"], "park"],
      paint: { "fill-color": "#0b5846", "fill-opacity": 0.5 },
    },
    {
      id: "tracker-buildings",
      type: "fill" as const,
      source: "city-vector",
      filter: ["==", ["get", "kind"], "building"],
      minzoom: 11,
      paint: {
        "fill-color": "#0a3768",
        "fill-outline-color": "#155786",
        "fill-opacity": 0.65,
      },
    },
    {
      id: "tracker-road-minor",
      type: "line" as const,
      source: "city-vector",
      filter: ["==", ["get", "kind"], "minor_road"],
      paint: {
        "line-color": "#0d486e",
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.8, 14, 1.8, 18, 5],
        "line-opacity": 0.75,
      },
    },
    {
      id: "tracker-road-casing",
      type: "line" as const,
      source: "city-vector",
      filter: ["==", ["get", "kind"], "major_road"],
      paint: {
        "line-color": "#021331",
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.8, 14, 4.5, 18, 12],
        "line-opacity": 0.9,
      },
    },
    {
      id: "tracker-road-lines",
      type: "line" as const,
      source: "city-vector",
      filter: ["==", ["get", "kind"], "major_road"],
      paint: {
        "line-color": "#17618b",
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.0, 14, 2.5, 18, 7],
        "line-opacity": 0.85,
      },
    },
    {
      id: "tracker-highways",
      type: "line" as const,
      source: "city-vector",
      filter: ["==", ["get", "kind"], "highway"],
      paint: {
        "line-color": "#28c7dc",
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.5, 14, 3.5, 18, 9],
        "line-opacity": 0.95,
      },
    },
    {
      id: "tracker-bridges",
      type: "line" as const,
      source: "city-vector",
      filter: ["==", ["get", "kind"], "bridge"],
      paint: {
        "line-color": "#41d67a",
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 2.0, 14, 4.0, 18, 10],
        "line-dasharray": [2, 1],
        "line-opacity": 0.9,
      },
    },
  ],
};

const globalSightings: Sighting[] = [
  ["Los Angeles", 34.0522, -118.2437, "rumored"], ["Mexico City", 19.4326, -99.1332, "confirmed"],
  ["Bogotá", 4.711, -74.0721, "confirmed"], ["São Paulo", -23.5505, -46.6333, "rumored"],
  ["London", 51.5072, -0.1276, "archived"], ["Paris", 48.8566, 2.3522, "confirmed"],
  ["Berlin", 52.52, 13.405, "confirmed"], ["Istanbul", 41.0082, 28.9784, "rumored"],
  ["Riyadh", 24.7136, 46.6753, "archived"], ["Tokyo", 35.6762, 139.6503, "confirmed"],
  ["Manila", 14.5995, 120.9842, "confirmed"], ["Jakarta", -6.2088, 106.8456, "rumored"],
  ["Sydney", -33.8688, 151.2093, "rumored"], ["Johannesburg", -26.2041, 28.0473, "archived"],
].map(([city, latitude, longitude, status], index) => ({
  id: `global-${index}`,
  title: `Signal in ${city}`,
  description: "Arachnid signature detected by the global network.",
  latitude: latitude as number,
  longitude: longitude as number,
  status: status as SightingStatus,
  confidence: 58 + (index * 7) % 39,
  createdAt: "2026-08-04T18:00:00Z",
}));

const label: Record<SightingStatus, string> = {
  confirmed: "CONFIRMED",
  rumored: "RUMOR",
  archived: "ARCHIVED",
};

function PixelSpider({ small = false }: { small?: boolean }) {
  return (
    <img className={`pixel-spider asset ${small ? "small" : ""}`} src="/assets/spider-marker.png" alt="" aria-hidden="true" />
  );
}

export function App() {
  const introAudioRef = useRef<HTMLAudioElement | null>(null);
  const introTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const introStartedRef = useRef(false);
  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const mediaPopupRef = useRef<maplibregl.Popup | null>(null);
  const selectedAudioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const adminTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const adminTapCountRef = useRef(0);
  const sightingOpenRequestRef = useRef(0);
  const [sightings, setSightings] = useState<Sighting[]>(seedSightings);
  const [active, setActive] = useState<Set<SightingStatus>>(new Set(["confirmed", "rumored", "archived"]));
  const [selected, setSelected] = useState<Sighting | null>(null);
  const [worldMode, setWorldMode] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ audioData?: string; imageData?: string } | null>(null);
  const [introPhase, setIntroPhase] = useState<"waiting" | "opening" | "done">("waiting");
  const [introBlocked, setIntroBlocked] = useState(false);
  const [adminPromptOpen, setAdminPromptOpen] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [adminStatus, setAdminStatus] = useState<"idle" | "checking" | "invalid" | "blocked" | "error">("idle");
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try { return sessionStorage.getItem("spidey:admin-session"); } catch { return null; }
  });
  const [adminDeleteArmedId, setAdminDeleteArmedId] = useState<string | null>(null);
  const [developerCredit, setDeveloperCredit] = useState<{ name: string; url: string } | null>(null);
  const [notice, setNotice] = useState("SCANNER ONLINE // NYC GRID");
  const [isGuessMode, setIsGuessMode] = useState(false);
  const [guessCoords, setGuessCoords] = useState<[number, number] | null>(null);
  const guessMarkerRef = useRef<Marker | null>(null);

  async function submitGuess() {
    if (!guessCoords) return;
    try {
      setNotice("VERIFYING COORDINATES...");
      const res = await fetch('/api/cet/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationID: 'target-1',
          lat: guessCoords[1],
          lng: guessCoords[0]
        })
      });
      const data = await res.json();
      if (data.correct) {
        setNotice(`TARGET ACQUIRED // DISTANCE: ${data.distance}KM`);
        setIsGuessMode(false);
      } else {
        setNotice(`MISS // DISTANCE: ${data.distance}KM`);
      }
    } catch (e) {
      setNotice("VERIFICATION FAILED");
    }
  }

  function launchIntro() {
    if (introStartedRef.current) return;
    introStartedRef.current = true;
    setIntroBlocked(false);
    setIntroPhase("opening");
    const audio = introAudioRef.current;
    if (audio) {
      audio.currentTime = 0;
      void audio.play().catch(() => undefined);
    }
    introTimerRef.current = setTimeout(() => setIntroPhase("done"), 2350);
  }

  useEffect(() => {
    const audio = new Audio("/assets/spidey-intro.mp3");
    audio.preload = "auto";
    audio.volume = 0.72;
    introAudioRef.current = audio;
    audio.play().then(launchIntro).catch(() => setIntroBlocked(true));
    return () => {
      audio.pause();
      if (introTimerRef.current) clearTimeout(introTimerRef.current);
      introAudioRef.current = null;
    };
  }, []);


  useEffect(() => {
    fetch("/api/public-config")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: { developer?: { name?: unknown; url?: unknown } | null }) => {
        const name = typeof data.developer?.name === "string" ? data.developer.name.trim() : "";
        const url = typeof data.developer?.url === "string" ? data.developer.url : "";
        if (!name || !/^https?:\/\//u.test(url)) return;
        setDeveloperCredit({ name, url });
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    fetch("/api/sightings")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: { sightings: Sighting[]; source: string }) => {
        setSightings(data.sightings);
        const latestCommunityReport = data.sightings.find((sighting) => !sighting.id.startsWith("st-"));
        if (latestCommunityReport && !localStorage.getItem("spidey:last-report-location")) {
          const center: [number, number] = [latestCommunityReport.longitude, latestCommunityReport.latitude];
          localStorage.setItem("spidey:last-report-location", JSON.stringify(center));
          mapRef.current?.jumpTo({ center, zoom: 15.2, pitch: 0, bearing: 0 });
        }
        setNotice(data.source === "turso" ? "TURSO LINK ESTABLISHED" : "DEMO SIGNAL ACTIVE");
      })
      .catch(() => setNotice("LOCAL SIGNAL ACTIVE"));
  }, []);

  useEffect(() => () => {
    selectedAudioPlayerRef.current?.pause();
  }, []);

  useEffect(() => {
    if (!mapNode.current || mapRef.current) return;
    let initialCenter: [number, number] = [-73.9857, 40.7428];
    try {
      const savedCenter = JSON.parse(localStorage.getItem("spidey:last-report-location") ?? "null") as [number, number] | null;
      if (savedCenter && Number.isFinite(savedCenter[0]) && Number.isFinite(savedCenter[1])) initialCenter = savedCenter;
    } catch {
      // Invalid local state falls back to the original NYC grid.
    }
    const map = new maplibregl.Map({
      container: mapNode.current,
      style: mapStyle,
      center: initialCenter,
      zoom: 12.7,
      minZoom: 0.35,
      maxZoom: 19,
      attributionControl: false,
      pixelRatio: Math.min(window.devicePixelRatio || 1, 1.35),
      fadeDuration: 0,
      refreshExpiredTiles: false,
      renderWorldCopies: false,
      maxTileCacheZoomLevels: 2,
      validateStyle: false,
    });
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    if (mapNode.current) {
      resizeObserver.observe(mapNode.current);
    }
    requestAnimationFrame(() => map.resize());

    return () => {
      resizeObserver.disconnect();
      mediaPopupRef.current?.remove();
      mapRef.current = null;
      map.remove();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = (worldMode ? [...sightings, ...globalSightings] : sightings)
      .filter((sighting) => active.has(sighting.status))
      .map((sighting) => {
        const element = document.createElement("button");
        element.className = `sighting-marker ${sighting.status}`;
        element.setAttribute("aria-label", `${label[sighting.status]}: ${sighting.title}`);
        element.innerHTML = '<img class="marker-spider asset" src="/assets/spider-marker.png" alt="" aria-hidden="true">';
        element.addEventListener("click", () => {
          void openSighting(sighting);
        });
        return new maplibregl.Marker({ element, anchor: "center" })
          .setLngLat([sighting.longitude, sighting.latitude])
          .addTo(map);
      });

    const syncVisibleMarkers = () => {
      const canvas = map.getCanvas();
      const margin = 38;
      markersRef.current.forEach((marker, index) => {
        const point = map.project(marker.getLngLat());
        const visible = point.x >= -margin
          && point.y >= -margin
          && point.x <= canvas.clientWidth + margin
          && point.y <= canvas.clientHeight + margin;
        const element = marker.getElement();
        element.style.setProperty("--marker-delay", `${Math.min(index % 8, 7) * 35}ms`);
        element.classList.toggle("map-visible", visible);
      });
    };

    map.on("move", syncVisibleMarkers);
    map.on("zoom", syncVisibleMarkers);
    map.once("idle", syncVisibleMarkers);
    syncVisibleMarkers();

    return () => {
      map.off("move", syncVisibleMarkers);
      map.off("zoom", syncVisibleMarkers);
      map.off("idle", syncVisibleMarkers);
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
  }, [sightings, active, worldMode, adminToken]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    
    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      if (isGuessMode) {
        setGuessCoords([e.lngLat.lng, e.lngLat.lat]);
      }
    };
    
    if (isGuessMode) {
      map.on('click', handleMapClick);
      map.getCanvas().style.cursor = 'crosshair';
    } else {
      map.off('click', handleMapClick);
      map.getCanvas().style.cursor = '';
      setGuessCoords(null);
    }
    
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isGuessMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (guessCoords) {
      if (!guessMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'guess-marker';
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.backgroundColor = '#ff0000';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 0 10px rgba(255,0,0,0.5)';
        guessMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat(guessCoords)
          .addTo(map);
      } else {
        guessMarkerRef.current.setLngLat(guessCoords);
      }
    } else {
      guessMarkerRef.current?.remove();
      guessMarkerRef.current = null;
    }
  }, [guessCoords]);

  const visibleCount = useMemo(
    () => sightings.filter((sighting) => active.has(sighting.status) && sighting.status !== "archived").length,
    [active, sightings],
  );

  function toggleStatus(status: SightingStatus) {
    setActive((current) => {
      const next = new Set(current);
      next.has(status) ? next.delete(status) : next.add(status);
      return next;
    });
  }

  function setMapProjection(type: "mercator" | "globe") {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => map.setProjection({ type });
    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }

  function handleHeroEasterTap() {
    const clueSet = [
      "SPIDER SIGNAL // NEAR THE RIVER",
      "BLOOD RED TRACE // TOWER BLOCKS",
      "WHISPERS IN THE GRID // FOLLOW THE LIGHT",
      "NOISE AT THE EDGE // WATCH THE HUD",
    ];
    const next = clueSet[Math.floor(Math.random() * clueSet.length)];
    setNotice(next);
  }

  function handleAdminMaskTap() {
    adminTapCountRef.current += 1;
    if (adminTapTimerRef.current) clearTimeout(adminTapTimerRef.current);
    if (adminTapCountRef.current >= 5) {
      adminTapCountRef.current = 0;
      setAdminCode("");
      setAdminStatus("idle");
      setAdminPromptOpen(true);
      setNotice(adminToken ? "GOD MODE // SESSION ACTIVE" : "CLASSIFIED ACCESS // CODE REQUIRED");
      return;
    }
    adminTapTimerRef.current = setTimeout(() => { adminTapCountRef.current = 0; }, 3500);
  }

  async function unlockAdminMode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adminCode.trim() || adminStatus === "checking") return;
    setAdminStatus("checking");
    try {
      const response = await fetch("/api/moderation/unlock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: adminCode }),
      });
      if (!response.ok) {
        setAdminStatus(response.status === 429 ? "blocked" : response.status === 401 ? "invalid" : "error");
        return;
      }
      const data = await response.json() as { token: string };
      setAdminToken(data.token);
      try { sessionStorage.setItem("spidey:admin-session", data.token); } catch { /* Session storage is optional. */ }
      setAdminCode("");
      setAdminStatus("idle");
      setAdminPromptOpen(false);
      setNotice("GOD MODE ENABLED // DIRECT MODERATION ACTIVE");
    } catch {
      setAdminStatus("error");
    }
  }

  function lockAdminMode() {
    setAdminToken(null);
    setAdminDeleteArmedId(null);
    try { sessionStorage.removeItem("spidey:admin-session"); } catch { /* Session storage is optional. */ }
    setAdminPromptOpen(false);
    setNotice("GOD MODE DISABLED");
  }

  async function removeSightingAsAdmin(sighting: Sighting) {
    if (!adminToken) return false;
    try {
      const response = await fetch(`/api/sightings/${encodeURIComponent(sighting.id)}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${adminToken}` },
      });
      if (response.status === 401) {
        lockAdminMode();
        setNotice("GOD SESSION EXPIRED // UNLOCK AGAIN");
        return false;
      }
      if (!response.ok) throw new Error("admin removal failed");
      selectedAudioPlayerRef.current?.pause();
      mediaPopupRef.current?.remove();
      setSightings((items) => items.filter((item) => item.id !== sighting.id));
      setSelected(null);
      setSelectedMedia(null);
      setAdminDeleteArmedId(null);
      setNotice("GOD MODE // SIGHTING REMOVED");
      return true;
    } catch {
      setNotice("GOD MODE // REMOVAL FAILED");
      return false;
    }
  }

  function requestAdminRemoval(sighting: Sighting) {
    if (adminDeleteArmedId !== sighting.id) {
      setAdminDeleteArmedId(sighting.id);
      setNotice("PRESS DELETE AGAIN TO CONFIRM");
      setTimeout(() => setAdminDeleteArmedId((current) => current === sighting.id ? null : current), 4500);
      return;
    }
    void removeSightingAsAdmin(sighting);
  }

  function showWorld() {
    setWorldMode(true);
    setMapProjection("mercator");
    mapRef.current?.setPaintProperty("tracker-background", "background-color", "#09506d");
    mapRef.current?.setPaintProperty("tracker-landcover", "fill-color", "#0d617a");
    mapRef.current?.setPaintProperty("tracker-landuse", "fill-color", "#0b5874");
    mapRef.current?.easeTo({ center: [0, 17], zoom: window.innerWidth <= 640 ? 0.82 : 1.15, pitch: 0, bearing: 0, duration: 1200 });
    setNotice("GLOBAL SCAN ACTIVE");
  }

  async function openSighting(sighting: Sighting, autoplay = true) {
    const requestId = ++sightingOpenRequestRef.current;
    selectedAudioPlayerRef.current?.pause();
    selectedAudioPlayerRef.current = null;
    mediaPopupRef.current?.remove();
    setSelected(null);
    setSelectedMedia(null);
    try {
      // Frontend-served images: map sighting IDs to frontend assets.
      const imageMap: Record<string, string> = {
        'st-01': '/assets/hardcoded/st-01.jpg',
        'st-02': '/assets/hardcoded/st-02.jpg',
      };
      const imageData = imageMap[sighting.id] || null;
      const media = { imageData } as { audioData?: string; imageData?: string; moderation?: { keep: number; delete: number; total: number; removed: boolean } };
      if (requestId !== sightingOpenRequestRef.current) return;
      setSelectedMedia(media);
      if (media.imageData && mapRef.current) {
        const card = document.createElement("article");
        card.className = "map-sighting-media";
        const moderationBar = document.createElement("div");
        moderationBar.className = "moderation-bar";
        const keepButton = document.createElement("button");
        keepButton.type = "button";
        keepButton.className = "moderation-keep";
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "moderation-delete";
        const updateModeration = (moderation = { keep: 0, delete: 0, total: 0, removed: false }) => {
          keepButton.textContent = `✓ ${moderation.keep}`;
          keepButton.title = "Vote to keep report";
          deleteButton.textContent = `🗑 ${moderation.delete}`;
          deleteButton.title = "Vote to delete report";
        };
        updateModeration(media.moderation);
        const castVote = async (vote: "keep" | "delete") => {
          keepButton.disabled = true;
          deleteButton.disabled = true;
          try {
            const voteResponse = await fetch(`/api/sightings/${encodeURIComponent(sighting.id)}/vote`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ vote }),
            });
            if (!voteResponse.ok) throw new Error("vote failed");
            const result = await voteResponse.json() as { moderation: { keep: number; delete: number; total: number; removed: boolean } };
            updateModeration(result.moderation);
            if (result.moderation.removed) {
              mediaPopupRef.current?.remove();
              setSightings((items) => items.filter((item) => item.id !== sighting.id));
              setNotice("COMMUNITY REMOVED THIS SIGHTING");
              return;
            }
            setNotice(vote === "delete" ? "REMOVAL VOTE REGISTERED" : "KEEP VOTE REGISTERED");
          } catch {
            setNotice("MODERATION VOTE FAILED");
          } finally {
            keepButton.disabled = false;
            deleteButton.disabled = false;
          }
        };
        keepButton.addEventListener("click", () => void castVote("keep"));
        deleteButton.addEventListener("click", () => void castVote("delete"));
        moderationBar.append(keepButton, deleteButton);
        if (adminToken) {
          const adminDeleteButton = document.createElement("button");
          adminDeleteButton.type = "button";
          adminDeleteButton.className = "moderation-admin-delete";
          adminDeleteButton.textContent = "GOD DELETE";
          adminDeleteButton.title = "Immediately delete as administrator";
          let armed = false;
          let disarmTimer: ReturnType<typeof setTimeout> | null = null;
          adminDeleteButton.addEventListener("click", () => {
            if (!armed) {
              armed = true;
              adminDeleteButton.textContent = "CONFIRM DELETE";
              setNotice("PRESS DELETE AGAIN TO CONFIRM");
              disarmTimer = setTimeout(() => {
                armed = false;
                adminDeleteButton.textContent = "GOD DELETE";
              }, 4500);
              return;
            }
            if (disarmTimer) clearTimeout(disarmTimer);
            adminDeleteButton.disabled = true;
            void removeSightingAsAdmin(sighting);
          });
          moderationBar.append(adminDeleteButton);
        }
        card.appendChild(moderationBar);
        const image = document.createElement("img");
        image.src = media.imageData || '';
        image.alt = `Image of ${sighting.title}`;
        card.appendChild(image);
        const action = document.createElement("button");
        action.type = "button";
        action.className = "sighting-playback";
        action.textContent = media.audioData ? "▶ VIEW SIGHTING" : "VIEW SIGHTING";
        card.appendChild(action);

        let player: HTMLAudioElement | null = null;
        if (media.audioData) {
          player = new Audio(media.audioData);
          selectedAudioPlayerRef.current = player;
          player.addEventListener("play", () => { action.textContent = "Ⅱ PAUSE SIGHTING"; card.classList.add("playing"); });
          player.addEventListener("pause", () => { action.textContent = "▶ VIEW SIGHTING"; card.classList.remove("playing"); });
          player.addEventListener("ended", () => { action.textContent = "▶ PLAY AGAIN"; card.classList.remove("playing"); });
          action.addEventListener("click", () => { if (!player) return; if (player.paused) player.play().catch(() => undefined); else player.pause(); });
        }

        const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: false, offset: 28, maxWidth: "260px", className: "spidey-media-popup" })
          .setLngLat([sighting.longitude, sighting.latitude])
          .setDOMContent(card)
          .addTo(mapRef.current);
        popup.on("close", () => player?.pause());
        mediaPopupRef.current = popup;
        if (autoplay) player?.play().catch(() => undefined);
        return;
      }
      setSelected(sighting);
      if (media.audioData) {
        const player = new Audio(media.audioData);
        selectedAudioPlayerRef.current = player;
        if (autoplay) await player.play().catch(() => undefined);
      }
    } catch {
      if (requestId === sightingOpenRequestRef.current) setSelected(sighting);
    }
  }


  return (
    <main className="page-shell">
      {introPhase !== "done" && <div className={`app-intro ${introPhase}`} role="dialog" aria-label="Starting Spidey Tracker" aria-live="polite">
        <div className="intro-door intro-door-left" />
        <div className="intro-door intro-door-right" />
        <button className="intro-center" onClick={introBlocked ? launchIntro : undefined} disabled={!introBlocked}>
          <span className="intro-web" aria-hidden="true" />
          <img className="intro-mask asset" src="/spidey-tracker-icon-512.png" alt="Spidey Tracker" />
          <strong>SPIDEY TRACKER</strong>
          <small>{introBlocked ? "TAP TO START" : introPhase === "opening" ? "OPENING CITY GRID..." : "INITIALIZING SIGNAL..."}</small>
          <span className="intro-progress" aria-hidden="true"><i /></span>
        </button>
      </div>}
      <section className="tracker" aria-label="Spidey Tracker">
        <div className="outer-bevel" />
        <header className="tracker-header">
          <div className="mini-radar"><span /><span /><span /></div>
          <div className="status-line">SMT_1 <b>{notice}</b></div>
          <div className="alert-chip"><PixelSpider small /></div>
        </header>

        <nav className="side-controls" aria-label="Quick filters">
          {(["confirmed", "rumored", "archived"] as SightingStatus[]).map((status) => (
            <button
              key={status}
              className={`filter-button ${status} ${active.has(status) ? "active" : ""}`}
              onClick={() => toggleStatus(status)}
              aria-pressed={active.has(status)}
              aria-label={`${status} sightings`}
              title={status}
            >
              <img className="filter-spider asset" src="/assets/spider-marker.png" alt="" aria-hidden="true" />
            </button>
          ))}
          <div
            className="side-hero animated"
            role="button"
            tabIndex={0}
            onClick={handleHeroEasterTap}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleHeroEasterTap();
              }
            }}
            aria-label="Arachnid operator — secret signal"
          >
            <span className="hero-signal" aria-hidden="true" />
            <img className="hero-asset generated" src="/assets/web-hero-transparent-v2-256.png" alt="Arachnid operator" />
          </div>
        </nav>

        <div className={`map-frame ${worldMode ? "world-mode" : ""}`}>
          <div ref={mapNode} className="map" />
          <VectorCityMap
            sightings={sightings}
            globalSightings={globalSightings}
            activeStatuses={active}
            worldMode={worldMode}
            onSelectSighting={(sighting) => {
              void openSighting(sighting);
            }}
            labelMap={label}
          />
          <div className="map-grid" />
          <div className="scanline" />

          <div className="web-radar-shell" aria-label="Radar controls">
            <div className="web-radar css-web" aria-hidden="true">
              <span className="web-ring wr1" /><span className="web-ring wr2" />
              <span className="web-ring wr3" /><span className="web-ring wr4" />
              {Array.from({ length: 16 }, (_, index) => (
                <i key={index} style={{ transform: `rotate(${index * 22.5}deg)` }} />
              ))}
              <span className="radar-sweep" />
              <b className="radar-blip rb1" /><b className="radar-blip rb2" />
              <b className="radar-blip rb3" /><b className="radar-blip rb4" />
            </div>
            <button className="radar-action radar-world" aria-label="Show entire world" title="World view">
              <svg className="globe-icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="8" />
                <path d="M12 4v16M4 12h16" />
                <path d="M7 7.5c1.5 1.7 2.2 3.3 2.2 4.5S8.5 15.8 7 17.5M17 7.5c-1.5 1.7-2.2 3.3-2.2 4.5s.7 2.8 2.2 4.5" />
              </svg>
            </button>
            <button className="radar-action radar-location" aria-label="Go to my location" title="My Location">
              <svg className="location-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11Z" />
                <circle cx="12" cy="10" r="2.8" />
              </svg>
            </button>
            <button className={`radar-action radar-guess ${isGuessMode ? 'active' : ''}`} aria-label="Guess Location" title="Guess Location" onClick={() => {
              setIsGuessMode(!isGuessMode);
              if (!isGuessMode) showWorld();
              setNotice(!isGuessMode ? "GUESS MODE // DROP A PIN" : "GUESS ABORTED");
            }}>
              <svg className="target-icon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
                <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="2"/>
                <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2"/>
                <line x1="2" y1="12" x2="6" y2="12" stroke="currentColor" strokeWidth="2"/>
                <line x1="18" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
          </div>

          {isGuessMode && guessCoords && (
            <div className="guess-overlay" style={{ position: 'absolute', bottom: '120px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
              <button onClick={submitGuess} style={{ padding: '10px 20px', background: '#ff003c', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 0 10px rgba(255,0,60,0.8)', letterSpacing: '2px' }}>
                SUBMIT COORDINATES
              </button>
            </div>
          )}

          {selected && (
            <article className={`sighting-card ${selected.status} ${selectedMedia?.imageData ? "with-media" : ""}`}>
              <button onClick={() => { selectedAudioPlayerRef.current?.pause(); setSelected(null); setSelectedMedia(null); }} aria-label="Close details">×</button>
              {selectedMedia?.imageData && <img className="sighting-card-image" src={selectedMedia.imageData} alt="Sighting image" />}
              <small>{label[selected.status]} // {selected.confidence}%</small>
              <h2>{selected.title}</h2>
              <p>{selected.description}</p>
              {selectedMedia?.audioData && <button className="sighting-card-audio" onClick={() => {
                const player = selectedAudioPlayerRef.current;
                if (!player) return;
                if (player.paused) player.play().catch(() => undefined); else player.pause();
              }}>▶ PLAY AUDIO</button>}
              {adminToken && <button className={`sighting-admin-delete ${adminDeleteArmedId === selected.id ? "armed" : ""}`} onClick={() => requestAdminRemoval(selected)}>
                {adminDeleteArmedId === selected.id ? "CONFIRM GOD DELETE" : "GOD DELETE SIGHTING"}
              </button>}
            </article>
          )}
        </div>

        {adminPromptOpen && <div className="panel-backdrop admin-backdrop" onClick={() => setAdminPromptOpen(false)}>
          <section className="pixel-panel admin-panel" onClick={(event) => event.stopPropagation()} aria-label="Administrative access">
            <button className="panel-close" onClick={() => setAdminPromptOpen(false)} aria-label="Close administrative access">×</button>
            <span className="admin-classified">CLASSIFIED // LEVEL 616</span>
            {adminToken ? <>
              <h2>GOD MODE // ACTIVE</h2>
              <p>Direct deletion unlocked. Open a report and use GOD DELETE twice to confirm.</p>
              <button className="admin-lock-button" onClick={lockAdminMode}>DISABLE GOD MODE</button>
            </> : <form onSubmit={unlockAdminMode}>
              <h2>ENTER ACCESS CODE</h2>
              <p>Enter the secret access code configured on the server.</p>
              <input
                className="admin-code-input"
                type="password"
                value={adminCode}
                onChange={(event) => { setAdminCode(event.target.value); setAdminStatus("idle"); }}
                autoComplete="off"
                spellCheck={false}
                maxLength={512}
                autoFocus
                aria-label="Administrative access code"
              />
              {adminStatus !== "idle" && <small className={`admin-access-status ${adminStatus}`} role="status">
                {adminStatus === "checking" ? "VERIFYING SIGNAL..." : adminStatus === "invalid" ? "ACCESS DENIED // INVALID CODE" : adminStatus === "blocked" ? "TOO MANY ATTEMPTS // WAIT 15 MIN" : "ADMIN LINK FAILED // TRY AGAIN"}
              </small>}
              <button className="admin-unlock-button" type="submit" disabled={!adminCode.trim() || adminStatus === "checking"}>
                {adminStatus === "checking" ? "VERIFYING..." : "UNLOCK GOD MODE"}
              </button>
            </form>}
          </section>
        </div>}

        {developerCredit && <div className="developer-credit">
          <span>DEVELOPED BY</span>
          <a href={developerCredit.url} target="_blank" rel="noopener noreferrer">{developerCredit.name}</a>
        </div>}
      </section>
    </main>
  );
}
