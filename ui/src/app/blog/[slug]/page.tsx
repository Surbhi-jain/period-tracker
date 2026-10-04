import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogBlocks } from "@/components/blog-blocks";
import { PageBack, PageHero } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPost, listPosts } from "@/lib/blog";
import { formatDate } from "@/lib/dates";
import { HEALTH_DISCLAIMER } from "@/lib/site";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return listPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return { title: "Journal" };
  return {
    title: post.title,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const post = getPost((await params).slug);
  if (!post) notFound();

  return (
    <div className="app-shell">
      <SiteHeader variant="marketing" />
      <main id="main" className="content-page is-narrow">
        <PageBack href="/blog">← All notes</PageBack>
        <PageHero
          label={post.topic.toUpperCase()}
          title={post.title}
          meta={
            <p>
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span aria-hidden="true"> · </span>
              <span>{post.minutes} min read</span>
            </p>
          }
        />
        <BlogBlocks blocks={post.blocks} />
        <p className="estimate-disclaimer">{HEALTH_DISCLAIMER}</p>
        <div className="page-cta">
          <Link className="primary-button" href="/tracker">
            Open tracker
          </Link>
          <Link className="hero-text-link" href="/blog">
            More notes
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
