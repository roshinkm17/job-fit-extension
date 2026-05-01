import type { Session } from "@supabase/supabase-js";

const EXT_ID = import.meta.env.VITE_CHROME_EXTENSION_ID as string | undefined;

interface ChromeWithRuntime {
  readonly runtime: {
    sendMessage: (extensionId: string, message: unknown, cb: () => void) => void;
    lastError?: { message: string };
  };
}

function getChrome(): ChromeWithRuntime | null {
  if (typeof globalThis === "undefined") return null;
  const candidate = (globalThis as { chrome?: unknown }).chrome;
  if (candidate && typeof candidate === "object" && "runtime" in candidate) {
    return candidate as ChromeWithRuntime;
  }
  return null;
}

/**
 * Pushes the Supabase session to the extension's background worker so
 * `POST /analyze` can use `Authorization: Bearer` from LinkedIn. No-op
 * when `VITE_CHROME_EXTENSION_ID` is unset or the page is not running
 * with `chrome.*` (e.g. Firefox or Safari without the bridge).
 */
function warnBridgeFailure(context: string): void {
  const chrome = getChrome();
  const lastError = chrome?.runtime.lastError;
  if (!lastError?.message) return;
  const base = `[RoleGauge] extension bridge (${context}): ${lastError.message}`;
  if (import.meta.env.DEV) {
    console.warn(base);
    return;
  }
  console.warn(
    `${base} Add your deployed web origin to apps/extension/package.json → manifest.externally_connectable.matches (must match the RoleGauge site URL), rebuild the extension, and set VITE_CHROME_EXTENSION_ID in the web app env.`,
  );
}

export function pushSessionToExtension(session: Session | null): void {
  if (!EXT_ID) return;
  const chrome = getChrome();
  if (!chrome) return;
  if (!session) {
    chrome.runtime.sendMessage(EXT_ID, { type: "JOB_FIT_CLEAR_SESSION" }, () => {
      warnBridgeFailure("sign-out");
    });
    return;
  }
  chrome.runtime.sendMessage(
    EXT_ID,
    {
      type: "JOB_FIT_SET_SESSION",
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    },
    () => {
      warnBridgeFailure("set-session");
    },
  );
}
