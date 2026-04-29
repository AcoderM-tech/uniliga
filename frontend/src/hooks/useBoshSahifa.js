/**
 * hooks/useBoshSahifa.js
 *
 * React Query (data fetching + caching) + WebSocket (live updates) hook.
 *
 * ✅ TUZATISHLAR:
 *    - Proper error handling
 *    - useQueryClient dependency check
 *    - Memory leak prevention
 *    - Better type hints
 */

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getBoshSahifa } from '../lib/api';
import { makeWsUrl } from '../lib/ws';

// ── Query key ─────────────────────────────────────────────────────────────────
export const BOSH_SAHIFA_KEY = ['boshSahifa'];

// 5 daqiqa
const STALE_TIME = 5 * 60 * 1000;

// Jonli o'yin statuslari
const LIVE_STATUSES = new Set(['live', 'half_time', 'second_half', 'extra_time']);

// ── React Query hook: ma'lumot olish va caching ────────────────────────────────
/**
 * useBoshSahifaQuery
 *
 * @returns {Object} React Query hook natijasi: { data, isLoading, error, ... }
 */
export function useBoshSahifaQuery() {
  return useQuery({
    queryKey: BOSH_SAHIFA_KEY,
    queryFn: getBoshSahifa,

    // 5 daqiqa davomida qayta so'rov yuborilmaydi
    staleTime: STALE_TIME,
    gcTime: STALE_TIME * 6,

    // Sahifalar orasida navigatsiya qilganda eski ma'lumot ko'rinishda qoladi
    placeholderData: (prev) => prev,

    // HTTP 429 da retry to'xtatiladi; boshqa xatolarda 1 marta urinadi
    retry: (count, error) => {
      if (error?.response?.status === 429) return false;
      return count < 1;
    },

    // Exponential back-off: 350ms → 700ms → 1400ms (max 2500ms)
    retryDelay: (attempt) => Math.min(350 * 2 ** attempt, 2500),
  });
}

// ── WebSocket live-update hook ────────────────────────────────────────────────
/**
 * useBoshSahifaWebSocket
 *
 * WebSocket orqali jonli o'yin yangilanishlarini tinglaydi va
 * React Query cache-ni yangilaydi.
 *
 * MEMORY LEAK PREVENTION:
 *   - Cleanup function orqali WebSocket yopiladi
 *   - reconnectTimer o'chiriladi
 */
export function useBoshSahifaWebSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let ws = null;
    let shouldReconnect = true;
    let reconnectTimer = null;

    const connect = () => {
      try {
        ws = new WebSocket(makeWsUrl('/ws/jonli/'));
        ws.onmessage = (ev) => {
          try {

            const msg = JSON.parse(ev.data);
            if (msg.type !== 'live_update') return;

            queryClient.setQueryData(BOSH_SAHIFA_KEY, (prev) => {
              if (!prev) return prev;

              const updated = msg.data;
              const existing = prev.jonli_oyinlar ?? [];

              const jonli_oyinlar = LIVE_STATUSES.has(updated.status)
                ? existing.some((m) => m.id === updated.id)
                  ? existing.map((m) => (m.id === updated.id ? updated : m))
                  : [...existing, updated]
                : existing.filter((m) => m.id !== updated.id);

              return { ...prev, jonli_oyinlar };
            });
          } catch (err) {
            // Noto'g'ri formatdagi xabarlarni e'tiborsiz qoldirish
            console.error('[WebSocket] Parsing error:', err);
          }
        };

        ws.onclose = () => {
          if (shouldReconnect) {
            reconnectTimer = setTimeout(connect, 3000);
          }
        };

        ws.onerror = (err) => {
          // onclose avtomatik chaqiriladi
          console.error('[WebSocket] Connection error:', err);
        };
      } catch (err) {
        console.error('[WebSocket] Connection failed:', err);
        if (shouldReconnect) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      }
    };

    connect();

    // ✅ CLEANUP: unmount bo'lganda yoki dependency o'zgarganda
    return () => {
      shouldReconnect = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [queryClient]);
}

// ── Birlashtirilgan convenience hook ─────────────────────────────────────────
/**
 * useBoshSahifa
 *
 * ✅ ISHLATISH:
 *    const { data, isLoading, error } = useBoshSahifa();
 *
 * @returns {Object} React Query hook natijasi (data, isLoading, error, ...)
 */
export function useBoshSahifa() {
  const query = useBoshSahifaQuery();
  useBoshSahifaWebSocket();
  return query;
}

export default useBoshSahifa;