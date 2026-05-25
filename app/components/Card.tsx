export function Card({
  title,
  children,
  className = "",
  hover = true,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  const hoverClass = hover
    ? "transition-transform transition-shadow duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    : "";

  return (
    <article
      className={`rounded-lg border border-border bg-surface p-6 shadow-sm ${hoverClass} ${className}`}
    >
      {title && (
        <h3 className="mb-3 text-xl font-semibold text-text">{title}</h3>
      )}
      {children}
    </article>
  );
}
