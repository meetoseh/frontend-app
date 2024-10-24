import { createWritableValueWithCallbacks } from '../../../shared/lib/Callbacks';
import { setVWC } from '../../../shared/lib/setVWC';
import { waitForValueWithCallbacksConditionCancelable } from '../../../shared/lib/waitForValueWithCallbacksCondition';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A simple async storage interface to a specific key that can only be
 * accessed while a lock is held preventing the value from being mutated
 */
export type SimpleAsyncStorage = {
  /**
   * Acquires the lock and calls the handler with the current value,
   * waits for the result. If it is a string, the storage is updated
   * with the new value. If it is null, the storage is cleared. If
   * it is undefined, the storage is left unchanged (generally used
   * for handling aborts).
   *
   * On the web, if WebLocks are supported, then this will guard against
   * other tabs accessing the key as well. Otehrwise, this is an instance
   * specific lock.
   *
   * The promise resolves or rejects when the request completely finishes or is
   * completely aborted.
   */
  withStore: (
    this: void,
    handler: (
      stored: string | null,
      opts: { signal: AbortSignal }
    ) => Promise<string | null | undefined>,
    opts: { signal: AbortSignal }
  ) => Promise<void>;
};

/**
 * Creates a simple async storage adapter that stores the value in
 * AsyncStorage at the given key.
 */
export const createUnencryptedStorageAdapter = (
  key: string,
  _lockId: string
): SimpleAsyncStorage => {
  const instanceLock = createWritableValueWithCallbacks<boolean>(false);

  return {
    withStore: async (handler, opts) => {
      const canceled = createWritableValueWithCallbacks(false);
      const doAbort = () => setVWC(canceled, true);
      opts.signal.addEventListener('abort', doAbort);
      if (opts.signal.aborted) {
        doAbort();
      }

      try {
        const canceledCancelable = waitForValueWithCallbacksConditionCancelable(
          canceled,
          (c) => c
        );
        canceledCancelable.promise.catch(() => {});
        while (true) {
          const instanceUnlocked = waitForValueWithCallbacksConditionCancelable(
            instanceLock,
            (l) => !l
          );
          instanceUnlocked.promise.catch(() => {});

          await Promise.race([
            canceledCancelable.promise,
            instanceUnlocked.promise,
          ]);
          instanceUnlocked.cancel();

          if (canceled.get()) {
            return;
          }

          if (instanceLock.get()) {
            continue;
          }

          instanceLock.set(true);
          instanceLock.callbacks.call(undefined);
          break;
        }

        try {
          // cancellation is now the responsibility of the handler
          canceledCancelable.cancel();
          const stored = await AsyncStorage.getItem(key);
          const result = await handler(stored, opts);
          if (result !== undefined) {
            if (result === null) {
              await AsyncStorage.removeItem(key);
            } else {
              await AsyncStorage.setItem(key, result);
            }
          }
        } finally {
          instanceLock.set(false);
          instanceLock.callbacks.call(undefined);
        }
      } finally {
        opts.signal.removeEventListener('abort', doAbort);
        doAbort();
      }
    },
  };
};
