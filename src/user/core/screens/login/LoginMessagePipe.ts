import { Callbacks } from "../../../../shared/lib/Callbacks";
import { CancelablePromise } from "../../../../shared/lib/CancelablePromise";
import * as Crypto from "expo-crypto";

/**
 * The user decided not to login on the page
 */
export type LoginCancelMessage = { type: "cancel" };
/**
 * Dismissed the popup to login, returning back to the app
 */
export type LoginDismissMessage = { type: "dismiss" };
/**
 * Received an unexpected type of message
 */
export type LoginUnknownMessage = { type: "unknown"; rawType: string };
/**
 * Oseh's authorization server rejected the token provided by the underlying
 * provider.
 */
export type LoginFailureMessage = { type: "error"; message: string };
/**
 * The user logged in successfully and we received tokens
 */
export type LoginSuccessMessage = {
  type: "success";
  /**
   * A short-lived token which is used as the bearer token for requests
   */
  idToken: string;
  /**
   * If available, a long-lived but single-use token that can be used to
   * retrieve a new idToken and potentially a new refreshToken.
   */
  refreshToken?: string;
  /**
   * True if the users account was just created, false if they were already
   * registered. Used as a catch-all to reduce how much state needs to be
   * stored in each feature, can be used to slightly update the features in
   * the specific case where we expect that every notification is going to
   * be shown, by e.g. simplifying parts.
   */
  onboard: boolean;
};

/**
 * A message that can be received from the pipe
 */
export type LoginMessage =
  | LoginCancelMessage
  | LoginDismissMessage
  | LoginUnknownMessage
  | LoginFailureMessage
  | LoginSuccessMessage;

/**
 * Describes an output pipe that can be used to send message.
 */
export type WritableLoginMessagePipe = {
  /**
   * Sends a message across the pipe. If not connected this will return
   * a rejected promise. This requires "spinning" for the lock, so it
   * should be guarded with a timeout.
   */
  send: (message: LoginMessage) => CancelablePromise<void>;
  /**
   * Closes the pipe, preventing any further messages from being sent.
   * Note that the pipe will only be cleaned up if there are no connected
   * readers, otherwise, it will simply indicate there is no longer a
   * writer.
   */
  close: () => Promise<void>;
};

type StoredPipeReader = {
  id: string;
  lastRead: number | null;
};

type StoredPipe = {
  writerId: string | null;
  readers: StoredPipeReader[];
  message: {
    value: LoginMessage;
    ctr: number;
  } | null;
};

let __currentPipe: StoredPipe | null = null;

const readPipe = (): StoredPipe | null => {
  return __currentPipe;
};

const compareAndSwapPipe = (
  expected: StoredPipe | null,
  value: StoredPipe | null
): boolean => {
  // because javascript is single threaded, this is atomic
  if (Object.is(expected, __currentPipe)) {
    __currentPipe = value;
    return true;
  }
  return false;
};

/**
 * Waits until the stored pipe fulfills the given predicate, then returns it.
 * This may yield even if the pipe already fulfills the predicate. This may
 * take forever if the predicate is never satisfied, and thus should be used
 * with a timeout.
 * @param predicate The predicate to wait for
 * @returns A cancelable promise that resolves to a pipe fulfilling the predicate
 *   which was, at least recently, the stored pipe.
 */
const waitForPipeCondition = (
  predicate: (value: StoredPipe | null) => boolean
): CancelablePromise<StoredPipe | null> => {
  let active = true;
  let realCanceler = () => {
    active = false;
  };

  const promise = new Promise<StoredPipe | null>((resolve, reject) => {
    if (!active) {
      reject(new Error("canceled"));
      return;
    }

    let timeout: NodeJS.Timeout | null = null;
    realCanceler = () => {
      if (!active) {
        return;
      }

      active = false;

      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }

      reject(new Error("canceled"));
      return;
    };

    const checkPredicate = (): boolean => {
      if (!active) {
        return false;
      }

      const item = readPipe();

      if (!predicate(item)) {
        return false;
      }

      active = false;
      resolve(item);
      return true;
    };

    const onTimeout = () => {
      timeout = null;
      if (!active) {
        return;
      }

      if (checkPredicate()) {
        return;
      }

      if (!active) {
        return;
      }

      timeout = setTimeout(onTimeout, 16);
    };

    onTimeout();
  });

  return {
    done: () => !active,
    cancel: () => realCanceler(),
    promise,
  };
};

/**
 * Creates a writable pipe that can be used to send login messages. This is a
 * singleton, in the sense that if there is already a pipe that has been created
 * this will destroy it when creating a new one, under the assumption that its
 * writer and readers have already died but cleanup failed.
 */
export const createWritePipe = async (): Promise<WritableLoginMessagePipe> => {
  const item = readPipe();
  if (item !== null) {
    console.log(
      `LoginMessagePipe createWritePipe found existing pipe: ${JSON.stringify(
        item
      )}, destroying it`
    );
    if (compareAndSwapPipe(item, null)) {
      console.log("  destroyed successfully");
    } else {
      throw new Error("failed to destroy existing pipe");
    }
  }

  const writerId = Crypto.randomUUID();

  if (
    !compareAndSwapPipe(null, {
      writerId,
      readers: [],
      message: null,
    })
  ) {
    throw new Error("failed to create pipe");
  }

  return {
    send: (message: LoginMessage): CancelablePromise<void> => {
      let active = true;
      let realCanceler = () => {
        active = false;
      };

      const promise = (async () => {
        if (!active) {
          throw new Error("canceled");
        }

        const cancelers = new Callbacks<undefined>();
        realCanceler = () => {
          active = false;
          cancelers.call(undefined);
        };

        while (true) {
          if (!active) {
            throw new Error("canceled");
          }

          const readersReadyPipeCancelablePromise = waitForPipeCondition(
            (pipe) => {
              if (pipe === null || pipe.writerId !== writerId) {
                throw new Error("pipe was destroyed");
              }

              if (pipe.message === null) {
                return true;
              }

              return pipe.readers.every(
                (reader) => reader.lastRead === pipe.message?.ctr
              );
            }
          );
          cancelers.add(readersReadyPipeCancelablePromise.cancel);
          const item =
            (await readersReadyPipeCancelablePromise.promise) as StoredPipe;
          cancelers.remove(readersReadyPipeCancelablePromise.cancel);

          if (
            compareAndSwapPipe(item, {
              ...item,
              message: {
                value: message,
                ctr: (item.message?.ctr ?? 0) + 1,
              },
            })
          ) {
            return;
          }
        }
      })();

      promise.finally(() => {
        active = false;
      });

      return {
        done: () => !active,
        cancel: () => realCanceler(),
        promise,
      };
    },
    close: async () => {
      while (true) {
        const item = readPipe();
        if (item?.writerId !== writerId) {
          return;
        }
        if (item.readers.length === 0) {
          if (compareAndSwapPipe(item, null)) {
            return;
          }
        } else {
          if (compareAndSwapPipe(item, { ...item, writerId: null })) {
            return;
          }
        }
      }
    },
  };
};

/**
 * Describes an input pipe that can be used to receive messages.
 */
export type ReadableLoginMessagePipe = {
  /**
   * Receives a message on the pipe. If the pipe is not connected this
   * will return a rejected promise.
   *
   * It's recommended to race the returned promise with a timeout and
   * cancel the request if it takes too long, assuming that the writer
   * died.
   */
  read: () => CancelablePromise<LoginMessage>;

  /**
   * Closes the pipe, preventing any further messages from being received.
   * Note that the pipe will only be cleaned up if there are no connected
   * writers, otherwise, it will simply indicate there is no longer a
   * reader.
   *
   * This will cancel any pending reads.
   */
  close: () => Promise<void>;
};

/**
 * If there is a pipe available, creates and returns a readable pipe. Otherwise,
 * returns null.
 */
export const createReadPipeIfAvailable =
  async (): Promise<ReadableLoginMessagePipe | null> => {
    const readerId = Crypto.randomUUID();
    let initialItem: StoredPipe | null = null;

    while (true) {
      initialItem = readPipe();
      if (initialItem === null) {
        return null;
      }

      const newItem = {
        ...initialItem,
        readers: [...initialItem.readers, { id: readerId, lastRead: null }],
      };
      if (compareAndSwapPipe(initialItem, newItem)) {
        break;
      }
    }

    const writerId = initialItem.writerId;

    return {
      read: (): CancelablePromise<LoginMessage> => {
        let active = true;
        let realCanceler = () => {
          active = false;
        };

        const promise = (async (): Promise<LoginMessage> => {
          if (!active) {
            throw new Error("canceled");
          }

          const cancelers = new Callbacks<undefined>();
          realCanceler = () => {
            active = false;
            cancelers.call(undefined);
          };

          while (true) {
            if (!active) {
              throw new Error("canceled");
            }

            const pipeHasMessageCancelablePromise = waitForPipeCondition(
              (pipe) => {
                if (pipe === null || pipe.writerId !== writerId) {
                  throw new Error("pipe was destroyed");
                }

                const myReaderIdx = pipe.readers.findIndex(
                  (r) => r.id === readerId
                );
                if (myReaderIdx < 0) {
                  throw new Error("reader was removed from pipe");
                }

                if (pipe.message === null) {
                  return false;
                }

                return pipe.readers[myReaderIdx].lastRead !== pipe.message.ctr;
              }
            );
            cancelers.add(pipeHasMessageCancelablePromise.cancel);
            const item =
              (await pipeHasMessageCancelablePromise.promise) as StoredPipe;
            cancelers.remove(pipeHasMessageCancelablePromise.cancel);

            if (
              compareAndSwapPipe(item, {
                ...item,
                readers: item.readers.map((r) => {
                  if (r.id !== readerId) {
                    return r;
                  }
                  return {
                    ...r,
                    lastRead: item.message!.ctr,
                  };
                }),
              })
            ) {
              return item.message!.value;
            }
          }
        })();

        promise.finally(() => {
          active = false;
        });

        return {
          done: () => !active,
          cancel: () => realCanceler(),
          promise,
        };
      },
      close: async () => {
        while (true) {
          const item = readPipe();
          if (
            item === null ||
            item.writerId !== writerId ||
            !item.readers.some((r) => r.id === readerId)
          ) {
            return;
          }

          const newItem = {
            ...item,
            readers: item.readers.filter((r) => r.id !== readerId),
          };
          if (compareAndSwapPipe(item, newItem)) {
            return;
          }
        }
      },
    };
  };
