"use client";

import * as React from "react";

/**
 * One system-wide refresh signal.
 *
 * The shell owns the single refresh button in the topbar; pages subscribe here
 * instead of rendering their own, so pressing it reloads the current page's
 * data as well as the dashboard counts.
 */
const EVENT = "vs:system-refresh";

export function broadcastSystemRefresh(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENT));
}

/** Run `reload` whenever the shell's refresh button is pressed. */
export function useSystemRefresh(reload: () => void): void {
  const ref = React.useRef<(() => void) | null>(null);

  React.useEffect(() => {
    ref.current = reload;
  }, [reload]);

  React.useEffect(() => {
    const handler = () => ref.current?.();
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);
}
