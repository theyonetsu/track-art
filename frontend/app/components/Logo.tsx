import Link from "next/link";

export default function Logo({ href = "/", size = "md" }: { href?: string; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "text-3xl" : size === "sm" ? "text-sm" : "text-xl";
  return (
    <Link href={href} className={`font-serif font-medium tracking-[0.32em] uppercase ${cls} text-ink`}>
      Track<span className="text-terracotta">.</span>Art
    </Link>
  );
}
