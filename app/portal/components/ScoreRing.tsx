export function ScoreRing({
  score,
  max = 100,
  size = 120,
  stroke = 10,
  className = "",
}: {
  score: number;
  max?: number;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * (score / max);

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="var(--wa-primary-soft)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="var(--wa-primary)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>
      <div className="relative flex flex-col items-center">
        <span className="text-3xl font-bold text-text">{score}</span>
        <span className="text-[10px] uppercase tracking-wide text-text-muted">
          / {max}
        </span>
      </div>
    </div>
  );
}
