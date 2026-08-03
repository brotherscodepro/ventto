import { useState, useEffect, useMemo, useRef } from "react";
import { useWeather } from "./api/weather";

/* ============================================================
   VENTTO — Weather App
   Dark premium theme based on mockups
   ============================================================ */

const C = {
  bg: "#060608",
  card: "rgba(255,255,255,0.045)",
  cardBorder: "rgba(255,255,255,0.08)",
  text: "#F4F4F5",
  dim: "rgba(255,255,255,0.55)",
  faint: "rgba(255,255,255,0.35)",
  purple: "#8B8CF8",
  purpleBg: "rgba(139,140,248,0.16)",
  green: "#22C55E",
  orange: "#F97316",
  yellow: "#EAB308",
  red: "#EF4444",
  blue: "#60A5FA",
};

const MOCK = {
  city: "Lisboa, Portugal",
  now: {
    temp: 24, condition: "Parcialmente nublado", feels: 25, high: 26, low: 18,
    wind: 14, windDir: "N", aqi: 42, aqiLabel: "Boa", uv: 6, uvLabel: "Alto",
    rain2h: 20, sunset: "20:48", sunsetIn: "10h 37m", sunrise: "06:18",
    moonPhase: "Lua Crescente", moonPct: 62, pressure: 1018,
  },
  hourly: [
    { h: "Agora", t: 24, i: "cloudSun" }, { h: "11:00", t: 24, i: "cloud" },
    { h: "12:00", t: 25, i: "cloudSun" }, { h: "13:00", t: 26, i: "sun" },
    { h: "14:00", t: 26, i: "sun" }, { h: "15:00", t: 25, i: "cloudSun" },
    { h: "16:00", t: 24, i: "cloudSun" }, { h: "17:00", t: 23, i: "cloud" },
  ],
  daily: [
    { d: "Amanhã", date: "29 mai.", i: "cloudSun", pop: 10, lo: 18, hi: 27 },
    { d: "Sex", date: "30 mai.", i: "sun", pop: 0, lo: 17, hi: 28 },
    { d: "Sáb", date: "31 mai.", i: "sun", pop: 0, lo: 18, hi: 28 },
    { d: "Dom", date: "01 jun.", i: "rain", pop: 40, lo: 17, hi: 25 },
    { d: "Seg", date: "02 jun.", i: "rain", pop: 60, lo: 16, hi: 22 },
    { d: "Ter", date: "03 jun.", i: "rain", pop: 70, lo: 15, hi: 21 },
    { d: "Qua", date: "04 jun.", i: "cloudSun", pop: 20, lo: 16, hi: 23 },
  ],
  charts: {
    Temperatura: { unit: "°", color: "#8B8CF8", days: [24, 27, 28, 23, 20, 18, 21] },
    Precipitação: { unit: "mm", color: "#60A5FA", days: [0, 0, 0, 4, 12, 18, 2] },
    Vento: { unit: " km/h", color: "#34D399", days: [14, 12, 10, 22, 30, 34, 18] },
    Humidade: { unit: "%", color: "#22D3EE", days: [62, 55, 50, 68, 80, 84, 66] },
    "UV Index": { unit: "", color: "#F59E0B", days: [6, 7, 8, 5, 3, 2, 4] },
  },
  chartDays: ["Hoje", "Qui", "Sex", "Sáb", "Dom", "Seg", "Ter"],
  chartDates: ["28 mai", "29 mai", "30 mai", "31 mai", "1 jun", "2 jun", "3 jun"],
  hourlyTemps: [
    { h: "06:00", t: 18, i: "moon" }, { h: "07:00", t: 17, i: "moon" },
    { h: "08:00", t: 19, i: "cloudSun" }, { h: "09:00", t: 22, i: "cloudSun" },
    { h: "10:00", t: 24, i: "cloudSun" }, { h: "11:00", t: 26, i: "sun" },
    { h: "12:00", t: 25, i: "sun" }, { h: "13:00", t: 22, i: "cloudSun" },
    { h: "14:00", t: 19, i: "cloud" }, { h: "15:00", t: 17, i: "cloud" },
    { h: "16:00", t: 16, i: "cloud" }, { h: "17:00", t: 15, i: "cloud" },
  ],
  details: [
    { label: "Sensação térmica", value: "25°", sub: "Agora", color: "#EF4444" },
    { label: "Ponto de orvalho", value: "14°", sub: "Agora", color: "#8B8CF8" },
    { label: "Índice de calor", value: "26°", sub: "Hoje às 11:00", color: "#60A5FA" },
    { label: "Índice de arrefecimento", value: "23°", sub: "Hoje às 11:00", color: "#22D3EE" },
  ],
  alerts: {
    ativos: [
      {
        level: "vermelho", color: C.red, title: "Chuva forte", place: "Lisboa, Portugal",
        desc: "Períodos de chuva forte e persistente, podendo ser acompanhada de trovoada.",
        start: "28 mai 08:00", end: "29 mai 18:00",
        stats: [
          { l: "Acumulação", v: "50–80 mm" },
          { l: "Rajadas de vento", v: "70–90 km/h" },
          { l: "Agitação marítima", v: "4–6 m" },
        ],
      },
      {
        level: "laranja", color: C.orange, title: "Vento forte", place: "Grande Lisboa",
        desc: "Vento forte de noroeste com rajadas até 80 km/h.",
        start: "28 mai 12:00", end: "28 mai 23:59",
        stats: [
          { l: "Rajadas", v: "60–80 km/h" },
          { l: "Direção predominante", v: "NO" },
          { l: "Altitude afetada", v: "Litoral e terras altas" },
        ],
      },
    ],
    proximos: [
      { level: "amarelo", color: C.yellow, title: "Agitação marítima", place: "Costa ocidental", when: "29 mai · 00:00 – 12:00" },
    ],
    historico: [
      { level: "amarelo", color: C.yellow, title: "Calor", place: "Interior Sul", when: "20 mai · Terminado" },
      { level: "laranja", color: C.orange, title: "Trovoada", place: "Lisboa", when: "12 mai · Terminado" },
    ],
  },
};

/* ---------- Weather icons (SVG, no emoji) ---------- */
const WIcon = ({ type, size = 30 }) => {
  const s = { width: size, height: size, display: "block", margin: "0 auto" };
  if (type === "sun")
    return (
      <svg viewBox="0 0 32 32" style={s}>
        <circle cx="16" cy="16" r="7" fill="#FBBF24" />
        {[...Array(8)].map((_, i) => {
          const a = (i * 45 * Math.PI) / 180;
          return <line key={i} x1={16 + Math.cos(a) * 10} y1={16 + Math.sin(a) * 10} x2={16 + Math.cos(a) * 13.5} y2={16 + Math.sin(a) * 13.5} stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />;
        })}
      </svg>
    );
  if (type === "cloudSun")
    return (
      <svg viewBox="0 0 32 32" style={s}>
        <circle cx="12" cy="12" r="6" fill="#FBBF24" />
        <path d="M10 24 a5 5 0 0 1 1-9.9 a6.5 6.5 0 0 1 12.4 1.9 a4.5 4.5 0 0 1-.9 8 z" fill="#E5E7EB" />
      </svg>
    );
  if (type === "cloud")
    return (
      <svg viewBox="0 0 32 32" style={s}>
        <path d="M9 23 a5.5 5.5 0 0 1 1-10.8 a7 7 0 0 1 13.4 2 a5 5 0 0 1-1 8.8 z" fill="#D1D5DB" />
      </svg>
    );
  if (type === "rain")
    return (
      <svg viewBox="0 0 32 32" style={s}>
        <path d="M9 19 a5.5 5.5 0 0 1 1-10.8 a7 7 0 0 1 13.4 2 a5 5 0 0 1-1 8.8 z" fill="#D1D5DB" />
        {[11, 16, 21].map((x, i) => (
          <line key={i} x1={x} y1={22} x2={x - 1.5} y2={27} stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
        ))}
      </svg>
    );
  if (type === "moon")
    return (
      <svg viewBox="0 0 32 32" style={s}>
        <path d="M22 17.5 A8.5 8.5 0 1 1 14.5 6 a7 7 0 0 0 7.5 11.5z" fill="#CBD5E1" />
      </svg>
    );
  return null;
};

/* ---------- Nav icons ---------- */
const NavIcon = ({ type, color }) => {
  const p = { fill: "none", stroke: color, strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };
  const sv = { width: 24, height: 24, display: "block" };
  if (type === "geral") return <svg viewBox="0 0 24 24" style={sv}><path {...p} d="M6.5 18a4 4 0 0 1 .6-7.95 5.5 5.5 0 0 1 10.6 1.6A3.5 3.5 0 0 1 17 18z" /></svg>;
  if (type === "previsao") return <svg viewBox="0 0 24 24" style={sv}><rect {...p} x="4" y="5" width="16" height="15" rx="3" /><path {...p} d="M8 3v4M16 3v4M4 10h16M9 14.5h2M13.5 14.5h2M9 17.2h2" /></svg>;
  if (type === "graficos") return <svg viewBox="0 0 24 24" style={sv}><path {...p} d="M4 17l4.5-5 3.5 3 4-6 4 4" /><circle cx="8.5" cy="12" r="1.3" fill={color} stroke="none" /><circle cx="12" cy="15" r="1.3" fill={color} stroke="none" /><circle cx="16" cy="9" r="1.3" fill={color} stroke="none" /></svg>;
  if (type === "radar") return <svg viewBox="0 0 24 24" style={sv}><circle {...p} cx="12" cy="12" r="8.5" /><circle {...p} cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1.5" fill={color} stroke="none" /></svg>;
  if (type === "alertas") return <svg viewBox="0 0 24 24" style={sv}><path {...p} d="M12 4a5.5 5.5 0 0 0-5.5 5.5c0 4-1.7 5.5-1.7 5.5h14.4s-1.7-1.5-1.7-5.5A5.5 5.5 0 0 0 12 4z" /><path {...p} d="M10.3 18.5a1.8 1.8 0 0 0 3.4 0" /></svg>;
  return null;
};

/* ---------- Hero scene: eclipse, clouds, mountains, water ---------- */
const HeroScene = () => (
  <svg viewBox="0 0 420 380" preserveAspectRatio="xMidYMid slice"
       style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
    <defs>
      <linearGradient id="hsky" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0%" stopColor="#0a0d18" />
        <stop offset="45%" stopColor="#111629" />
        <stop offset="75%" stopColor="#1b2033" />
        <stop offset="100%" stopColor="#0d1120" />
      </linearGradient>
      <radialGradient id="hglow" cx="50%" cy="50%">
        <stop offset="55%" stopColor="rgba(251,146,60,0)" />
        <stop offset="78%" stopColor="rgba(251,146,60,0.16)" />
        <stop offset="100%" stopColor="rgba(251,146,60,0)" />
      </radialGradient>
      <linearGradient id="hrim" x1="0.15" y1="0.05" x2="0.85" y2="1">
        <stop offset="0%" stopColor="#FFE9C4" />
        <stop offset="30%" stopColor="#FDBA74" />
        <stop offset="65%" stopColor="#F97316" />
        <stop offset="100%" stopColor="rgba(249,115,22,0.15)" />
      </linearGradient>
      <radialGradient id="hdisc" cx="45%" cy="42%">
        <stop offset="0%" stopColor="#141a2e" />
        <stop offset="100%" stopColor="#0b0f1c" />
      </radialGradient>
      <radialGradient id="hcloud" cx="38%" cy="32%">
        <stop offset="0%" stopColor="#EEF1F6" />
        <stop offset="52%" stopColor="#AEB6C6" />
        <stop offset="100%" stopColor="#4B5468" />
      </radialGradient>
      <linearGradient id="hmtnFar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2b3348" />
        <stop offset="100%" stopColor="#161c2c" />
      </linearGradient>
      <linearGradient id="hmtnMid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1c2234" />
        <stop offset="100%" stopColor="#0e121e" />
      </linearGradient>
      <linearGradient id="hwater2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4a5468" />
        <stop offset="45%" stopColor="#222a3c" />
        <stop offset="100%" stopColor="#0c1019" />
      </linearGradient>
      <linearGradient id="hshine" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(253,186,116,0.55)" />
        <stop offset="60%" stopColor="rgba(253,186,116,0.12)" />
        <stop offset="100%" stopColor="rgba(253,186,116,0)" />
      </linearGradient>
      <filter id="hsoft" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="7" />
      </filter>
      <filter id="hsoft2" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="2.4" />
      </filter>
      <filter id="hrimBlur" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="5" />
      </filter>
      <linearGradient id="hfade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(8,10,18,0)" />
        <stop offset="100%" stopColor="rgba(8,10,18,0.55)" />
      </linearGradient>
      <linearGradient id="hleft" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="rgba(8,10,18,0.85)" />
        <stop offset="70%" stopColor="rgba(8,10,18,0.15)" />
        <stop offset="100%" stopColor="rgba(8,10,18,0)" />
      </linearGradient>
      <clipPath id="heroClip"><rect x="0" y="0" width="420" height="380" /></clipPath>
    </defs>

    <g clipPath="url(#heroClip)">
      <rect width="420" height="380" fill="url(#hsky)" />

      {/* stars */}
      {[[30,40,0.8],[70,22,0.6],[110,58,0.5],[150,30,0.7],[26,96,0.5],[62,120,0.45],
        [340,26,0.5],[392,60,0.45],[300,18,0.4],[130,90,0.4],[96,66,0.35],[168,72,0.3]]
        .map(([x,y,o],i)=>(<circle key={i} className="vt-star" style={{ animationDelay: `${(i*0.7)%4}s` }} cx={x} cy={y} r={o>0.6?1.2:0.8} fill="#fff" opacity={o} />))}

      {/* eclipse outer glow */}
      <circle className="vt-glow" cx="278" cy="168" r="168" fill="url(#hglow)" />

      {/* eclipse rim (bright ring) */}
      <circle className="vt-rim" cx="278" cy="168" r="128" fill="none" stroke="url(#hrim)" strokeWidth="7" filter="url(#hrimBlur)" opacity="0.85" />
      <circle cx="278" cy="168" r="128" fill="none" stroke="url(#hrim)" strokeWidth="2.6" />
      {/* dark disc */}
      <circle cx="278" cy="168" r="125" fill="url(#hdisc)" />
      {/* faint inner atmosphere */}
      <circle cx="278" cy="168" r="125" fill="none" stroke="rgba(148,163,184,0.16)" strokeWidth="1" />

      {/* clouds in front of eclipse */}
      <g className="vt-cloudA" filter="url(#hsoft2)">
        <ellipse cx="300" cy="150" rx="62" ry="42" fill="url(#hcloud)" opacity="0.96" />
        <ellipse cx="258" cy="168" rx="46" ry="30" fill="url(#hcloud)" opacity="0.9" />
        <ellipse cx="336" cy="176" rx="44" ry="28" fill="url(#hcloud)" opacity="0.85" />
        <ellipse cx="286" cy="128" rx="34" ry="24" fill="#F3F5F9" opacity="0.9" />
        <ellipse cx="322" cy="134" rx="26" ry="19" fill="#DDE2EB" opacity="0.85" />
        <ellipse cx="276" cy="192" rx="52" ry="24" fill="#7A8496" opacity="0.6" />
      </g>
      <g className="vt-cloudB" filter="url(#hsoft)">
        <ellipse cx="300" cy="196" rx="70" ry="20" fill="#39415a" opacity="0.55" />
      </g>

      {/* far mountains */}
      <path d="M0 268 L44 236 L78 254 L116 224 L150 252 L182 234 L214 262 L246 240 L286 264 L330 238 L372 262 L420 240 L420 300 L0 300 Z"
            fill="url(#hmtnFar)" opacity="0.9" />
      {/* mid mountains */}
      <path d="M0 288 L38 262 L82 282 L128 254 L168 278 L206 262 L248 286 L292 260 L340 284 L386 262 L420 280 L420 320 L0 320 Z"
            fill="url(#hmtnMid)" />

      {/* water */}
      <rect x="0" y="300" width="420" height="80" fill="url(#hwater2)" />
      {/* reflection shine */}
      <path className="vt-shine" d="M258 300 L298 300 L318 380 L238 380 Z" fill="url(#hshine)" opacity="0.75" filter="url(#hsoft2)" />
      {/* water ripples */}
      {[[308,0.28],[318,0.2],[330,0.22],[344,0.15],[358,0.18],[372,0.12]].map(([y,o],i)=>(
        <line key={i} className="vt-ripple" style={{ animationDelay: `${i*0.5}s` }} x1={i%2?150:210} y1={y} x2={i%2?330:390} y2={y} stroke="#93A3BC" strokeWidth="1" opacity={o} />
      ))}

      {/* foreground dunes */}
      <path d="M0 344 Q80 320 160 340 Q220 354 280 344 Q350 332 420 348 L420 380 L0 380 Z" fill="#0a0e18" opacity="0.92" />

      {/* bottom fade for text legibility */}
      <rect x="0" y="240" width="420" height="140" fill="url(#hfade)" />
      {/* left vignette so text reads clearly */}
      <rect x="0" y="0" width="230" height="380" fill="url(#hleft)" />
    </g>
  </svg>
);

/* ---------- Weather → video mapping ---------- */
const pickVideo = (weather) => {
  if (!weather) return "/clear_night.mp4";
  const { icon, condition } = weather.now;
  const isNight = icon === "moon" || icon === "cloud" && condition.toLowerCase().includes("noite");
  const code = (condition || "").toLowerCase();

  // Trovoada
  if (code.includes("trovoada")) return "/thunderstorm.mp4";
  // Neve
  if (code.includes("neve") || code.includes("grão"))
    return isNight ? "/snow_night.mp4" : "/snow_day.mp4";
  // Nevoeiro / geada
  if (code.includes("nevoeiro")) return "/fog.mp4";
  if (code.includes("gelad")) return "/frost.mp4";
  // Chuva / chuvisco / aguaceiro
  if (icon === "rain" || code.includes("chuva") || code.includes("chuvisco") || code.includes("aguaceiro"))
    return isNight ? "/rain_night.mp4" : "/rain_day.mp4";
  // Vento forte (>40 km/h)
  if (weather.now.wind > 40) return "/windy.mp4";
  // Encoberto
  if (icon === "cloud" || code.includes("encoberto"))
    return isNight ? "/overcast_night.mp4" : "/overcast_day.mp4";
  // Parcialmente nublado
  if (icon === "cloudSun" || code.includes("nublado") || code.includes("nuvens"))
    return isNight ? "/partly_cloudy_night.mp4" : "/partly_cloudy_day.mp4";
  // Limpo
  if (icon === "moon") return "/clear_night.mp4";
  return isNight ? "/clear_night.mp4" : "/clear_day.mp4";
};

/* ---------- App background: fullscreen looping video ---------- */
const AppBackground = ({ videoSrc }) => {
  const ref = useRef(null);
  const [fade, setFade] = useState(false);
  const [activeSrc, setActiveSrc] = useState(videoSrc);

  // Smooth cross-fade when the video source changes
  useEffect(() => {
    if (videoSrc === activeSrc) return;
    setFade(true);
    const t = setTimeout(() => {
      setActiveSrc(videoSrc);
      setFade(false);
    }, 700);
    return () => clearTimeout(t);
  }, [videoSrc, activeSrc]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    const play = () => v.play().catch(() => {});
    const pause = () => v.pause();

    const onLoaded = () => play();
    v.addEventListener("loadeddata", onLoaded);
    v.load();

    const onVisibility = () => (document.hidden ? pause() : play());
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", pause);
    window.addEventListener("pageshow", play);
    window.addEventListener("blur", pause);
    window.addEventListener("focus", play);

    return () => {
      v.removeEventListener("loadeddata", onLoaded);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", pause);
      window.removeEventListener("pageshow", play);
      window.removeEventListener("blur", pause);
      window.removeEventListener("focus", play);
    };
  }, [activeSrc]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
      {/* Fallback scene */}
      <div style={{ position: "absolute", inset: 0 }}><HeroScene /></div>

      <video
        ref={ref}
        key={activeSrc}
        muted
        loop
        playsInline
        preload="auto"
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
          opacity: fade ? 0 : 1,
          transition: "opacity 0.7s ease-in-out",
        }}
      >
        <source src={activeSrc} type="video/mp4" />
      </video>

      {/* Scrim: top stays vivid, darkens downward for card readability */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(6,7,12,0.05) 0%, rgba(6,7,12,0.15) 22%, rgba(6,7,12,0.55) 44%, rgba(6,7,12,0.80) 65%, rgba(6,7,12,0.90) 100%)",
        }}
      />
    </div>
  );
};

/* ---------- Shared UI ---------- */
const Card = ({ children, style = {} }) => (
  <div
    style={{
      background: "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      border: "1px solid rgba(255,255,255,0.13)",
      boxShadow: "0 12px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
      borderRadius: 24,
      padding: 18,
      ...style,
    }}
  >
    {children}
  </div>
);

const Chips = ({ items, active, onSelect, accent = C.purple, accentBg = C.purpleBg, icons }) => (
  <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
    {items.map((it) => {
      const on = it === active;
      return (
        <button
          key={it}
          onClick={() => onSelect(it)}
          style={{
            whiteSpace: "nowrap", padding: "9px 16px", borderRadius: 999, fontSize: 13.5, fontWeight: 600,
            background: on ? accentBg : "rgba(255,255,255,0.05)",
            border: `1px solid ${on ? accent : "rgba(255,255,255,0.08)"}`,
            color: on ? accent : C.dim, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}
        >
          {icons?.[it]}{it}
        </button>
      );
    })}
  </div>
);

const SectionTitle = ({ children, right }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, color: C.dim, textTransform: "uppercase" }}>{children}</div>
    {right}
  </div>
);

/* ---------- Gauges & mini viz ---------- */
const DottedRing = ({ value, label }) => {
  const dots = 28, pct = Math.min(value / 100, 1);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ position: "relative", width: 78, height: 78 }}>
        <svg viewBox="0 0 78 78" style={{ width: 78, height: 78 }}>
          {[...Array(dots)].map((_, i) => {
            const a = (i / dots) * Math.PI * 2 - Math.PI / 2;
            const lit = i / dots <= pct;
            const hue = 120 - (i / dots) * 20;
            return <circle key={i} cx={39 + Math.cos(a) * 33} cy={39 + Math.sin(a) * 33} r={2.4} fill={lit ? `hsl(${hue} 70% 55%)` : "rgba(255,255,255,0.12)"} />;
          })}
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 300 }}>{value}</div>
      </div>
      <div style={{ fontSize: 17, fontWeight: 600 }}>{label}</div>
    </div>
  );
};

const PressureGauge = ({ value }) => {
  const min = 980, max = 1050;
  const pct = (value - min) / (max - min);
  const start = -220, sweep = 260;
  const needle = start + pct * sweep;
  const arc = (a0, a1, color, w) => {
    const r = 34, cx = 45, cy = 48;
    const p0 = [cx + r * Math.cos((a0 * Math.PI) / 180), cy + r * Math.sin((a0 * Math.PI) / 180)];
    const p1 = [cx + r * Math.cos((a1 * Math.PI) / 180), cy + r * Math.sin((a1 * Math.PI) / 180)];
    return <path d={`M ${p0[0]} ${p0[1]} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p1[0]} ${p1[1]}`} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" />;
  };
  return (
    <div style={{ textAlign: "center" }}>
      <svg viewBox="0 0 90 90" style={{ width: 110, height: 100, margin: "0 auto", display: "block" }}>
        <defs>
          <linearGradient id="pg" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#8B5CF6" /><stop offset="60%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
        {arc(-220, 40, "rgba(255,255,255,0.1)", 7)}
        {arc(-220, start + pct * sweep, "url(#pg)", 7)}
        <g transform={`rotate(${needle + 90}, 45, 48)`}>
          <line x1="45" y1="48" x2="45" y2="22" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
        </g>
        <circle cx="45" cy="48" r="3.5" fill="#fff" />
      </svg>
      <div style={{ fontSize: 26, fontWeight: 300, marginTop: -6 }}>{value}</div>
      <div style={{ fontSize: 12, color: C.faint }}>hPa</div>
    </div>
  );
};

const MoonViz = ({ pct }) => (
  <svg viewBox="0 0 90 90" style={{ width: 86, height: 86 }}>
    <defs>
      <radialGradient id="moonG" cx="35%" cy="35%">
        <stop offset="0%" stopColor="#E2E8F0" /><stop offset="100%" stopColor="#64748B" />
      </radialGradient>
    </defs>
    <circle cx="45" cy="45" r="38" fill="url(#moonG)" />
    {[[30, 32, 6], [55, 50, 8], [40, 62, 4], [60, 28, 4]].map(([x, y, r], i) => (
      <circle key={i} cx={x} cy={y} r={r} fill="rgba(0,0,0,0.12)" />
    ))}
    <path d={`M45 7 a38 38 0 0 0 0 76 a${38 * (1 - pct / 100) * 2 || 0.01} 38 0 0 1 0 -76z`} fill="rgba(4,4,8,0.78)" />
  </svg>
);

const SunsetArc = ({ time, sub }) => (
  <div style={{ textAlign: "center" }}>
    <svg viewBox="0 0 120 52" style={{ width: 130, height: 56, margin: "0 auto", display: "block" }}>
      <defs>
        <linearGradient id="sunA" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(249,115,22,0)" /><stop offset="50%" stopColor="#FB923C" /><stop offset="100%" stopColor="rgba(249,115,22,0)" />
        </linearGradient>
      </defs>
      <path d="M8 48 Q60 -8 112 48" fill="none" stroke="url(#sunA)" strokeWidth="2" />
      <circle cx="60" cy="20" r="7" fill="#FB923C" style={{ filter: "drop-shadow(0 0 8px #FB923C)" }} />
      <line x1="4" y1="48" x2="116" y2="48" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
    </svg>
    <div style={{ fontSize: 26, fontWeight: 300, marginTop: 4 }}>{time}</div>
    <div style={{ fontSize: 11.5, color: C.faint, marginTop: 2 }}>{sub}</div>
  </div>
);

const MiniRain = () => (
  <svg viewBox="0 0 140 46" style={{ width: "100%", height: 46 }}>
    <defs>
      <linearGradient id="mr" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(96,165,250,0.5)" /><stop offset="100%" stopColor="rgba(96,165,250,0)" />
      </linearGradient>
    </defs>
    <path d="M0 42 C25 40 40 36 60 30 C85 22 110 14 140 10 L140 46 L0 46 Z" fill="url(#mr)" />
    <path d="M0 42 C25 40 40 36 60 30 C85 22 110 14 140 10" fill="none" stroke="#60A5FA" strokeWidth="2" />
  </svg>
);

/* ---------- Line chart (custom SVG with labels) ---------- */
const LabeledChart = ({ values, labels, sublabels, color, unit, height = 240, highlight = -1, icons }) => {
  const W = 700, H = height, padX = 46, padTop = 44, padBot = icons ? 74 : 54;
  const min = Math.min(...values), max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const lo = min - range * 0.25, hi = max + range * 0.25;
  const x = (i) => padX + (i / (values.length - 1)) * (W - padX * 2);
  const y = (v) => padTop + (1 - (v - lo) / (hi - lo)) * (H - padTop - padBot);
  const pts = values.map((v, i) => [x(i), y(v)]);
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]} ${p[1]}` : `L${p[0]} ${p[1]}`)).join(" ");
  const area = `${path} L${x(values.length - 1)} ${H - padBot} L${x(0)} ${H - padBot} Z`;
  const gid = `g${color.replace("#", "")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f, i) => (
        <line key={i} x1={padX} x2={W - padX} y1={padTop + f * (H - padTop - padBot)} y2={padTop + f * (H - padTop - padBot)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      <path d={area} fill={`url(#${gid})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {pts.map(([px, py], i) => (
        <g key={i}>
          {i === highlight && <rect x={px - 22} y={padTop - 26} width={44} height={H - padTop - padBot + 30} rx={10} fill="rgba(249,115,22,0.12)" />}
          <line x1={px} y1={py} x2={px} y2={H - padBot} stroke="rgba(255,255,255,0.07)" strokeDasharray="3 4" />
          <circle cx={px} cy={py} r="4.5" fill={i === highlight ? "#FB923C" : color} stroke="#0a0a10" strokeWidth="2" />
          <text x={px} y={py - 12} textAnchor="middle" fill={i === highlight ? "#FB923C" : "#fff"} fontSize="15" fontWeight="600">{values[i]}{unit}</text>
          <text x={px} y={H - padBot + (icons ? 44 : 24)} textAnchor="middle" fill={i === highlight ? "#FB923C" : "rgba(255,255,255,0.75)"} fontSize="13.5" fontWeight="600">{labels[i]}</text>
          {sublabels && <text x={px} y={H - padBot + 42} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="11.5">{sublabels[i]}</text>}
        </g>
      ))}
    </svg>
  );
};

/* ---------- Radar scope ---------- */
const RadarScope = ({ offset }) => {
  const [sweep, setSweep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSweep((s) => (s + 1.2) % 360), 30);
    return () => clearInterval(id);
  }, []);

  const cells = useMemo(() => {
    const rng = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };
    const r = rng(97);
    const clusters = [
      { x: 90, y: 150, n: 90, spread: 55, heat: 0.9 },
      { x: 235, y: 95, n: 55, spread: 42, heat: 0.5 },
      { x: 225, y: 235, n: 45, spread: 38, heat: 0.45 },
      { x: 140, y: 70, n: 35, spread: 30, heat: 0.35 },
    ];
    const out = [];
    clusters.forEach((c) => {
      for (let i = 0; i < c.n; i++) {
        const dx = (r() - 0.5) * c.spread * 2, dy = (r() - 0.5) * c.spread * 2;
        const dist = Math.sqrt(dx * dx + dy * dy) / c.spread;
        const px = c.x + dx, py = c.y + dy;
        const dc = Math.sqrt((px - 160) ** 2 + (py - 160) ** 2);
        if (dc > 138) continue;
        const heat = Math.max(0, c.heat * (1 - dist) + (r() - 0.5) * 0.15);
        const col = heat > 0.62 ? "#B91C1C" : heat > 0.45 ? "#F59E0B" : heat > 0.28 ? "#65A30D" : "#166534";
        out.push({ px, py, r: 4 + r() * 9, col, op: 0.25 + heat * 0.55 });
      }
    });
    return out;
  }, []);

  const drift = offset * 0.25;

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 340, margin: "0 auto" }}>
      <svg viewBox="0 0 320 320" style={{ width: "100%", display: "block" }}>
        <defs>
          <radialGradient id="scopeBg" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#03140a" /><stop offset="100%" stopColor="#020604" />
          </radialGradient>
          <linearGradient id="sweepG" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(34,197,94,0)" /><stop offset="100%" stopColor="rgba(34,197,94,0.4)" />
          </linearGradient>
          <clipPath id="scopeClip"><circle cx="160" cy="160" r="140" /></clipPath>
        </defs>
        <circle cx="160" cy="160" r="146" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="3" />
        <circle cx="160" cy="160" r="140" fill="url(#scopeBg)" />
        <g clipPath="url(#scopeClip)">
          <g transform={`translate(${drift}, 0)`}>
            {cells.map((c, i) => (
              <circle key={i} cx={c.px} cy={c.py} r={c.r} fill={c.col} opacity={c.op} style={{ filter: "blur(4px)" }} />
            ))}
          </g>
          <g transform={`rotate(${sweep}, 160, 160)`}>
            <path d="M160 160 L160 20 A140 140 0 0 1 231 36 Z" fill="url(#sweepG)" />
          </g>
        </g>
        {[46, 93, 140].map((r, i) => (
          <circle key={i} cx="160" cy="160" r={r} fill="none" stroke="rgba(34,197,94,0.22)" strokeWidth="1" />
        ))}
        <line x1="160" y1="20" x2="160" y2="300" stroke="rgba(34,197,94,0.12)" />
        <line x1="20" y1="160" x2="300" y2="160" stroke="rgba(34,197,94,0.12)" />
        {[["50 km", 208], ["100 km", 255], ["150 km", 298]].map(([t, x], i) => (
          <text key={i} x={x} y="156" fill="rgba(255,255,255,0.4)" fontSize="10.5" textAnchor="middle">{t}</text>
        ))}
        <circle cx="160" cy="160" r="5" fill="#22C55E" style={{ filter: "drop-shadow(0 0 6px #22C55E)" }} />
        {[["N", 160, 14], ["S", 160, 314], ["W", 10, 165], ["E", 310, 165]].map(([d, x, y]) => (
          <g key={d}>
            <circle cx={x} cy={y - 4} r="13" fill="#0a0f0b" stroke="rgba(255,255,255,0.12)" />
            <text x={x} y={y} fill="#fff" fontSize="12" fontWeight="700" textAnchor="middle">{d}</text>
          </g>
        ))}
      </svg>
    </div>
  );
};

/* ---------- Segmented control ---------- */
const Segmented = ({ items, active, onSelect, accent = C.purple, badges = {} }) => (
  <div style={{ display: "flex", background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", borderRadius: 999, padding: 4, border: "1px solid rgba(255,255,255,0.1)" }}>
    {items.map((it) => {
      const on = it === active;
      return (
        <button key={it} onClick={() => onSelect(it)}
          style={{
            flex: 1, padding: "9px 8px", borderRadius: 999, fontSize: 13.5, fontWeight: 600, cursor: "pointer",
            background: on ? "rgba(139,140,248,0.18)" : "transparent",
            border: on ? `1px solid ${accent}` : "1px solid transparent",
            color: on ? "#fff" : C.dim, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
          {it}
          {badges[it] != null && (
            <span style={{ background: badges[it].color, color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "1px 7px" }}>{badges[it].n}</span>
          )}
        </button>
      );
    })}
  </div>
);

/* ============================================================ */
export default function App() {
  const [tab, setTab] = useState("geral");
  const [unit, setUnit] = useState("C");
  const [prevMode, setPrevMode] = useState("Diária");
  const [chartMetric, setChartMetric] = useState("Temperatura");
  const [radarLayer, setRadarLayer] = useState("Precipitação");
  const [alertTab, setAlertTab] = useState("Ativos");
  const [radarT, setRadarT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playRef = useRef(null);

  const cv = (t) => (unit === "C" ? t : Math.round(t * 1.8 + 32));

  useEffect(() => {
    if (playing) {
      playRef.current = setInterval(() => {
        setRadarT((t) => (t >= 90 ? -90 : t + 3));
      }, 120);
    } else clearInterval(playRef.current);
    return () => clearInterval(playRef.current);
  }, [playing]);

  const { data: live, loading, error, reload, place } = useWeather();
  const d = live || MOCK;
  const metric = d.charts[chartMetric];
  const mMax = Math.max(...metric.days), mMin = Math.min(...metric.days);
  const mAvg = Math.round(metric.days.reduce((a, b) => a + b, 0) / metric.days.length);
  const isTemp = chartMetric === "Temperatura";
  const fmtM = (v) => `${isTemp ? cv(v) : v}${isTemp ? "°" : metric.unit}`;

  const daily15 = [...d.daily, ...d.daily.slice(0, 6).map((x, i) => ({ ...x, d: ["Qui", "Sex", "Sáb", "Dom", "Seg", "Ter"][i], date: `0${5 + i} jun.` }))];

  const NAV = [
    { id: "geral", label: "Geral" },
    { id: "previsao", label: "Previsão" },
    { id: "graficos", label: "Gráficos" },
    { id: "radar", label: "Radar" },
    { id: "alertas", label: "Alertas" },
  ];
  const navAccent = { geral: C.purple, previsao: C.purple, graficos: C.purple, radar: C.green, alertas: C.red };

  const PageTitle = ({ children }) => (
    <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5, marginBottom: 16 }}>{children}</div>
  );

  const tempBar = (lo, hi) => {
    const gMin = 14, gMax = 30;
    const l = ((lo - gMin) / (gMax - gMin)) * 100, r = ((hi - gMin) / (gMax - gMin)) * 100;
    return (
      <div style={{ flex: 1, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.08)", position: "relative", margin: "0 10px" }}>
        <div style={{ position: "absolute", left: `${l}%`, width: `${r - l}%`, top: 0, bottom: 0, borderRadius: 3, background: "linear-gradient(90deg,#22D3EE,#4ADE80,#FDE047)" }} />
        <div style={{ position: "absolute", left: `${(l + r) / 2}%`, top: -2.5, width: 10, height: 10, borderRadius: 5, background: "#fff", transform: "translateX(-50%)", boxShadow: "0 0 4px rgba(0,0,0,0.6)" }} />
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse 90% 60% at 50% -10%, #12142a 0%, #08080e 55%, #050507 100%)", color: C.text, fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,system-ui,sans-serif", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes vtDriftA { 0%,100% { transform: translateX(0) } 50% { transform: translateX(-16px) } }
        @keyframes vtDriftB { 0%,100% { transform: translateX(0) } 50% { transform: translateX(14px) } }
        @keyframes vtPulse  { 0%,100% { opacity: .55 } 50% { opacity: 1 } }
        @keyframes vtRimPulse { 0%,100% { opacity: .6 } 50% { opacity: .95 } }
        @keyframes vtTwinkle { 0%,100% { opacity: .18 } 50% { opacity: .9 } }
        @keyframes vtShine  { 0%,100% { opacity: .45 } 50% { opacity: .85 } }
        @keyframes vtRipple { 0%,100% { transform: translateX(0) } 50% { transform: translateX(10px) } }
        .vt-cloudA { animation: vtDriftA 26s ease-in-out infinite; }
        .vt-cloudB { animation: vtDriftB 34s ease-in-out infinite; }
        .vt-glow   { animation: vtPulse 7s ease-in-out infinite; }
        .vt-rim    { animation: vtRimPulse 5.5s ease-in-out infinite; }
        .vt-star   { animation: vtTwinkle 4s ease-in-out infinite; }
        .vt-shine  { animation: vtShine 6s ease-in-out infinite; }
        .vt-ripple { animation: vtRipple 9s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .vt-cloudA,.vt-cloudB,.vt-glow,.vt-rim,.vt-star,.vt-shine,.vt-ripple { animation: none; }
        }
        input[type=range] { -webkit-appearance: none; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.15); outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #22C55E; box-shadow: 0 0 8px rgba(34,197,94,.7); cursor: pointer; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      <AppBackground videoSrc={pickVideo(live)} />

      {/* Ambient atmosphere */}
      <div style={{ position: "fixed", top: "-12%", right: "-18%", width: 460, height: 460, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,140,248,0.08) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", top: "35%", left: "-22%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "-15%", right: "-10%", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "22px 16px 108px", position: "relative", zIndex: 1 }}>

        {/* ============ GERAL ============ */}
        {tab === "geral" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Hero — text left, video element right */}
            <div style={{ position: "relative", margin: "-22px -16px 2px", padding: "calc(env(safe-area-inset-top, 0px) + 18px) 20px 28px", minHeight: 420 }}>

              {/* Top bar: menu + bell */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 28, position: "relative", zIndex: 2 }}>
                <div style={{ width: 44, height: 44, borderRadius: 22, background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>☰</div>
                <div style={{ width: 44, height: 44, borderRadius: 22, background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  <NavIcon type="alertas" color="#fff" />
                  <div style={{ position: "absolute", top: 10, right: 10, width: 7, height: 7, borderRadius: 4, background: C.orange }} />
                </div>
              </div>

              {/* Info — anchored left, max ~55% width so it doesn't overlap the video element */}
              <div style={{ position: "relative", zIndex: 2, maxWidth: "58%", textShadow: "0 2px 16px rgba(0,0,0,0.7)" }}>

                <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: 2.5, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
                  {d.city.toUpperCase()} ➤
                  {loading && <span style={{ fontSize: 10.5, fontWeight: 500, letterSpacing: 0, opacity: 0.55 }}>a atualizar…</span>}
                </div>

                {error && (
                  <div onClick={() => reload()} style={{ fontSize: 12, color: "#FCA5A5", marginBottom: 6, cursor: "pointer", textShadow: "none" }}>
                    Sem ligação — tocar para tentar de novo.
                  </div>
                )}

                <div style={{ fontSize: 88, fontWeight: 200, lineHeight: 0.95, letterSpacing: -3 }}>
                  {cv(d.now.temp)}<span style={{ fontSize: 44, fontWeight: 300, verticalAlign: "super" }}>°</span>
                </div>

                <div style={{ fontSize: 17, fontWeight: 500, marginTop: 8 }}>{d.now.condition}</div>

                <div style={{ fontSize: 14, color: C.dim, marginTop: 5 }}>Sensação {cv(d.now.feels)}°</div>

                <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 15 }}>
                  <span>↑ {cv(d.now.high)}°</span>
                  <span style={{ color: C.dim }}>↓ {cv(d.now.low)}°</span>
                </div>

                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  marginTop: 18,
                  background: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: 999, padding: "9px 15px", fontSize: 13.5,
                  textShadow: "none",
                }}>
                  💨 {d.now.windDir} {d.now.wind} km/h
                </div>
              </div>
            </div>

            {/* AQI + UV */}
            <Card style={{ display: "flex", padding: 0 }}>
              <div style={{ flex: 1, padding: 18 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 1, color: C.dim, marginBottom: 10 }}>QUALIDADE DO AR</div>
                <DottedRing value={d.now.aqi} label={d.now.aqiLabel} />
              </div>
              <div style={{ width: 1, background: C.cardBorder }} />
              <div style={{ flex: 1, padding: 18 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 1, color: C.dim, marginBottom: 10 }}>UV INDEX</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <span style={{ fontSize: 40, fontWeight: 300 }}>{d.now.uv}</span>
                    <span style={{ fontSize: 16 }}>{d.now.uvLabel}</span>
                  </div>
                  <WIcon type="sun" size={38} />
                </div>
              </div>
            </Card>

            {/* Hourly */}
            <Card>
              <SectionTitle right={<span style={{ color: C.faint }}>›</span>}>Próximas horas</SectionTitle>
              <div style={{ display: "flex", overflowX: "auto", gap: 6, scrollbarWidth: "none" }}>
                {d.hourly.slice(0, 6).map((h, i) => (
                  <div key={i} style={{ minWidth: 62, textAlign: "center" }}>
                    <div style={{ fontSize: 12, color: C.dim, fontWeight: 600 }}>{h.h === "Agora" ? "AGORA" : h.h}</div>
                    <div style={{ margin: "10px 0" }}><WIcon type={h.i} size={30} /></div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{cv(h.t)}°</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 2x2 grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 700, letterSpacing: 1, color: C.dim }}>
                  <span>CHUVA NAS<br />PRÓXIMAS 2H</span><span style={{ color: C.blue, fontSize: 15 }}>💧</span>
                </div>
                <div style={{ fontSize: 38, fontWeight: 300, margin: "8px 0 4px" }}>{d.now.rain2h}%</div>
                <MiniRain />
              </Card>
              <Card>
                <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 1, color: C.dim, marginBottom: 6 }}>PÔR DO SOL</div>
                <SunsetArc time={d.now.sunset} sub={`Sol se põe em ${d.now.sunsetIn}`} />
              </Card>
              <Card>
                <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 1, color: C.dim, marginBottom: 10 }}>FASE DA LUA</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <MoonViz pct={d.now.moonPct} />
                  <div>
                    <div style={{ fontSize: 13, color: C.dim }}>{d.now.moonPhase}</div>
                    <div style={{ fontSize: 30, fontWeight: 300 }}>{d.now.moonPct}%</div>
                  </div>
                </div>
              </Card>
              <Card>
                <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 1, color: C.dim, marginBottom: 4 }}>PRESSÃO</div>
                <PressureGauge value={d.now.pressure} />
              </Card>
            </div>
          </div>
        )}

        {/* ============ PREVISÃO ============ */}
        {tab === "previsao" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <PageTitle>Previsão</PageTitle>
            <Segmented items={["Diária", "Por horas", "15 dias"]} active={prevMode} onSelect={setPrevMode} />

            {/* Hero sunset */}
            <div style={{ position: "relative", borderRadius: 28, overflow: "hidden", padding: "22px 22px 26px", border: "1px solid rgba(255,255,255,0.12)", background: "linear-gradient(180deg,rgba(11,14,28,0.88) 0%,rgba(45,25,66,0.85) 45%,rgba(105,52,32,0.85) 78%,rgba(194,101,42,0.9) 105%)", boxShadow: "0 16px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
              <div style={{ position: "absolute", bottom: -34, left: "18%", width: 68, height: 68, borderRadius: "50%", background: "#FDBA74", filter: "blur(6px)", boxShadow: "0 0 60px 28px rgba(251,146,60,0.5)" }} />
              <div style={{ position: "absolute", top: 26, right: 26, width: 92, height: 56, borderRadius: 40, background: "radial-gradient(ellipse at 45% 50%, #e5e7eb 0%, #9ca3af 55%, transparent 100%)", filter: "blur(1.5px)" }} />
              <div style={{ position: "absolute", top: 40, right: 82, width: 40, height: 40, borderRadius: 20, background: "#FBBF24", filter: "blur(2px)", opacity: 0.9 }} />
              <div style={{ position: "relative" }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{d.city} ➤</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>Hoje, 28 de maio</div>
                <div style={{ fontSize: 66, fontWeight: 200, lineHeight: 1.05, marginTop: 12 }}>{cv(d.now.temp)}°</div>
                <div style={{ fontSize: 15, marginTop: 4 }}>{d.now.condition}</div>
                <div style={{ display: "flex", gap: 14, marginTop: 6, fontSize: 14.5 }}>
                  <span>↑ {cv(d.now.high)}°</span><span style={{ opacity: 0.7 }}>↓ {cv(d.now.low)}°</span>
                </div>
                <div style={{ display: "flex", gap: 22, marginTop: 16, fontSize: 13 }}>
                  <div><span style={{ fontWeight: 700, fontSize: 15 }}>🌅 {d.now.sunrise}</span><div style={{ opacity: 0.65, marginTop: 2 }}>Nascer do sol</div></div>
                  <div style={{ width: 1, background: "rgba(255,255,255,0.2)" }} />
                  <div><span style={{ fontWeight: 700, fontSize: 15 }}>🌇 {d.now.sunset}</span><div style={{ opacity: 0.65, marginTop: 2 }}>Pôr do sol</div></div>
                </div>
              </div>
            </div>

            {(prevMode === "Diária" || prevMode === "Por horas") && (
              <Card style={{ padding: "14px 8px" }}>
                <div style={{ display: "flex", overflowX: "auto", gap: 4, scrollbarWidth: "none" }}>
                  {d.hourly.map((h, i) => (
                    <div key={i} style={{ minWidth: 66, textAlign: "center", padding: "10px 4px", borderRadius: 16, background: i === 0 ? "rgba(139,140,248,0.16)" : "transparent", border: i === 0 ? `1px solid ${C.purple}` : "1px solid transparent" }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: i === 0 ? "#fff" : C.dim }}>{h.h}</div>
                      <div style={{ margin: "8px 0" }}><WIcon type={h.i} size={28} /></div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>{cv(h.t)}°</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {prevMode !== "Por horas" && (
              <Card style={{ padding: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 18px", borderBottom: `1px solid ${C.cardBorder}` }}>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>Previsão diária</span>
                  {prevMode === "Diária" && (
                    <button onClick={() => setPrevMode("15 dias")} style={{ background: "none", border: "none", color: C.purple, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Ver 15 dias ›</button>
                  )}
                </div>
                {(prevMode === "15 dias" ? daily15 : d.daily).map((day, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", padding: "13px 18px", borderBottom: i < (prevMode === "15 dias" ? daily15 : d.daily).length - 1 ? `1px solid ${C.cardBorder}` : "none", gap: 8 }}>
                    <div style={{ width: 66 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 600 }}>{day.d}</div>
                      <div style={{ fontSize: 11.5, color: C.faint }}>{day.date}</div>
                    </div>
                    <WIcon type={day.i} size={28} />
                    <div style={{ width: 52, fontSize: 12.5, color: C.blue, textAlign: "center" }}>💧 {day.pop}%</div>
                    <div style={{ fontSize: 14, color: C.dim, width: 28, textAlign: "right" }}>{cv(day.lo)}°</div>
                    {tempBar(day.lo, day.hi)}
                    <div style={{ fontSize: 14.5, fontWeight: 600, width: 30 }}>{cv(day.hi)}°</div>
                    <span style={{ color: C.faint }}>›</span>
                  </div>
                ))}
              </Card>
            )}

            <Card style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 22, background: "rgba(139,140,248,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>☂️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700 }}>Possibilidade de chuva no domingo</div>
                <div style={{ fontSize: 12.5, color: C.dim, marginTop: 3, lineHeight: 1.45 }}>Leva um guarda-chuva! A probabilidade de chuva aumenta a partir do fim da manhã.</div>
              </div>
              <button style={{ background: "rgba(139,140,248,0.16)", border: `1px solid ${C.purple}`, borderRadius: 999, color: C.purple, fontSize: 12.5, fontWeight: 700, padding: "8px 14px", cursor: "pointer", whiteSpace: "nowrap" }}>Ver detalhes</button>
            </Card>
          </div>
        )}

        {/* ============ GRÁFICOS ============ */}
        {tab === "graficos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <PageTitle>Gráficos</PageTitle>
            <Chips items={Object.keys(d.charts)} active={chartMetric} onSelect={setChartMetric} />

            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{chartMetric}</div>
                  <div style={{ fontSize: 12.5, color: C.faint, marginTop: 2 }}>Próximos 7 dias</div>
                </div>
                {isTemp && (
                  <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 3 }}>
                    {["C", "F"].map((u) => (
                      <button key={u} onClick={() => setUnit(u)} style={{ padding: "5px 12px", borderRadius: 9, fontSize: 12.5, fontWeight: 700, border: "none", cursor: "pointer", background: unit === u ? "rgba(139,140,248,0.3)" : "transparent", color: unit === u ? "#fff" : C.dim }}>°{u}</button>
                    ))}
                  </div>
                )}
              </div>
              <LabeledChart values={metric.days.map((v) => (isTemp ? cv(v) : v))} labels={d.chartDays} sublabels={d.chartDates} color={metric.color} unit={isTemp ? "°" : ""} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderTop: `1px solid ${C.cardBorder}`, marginTop: 8, paddingTop: 14 }}>
                {[
                  { l: `Máxima (7 dias)`, v: fmtM(mMax), s: "Sex, 30 mai", c: "#8B8CF8" },
                  { l: `Mínima (7 dias)`, v: fmtM(mMin), s: "Ter, 3 jun", c: "#60A5FA" },
                  { l: "Média", v: fmtM(mAvg), s: "Nos próximos 7 dias", c: "#EF4444" },
                  { l: "Amplitude", v: fmtM(mMax - mMin), s: "(máx − mín)", c: "#22D3EE" },
                ].map((st, i) => (
                  <div key={i} style={{ padding: "0 6px", borderLeft: i > 0 ? `1px solid ${C.cardBorder}` : "none" }}>
                    <div style={{ fontSize: 14, color: st.c }}>🌡</div>
                    <div style={{ fontSize: 10.5, color: C.dim, margin: "4px 0", lineHeight: 1.3 }}>{st.l}</div>
                    <div style={{ fontSize: 20, fontWeight: 400 }}>{st.v}</div>
                    <div style={{ fontSize: 9.5, color: C.faint, marginTop: 2 }}>{st.s}</div>
                  </div>
                ))}
              </div>
            </Card>

            {isTemp && (
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 15.5, fontWeight: 700 }}>Temperatura por hora <span style={{ color: C.faint, fontWeight: 400 }}>· Hoje</span></span>
                  <span style={{ color: C.purple, fontSize: 13, fontWeight: 600 }}>Ver tabela ›</span>
                </div>
                <LabeledChart values={d.hourlyTemps.map((h) => cv(h.t))} labels={d.hourlyTemps.map((h) => h.h)} color="#8B8CF8" unit="°" highlight={5} height={230} icons />
                <div style={{ display: "flex", justifyContent: "space-between", padding: "0 30px", marginTop: -30 }}>
                  {d.hourlyTemps.map((h, i) => (
                    <div key={i} style={{ transform: "scale(0.75)" }}><WIcon type={h.i} size={22} /></div>
                  ))}
                </div>
              </Card>
            )}

            <Card>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Detalhes</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(100px,1fr))", gap: 10 }}>
                {d.details.map((dt, i) => (
                  <div key={i} style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.035))", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: 12 }}>
                    <div style={{ fontSize: 14, color: dt.color }}>🌡</div>
                    <div style={{ fontSize: 11, color: C.dim, margin: "6px 0", lineHeight: 1.3, minHeight: 28 }}>{dt.label}</div>
                    <div style={{ fontSize: 24, fontWeight: 300 }}>{dt.value}</div>
                    <div style={{ fontSize: 10.5, color: C.faint, marginTop: 2 }}>{dt.sub}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ============ RADAR ============ */}
        {tab === "radar" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <PageTitle>Radar</PageTitle>
            <div style={{ display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 7, background: "linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.04))", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 999, padding: "9px 16px", fontSize: 14, fontWeight: 600 }}>
              📍 {d.city} ➤
            </div>
            <Chips items={["Precipitação", "Temp.", "Vento", "Nuvens"]} active={radarLayer} onSelect={setRadarLayer} accent={C.green} accentBg="rgba(34,197,94,0.14)" />

            <RadarScope offset={radarT} />

            {/* Legend */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.035))", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 999, padding: "10px 16px", fontSize: 12.5, color: C.dim }}>
              <span>Fraca</span>
              <div style={{ flex: 1, height: 8, borderRadius: 4, background: "linear-gradient(90deg,#166534,#65A30D,#EAB308,#F97316,#B91C1C)" }} />
              <span>Extrema</span>
            </div>

            {/* Animation */}
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Animação de radar</span>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: C.green, fontWeight: 700, fontSize: 15 }}>{radarT === 0 ? "09:30" : `${radarT > 0 ? "+" : ""}${radarT} min`}</div>
                  <div style={{ fontSize: 11, color: C.faint }}>{radarT === 0 ? "Agora" : ""}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "6px 12px", fontSize: 13, fontWeight: 600 }}>1x ▾</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <button onClick={() => setPlaying(!playing)} style={{ width: 46, height: 46, borderRadius: 23, background: "rgba(34,197,94,0.14)", border: `1px solid ${C.green}`, color: C.green, fontSize: 17, cursor: "pointer", flexShrink: 0 }}>
                  {playing ? "❚❚" : "▶"}
                </button>
                <div style={{ flex: 1 }}>
                  <input type="range" min={-90} max={90} step={3} value={radarT} onChange={(e) => { setPlaying(false); setRadarT(Number(e.target.value)); }} style={{ width: "100%", accentColor: C.green }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: C.faint, marginTop: 2 }}>
                    <span>-90 min</span><span>-60</span><span>-30</span><span style={{ color: C.green, fontWeight: 700 }}>Agora</span><span>+30</span><span>+60</span><span>+90 min</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Info grid */}
            <Card style={{ padding: "16px 8px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
                {[
                  { l: "Tipo", v: "Chuva", ic: "🌧", c: C.green },
                  { l: "Distância máx.", v: "150 km", ic: "🎯", c: C.blue },
                  { l: "Atualizado", v: "há 1 min", ic: "🕐", c: C.orange },
                  { l: "Cobertura", v: "70%", ic: "📶", c: C.blue },
                ].map((it, i) => (
                  <div key={i} style={{ textAlign: "center", padding: "0 4px", borderLeft: i > 0 ? `1px solid ${C.cardBorder}` : "none" }}>
                    <div style={{ width: 42, height: 42, margin: "0 auto 8px", borderRadius: 21, border: `1.5px solid ${it.c}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{it.ic}</div>
                    <div style={{ fontSize: 11, color: C.dim }}>{it.l}</div>
                    <div style={{ fontSize: 14.5, fontWeight: 700, marginTop: 3 }}>{it.v}</div>
                  </div>
                ))}
              </div>
            </Card>

            <div style={{ display: "flex", alignItems: "center", gap: 14, background: "linear-gradient(160deg, rgba(239,68,68,0.14), rgba(239,68,68,0.05))", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(239,68,68,0.45)", borderRadius: 20, padding: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 20, background: "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>⚠️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700 }}>Chuva forte a aproximar-se de Lisboa</div>
                <div style={{ fontSize: 12.5, color: C.dim, marginTop: 3 }}>Previsão de chuva forte dentro de 30–45 min.</div>
              </div>
              <span style={{ color: C.faint }}>›</span>
            </div>
          </div>
        )}

        {/* ============ ALERTAS ============ */}
        {tab === "alertas" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <PageTitle>Alertas</PageTitle>
            <Segmented
              items={["Ativos", "Próximos", "Histórico"]}
              active={alertTab}
              onSelect={setAlertTab}
              badges={{ Ativos: { n: d.alerts.ativos.length, color: C.red }, Próximos: { n: d.alerts.proximos.length, color: C.orange } }}
            />

            {alertTab === "Ativos" && d.alerts.ativos.map((a, i) => (
              <div key={i} style={{ border: `1px solid ${a.color}66`, borderRadius: 24, overflow: "hidden", background: `linear-gradient(160deg, ${a.color}18 0%, rgba(255,255,255,0.05) 55%)`, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", boxShadow: "0 12px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)" }}>
                <div style={{ padding: 18 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: a.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, boxShadow: `0 0 18px ${a.color}66` }}>⚠️</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: a.color, fontWeight: 700 }}>Aviso {a.level}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 1 }}>{a.title}</div>
                      <div style={{ fontSize: 13, color: C.dim, marginTop: 3 }}>📍 {a.place}</div>
                    </div>
                    <div style={{ border: `1px solid ${a.color}`, color: a.color, borderRadius: 10, padding: "5px 11px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>Em vigor</div>
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
                    <div style={{ flex: 1.4, fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>{a.desc}</div>
                    <div style={{ borderLeft: `1px solid ${C.cardBorder}`, paddingLeft: 14, fontSize: 12 }}>
                      <div style={{ color: C.faint }}>Início</div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginTop: 1 }}>{a.start}</div>
                      <div style={{ color: C.faint, marginTop: 8 }}>Fim previsto</div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginTop: 1 }}>{a.end}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", borderTop: `1px solid ${C.cardBorder}`, marginTop: 16, paddingTop: 14 }}>
                    {a.stats.map((s, j) => (
                      <div key={j} style={{ flex: 1, paddingLeft: j > 0 ? 12 : 0, borderLeft: j > 0 ? `1px solid ${C.cardBorder}` : "none" }}>
                        <div style={{ fontSize: 11, color: C.dim }}>{s.l}</div>
                        <div style={{ fontSize: 14.5, fontWeight: 700, marginTop: 3 }}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop: `1px solid ${C.cardBorder}`, marginTop: 14, paddingTop: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: a.color, fontSize: 14, fontWeight: 600 }}>Ver recomendações de segurança</span>
                    <span style={{ color: a.color }}>›</span>
                  </div>
                </div>
              </div>
            ))}

            {alertTab === "Ativos" && (
              <>
                <div style={{ fontSize: 17, fontWeight: 700, marginTop: 4 }}>Próximos alertas</div>
                {d.alerts.proximos.map((a, i) => <SmallAlert key={i} a={a} />)}
              </>
            )}
            {alertTab === "Próximos" && d.alerts.proximos.map((a, i) => <SmallAlert key={i} a={a} />)}
            {alertTab === "Histórico" && d.alerts.historico.map((a, i) => <SmallAlert key={i} a={a} />)}
          </div>
        )}
      </div>

      {/* ============ NAV BAR ============ */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(8,8,12,0.92)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", borderTop: `1px solid ${C.cardBorder}`, display: "flex", justifyContent: "center", padding: "10px 8px calc(env(safe-area-inset-bottom, 0px) + 10px)", zIndex: 100 }}>
        <div style={{ display: "flex", maxWidth: 480, width: "100%" }}>
          {NAV.map((n) => {
            const on = tab === n.id;
            const ac = navAccent[n.id];
            return (
              <button key={n.id} onClick={() => setTab(n.id)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative" }}>
                <div style={{ padding: "6px 14px", borderRadius: 14, background: on ? `${ac}22` : "transparent", position: "relative" }}>
                  <NavIcon type={n.id} color={on ? ac : "rgba(255,255,255,0.45)"} />
                  {n.id === "alertas" && <div style={{ position: "absolute", top: 4, right: 10, width: 6, height: 6, borderRadius: 3, background: C.red }} />}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: on ? ac : "rgba(255,255,255,0.45)" }}>{n.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const SmallAlert = ({ a }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, background: "linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.035))", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 8px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)", borderRadius: 20, padding: 16 }}>
    <div style={{ width: 42, height: 42, borderRadius: 12, background: `${a.color}22`, border: `1.5px solid ${a.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>⚠️</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 12.5, color: a.color, fontWeight: 700 }}>Aviso {a.level}</div>
      <div style={{ fontSize: 16.5, fontWeight: 700, marginTop: 1 }}>{a.title}</div>
      <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>📍 {a.place}</div>
    </div>
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "pre-line" }}>{a.when.replace(" · ", "\n")}</div>
    </div>
    <span style={{ color: "rgba(255,255,255,0.35)" }}>›</span>
  </div>
);
