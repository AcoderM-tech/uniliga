function toInt(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? Math.trunc(num) : fallback;
}

function toDateMs(value) {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function isMatchClockRunning(match) {
  const phase = match?.phase;
  return ['first_half', 'second_half', 'extra_time'].includes(phase) && Boolean(toDateMs(match?.phase_started_at));
}

// Frontend clock: mirrors backend `Match.get_display_minute()` but keeps ticking in `extra_time` as well.
export function getMatchClock(match, nowMs = Date.now()) {
  if (!match) return { minute: 0, extra: 0, second: 0 };

  const phase = match.phase || 'not_started';
  const firstHalfDuration = toInt(match.first_half_duration, 45);
  const firstHalfExtra = toInt(match.first_half_extra, 0);
  const secondHalfDuration = toInt(match.second_half_duration, 45);
  const secondHalfExtra = toInt(match.second_half_extra, 0);

  const fallbackMinute = toInt(match.display_minute ?? match.minute, 0);
  const fallbackExtra = toInt(match.display_extra ?? match.extra_minute, 0);

  if (phase === 'not_started') return { minute: 0, extra: 0, second: 0 };

  if (phase === 'half_time') {
    return { minute: firstHalfDuration + (firstHalfExtra || 0), extra: 0, second: 0 };
  }

  if (phase === 'finished') {
    const base = firstHalfDuration + secondHalfDuration;
    return { minute: base + (secondHalfExtra || 0), extra: 0, second: 0 };
  }

  const startedAtMs = toDateMs(match.phase_started_at);
  if (!startedAtMs) return { minute: fallbackMinute, extra: fallbackExtra, second: 0 };

  const safeNow = toInt(nowMs, Date.now());
  let elapsedSec = Math.max(0, Math.floor((safeNow - startedAtMs) / 1000));

  if (phase === 'first_half') {
    const cap = firstHalfDuration;
    const maxExtra = firstHalfExtra || 5;
    const maxTotal = (cap + maxExtra) * 60 + 59;
    if (elapsedSec > maxTotal) elapsedSec = maxTotal;

    const capSec = cap * 60;
    if (elapsedSec <= capSec + 59) {
      return { minute: Math.floor(elapsedSec / 60), extra: 0, second: elapsedSec % 60 };
    }

    const extraSec = elapsedSec - capSec;
    const extraMin = Math.floor(extraSec / 60);
    return { minute: cap, extra: Math.min(extraMin, maxExtra), second: extraSec % 60 };
  }

  if (phase === 'second_half' || phase === 'extra_time') {
    const base = firstHalfDuration + (firstHalfExtra || 0);
    const cap2 = secondHalfDuration;
    const maxExtra = secondHalfExtra || 5;
    const maxTotal = (cap2 + maxExtra) * 60 + 59;
    if (elapsedSec > maxTotal) elapsedSec = maxTotal;

    const cap2Sec = cap2 * 60;
    if (elapsedSec <= cap2Sec + 59) {
      return { minute: base + Math.floor(elapsedSec / 60), extra: 0, second: elapsedSec % 60 };
    }

    const extraSec = elapsedSec - cap2Sec;
    const extraMin = Math.floor(extraSec / 60);
    return { minute: base + cap2, extra: Math.min(extraMin, maxExtra), second: extraSec % 60 };
  }

  return { minute: fallbackMinute, extra: fallbackExtra, second: 0 };
}
