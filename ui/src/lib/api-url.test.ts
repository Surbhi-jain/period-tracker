import { afterEach, describe, expect, it, vi } from "vitest";
import { apiUrl } from "./api-url";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("apiUrl", () => {
  it("points at the backend, defaulting to local port 4000", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    // Empty counts as unset so local dev still reaches the backend.
    expect(apiUrl("/periods")).toBe("http://localhost:4000/periods");
  });

  it("uses the configured backend origin", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com/");
    expect(apiUrl("periods")).toBe("https://api.example.com/periods");
  });
});
