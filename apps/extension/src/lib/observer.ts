import { type LinkedInJobLocator, parseLinkedInJobUrl } from "./url";

export interface JobContextChange {
  readonly locator: LinkedInJobLocator | null;
  readonly href: string;
  readonly trigger: "initial" | "url" | "dom";
}

export interface JobContextWatcherOptions {
  readonly onChange: (event: JobContextChange) => void;
  /** Debounce DOM mutation dispatches. Defaults to 250ms. */
  readonly debounceMs?: number;
  /** Override the global `window` / `document`; used in tests. */
  readonly windowRef?: Window;
}

/**
 * Watches LinkedIn for the currently displayed job and notifies the caller
 * when the user navigates between jobs. Covers three triggers:
 *
 *  - initial: fired once when start() is called so consumers can do a first
 *    extraction pass without duplicating code.
 *  - url: LinkedIn's SPA pushes/replaces history state when the user clicks a
 *    different job; we listen for pushState/replaceState + popstate.
 *  - dom: when the job id in the URL stays the same but the detail panel
 *    re-renders (e.g. after login redirect, lazy description load), a debounced
 *    MutationObserver forces a re-check.
 */
export function createJobContextWatcher(options: JobContextWatcherOptions): {
  start: () => void;
  stop: () => void;
} {
  const win = options.windowRef ?? window;
  const doc = win.document;
  const debounceMs = options.debounceMs ?? 250;

  const MutationObserverCtor = (win as unknown as { MutationObserver: typeof MutationObserver })
    .MutationObserver;

  let stopped = true;
  let lastHref = "";
  let domTimer: ReturnType<typeof setTimeout> | null = null;
  let observer: MutationObserver | null = null;
  let unpatchHistory: (() => void) | null = null;

  function dispatch(trigger: JobContextChange["trigger"]): void {
    const href = win.location.href;
    const locator = parseLinkedInJobUrl(href);
    const locatorKey = locator ? `${locator.kind}:${locator.jobId}` : "none";
    const key = `${trigger === "dom" ? lastHref : href}|${locatorKey}`;
    if (trigger !== "dom" && key === lastHref) return;
    lastHref = key;
    options.onChange({ locator, href, trigger });
  }

  function scheduleDomDispatch(): void {
    if (domTimer) clearTimeout(domTimer);
    domTimer = setTimeout(() => {
      domTimer = null;
      if (!stopped) dispatch("dom");
    }, debounceMs);
  }

  function patchHistory(): () => void {
    const originalPush = win.history.pushState.bind(win.history);
    const originalReplace = win.history.replaceState.bind(win.history);
    win.history.pushState = (...args) => {
      const result = originalPush(...args);
      queueMicrotask(() => {
        if (!stopped) dispatch("url");
      });
      return result;
    };
    win.history.replaceState = (...args) => {
      const result = originalReplace(...args);
      queueMicrotask(() => {
        if (!stopped) dispatch("url");
      });
      return result;
    };
    return () => {
      win.history.pushState = originalPush;
      win.history.replaceState = originalReplace;
    };
  }

  function onPopState(): void {
    if (!stopped) dispatch("url");
  }

  return {
    start() {
      if (!stopped) return;
      stopped = false;
      lastHref = "";
      unpatchHistory = patchHistory();
      win.addEventListener("popstate", onPopState);
      observer = new MutationObserverCtor(scheduleDomDispatch);
      observer.observe(doc.body, { childList: true, subtree: true });
      dispatch("initial");
    },
    stop() {
      if (stopped) return;
      stopped = true;
      if (domTimer) {
        clearTimeout(domTimer);
        domTimer = null;
      }
      observer?.disconnect();
      observer = null;
      win.removeEventListener("popstate", onPopState);
      unpatchHistory?.();
      unpatchHistory = null;
    },
  };
}
