/**
 * What one page view owns. app.ts makes one per view and disposes it before Swup swaps #swup, so a script
 * registers each listener, frame and teardown as it goes and a throw halfway through leaks nothing.
 */
export type PageScope = {
  /** For addEventListener(..., { signal }) and fetch(..., { signal }); aborts on dispose. */
  signal: AbortSignal;
  /** Runs on dispose (last added first); added after dispose, it runs at once. */
  add(cleanup: () => void): void;
  /** requestAnimationFrame that is cancelled on dispose. */
  frame(cb: FrameRequestCallback): number;
  dispose(): void;
};

export function createScope(): PageScope {
  const controller = new AbortController();
  const cleanups: (() => void)[] = [];
  const frames = new Set<number>();
  const run = (fn: () => void) => {
    try {
      fn();
    } catch (error) {
      console.error(error); // one failing cleanup must not stop the others
    }
  };

  return {
    signal: controller.signal,
    add(cleanup) {
      if (controller.signal.aborted) run(cleanup);
      else cleanups.push(cleanup);
    },
    frame(cb) {
      if (controller.signal.aborted) return 0;
      const id = requestAnimationFrame((t) => {
        frames.delete(id);
        cb(t);
      });
      frames.add(id);
      return id;
    },
    dispose() {
      if (controller.signal.aborted) return;
      controller.abort();
      frames.forEach((id) => cancelAnimationFrame(id));
      frames.clear();
      cleanups.splice(0).reverse().forEach(run);
    },
  };
}
