import Link from "next/link";
import type { ReactNode } from "react";

export function PageBack({ href, children }: { href: string; children: ReactNode }) {
  return (
    <p className="page-back">
      <Link href={href}>{children}</Link>
    </p>
  );
}

export function PageHero({
  label,
  title,
  lead,
  meta,
}: {
  label: string;
  title: string;
  lead?: string;
  meta?: ReactNode;
}) {
  return (
    <header className="page-hero">
      <p className="step-label">{label}</p>
      <h1>{title}</h1>
      {lead ? <p className="page-lead">{lead}</p> : null}
      {meta ? <div className="page-meta">{meta}</div> : null}
    </header>
  );
}
