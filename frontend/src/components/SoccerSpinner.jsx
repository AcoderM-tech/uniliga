import { useId, useMemo } from 'react';

const SQRT3 = Math.sqrt(3);

function hexPoints(cx, cy, r) {
  const a = (SQRT3 * r) / 2;
  const pts = [
    [cx + r, cy],
    [cx + r / 2, cy + a],
    [cx - r / 2, cy + a],
    [cx - r, cy],
    [cx - r / 2, cy - a],
    [cx + r / 2, cy - a],
  ];
  return pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
}

export default function SoccerSpinner({ size = 96 }) {
  const uid = useId().replace(/:/g, '');
  const clipId = `ballClip${uid}`;
  const bgId = `ballBg${uid}`;
  const rimId = `ballRim${uid}`;

  const panels = useMemo(() => {
    const r = 11.5;      // hex radius (corner distance)
    const range = 3;     // grid range
    const maxDist = 34;  // keep inside circle

    const centers = [];
    for (let q = -range; q <= range; q++) {
      for (let s = -range; s <= range; s++) {
        const x = 50 + r * (1.5 * q);
        const y = 50 + r * (SQRT3 * (s + q / 2));
        const dist = Math.hypot(x - 50, y - 50);
        if (dist <= maxDist) centers.push({ x, y, dist });
      }
    }

    const center = centers.find((c) => c.dist < 0.5) || null;
    const outer = centers.filter((c) => c !== center);

    outer.sort((a, b) => {
      const aa = Math.atan2(a.y - 50, a.x - 50);
      const bb = Math.atan2(b.y - 50, b.x - 50);
      return bb - aa; // clockwise
    });

    const ordered = center ? [...outer, center] : outer;

    return ordered.map((c, i) => ({
      key: `${c.x.toFixed(2)}-${c.y.toFixed(2)}`,
      points: hexPoints(c.x, c.y, r),
      i,
    }));
  }, []);

  return (
    <div className="soccer-spinner-wrap" style={{ width: size, height: size }} aria-hidden="true">
      <svg className="soccer-spinner" viewBox="0 0 100 100" focusable="false">
        <defs>
          <radialGradient id={bgId} cx="32%" cy="28%" r="75%">
            <stop offset="0%" stopColor="#0d0f12" />
            <stop offset="45%" stopColor="#1a1a1a" />
            <stop offset="100%" stopColor="#0b0c0e" />
          </radialGradient>
          <linearGradient id={rimId} x1="20%" y1="10%" x2="80%" y2="90%">
            <stop offset="0%" stopColor="rgba(0,143,57,.55)" />
            <stop offset="45%" stopColor="rgba(0,143,57,.18)" />
            <stop offset="100%" stopColor="rgba(0,143,57,.42)" />
          </linearGradient>
          <clipPath id={clipId}>
            <circle cx="50" cy="50" r="40" />
          </clipPath>
        </defs>

        <circle cx="50" cy="50" r="40" fill={`url(#${bgId})`} />

        <g clipPath={`url(#${clipId})`}>
          {panels.map((p) => (
            <polygon key={p.key} className="soccer-panel" style={{ '--i': p.i }} points={p.points} />
          ))}
        </g>

        <circle cx="50" cy="50" r="40" fill="none" stroke={`url(#${rimId})`} strokeWidth="1.25" opacity="0.9" />
        <circle cx="50" cy="50" r="39.3" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="1" opacity="0.8" />
      </svg>
    </div>
  );
}

