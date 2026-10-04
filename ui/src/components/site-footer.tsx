import Link from "next/link";
import { HEALTH_DISCLAIMER } from "@/lib/site";
import { BrandMark } from "./icons";

const LINKS = [
  { href: "/tracker", label: "Open tracker" },
  { href: "/blog", label: "Journal" },
  { href: "/privacy", label: "Privacy" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteFooter({ variant: _variant = "marketing" }: { variant?: "marketing" | "app" }) {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-brand">
          <BrandMark />
          <p>
            <strong>Your body. Your data.</strong>
            <br />
            {HEALTH_DISCLAIMER}
          </p>
        </div>
        <nav className="footer-links" aria-label="Footer">
          {LINKS.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <p className="footer-legal">© {new Date().getFullYear()} Luna</p>
    </footer>
  );
}
