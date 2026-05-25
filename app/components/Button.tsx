import Link from "next/link";

type Variant = "primary" | "outline";

const styles: Record<Variant, string> = {
  primary:
    "bg-wa-primary text-white hover:bg-wa-primary-dark border border-transparent",
  outline:
    "bg-transparent text-wa-primary hover:bg-wa-primary-soft border border-wa-primary",
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
    "inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wa-primary";

  return (
    <Link href={href} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </Link>
  );
}
