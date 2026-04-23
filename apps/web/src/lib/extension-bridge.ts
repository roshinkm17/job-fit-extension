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
export function pushSessionToExtension(session: Session | null): void {
  if (!EXT_ID) return;
  const chrome = getChrome();
  if (!chrome) return;
  if (!session) {
    chrome.runtime.sendMessage(EXT_ID, { type: "JOB_FIT_CLEAR_SESSION" }, () => {
      void chrome.runtime.lastError;
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
      void chrome.runtime.lastError;
    },
  );
}
