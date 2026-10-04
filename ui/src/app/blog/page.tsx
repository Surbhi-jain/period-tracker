import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { listPosts } from "@/lib/blog";
import { formatDate } from "@/lib/dates";

export const metadata: Metadata = {
  title: "Journal",
  description: "Plain-language notes on periods, cycle patterns, and what those dates can — and cannot — say about health.",
};

export default function BlogIndexPage() {
  const posts = listPosts();

  return (
    <div className="app-shell">
      <SiteHeader variant="marketing" />
      <main id="main" className="content-page">
        <PageHero
          label="JOURNAL"
          title="Notes on periods and health"
          lead="What cycle patterns can show, and what they cannot."
        />

        <ul className="blog-grid">
          {posts.map((post) => (
            <li key={post.slug}>
              <article className="card blog-card">
                <p className="page-meta">
                  <span>{post.topic}</span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                  <span aria-hidden="true">·</span>
                  <span>{post.minutes} min read</span>
                </p>
                <h2>
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p>{post.description}</p>
                <Link className="text-button blog-card-link" href={`/blog/${post.slug}`}>
                  Read this note <span aria-hidden="true">→</span>
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
