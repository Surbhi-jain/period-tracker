import { describe, expect, it } from "vitest";
import { getPost, latestPosts, listPosts } from "./blog";

describe("blog posts", () => {
  it("lists posts newest first with a unique slug", () => {
    const posts = listPosts();
    expect(posts.length).toBeGreaterThanOrEqual(4);
    expect(posts.map((post) => post.slug)).toEqual([...new Set(posts.map((post) => post.slug))]);
    expect(posts[0].date >= posts[posts.length - 1].date).toBe(true);
    expect(posts.every((post) => post.blocks.length > 0)).toBe(true);
  });

  it("returns a post by slug and nothing for an unknown one", () => {
    const post = getPost("what-your-period-can-tell-you");
    expect(post?.title).toMatch(/period/i);
    expect(post?.title).toMatch(/health/i);
    const words = post?.blocks.flatMap((block) =>
      block.type === "ul" ? block.items : block.type === "p" ? [block.text] : [],
    );
    expect(words?.some((text) => /not a diagnosis/i.test(text))).toBe(true);
    expect(words?.some((text) => /not be used as contraception/i.test(text))).toBe(true);
    expect(getPost("missing-post")).toBeNull();
  });

  it("keeps every note on periods and health, not product trivia", () => {
    for (const post of listPosts()) {
      const text = [post.title, post.description, post.topic, ...post.blocks.flatMap((block) =>
        block.type === "ul" ? block.items : block.type === "h2" || block.type === "p" ? [block.text] : [],
      )].join(" ");
      expect(text).toMatch(/period|bleeding|cycle/i);
      expect(text).not.toMatch(/Hindu tithi|Gmail|inbox/i);
    }
  });

  it("keeps the home teaser to the newest posts", () => {
    expect(latestPosts(3)).toEqual(listPosts().slice(0, 3));
  });
});
