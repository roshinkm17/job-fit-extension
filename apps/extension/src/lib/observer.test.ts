import { JSDOM } from "jsdom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createJobContextWatcher, type JobContextChange } from "./observer";

const JOB_A = "https://www.linkedin.com/jobs/view/1111111111/";
const JOB_B = "https://www.linkedin.com/jobs/view/2222222222/";
const SEARCH = "https://www.linkedin.com/jobs/search/?currentJobId=3333333333";

interface Harness {
  readonly dom: JSDOM;
  readonly win: Window;
  readonly events: JobContextChange[];
}

function createHarness(initialUrl: string): Harness {
  const dom = new JSDOM("<!doctype html><html><body><main></main></body></html>", {
    url: initialUrl,
    pretendToBeVisual: true,
  });
  const events: JobContextChange[] = [];
  return {
    dom,
    win: dom.window as unknown as Window,
    events,
  };
}

describe("createJobContextWatcher", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fires an initial event on start", () => {
    const harness = createHarness(JOB_A);
    const watcher = createJobContextWatcher({
      onChange: (event) => harness.events.push(event),
      windowRef: harness.win,
    });
    watcher.start();
    expect(harness.events).toHaveLength(1);
    const first = harness.events[0];
    expect(first?.trigger).toBe("initial");
    expect(first?.locator).toEqual({ jobId: "1111111111", kind: "view" });
    watcher.stop();
  });

  it("dispatches on SPA pushState navigation to a new job", async () => {
    const harness = createHarness(JOB_A);
    const watcher = createJobContextWatcher({
      onChange: (event) => harness.events.push(event),
      windowRef: harness.win,
    });
    watcher.start();
    harness.win.history.pushState({}, "", JOB_B);
    await Promise.resolve();
    expect(harness.events.map((event) => event.trigger)).toEqual(["initial", "url"]);
    expect(harness.events[1]?.locator?.jobId).toBe("2222222222");
    watcher.stop();
  });

  it("dispatches when switching between jobs on a search page", async () => {
    const harness = createHarness("https://www.linkedin.com/jobs/search/?currentJobId=1");
    const watcher = createJobContextWatcher({
      onChange: (event) => harness.events.push(event),
      windowRef: harness.win,
    });
    watcher.start();
    harness.win.history.replaceState({}, "", SEARCH);
    await Promise.resolve();
    expect(harness.events[1]?.trigger).toBe("url");
    expect(harness.events[1]?.locator).toEqual({ jobId: "3333333333", kind: "collection" });
    watcher.stop();
  });

  it("debounces DOM mutations and emits a single dom event", () => {
    const harness = createHarness(JOB_A);
    const watcher = createJobContextWatcher({
      onChange: (event) => harness.events.push(event),
      windowRef: harness.win,
      debounceMs: 50,
    });
    watcher.start();
    harness.events.length = 0;
    for (let i = 0; i < 5; i += 1) {
      const node = harness.win.document.createElement("div");
      node.textContent = `tick-${i}`;
      harness.win.document.body.appendChild(node);
    }
    // MutationObserver notifications are delivered on a microtask.
    return Promise.resolve().then(() => {
      vi.advanceTimersByTime(100);
      expect(harness.events.map((event) => event.trigger)).toEqual(["dom"]);
      watcher.stop();
    });
  });

  it("stops listening after stop()", () => {
    const harness = createHarness(JOB_A);
    const watcher = createJobContextWatcher({
      onChange: (event) => harness.events.push(event),
      windowRef: harness.win,
    });
    watcher.start();
    watcher.stop();
    harness.events.length = 0;
    harness.win.history.pushState({}, "", JOB_B);
    expect(harness.events).toEqual([]);
  });
});
