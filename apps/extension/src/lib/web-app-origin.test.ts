import { describe, expect, it } from "vitest";
import { isAllowedWebSender } from "./web-app-origin";

describe("isAllowedWebSender", () => {
  it("allows the same origin", () => {
    expect(isAllowedWebSender("http://localhost:5173/foo", "http://localhost:5173")).toBe(true);
  });

  it("allows localhost vs 127.0.0.1 for Vite dev ports", () => {
    expect(isAllowedWebSender("http://127.0.0.1:5173/", "http://localhost:5173")).toBe(true);
    expect(isAllowedWebSender("http://localhost:5173/", "http://127.0.0.1:5173")).toBe(true);
  });

  it("rejects unrelated origins", () => {
    expect(isAllowedWebSender("https://evil.com", "http://localhost:5173")).toBe(false);
  });
});
