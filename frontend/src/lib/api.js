import axios from 'axios';

const DEFAULT_TIMEOUT_MS = 15_000;
const ACCESS_TOKEN_KEY = 'unilga_access_token';
const REFRESH_FLAG_KEY = 'unilga_has_refresh';

function normalizeOrigin(raw) {
  if (!raw) return null;
  const trimmed = String(raw).trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
}

// Expected: VITE_API_URL=http://<host>:8000  (no `/api` suffix needed)
export const API_ORIGIN = normalizeOrigin(import.meta.env.VITE_API_URL);
export const API_BASE_URL = API_ORIGIN
  ? (API_ORIGIN.endsWith('/api') ? API_ORIGIN : `${API_ORIGIN}/api`)
  : 'http://localhost:8000/api';

if (import.meta.env.DEV && !API_ORIGIN) {
  // eslint-disable-next-line no-console
  console.warn(
    '[api] VITE_API_URL is missing/invalid. Falling back to http://localhost:8000 (set frontend .env.local).'
  );
}

function getCookie(name) {
  if (!name) return null;
  for (let c of (document.cookie || '').split(';')) {
    const t = c.trim();
    if (t.startsWith(`${name}=`)) return decodeURIComponent(t.slice(name.length + 1));
  }
  return null;
}

const csrfClient = axios.create({ baseURL: API_BASE_URL, timeout: DEFAULT_TIMEOUT_MS, withCredentials: true });
let csrfPromise  = null;
export async function ensureCsrfToken() {
  if (getCookie('csrftoken')) return getCookie('csrftoken');
  if (!csrfPromise) {
    csrfPromise = csrfClient.get('/csrf/').catch(() => null).finally(() => { csrfPromise = null; });
  }
  await csrfPromise;
  return getCookie('csrftoken');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  withCredentials: true,
  headers: { Accept: 'application/json' },
});

// ── JWT (Access) token: xotirada + sessionStorage ─────────────────────────────
let accessToken = null;
try {
  accessToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
} catch {
  accessToken = null;
}
const tokenSubscribers = new Set();

export function setAccessToken(token) {
  accessToken = token || null;
  try {
    if (accessToken) {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    } else {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  } catch {
    // ignore storage errors
  }
  tokenSubscribers.forEach(fn => {
    try { fn(accessToken); } catch { /* ignore */ }
  });
}

export function getAccessToken() {
  return accessToken;
}

export function setRefreshFlag(present) {
  try {
    if (present) {
      sessionStorage.setItem(REFRESH_FLAG_KEY, '1');
    } else {
      sessionStorage.removeItem(REFRESH_FLAG_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

function hasRefreshFlag() {
  try {
    return sessionStorage.getItem(REFRESH_FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

function parseJwt(token) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isTokenExpired(token, skewSeconds = 30) {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= (now + skewSeconds);
}

export function onAccessTokenChange(fn) {
  tokenSubscribers.add(fn);
  return () => tokenSubscribers.delete(fn);
}

api.interceptors.request.use(async (config) => {
  const method = (config.method || 'get').toLowerCase();

  // Attach JWT to all requests (admin endpointlar uchun)
  if (accessToken) {
    config.headers = { ...config.headers, Authorization: `Bearer ${accessToken}` };
  }

  if (!['get','head','options','trace'].includes(method)) {
    await ensureCsrfToken();
    const csrf = getCookie('csrftoken');
    if (csrf) config.headers = { ...config.headers, 'X-CSRFToken': csrf };
  }
  return config;
});

// ── Auto refresh on 401 ───────────────────────────────────────────────────────
const authClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  withCredentials: true,
  headers: { Accept: 'application/json' },
});
let refreshPromise = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      await ensureCsrfToken();
      const csrf = getCookie('csrftoken');
      const headers = csrf ? { 'X-CSRFToken': csrf } : undefined;
      const res = await authClient.post('/auth/token/refresh/', {}, { headers });
      const next = res?.data?.access;
      if (!next) throw new Error('No access token');
      setAccessToken(next);
      return next;
    })().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

export async function ensureAccessToken() {
  if (accessToken && !isTokenExpired(accessToken)) return accessToken;
  if (!hasRefreshFlag()) throw new Error('No refresh flag');
  return refreshAccessToken();
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const status = error?.response?.status;
    const original = error?.config;
    const url = String(original?.url || '');

    const isAuthUrl =
      url.includes('/auth/token/') ||
      url.includes('/auth/token/refresh/') ||
      url.includes('/auth/logout/') ||
      url.includes('/csrf/');

    if (status === 401 && original && !original._retry && !isAuthUrl) {
      original._retry = true;
      try {
        const next = await refreshAccessToken();
        original.headers = { ...original.headers, Authorization: `Bearer ${next}` };
        return api(original);
      } catch {
        setAccessToken(null);
        setRefreshFlag(false);
      }
    }

    return Promise.reject(error);
  }
);

// ── Ommaviy ──────────────────────────────────────────────────────────────────
export const getBoshSahifa    = ()     => api.get('/bosh-sahifa/').then(r => r.data);
export const getHomepage      = getBoshSahifa;
export const getOyinlar       = (p={}) => api.get('/oyinlar/', { params: p }).then(r => r.data).catch(() => ({ results: [] }));
export const getMatches       = getOyinlar;
export const getOyin          = (id)   => api.get(`/oyinlar/${id}/`).then(r => r.data);
export const getMatch         = getOyin;
export const getJadval        = (p={}) => api.get('/jadval/', { params: p }).then(r => r.data).catch(() => []);
export const getTopFutbolchi  = (p={}) => api.get('/top-futbolchilar/', { params: p }).then(r => r.data).catch(() => []);
export const getYangiliklar   = (p={}) => api.get('/yangiliklar/', { params: p }).then(r => r.data).catch(() => ({ results: [] }));
export const getYangilik      = (id)   => api.get(`/yangiliklar/${id}/`).then(r => r.data);
export const getJamoalar      = (p={}) => api.get('/jamoalar/', { params: p }).then(r => r.data).catch(() => ({ results: [] }));
export const getTeams         = getJamoalar;
export const getFutbolchilar  = (p={}) => api.get('/futbolchilar/', { params: p }).then(r => r.data).catch(() => ({ results: [] }));
export const getStatistika    = ()     => api.get('/statistika/').then(r => r.data).catch(() => ({}));
export const getMavsumlar     = ()     => api.get('/mavsumlar/').then(r => r.data).catch(() => ({ results: [] }));
export const getFaolMavsum    = ()     => api.get('/mavsumlar/faol/').then(r => r.data).catch(() => null);
export const getMavsum        = (id)   => api.get(`/mavsumlar/${id}/`).then(r => r.data);
export const getMavsumArhiv   = (id)   => api.get(`/mavsumlar/${id}/arxiv_malumot/`).then(r => r.data);
export const getLinkableMatches = ()   => api.get('/oyinlar/linkable_matches/').then(r => r.data).catch(() => []);

// ── Admin auth (JWT) ──────────────────────────────────────────────────────────
export const adminKirish  = async (d) => { await ensureCsrfToken(); return api.post('/auth/token/', d).then(r => r.data); };
export const adminChiqish = ()  => api.post('/auth/logout/').then(r => r.data);
export const adminMen     = async () => {
  try {
    await ensureAccessToken();
  } catch {
    // No token/refresh available → skip request to avoid 401 noise
    throw new Error('Not authenticated');
  }
  return api.get('/auth/me/').then(r => r.data);
};

// ── Match lifecycle ───────────────────────────────────────────────────────────
export const adminBoshlash                = (id, d) => api.post(`/oyinlar/${id}/boshlash/`, d).then(r => r.data);
export const adminBirinchiYarimQoshimcha  = (id, d) => api.post(`/oyinlar/${id}/birinchi_yarim_qoshimcha/`, d).then(r => r.data);
export const adminTanaffus                = (id, d) => api.post(`/oyinlar/${id}/tanaffus/`, d).then(r => r.data);
export const adminIkkinchiYarim           = (id, d) => api.post(`/oyinlar/${id}/ikkinchi_yarim/`, d).then(r => r.data);
export const adminIkkinchiYarimQoshimcha  = (id, d) => api.post(`/oyinlar/${id}/ikkinchi_yarim_qoshimcha/`, d).then(r => r.data);
export const adminTugatish                = (id)    => api.post(`/oyinlar/${id}/tugatish/`).then(r => r.data);
export const getBoshlanishXabari          = ()      => api.get('/oyinlar/boshlanish_xabari/').then(r => r.data).catch(() => []);

// ── Admin CRUD ────────────────────────────────────────────────────────────────
export const adminUpdateScore         = (id, d) => api.patch(`/oyinlar/${id}/hisob_yangilash/`, d).then(r => r.data);
export const adminHisobYangilash      = adminUpdateScore;
export const adminAddEvent            = (id, d) => api.post(`/oyinlar/${id}/hodisa_qoshish/`, d).then(r => r.data);
export const adminHodisaQoshish       = adminAddEvent;
export const adminHodisaOchirish      = (id, d) => api.post(`/oyinlar/${id}/hodisa_ochirish/`, d).then(r => r.data);
export const adminCreateMatch         = (d)     => api.post('/oyinlar/', d).then(r => r.data);
export const adminOyinYaratish        = adminCreateMatch;
export const adminOyinOchirish        = (id)    => api.delete(`/oyinlar/${id}/`).then(r => r.data);
export const adminJamoaYaratish       = (d)     => api.post('/jamoalar/', d).then(r => r.data);
export const adminJamoaOchirish       = (id)    => api.delete(`/jamoalar/${id}/`).then(r => r.data);
export const adminYangilikYaratish    = (d)     => api.post('/yangiliklar/', d).then(r => r.data);
export const adminYangilikOchirish    = (id)    => api.delete(`/yangiliklar/${id}/`).then(r => r.data);
export const adminMavsumYaratish      = (d)     => api.post('/mavsumlar/', d).then(r => r.data);
export const adminMavsumOchirish      = (id)    => api.delete(`/mavsumlar/${id}/`).then(r => r.data);
export const adminFutbolchiYaratish   = (d)     => api.post('/futbolchilar/', d).then(r => r.data);
export const adminFutbolchiOchirish   = (id)    => api.delete(`/futbolchilar/${id}/`).then(r => r.data);

// Mavsum boshqaruvi
export const adminMavsumFaollashtirish = (id) => api.post(`/mavsumlar/${id}/faollashtirish/`).then(r => r.data);
export const adminMavsumArxivlash      = (id) => api.post(`/mavsumlar/${id}/arxivlash/`).then(r => r.data);

// Home slider (admin)
export const getHomeSlides           = () => api.get('/home-slides/').then(r => r.data);
export const adminHomeSlideCreate    = (fd) => api.post('/home-slides/', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
export const adminHomeSlideUpdate    = (id, fd) => api.patch(`/home-slides/${id}/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
export const adminHomeSlideDelete    = (id) => api.delete(`/home-slides/${id}/`).then(r => r.data);

export default api;

// ── Match Center API ──────────────────────────────────────────────────────────
export const getMatchLineup     = (id)    => api.get(`/oyinlar/${id}/lineup/`).then(r => r.data);
export const addPlayerToMatch   = (id, d) => api.post(`/oyinlar/${id}/add-player/`, d).then(r => r.data);
export const applyFormation     = (id, d) => api.post(`/oyinlar/${id}/formation/`, d).then(r => r.data);
export const getMatchPlayers    = (p={})  => api.get('/match-players/', { params: p }).then(r => r.data);
export const updatePlayerPos    = (id, d) => api.patch(`/match-players/${id}/position/`, d).then(r => r.data);
export const addPlayerEvent     = (id, d) => api.post(`/match-players/${id}/event/`, d).then(r => r.data);
export const deleteMatchPlayer  = (id)    => api.delete(`/match-players/${id}/`).then(r => r.data);

// ── Yetishmayotgan alias funksiyalar (NewsPage, TablePage uchun) ──────────────
export const getPosts  = getYangiliklar;   // NewsPage.jsx ishlatadi
export const getTable  = getJadval;        // TablePage.jsx ishlatadi

// Strict helpers (React Query friendly): do NOT swallow errors.
export const fetchOyinlar       = (p = {}) => api.get('/oyinlar/', { params: p }).then(r => r.data);
export const fetchJadval        = (p = {}) => api.get('/jadval/', { params: p }).then(r => r.data);
export const fetchTopFutbolchi  = (p = {}) => api.get('/top-futbolchilar/', { params: p }).then(r => r.data);
export const fetchYangiliklar   = (p = {}) => api.get('/yangiliklar/', { params: p }).then(r => r.data);
export const fetchFaolMavsum    = ()      => api.get('/mavsumlar/faol/').then(r => r.data);
export const fetchMavsum        = (id)    => api.get(`/mavsumlar/${id}/`).then(r => r.data);
