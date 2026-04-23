import { readEnv } from "../lib/env";
import { getExtensionSupabase } from "../lib/supabase";
import { isAllowedWebSender } from "../lib/web-app-origin";

/**
 * Never call `readEnv()` at the top level of the service worker. If the
 * built bundle is missing `PLASMO_PUBLIC_*` (e.g. no `apps/extension/.env`
 * when running `plasmo build`), a synchronous throw prevents registration
 * and Chrome reports "Service worker registration failed. Status code: 15".
 * We only read config when a message arrives so the worker still registers;
 * a missing config returns a clear error to the web app instead.
 */
chrome.runtime.onMessageExternal.addListener(
  (raw: unknown, sender, sendResponse: (r: { ok: boolean; error?: string }) => void) => {
    let webAppUrl: string;
    try {
      webAppUrl = readEnv().webAppUrl;
    } catch {
      sendResponse({ ok: false, error: "extension_env_missing" });
      return false;
    }

    if (!isAllowedWebSender(sender.url, webAppUrl)) {
      sendResponse({ ok: false, error: "forbidden" });
      return;
    }
    const message = raw as Partial<{
      type: string;
      access_token?: string;
      refresh_token?: string;
    }>;
    if (message.type === "JOB_FIT_SET_SESSION") {
      if (!message.access_token || !message.refresh_token) {
        sendResponse({ ok: false, error: "bad_payload" });
        return;
      }
      void getExtensionSupabase()
        .auth.setSession({
          access_token: message.access_token,
          refresh_token: message.refresh_token,
        })
        .then(({ error }) => {
          if (error) {
            sendResponse({ ok: false, error: error.message });
            return;
          }
          sendResponse({ ok: true });
        });
      return true;
    }
    if (message.type === "JOB_FIT_CLEAR_SESSION") {
      void getExtensionSupabase()
        .auth.signOut()
        .then(() => {
          sendResponse({ ok: true });
        });
      return true;
    }
    sendResponse({ ok: false, error: "unknown_type" });
    return false;
  },
);
