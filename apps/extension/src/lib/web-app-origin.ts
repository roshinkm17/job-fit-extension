/**
 * The web app and Vite may use `localhost` or `127.0.0.1` interchangeably. We
 * treat both as the same Job Fit app for external messaging + security checks.
 */
export function isAllowedWebSender(pageUrl: string | undefined, webAppBaseUrl: string): boolean {
  if (!pageUrl) return false;
  let a: string;
  let b: string;
  try {
    a = new URL(pageUrl).origin;
    b = new URL(webAppBaseUrl).origin;
  } catch {
    return false;
  }
  if (a === b) return true;
  return isLocalhostPair(a, b);
}

function isLocalhostPair(a: string, b: string): boolean {
  const dev = new Set(["http://localhost:5173", "http://127.0.0.1:5173"]);
  if (!a.startsWith("http://") || !b.startsWith("http://")) return false;
  if (!a.includes("5173") || !b.includes("5173")) return false;
  return dev.has(a) && dev.has(b);
}
