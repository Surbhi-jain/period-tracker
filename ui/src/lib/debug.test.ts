import { afterEach, describe, expect, it, vi } from "vitest";
import { lunaDebug } from "./debug";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("lunaDebug", () => {
  it("prints a [Luna] line in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    lunaDebug("page", "Saving profile to API", { mode: "age" });

    expect(log).toHaveBeenCalledWith("[Luna]", "page", "Saving profile to API", {
      mode: "age",
    });
  });

  it("omits extra when it is not passed", () => {
    vi.stubEnv("NODE_ENV", "test");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    lunaDebug("auth", "No signed-in user on this request");

    expect(log).toHaveBeenCalledWith(
      "[Luna]",
      "auth",
      "No signed-in user on this request",
    );
  });

  it("stays silent in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    lunaDebug("page", "This should not print");

    expect(log).not.toHaveBeenCalled();
  });
});
