"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export const MARKETING_NAV = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features", label: "Features" },
  { href: "/#faq", label: "FAQ" },
  { href: "/blog", label: "Journal" },
];

export function isNavActive(path: string, href: string, hash: string) {
  if (href === "/blog") return path === "/blog" || path.startsWith("/blog/");
  if (href === "/privacy") return path === "/privacy";
  if (href.startsWith("/#")) return path === "/" && hash === href.slice(1);
  return false;
}

export function MarketingNav({ compact = false }: { compact?: boolean }) {
  const path = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [path]);

  return (
    <nav className={compact ? "site-menu-links" : "site-nav"} aria-label={compact ? "Mobile" : "Main"}>
      {MARKETING_NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={isNavActive(path, item.href, hash) ? "is-active" : undefined}
          onClick={() => {
            if (item.href.startsWith("/#")) setHash(item.href.slice(1));
          }}
        >
          {item.label}
        </Link>
      ))}
      {compact ? <Link href="/tracker">Open tracker</Link> : null}
    </nav>
  );
}
