"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "rolodex/install-dismissed";

/**
 * Registers the service worker and, when the browser offers it, surfaces a
 * single unobtrusive install prompt. iOS never fires beforeinstallprompt, so
 * Safari users get the Share-sheet instruction instead.
 */
export default function PWA() {
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration fails on unsupported browsers and in some private
        // modes. The app works fine without it; there is nothing to recover.
      });
    }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      dismissed = false;
    }
    if (isIos && !standalone && !dismissed) setIosHint(true);

    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Nothing to do; the banner simply returns next visit.
    }
    setDeferred(null);
    setIosHint(false);
  };

  return (
    <>
      {offline ? (
        <p
          role="status"
          className="fixed inset-x-0 top-0 z-50 bg-card-2 py-1 text-center text-micro font-medium text-fg-muted"
        >
          Offline — your contacts are on this device, so everything still works.
        </p>
      ) : null}

      {deferred || iosHint ? (
        <div className="fixed inset-x-3 bottom-[4.75rem] z-40 lg:bottom-3 lg:left-auto lg:right-3 lg:w-80">
          <div className="card card-2 flex items-center gap-3 p-3 shadow-xl">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-ink">
              <Plus size={18} strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-callout font-semibold leading-tight">Install Rolodex</p>
              <p className="text-caption leading-tight text-fg-muted">
                {deferred
                  ? "Add it to your home screen for full screen and offline."
                  : "Tap Share, then Add to Home Screen."}
              </p>
            </div>
            {deferred ? (
              <button
                onClick={async () => {
                  await deferred.prompt();
                  await deferred.userChoice;
                  setDeferred(null);
                }}
                className="btn btn-primary"
              >
                Install
              </button>
            ) : null}
            <button onClick={dismiss} aria-label="Dismiss install prompt" className="btn btn-ghost px-2">
              ✕
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
