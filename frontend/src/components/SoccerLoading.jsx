import SoccerSpinner from './SoccerSpinner';

export default function SoccerLoading({ label = "Yuklanmoqda...", minHeight, full = false }) {
  return (
    <div
      className={`soccer-loading${full ? ' soccer-loading--full' : ''}`}
      style={minHeight ? { minHeight } : undefined}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="soccer-loading-card">
        <SoccerSpinner />
        {label ? <div className="soccer-loading-label">{label}</div> : null}
      </div>
    </div>
  );
}

