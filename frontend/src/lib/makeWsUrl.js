/**
 * lib/makeWsUrl.js
 *
 * WebSocket URL manzillarini tunnel va production muhitiga moslab hosil qiladi.
 * - Har doim `wss://` protokolida ulanadi
 * - `api-football.acoderm.uz` hostiga qaratadi
 * - Oxiri `/` bilan tugaydi
 * - Ortiqcha `ws/` qismlarini tozalaydi
 */

function normalizeWsOrigin(raw) {
  if (!raw) return null;
  const trimmed = String(raw).trim().replace(/\/+$/, '');
  if (!/^wss?:\/\//i.test(trimmed)) return null;
  return trimmed;
}

function normalizeHttpOrigin(raw) {
  if (!raw) return null;
  const trimmed = String(raw).trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
}

function wsOriginFromApiOrigin(apiOrigin) {
  const httpOrigin = normalizeHttpOrigin(apiOrigin);
  if (!httpOrigin) return null;
  // https -> wss, http -> ws ga o'tkazish
  return httpOrigin.replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:');
}

/**
 * WS_ORIGIN aniqlash tartibi:
 * 1. .env fayldagi VITE_WS_URL
 * 2. .env fayldagi VITE_API_URL dan hosil qilingan wss manzil
 * 3. Hozirgi brauzer protokoli va hostname (port 8000 olib tashlandi)
 */
export const WS_ORIGIN =
  normalizeWsOrigin(import.meta.env.VITE_WS_URL) ??
  wsOriginFromApiOrigin(import.meta.env.VITE_API_URL) ??
  `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}`;

// Debug log (faqat development rejimida)
if (import.meta.env.DEV) {
  const wsUrlMissing = !import.meta.env.VITE_WS_URL;
  const apiUrlMissing = !import.meta.env.VITE_API_URL;

  if (wsUrlMissing && apiUrlMissing) {
    console.warn(
      `[ws] VITE_WS_URL va VITE_API_URL topilmadi. Hozirgi manzil: ${WS_ORIGIN}`
    );
  }
}

/**
 * Pathni tozalash: ortiqcha ws/ qismlarini olib tashlash
 * @param {string} path - Masalan: '/ws/jonli/' yoki '/ws/ws/jonli'
 * @returns {string} - Tozalangan path
 */
function cleanPath(path) {
  if (!path) return path;

  // Oldidagi va oxiridagi slashlarni olib tashlash
  let cleaned = String(path).trim();

  // Barcha ortiqcha 'ws/' qismlarini olib tashlash (boshidagi `/` bilan yoki undan xola)
  // Misol: `/ws/ws/jonli/` -> `/jonli/`
  cleaned = cleaned.replace(/^\/+ws\//i, '/').replace(/^ws\//i, '/');

  // Yana bir marta tekshirish (nested ws/)
  if (/^\/+ws\//i.test(cleaned)) {
    cleaned = cleanPath(cleaned); // rekursiv
  }

  // Boshida `/` bo'lmasligini ta'minlash
  cleaned = cleaned.replace(/^\/+/, '/');

  // Oxiri `/` bilan tugashi
  if (!cleaned.endsWith('/')) {
    cleaned += '/';
  }

  return cleaned;
}

/**
 * To'liq WebSocket URL hosil qilish
 * @param {string} path - Masalan: '/jonli/' yoki 'ws/jonli'
 * @returns {string} - To'liq WebSocket URL, masalan: 'wss://api-football.acoderm.uz/jonli/'
 */
export function makeWsUrl(path) {
  if (!path) throw new Error('makeWsUrl(path) requires a path');

  // Agar path to'liq URL bo'lsa (wss://...), uni o'zini qaytaradi
  if (/^wss?:\/\//i.test(path)) return path;

  // Pathni tozalash
  const cleanedPath = cleanPath(path);

  return `${WS_ORIGIN}${cleanedPath}`;
}