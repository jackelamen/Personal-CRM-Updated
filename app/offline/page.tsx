export const metadata = { title: "Offline — Rolodex" };

export default function OfflinePage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
      <p className="font-semibold">You are offline</p>
      <p className="max-w-xs text-callout text-fg-muted">
        This screen has not been opened before, so there is no cached copy. Your
        contacts are stored on this device and are safe.
      </p>
    </div>
  );
}
