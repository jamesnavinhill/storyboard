// Small helper to prefetch dynamic chunks on hover/idle without duplicating work
type Loader = () => Promise<unknown>;

const seen = new WeakSet<Loader>();

export function prefetch(loader: Loader) {
  if (seen.has(loader)) return;
  seen.add(loader);
  try {
    void loader();
  } catch {
    // ignore
  }
}

export function idlePrefetch(loader: Loader) {
  if (typeof (window as any).requestIdleCallback === "function") {
    (window as any).requestIdleCallback(() => prefetch(loader));
  } else {
    setTimeout(() => prefetch(loader), 0);
  }
}
