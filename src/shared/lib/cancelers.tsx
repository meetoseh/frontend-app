export type CancelerIdentifier = {
  /**
   * The index that the canceler was originally added at. This is used
   * as a hint for where to start the search since cancelers are only
   * ever added to the end of the list.
   */
  originalIndex: number;

  /**
   * The original callback
   */
  cb: () => void | Promise<void>;
};

/**
 * Describes a basic canceler list which balances efficient add/remove with
 * efficient iteration under an expected small number of items. It's expected
 * that typically cancelers are either never removed or they are removed shortly
 * after being added.
 */
export class Cancelers {
  /**
   * The underlying list of cancelers.
   */
  private cancelers: (() => void | Promise<void>)[];

  /**
   * Whether we are preventing mutation because we are currently iterating
   * and the callee of the iteration did not indicate that we should copy
   * the list.
   *
   * If this is positive, mutation is prevented. It is always non-negative.
   */
  private mutationPrevented: number;

  constructor() {
    this.cancelers = [];
    this.mutationPrevented = 0;
  }

  /**
   * Registers a canceler and returns the cancel identifier.
   */
  add(canceler: () => void | Promise<void>): CancelerIdentifier {
    if (this.mutationPrevented > 0) {
      throw new Error('Cannot add a canceler while unsafe iteration is in progress');
    }

    const originalIndex = this.cancelers.length;
    this.cancelers.push(canceler);
    return { originalIndex, cb: canceler };
  }

  /**
   * Removes the canceler associated with the given identifier.
   */
  remove(identifier: CancelerIdentifier): void {
    if (this.mutationPrevented > 0) {
      throw new Error('Cannot remove a canceler while unsafe iteration is in progress');
    }

    let index = Math.min(identifier.originalIndex, this.cancelers.length - 1);
    while (index >= 0) {
      if (this.cancelers[index] === identifier.cb) {
        this.cancelers.splice(index, 1);
        return;
      }
      index--;
    }
  }

  /**
   * Invokes all the callbacks in the list. By default, this will block
   * mutation of the list while the callbacks are being invoked. If the
   * keyword argument `copy` is true, then the list will be copied before
   * iteration, then cleared, and mutation will be allowed (note this can
   * only occur when mutation is allowed as the list must be cleared
   * prior to iteration).
   *
   * The result is a promise which either resolves immediately or after
   * all the callbacks have settled, depending on if any of the callbacks
   * return a promise. Rejects if any of the callbacks reject, but clobbering
   * the error message.
   */
  invokeAll({ copy = false }: { copy: boolean }): Promise<void> {
    if (copy) {
      if (this.mutationPrevented > 0) {
        throw new Error('Cannot copy the list while iteration is in progress');
      }

      const cancelers = this.cancelers.slice();
      this.cancelers = [];
      const promises: Promise<void>[] = [];
      for (const canceler of cancelers) {
        const res = canceler();
        if (res instanceof Promise) {
          promises.push(res);
        }
      }
      if (promises.length > 0) {
        return Promise.allSettled(promises).then((p) => {
          if (p.some((r) => r.status === 'rejected')) {
            throw new Error('One or more cancelers rejected');
          }
        });
      }
      return Promise.resolve();
    }

    const promises: Promise<void>[] = [];
    this.mutationPrevented++;
    try {
      for (const canceler of this.cancelers) {
        const res = canceler();
        if (res instanceof Promise) {
          promises.push(res);
        }
      }
    } catch (e) {
      this.mutationPrevented--;
      return Promise.reject(e);
    }

    if (promises.length > 0) {
      return Promise.allSettled(promises)
        .then((p) => {
          if (p.some((r) => r.status === 'rejected')) {
            throw new Error('One or more cancelers rejected');
          }
        })
        .finally(() => {
          this.mutationPrevented--;
        });
    }

    this.mutationPrevented--;
    return Promise.resolve();
  }

  /**
   * Removes all cancelers from the list.
   */
  clear() {
    if (this.mutationPrevented > 0) {
      throw new Error('Cannot clear the list while iteration is in progress');
    }

    this.cancelers = [];
  }
}
