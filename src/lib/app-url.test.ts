import { describe, expect, it, vi } from "vitest";

describe("getAppUrl", () => {
  it("uses NEXT_PUBLIC_APP_URL when configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://smartmove.example.com/");
    vi.resetModules();

    const { getAppUrl } = await import("./app-url");

    expect(getAppUrl()).toBe("https://smartmove.example.com");
  });

  it("falls back to localhost in development", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("NODE_ENV", "development");
    vi.resetModules();

    const { getAppUrl } = await import("./app-url");

    expect(getAppUrl()).toBe("http://localhost:9002");
  });
});
