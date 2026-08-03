import { useState, useEffect, useCallback } from "react";

/* ============================================================
   VENTTO — Ligação à API Open-Meteo (gratuita, sem chave)
   Devolve os dados no mesmo formato que a app já usa.
   ============================================================ */

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const AIR_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const REVERSE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";

/* Lisboa como local por defeito */
export const DEFAULT_COORDS = { lat: 38.7223, lon: -9.1393, name: "Lisboa, Portugal" };

/* ---------- Códigos WMO → condição + ícone ---------- */
const WMO = {
  0: ["Céu limpo", "sun"],
  1: ["Pouco nublado", "cloudSun"],
  2: ["Parcialmente nublado", "cloudSun"],
  3: ["Encoberto", "cloud"],
  45: ["Nevoeiro", "cloud"],
  48: ["Nevoeiro gelado", "cloud"],
  51: ["Chuvisco fraco", "rain"],
  53: ["Chuvisco", "rain"],
  55: ["Chuvisco forte", "rain"],
  56: ["Chuvisco gelado", "rain"],
  57: ["Chuvisco gelado forte", "rain"],
  61: ["Chuva fraca", "rain"],
  63: ["Chuva", "rain"],
  65: ["Chuva forte", "rain"],
  66: ["Chuva gelada", "rain"],
  67: ["Chuva gelada forte", "rain"],
  71: ["Neve fraca", "cloud"],
  73: ["Neve", "cloud"],
  75: ["Neve forte", "cloud"],
  77: ["Grãos de neve", "cloud"],
  80: ["Aguaceiros fracos", "rain"],
  81: ["Aguaceiros", "rain"],
  82: ["Aguaceiros fortes", "rain"],
  85: ["Aguaceiros de neve", "cloud"],
  86: ["Aguaceiros de neve fortes", "cloud"],
  95: ["Trovoada", "rain"],
  96: ["Trovoada com granizo", "rain"],
  99: ["Trovoada forte com granizo", "rain"],
};

const decodeWMO = (code, isNight = false) => {
  const [label, icon] = WMO[code] || ["—", "cloud"];
  // À noite, céu limpo mostra lua em vez de sol
  if (isNight && (icon === "sun" || icon === "cloudSun")) {
    return [label, code === 0 ? "moon" : "cloud"];
  }
  return [label, icon];
};

/* ---------- Helpers ---------- */
const DIRS = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
const windDir = (deg) => DIRS[Math.round(deg / 45) % 8];

const uvLabel = (uv) => {
  if (uv < 3) return "Baixo";
  if (uv < 6) return "Moderado";
  if (uv < 8) return "Alto";
  if (uv < 11) return "Muito alto";
  return "Extremo";
};

/* AQI europeu: 0–20 muito boa, 20–40 boa, 40–60 média, 60–80 fraca, 80–100 má */
const aqiLabel = (aqi) => {
  if (aqi <= 20) return "Muito boa";
  if (aqi <= 40) return "Boa";
  if (aqi <= 60) return "Média";
  if (aqi <= 80) return "Fraca";
  if (aqi <= 100) return "Má";
  return "Muito má";
};

const hhmm = (iso) => (iso ? iso.slice(11, 16) : "--:--");

const shortDay = (iso) => {
  const names = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return names[new Date(iso).getDay()];
};

const shortDate = (iso) => {
  const months = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]}`;
};

const chartDate = (iso) => {
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const d = new Date(iso);
  return `${d.getDate()} ${months[d.getMonth()]}`;
};

/* Tempo até ao pôr do sol, em formato "10h 37m" */
const timeUntil = (iso) => {
  const diff = new Date(iso) - new Date();
  if (diff <= 0) return "já se pôs";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

/* ---------- Fase da lua (cálculo local, sem API) ---------- */
const moonInfo = (date = new Date()) => {
  const synodic = 29.530588853;
  const known = new Date(Date.UTC(2000, 0, 6, 18, 14)); // lua nova de referência
  const days = (date - known) / 86400000;
  const age = ((days % synodic) + synodic) % synodic;
  const pct = Math.round((1 - Math.cos((2 * Math.PI * age) / synodic)) / 2 * 100);

  let phase;
  if (age < 1.85) phase = "Lua Nova";
  else if (age < 5.5) phase = "Crescente Côncava";
  else if (age < 9.2) phase = "Quarto Crescente";
  else if (age < 12.9) phase = "Crescente Gibosa";
  else if (age < 16.6) phase = "Lua Cheia";
  else if (age < 20.3) phase = "Minguante Gibosa";
  else if (age < 24) phase = "Quarto Minguante";
  else if (age < 27.7) phase = "Minguante Côncava";
  else phase = "Lua Nova";

  return { phase, pct };
};

/* ---------- Pesquisa de cidades ---------- */
export async function searchCity(name) {
  const url = `${GEO_URL}?name=${encodeURIComponent(name)}&count=8&language=pt&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha na pesquisa");
  const json = await res.json();
  return (json.results || []).map((r) => ({
    lat: r.latitude,
    lon: r.longitude,
    name: `${r.name}, ${r.country}`,
    admin: r.admin1,
  }));
}

/* ---------- Nome do local a partir das coordenadas ---------- */
async function reverseName(lat, lon) {
  try {
    const res = await fetch(`${REVERSE_URL}?latitude=${lat}&longitude=${lon}&localityLanguage=pt`);
    if (!res.ok) throw new Error();
    const j = await res.json();
    const city = j.city || j.locality || j.principalSubdivision;
    return city ? `${city}, ${j.countryName}` : null;
  } catch {
    return null;
  }
}

/* ---------- Chamada principal ---------- */
export async function fetchWeather(lat, lon, placeName) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,precipitation,is_day,dew_point_2m",
    hourly: "temperature_2m,precipitation_probability,weather_code,relative_humidity_2m,wind_speed_10m,uv_index,is_day,apparent_temperature,precipitation",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset,uv_index_max,wind_speed_10m_max",
    timezone: "auto",
    forecast_days: "16",
  });

  const airParams = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: "european_aqi",
    timezone: "auto",
  });

  const [wRes, aRes] = await Promise.all([
    fetch(`${FORECAST_URL}?${params}`),
    fetch(`${AIR_URL}?${airParams}`).catch(() => null),
  ]);

  if (!wRes.ok) throw new Error("Não foi possível obter a meteorologia");
  const w = await wRes.json();
  const air = aRes && aRes.ok ? await aRes.json() : null;

  const name = placeName || (await reverseName(lat, lon)) || "Local atual";

  /* ----- Momento atual ----- */
  const cur = w.current;
  const isNight = cur.is_day === 0;
  const [condition, curIcon] = decodeWMO(cur.weather_code, isNight);
  const aqi = Math.round(air?.current?.european_aqi ?? 0);

  /* Índice da hora atual dentro do array horário */
  const nowIso = cur.time.slice(0, 13);
  let idx = w.hourly.time.findIndex((t) => t.slice(0, 13) === nowIso);
  if (idx < 0) idx = 0;

  /* UV: usa o valor da hora atual */
  const uvNow = Math.round(w.hourly.uv_index[idx] ?? 0);

  /* Chuva nas próximas 2h: maior probabilidade das próximas 2 horas */
  const rain2h = Math.max(
    w.hourly.precipitation_probability[idx + 1] ?? 0,
    w.hourly.precipitation_probability[idx + 2] ?? 0
  );

  const moon = moonInfo();

  /* ----- Próximas horas (12 a partir de agora) ----- */
  const hourly = [];
  for (let i = 0; i < 12; i++) {
    const k = idx + i;
    if (k >= w.hourly.time.length) break;
    const night = w.hourly.is_day[k] === 0;
    const [, ic] = decodeWMO(w.hourly.weather_code[k], night);
    hourly.push({
      h: i === 0 ? "Agora" : hhmm(w.hourly.time[k]),
      t: Math.round(w.hourly.temperature_2m[k]),
      i: ic,
      pop: w.hourly.precipitation_probability[k] ?? 0,
    });
  }

  /* ----- Previsão diária (a partir de amanhã) ----- */
  const daily = [];
  for (let i = 1; i < Math.min(w.daily.time.length, 16); i++) {
    const [, ic] = decodeWMO(w.daily.weather_code[i]);
    daily.push({
      d: i === 1 ? "Amanhã" : shortDay(w.daily.time[i]),
      date: shortDate(w.daily.time[i]),
      i: ic,
      pop: w.daily.precipitation_probability_max[i] ?? 0,
      lo: Math.round(w.daily.temperature_2m_min[i]),
      hi: Math.round(w.daily.temperature_2m_max[i]),
    });
  }

  /* ----- Gráficos: 7 dias ----- */
  const days7 = w.daily.time.slice(0, 7);
  const chartDays = days7.map((t, i) => (i === 0 ? "Hoje" : shortDay(t)));
  const chartDates = days7.map(chartDate);

  /* Média diária da humidade e do vento a partir dos dados horários */
  const dayAvg = (arr, dayIso) => {
    const vals = w.hourly.time
      .map((t, k) => (t.slice(0, 10) === dayIso.slice(0, 10) ? arr[k] : null))
      .filter((v) => v != null);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  };

  const charts = {
    Temperatura: {
      unit: "°",
      color: "#8B8CF8",
      days: days7.map((_, i) => Math.round(w.daily.temperature_2m_max[i])),
    },
    Precipitação: {
      unit: "mm",
      color: "#60A5FA",
      days: days7.map((_, i) => Math.round(w.daily.precipitation_sum[i] ?? 0)),
    },
    Vento: {
      unit: " km/h",
      color: "#34D399",
      days: days7.map((_, i) => Math.round(w.daily.wind_speed_10m_max[i] ?? 0)),
    },
    Humidade: {
      unit: "%",
      color: "#22D3EE",
      days: days7.map((t) => dayAvg(w.hourly.relative_humidity_2m, t)),
    },
    "UV Index": {
      unit: "",
      color: "#F59E0B",
      days: days7.map((_, i) => Math.round(w.daily.uv_index_max[i] ?? 0)),
    },
  };

  /* ----- Temperatura por hora (hoje, 12 pontos) ----- */
  const todayStart = w.hourly.time.findIndex((t) => t.slice(0, 10) === w.daily.time[0]);
  const hourlyTemps = [];
  for (let i = 6; i < 18; i++) {
    const k = (todayStart >= 0 ? todayStart : 0) + i;
    if (k >= w.hourly.time.length) break;
    const night = w.hourly.is_day[k] === 0;
    const [, ic] = decodeWMO(w.hourly.weather_code[k], night);
    hourlyTemps.push({
      h: hhmm(w.hourly.time[k]),
      t: Math.round(w.hourly.temperature_2m[k]),
      i: ic,
    });
  }

  /* ----- Detalhes ----- */
  const details = [
    { label: "Sensação térmica", value: `${Math.round(cur.apparent_temperature)}°`, sub: "Agora", color: "#EF4444" },
    { label: "Ponto de orvalho", value: `${Math.round(cur.dew_point_2m)}°`, sub: "Agora", color: "#8B8CF8" },
    { label: "Humidade", value: `${Math.round(cur.relative_humidity_2m)}%`, sub: "Agora", color: "#60A5FA" },
    { label: "Precipitação", value: `${(cur.precipitation ?? 0).toFixed(1)} mm`, sub: "Última hora", color: "#22D3EE" },
  ];

  return {
    city: name,
    updatedAt: new Date(),
    now: {
      temp: Math.round(cur.temperature_2m),
      condition,
      icon: curIcon,
      feels: Math.round(cur.apparent_temperature),
      high: Math.round(w.daily.temperature_2m_max[0]),
      low: Math.round(w.daily.temperature_2m_min[0]),
      wind: Math.round(cur.wind_speed_10m),
      windDir: windDir(cur.wind_direction_10m),
      aqi,
      aqiLabel: aqiLabel(aqi),
      uv: uvNow,
      uvLabel: uvLabel(uvNow),
      rain2h,
      sunrise: hhmm(w.daily.sunrise[0]),
      sunset: hhmm(w.daily.sunset[0]),
      sunsetIn: timeUntil(w.daily.sunset[0]),
      moonPhase: moon.phase,
      moonPct: moon.pct,
      pressure: Math.round(cur.surface_pressure),
    },
    hourly,
    daily,
    charts,
    chartDays,
    chartDates,
    hourlyTemps,
    details,
  };
}

/* ============================================================
   Hook: useWeather()
   ============================================================ */
export function useWeather() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [place, setPlace] = useState(null);

  const load = useCallback(async (coords) => {
    setLoading(true);
    setError(null);
    try {
      const c = coords || place || DEFAULT_COORDS;
      const result = await fetchWeather(c.lat, c.lon, c.name);
      setData(result);
      setPlace(c);
    } catch (e) {
      setError(e.message || "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [place]);

  /* Arranque: tenta a localização do dispositivo, senão usa Lisboa */
  useEffect(() => {
    let done = false;

    const fallback = () => {
      if (!done) { done = true; load(DEFAULT_COORDS); }
    };

    if (!navigator.geolocation) return fallback();

    const timer = setTimeout(fallback, 6000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        if (done) return;
        done = true;
        load({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => { clearTimeout(timer); fallback(); },
      { timeout: 5000, maximumAge: 600000 }
    );

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Atualiza a cada 10 minutos enquanto a app está aberta */
  useEffect(() => {
    const id = setInterval(() => { if (!document.hidden && place) load(place); }, 600000);
    return () => clearInterval(id);
  }, [place, load]);

  return { data, loading, error, reload: load, place };
}
