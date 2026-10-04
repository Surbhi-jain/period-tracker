import { describe, expect, it } from "vitest";
import { createSessionToken, readSessionToken } from "./session";

process.env.AUTH_SECRET = process.env.AUTH_SECRET || "test-secret-for-luna-jwt-signing";

describe("session token", () => {
  it("round-trips the signed-in email", async () => {
    const token = await createSessionToken({
      email: "Ada@Example.com",
      name: "Ada",
      image: "https://example.com/a.png",
    });
    await expect(readSessionToken(token)).resolves.toEqual({
      email: "ada@example.com",
      name: "Ada",
      image: "https://example.com/a.png",
    });
  });

  it("rejects a tampered token", async () => {
    const token = await createSessionToken({ email: "ada@example.com" });
    await expect(readSessionToken(`${token}x`)).resolves.toBeNull();
  });
});
