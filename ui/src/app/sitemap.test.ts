import { describe, expect, it } from "vitest";
import { listPosts } from "@/lib/blog";
import sitemap from "./sitemap";

describe("sitemap", () => {
  it("includes the journal index and every note", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toContain("http://localhost:3000/blog");
    for (const post of listPosts()) {
      expect(urls).toContain(`http://localhost:3000/blog/${post.slug}`);
    }
  });
});
