"use client";

import { useEffect, useRef, useState } from "react";
import { VectorCityMap } from "./VectorCityMap";
import { seedSightings } from "./seed";
import { ensureSession, createSession, type SessionInfo } from "./session";
import type { SightingStatus } from "./types";

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

function formatClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60).toString().padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

interface SessionStatus {
  solved: string[];
  total: number;
  remainingMs: number;
  expired: boolean;
  complete: boolean;
  flag: string | null;
}

export function App() {
  const introAudioRef = useRef<HTMLAudioElement | null>(null);
  const introTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const introStartedRef = useRef(false);

  const [active, setActive] = useState<Set<SightingStatus>>(new Set(["confirmed", "rumored", "archived"]));
  const [introPhase, setIntroPhase] = useState<"waiting" | "opening" | "done">("waiting");
  const [introBlocked, setIntroBlocked] = useState(false);
  const [notice, setNotice] = useState("SCANNER ONLINE // NYC GRID");

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [status, setStatus] = useState<SessionStatus>({
    solved: [],
    total: seedSightings.length,
    remainingMs: 0,
    expired: false,
    complete: false,
    flag: null,
  });
  const [remainingMs, setRemainingMs] = useState(0);

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

  // Establish an anonymous session (30 minute window) on load.
  useEffect(() => {
    let cancelled = false;
    ensureSession()
      .then((info) => {
        if (cancelled) return;
        setSession(info);
        setRemainingMs(Math.max(0, info.expiresAt - Date.now()));
        setNotice("SESSION LIVE // SOLVE ALL SIGHTINGS");
      })
      .catch(() => setNotice("SESSION LINK FAILED // RELOAD"));
    return () => { cancelled = true; };
  }, []);

  // Poll session progress from the server so solves made in the guess tabs
  // show up here and the flag is revealed on completion.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/cet/session/${encodeURIComponent(session.token)}`);
        if (!res.ok) return;
        const data = (await res.json()) as SessionStatus;
        if (cancelled) return;
        setStatus(data);
        setRemainingMs(data.remainingMs);
        if (data.complete && data.flag) setNotice("ALL SIGHTINGS CONFIRMED // FLAG UNLOCKED");
        else if (data.expired) setNotice("SESSION EXPIRED // RESTART TO RETRY");
      } catch {
        /* transient network errors are ignored; next tick retries */
      }
    };

    void poll();
    const id = setInterval(poll, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, [session]);

  // Local 1s countdown between server polls.
  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => {
      setRemainingMs(Math.max(0, session.expiresAt - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [session]);

  const expired = status.expired || (session != null && remainingMs <= 0 && !status.complete);

  async function restartSession() {
    try {
      setNotice("STARTING NEW SESSION...");
      const info = await createSession();
      setSession(info);
      setRemainingMs(Math.max(0, info.expiresAt - Date.now()));
      setStatus({ solved: [], total: status.total, remainingMs: info.expiresAt - Date.now(), expired: false, complete: false, flag: null });
      setNotice("SESSION LIVE // SOLVE ALL SIGHTINGS");
    } catch {
      setNotice("SESSION LINK FAILED // RELOAD");
    }
  }

  function openSighting(id: string) {
    window.open(`/guess/${id}`, "_blank", "noopener,noreferrer");
  }

  function toggleStatus(status: SightingStatus) {
    setActive((current) => {
      const next = new Set(current);
      if (next.has(status)) next.delete(status); else next.add(status);
      return next;
    });
  }

  const solvedCount = status.solved.length;
  const total = status.total || seedSightings.length;
  const progressPct = total > 0 ? Math.round((solvedCount / total) * 100) : 0;
  const timerCritical = remainingMs <= 5 * 60 * 1000;

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
          {(["confirmed", "rumored", "archived"] as SightingStatus[]).map((s) => (
            <button
              key={s}
              className={`filter-button ${s} ${active.has(s) ? "active" : ""}`}
              onClick={() => toggleStatus(s)}
              aria-pressed={active.has(s)}
              aria-label={`${s} sightings`}
              title={s}
            >
              <img className="filter-spider asset" src="/assets/spider-marker.png" alt="" aria-hidden="true" />
            </button>
          ))}
        </nav>

        <div className="map-frame">
          <VectorCityMap
            sightings={seedSightings}
            activeStatuses={active}
            onSelectSighting={(sighting) => openSighting(sighting.id)}
            labelMap={label}
          />
          <div className="map-grid" />
          <div className="scanline" />

          {/* Session HUD: timer + progress + flag */}
          <div style={hud.panel} aria-label="Session status">
            <div style={hud.row}>
              <span style={hud.label}>SESSION</span>
              <span style={{ ...hud.timer, color: expired ? "#ff5470" : timerCritical ? "#ffb347" : "#41d67a" }}>
                {expired ? "EXPIRED" : formatClock(remainingMs)}
              </span>
            </div>
            <div style={hud.progressLabel}>
              <span>SIGHTINGS CONFIRMED</span>
              <span>{solvedCount}/{total}</span>
            </div>
            <div style={hud.track}>
              <div style={{ ...hud.fill, width: `${progressPct}%` }} />
            </div>

            {status.complete && status.flag && (
              <div style={hud.flagBox}>
                <div style={hud.flagLabel}>✓ ALL SIGHTINGS CONFIRMED</div>
                <code style={hud.flagCode}>{status.flag}</code>
              </div>
            )}

            {expired && !status.complete && (
              <button style={hud.restart} onClick={restartSession}>RESTART SESSION</button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

const hud: Record<string, React.CSSProperties> = {
  panel: {
    position: "absolute",
    bottom: 16,
    left: 16,
    zIndex: 30,
    width: 260,
    padding: "12px 14px",
    background: "rgba(2, 14, 50, 0.88)",
    border: "1px solid rgba(40, 199, 220, 0.5)",
    borderRadius: 8,
    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
    backdropFilter: "blur(4px)",
    color: "#cfeaff",
    fontFamily: "monospace",
  },
  row: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  label: { fontSize: 11, letterSpacing: 2, color: "#7fb6d6" },
  timer: { fontSize: 22, fontWeight: "bold", letterSpacing: 2, fontVariantNumeric: "tabular-nums" },
  progressLabel: { display: "flex", justifyContent: "space-between", fontSize: 11, letterSpacing: 1, marginBottom: 4 },
  track: { height: 8, borderRadius: 4, background: "rgba(255,255,255,0.1)", overflow: "hidden" },
  fill: { height: "100%", background: "linear-gradient(90deg, #28c7dc, #41d67a)", transition: "width 0.4s ease" },
  flagBox: { marginTop: 12, padding: "8px 10px", borderRadius: 6, background: "rgba(20,60,30,0.6)", border: "1px solid #41d67a" },
  flagLabel: { fontSize: 11, letterSpacing: 1, color: "#41d67a", marginBottom: 6 },
  flagCode: { display: "block", fontSize: 13, color: "#eaffef", wordBreak: "break-all" },
  restart: {
    marginTop: 12, width: "100%", padding: "8px 0",
    background: "#ff003c", color: "white", border: "none", borderRadius: 4,
    fontWeight: "bold", letterSpacing: 2, cursor: "pointer",
  },
};
