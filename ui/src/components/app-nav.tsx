"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/tracker", label: "Tracker" },
  { href: "/tracker/tithi", label: "Moon and tithi" },
];

export function AppNav() {
  const path = usePathname();
  return (
    <nav className="app-nav" aria-label="Tracker">
      {LINKS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-label={item.label}
          className={path === item.href ? "is-active" : undefined}
        >
          <span className="app-nav-full" aria-hidden="true">{item.label}</span>
          <span className="app-nav-short" aria-hidden="true">
            {item.href === "/tracker/tithi" ? "Tithi" : item.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}
