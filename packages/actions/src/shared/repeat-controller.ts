import type { ILogger } from "@iracedeck/logger";

/**
 * Options for a single long-press hold registered with {@link RepeatController}.
 */
export interface RepeatOptions {
  /** Delay before the repeat loop starts. Quick taps shorter than this never repeat. */
  holdMs: number;
  /** Delay between repeat ticks once the loop is running. */
  intervalMs: number;
  /** Hard cap for the entire hold — catches dropped keyUp events. */
  safetyMs: number;
  /**
   * Per-tick work. Return `false` to stop the loop (e.g. settings went stale).
   * May be async; the loop awaits it before scheduling the next tick, so there
   * is at most one in-flight execution per button.
   */
  execute: () => Promise<boolean> | boolean;
}

export interface RepeatEntry {
  hold?: ReturnType<typeof setTimeout>;
  next?: ReturnType<typeof setTimeout>;
  safety: ReturnType<typeof setTimeout>;
  options: RepeatOptions;
}

/**
 * Shared long-press repeat state machine.
 *
 * Owns `heldButtons` and per-button `hold`/`next`/`safety` timers, and runs a
 * self-awaiting repeat loop that fires `options.execute` at most once at a
 * time. Releasing the button (onKeyUp/clear/clearAll) stops the loop promptly
 * even when an execute is in flight, and a safety timeout guarantees the loop
 * cannot outlive `options.safetyMs` if the keyUp is ever lost.
 */
export class RepeatController {
  /** @internal Exposed for action classes and test compat. */
  readonly heldButtons = new Set<string>();
  /** @internal Exposed for action classes and test compat. */
  readonly timers = new Map<string, RepeatEntry>();

  constructor(private readonly logger: ILogger) {}

  /**
   * Register a button as held and arm the hold/safety timers.
   *
   * Call this synchronously from the action's `onKeyDown` — before any await —
   * so a racing `onKeyUp` during an async first execute is guaranteed to find
   * the timers and clear them.
   */
  onKeyDown(buttonId: string, options: RepeatOptions): void {
    // Reset any previous state for this button before installing new timers.
    this.clearTimers(buttonId);
    this.heldButtons.add(buttonId);

    // Safety timeout covers the entire hold — dropped keyUp can't leak past this.
    const safety = setTimeout(() => {
      this.logger.warn(`Repeat auto-stopped after ${options.safetyMs}ms (safety timeout — possible missed keyUp)`);
      this.heldButtons.delete(buttonId);
      this.clearTimers(buttonId);
    }, options.safetyMs);

    // Quick taps must never enter the repeat loop: wait holdMs before the first
    // repeat. If keyUp arrives first, clearTimers clears the hold and nothing ever
    // starts.
    const hold = setTimeout(() => {
      const entry = this.timers.get(buttonId);

      if (!entry) return;

      // Double-check: the button may have been released while the hold timer was pending.
      if (!this.heldButtons.has(buttonId)) {
        this.clearTimers(buttonId);

        return;
      }

      entry.hold = undefined;
      this.scheduleRepeatTick(buttonId);
    }, options.holdMs);

    this.timers.set(buttonId, { hold, safety, options });
  }

  /** Mark the button released and clear all of its timers. */
  onKeyUp(buttonId: string): void {
    // Delete from heldButtons BEFORE clearing timers so any in-flight timer
    // callback that re-checks `heldButtons` sees the released state.
    this.heldButtons.delete(buttonId);
    this.clearTimers(buttonId);
  }

  /**
   * Clear a button's state without distinguishing it from a normal release.
   * Used for `onWillDisappear` and `onDidReceiveSettings`.
   */
  clear(buttonId: string): void {
    this.heldButtons.delete(buttonId);
    this.clearTimers(buttonId);
  }

  /** Clear every known button. Used during teardown. */
  clearAll(): void {
    this.heldButtons.clear();

    for (const buttonId of [...this.timers.keys()]) {
      this.clearTimers(buttonId);
    }
  }

  /** Whether the given button is currently held. */
  isHeld(buttonId: string): boolean {
    return this.heldButtons.has(buttonId);
  }

  /**
   * Self-awaiting repeat loop. Each tick fires one execute, awaits it, then
   * schedules the next tick `intervalMs` later. Because we never have more
   * than one in-flight execution per button, releasing mid-hold stops the
   * repeat immediately — there is no queued backlog to drain.
   *
   * The held check runs four times per tick: before scheduling, inside the
   * scheduled callback, after execute resolves, and again before the next
   * schedule. Any of them can abort the loop without leaving orphan timers.
   */
  private scheduleRepeatTick(buttonId: string): void {
    if (!this.heldButtons.has(buttonId)) {
      this.clearTimers(buttonId);

      return;
    }

    const entry = this.timers.get(buttonId);

    if (!entry) return;

    entry.next = setTimeout(async () => {
      if (!this.heldButtons.has(buttonId)) {
        this.clearTimers(buttonId);

        return;
      }

      let keepGoing = true;

      try {
        keepGoing = (await entry.options.execute()) !== false;
      } catch (err) {
        this.logger.error(`Repeat execution failed: ${String(err)}`);
      }

      if (!keepGoing) {
        this.heldButtons.delete(buttonId);
        this.clearTimers(buttonId);

        return;
      }

      // The button may have been released while execute was in flight.
      if (!this.heldButtons.has(buttonId)) {
        this.clearTimers(buttonId);

        return;
      }

      this.scheduleRepeatTick(buttonId);
    }, entry.options.intervalMs);
  }

  private clearTimers(buttonId: string): void {
    const entry = this.timers.get(buttonId);

    if (entry) {
      if (entry.hold) clearTimeout(entry.hold);

      if (entry.next) clearTimeout(entry.next);

      clearTimeout(entry.safety);
      this.timers.delete(buttonId);
    }
  }
}
