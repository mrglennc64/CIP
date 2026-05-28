import Link from "next/link";

type Variant = "primary" | "outline" | "ghost" | "sage";

const styles: Record<Variant, string> = {
  // Pill, ink background — the mockup's primary CTA.
  primary:
    "bg-ink text-white border border-ink hover:bg-black",
  // Pill, sage filled — the mockup's accent CTA.
  sage:
    "bg-sage text-white border border-sage hover:bg-sage-dark hover:border-sage-dark",
  // Pill, outlined — mockup's "ghost" / secondary button.
  ghost:
    "bg-bg text-ink border border-border-2 hover:border-ink",
  // Legacy alias kept so existing pages keep working until repainted.
  outline:
    "bg-transparent text-sage-deep border border-sage hover:bg-sage-soft",
};

export function Button({
  href,
  variant = "primary",
  children,
  className = "",
}: {
  href: string;
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage";

  return (
    <Link href={href} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </Link>
  );
}
