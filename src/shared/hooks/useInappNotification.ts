import { useContext, useEffect, useRef } from "react";
import { LoginContext } from "../contexts/LoginContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from "../lib/Callbacks";
import {
  VariableStrategyProps,
  useVariableStrategyPropsAsValueWithCallbacks,
} from "../anim/VariableStrategyProps";
import { useUnwrappedValueWithCallbacks } from "./useUnwrappedValueWithCallbacks";
import { apiFetch } from "../lib/apiFetch";

const MAX_EXPIRATION_TIME_SECONDS = 60 * 60 * 24 * 7;

export type InappNotification = {
  /**
   * The inapp notification uid of the in-app notification
   * this information is for
   */
  uid: string;

  /**
   * True if the notification should be shown now, false
   * if it shouldn't be shown now
   */
  showNow: boolean;

  /**
   * Regardless of if we're showing it now or not, what would be the earliest
   * time that it might be shown next? This is not authoritative; it's meant to
   * reduce the number of requests to the backend that will definitely not
   * result in showing the notification.
   */
  nextShowAt: number | null;

  /**
   * Can be called to set showNow to false. Note that it's also necessary
   * to use an inapp notification session (useInappNotificationSession) to
   * tell the backend we saw the prompt, which also has a reset() function
   * that should be shown when the inapp notification is dismissed.
   *
   * Returns the inapp notification after setting showNow to false.
   *
   * @param tentative If true, showNow is not actually modified, but the returned
   *   inapp notification will have showNow set to false. This is useful for
   *   situations where we want to call doAnticipateState with a real promise,
   *   rather than just a resolved one
   */
  onShown: (this: void, tentative?: boolean) => InappNotification;
};

/**
 * Fetches the in-app notification with the given uid. Returns null while
 * loading the notification, and will hallucinate a showNow value of false if an
 * error occurs or we know the backend would return false if we query it.
 * Otherwise, this will ask the if the given notification should be presented
 * to the user or not.
 *
 * Note that this exclusively uses the idea that users should not be constantly
 * shown the same notification after dismissing it. It doesn't consider any
 * context surrounding the notification--for example, we shouldn't prompt a user
 * for a phone number if we already have their phone number.
 *
 * This requires react rerenders; when this is not desirable (most of the time),
 * prefer useInappNotificationValueWithCallbacks.
 *
 * @param uid The uid of the in-app notification to fetch
 * @param suppress If true, this will always return null, and won't query the
 *   backend. This always following the rules of hooks when an in-app notification
 *   is needed conditionally. Note that changing this from true to false to true
 *   may trigger two network requests.
 * @returns The in-app notification if we've either retrieved it from the backend
 *   or hallucinated that it should not be shown, null if either suppressed or we
 *   are still loading data
 */
export const useInappNotification = (
  uid: string,
  suppress: boolean
): InappNotification | null => {
  const vwc = useInappNotificationValueWithCallbacks({
    type: "react-rerender",
    props: {
      uid,
      suppress,
    },
  });

  return useUnwrappedValueWithCallbacks(vwc);
};

/**
 * Fetches the in-app notification with the given uid. Returns null while
 * loading the notification, and will hallucinate a showNow value of false if an
 * error occurs or we know the backend would return false if we query it.
 * Otherwise, this will ask the if the given notification should be presented
 * to the user or not.
 *
 * Note that this exclusively uses the idea that users should not be constantly
 * shown the same notification after dismissing it. It doesn't consider any
 * context surrounding the notification--for example, we shouldn't prompt a user
 * for a phone number if we already have their phone number.
 *
 * This never triggers react rerenders.
 *
 * @param propsVariableStrategy.uid The uid of the in-app notification to fetch
 * @param propsVariableStrategy.suppress If true, this will always return null, and won't query the
 *   backend.
 * @returns The in-app notification if we've either retrieved it from the backend
 *   or hallucinated that it should not be shown, null if either suppressed or we
 *   are still loading data
 */
export const useInappNotificationValueWithCallbacks = (
  propsVariableStrategy: VariableStrategyProps<{
    uid: string;
    suppress: boolean;
  }>
): ValueWithCallbacks<InappNotification | null> => {
  const loginContext = useContext(LoginContext);
  const notificationVWC =
    useWritableValueWithCallbacks<InappNotification | null>(() => null);
  const propsVWC = useVariableStrategyPropsAsValueWithCallbacks(
    propsVariableStrategy
  );

  const cleanedUp = useRef<boolean>(false);
  useEffect(() => {
    if (cleanedUp.current || loginContext.state === "loading") {
      return;
    }
    cleanedUp.current = true;

    withStorageLock(async () => {
      await pruneExpiredStateUnsafe(loginContext?.userAttributes?.sub ?? null);
    });
  }, [loginContext]);

  useEffect(() => {
    let unmountCurrent: (() => void) | null = null;
    propsVWC.callbacks.add(handlePropsChanged);
    handlePropsChanged();
    return () => {
      if (unmountCurrent !== null) {
        unmountCurrent();
        unmountCurrent = null;
      }
      propsVWC.callbacks.remove(handlePropsChanged);
    };

    function handlePropsChanged() {
      if (unmountCurrent !== null) {
        unmountCurrent();
        unmountCurrent = null;
      }

      unmountCurrent =
        handleProps(propsVWC.get().uid, propsVWC.get().suppress) ?? null;
    }

    function handleProps(
      uid: string,
      suppress: boolean
    ): (() => void) | undefined {
      if (suppress) {
        setNotification(null);
        return;
      }

      if (loginContext.state === "logged-out") {
        withStorageLock(async () => {
          await removeAllStateUnsafe();
        });
        return;
      }

      if (
        loginContext.state !== "logged-in" ||
        loginContext.userAttributes === null
      ) {
        setNotification(null);
        return;
      }
      const userSub = loginContext.userAttributes.sub;

      let active = true;
      fetchFromStoreFallbackToNetwork();
      return () => {
        active = false;
      };

      async function fetchFromNetworkUnsafeInner() {
        const response = await apiFetch(
          "/api/1/notifications/inapp/should_show",
          {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({
              inapp_notification_uid: uid,
            }),
          },
          loginContext
        );

        if (!response.ok) {
          throw response;
        }

        const data: { show_now: boolean; next_show_at: number | null } =
          await response.json();

        const now = Date.now() / 1000;
        const dataToStore: StoredInappNotification = {
          uid,
          userSub,
          checkedAt: now,
          expireAt: Math.min(
            now + MAX_EXPIRATION_TIME_SECONDS,
            data.next_show_at ?? now + MAX_EXPIRATION_TIME_SECONDS
          ),
          nextShowAt: data.next_show_at,
        };

        if (!data.show_now) {
          await storeUidUnsafe(uid, dataToStore);
        }

        const interpretedData: InappNotification = {
          uid,
          showNow: data.show_now,
          nextShowAt: data.next_show_at,
          onShown: (tentative) => {
            if (tentative === true) {
              return {
                ...interpretedData,
                showNow: false,
              };
            }

            setNotification((oldNotif) => {
              if (oldNotif === null) {
                return null;
              }

              if (!oldNotif.showNow) {
                return oldNotif;
              }

              withStorageLock(() => storeUidUnsafe(uid, dataToStore));

              const res = {
                ...oldNotif,
                showNow: false,
                onShown: () => res,
              };
              return res;
            });
            const newNotif = {
              uid,
              showNow: false,
              nextShowAt: data.next_show_at,
              onShown: () => newNotif,
            };
            return newNotif;
          },
        };
        setNotification(interpretedData);
      }

      async function fetchFromNetworkUnsafe() {
        try {
          await fetchFromNetworkUnsafeInner();
        } catch (e) {
          if (active) {
            console.error(
              "Error while fetching in-app notification from network: ",
              e
            );
            const res = {
              uid,
              showNow: false,
              nextShowAt: null,
              onShown: () => res,
            };
            setNotification(res);
          }
        }
      }

      async function fetchFromStoreInnerUnsafe(): Promise<boolean> {
        const stored = await fetchStoredUidUnsafe(uid);
        if (!active) {
          return false;
        }
        if (stored !== null) {
          const now = Date.now() / 1000;
          if (stored.nextShowAt === null || stored.nextShowAt > now) {
            const newNotif = {
              uid,
              showNow: false,
              nextShowAt: stored.nextShowAt,
              onShown: () => newNotif,
            };
            setNotification(newNotif);
            return true;
          }
        }
        return false;
      }

      async function fetchFromStoreUnsafe(): Promise<boolean> {
        try {
          return await fetchFromStoreInnerUnsafe();
        } catch (e) {
          if (active) {
            console.error(
              "Error while fetching in-app notification from store: ",
              e
            );
          }
          return false;
        }
      }

      async function fetchFromStoreFallbackToNetwork() {
        await withStorageLock(async () => {
          if (!active) {
            return;
          }

          if (await fetchFromStoreUnsafe()) {
            return;
          }

          if (!active) {
            return;
          }

          await fetchFromNetworkUnsafe();
        });
      }
    }

    function setNotification(
      notification:
        | InappNotification
        | null
        | ((oldNotif: InappNotification | null) => InappNotification | null)
    ) {
      if (typeof notification === "function") {
        notification = notification(notificationVWC.get());
      }

      if (notificationVWC.get() === notification) {
        return;
      }

      notificationVWC.set(notification);
      notificationVWC.callbacks.call(undefined);
    }
  }, [propsVWC, notificationVWC, loginContext]);

  return notificationVWC;
};

type StoredInappNotification = {
  /**
   * The uid of the inapp notification this contains information on
   */
  uid: string;
  /**
   * The sub of the user that saw the notification; disregard for different
   * users
   */
  userSub: string;
  /**
   * When we checked on this notification, in seconds since the epoch
   */
  checkedAt: number;
  /**
   * The latest that this key should be deleted, in seconds since the epoch
   */
  expireAt: number;
  /**
   * The earliest time that this notification might be shown again, in seconds
   * since the epoch, or null if it'll never be shown again
   */
  nextShowAt: number | null;
};

let __lock = false;
const __lockQueue: (() => Promise<void>)[] = [];

/**
 * Acquires an in-memory process-wide lock, and runs the given function. If
 * another call to withStorageLock is already running, this will wait for that
 * call to finish before running the given function.
 *
 * @param fn The function to call while nothing else is handling the
 *   in-app notification storage keys.
 * @returns The return value of the given function
 */
const withStorageLock = async <T>(fn: () => Promise<T>): Promise<T> => {
  const result = new Promise<T>((resolve, reject) => {
    __lockQueue.push(async () => {
      try {
        resolve(await fn());
      } catch (e) {
        reject(e);
      }
    });
  });

  (async () => {
    if (__lock) {
      return;
    }

    __lock = true;
    while (__lockQueue.length > 0) {
      const next = __lockQueue.shift()!;
      try {
        await next();
      } catch (e) {
        console.error("Error while running withStorageLock callback: ", e);
      }
    }
    __lock = false;
  })();

  return result;
};

/**
 * Fetches the uids of all inapp notifications that have been stored,
 * without acquiring the storage lock.
 */
const fetchStoredUidsUnsafe = async (): Promise<string[]> => {
  const raw = await AsyncStorage.getItem("inapp-notifications");
  if (raw === null) {
    return [];
  }

  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
};

/**
 * Sets the uids of all inapp notifications that have been stored,
 * without acquiring the storage lock.
 */
const storeUidsUnsafe = async (uids: string[]): Promise<void> => {
  await AsyncStorage.setItem("inapp-notifications", JSON.stringify(uids));
};

/**
 * Fetches the stored inapp notification with the given uid, without
 * acquiring the storage lock. Returns null if no such notification exists.
 */
const fetchStoredUidUnsafe = async (
  uid: string
): Promise<StoredInappNotification | null> => {
  const raw = await AsyncStorage.getItem(`inapp-notification-${uid}`);
  if (raw === null) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

/**
 * Stores the given inapp notification with the given uid, without
 * acquiring the storage lock.
 */
const storeUidUnsafe = async (
  uid: string,
  data: StoredInappNotification
): Promise<void> => {
  const uids = await fetchStoredUidsUnsafe();
  if (!uids.includes(uid)) {
    uids.push(uid);
  }
  await AsyncStorage.setItem(`inapp-notification-${uid}`, JSON.stringify(data));
  storeUidsUnsafe(uids);
};

/**
 * Removes any expired inapp notifications from storage, without acquiring
 * the storage lock.
 */
const pruneExpiredStateUnsafe = async (
  userSub: string | null
): Promise<void> => {
  const uids = await fetchStoredUidsUnsafe();
  const newUids: string[] = [];
  const removedUids: string[] = [];
  const now = Date.now() / 1000;

  for (const uid of uids) {
    const stored = await fetchStoredUidUnsafe(uid);
    if (stored === null) {
      removedUids.push(uid);
      continue;
    }

    if (stored.expireAt < now) {
      removedUids.push(uid);
      continue;
    }

    if (stored.checkedAt + MAX_EXPIRATION_TIME_SECONDS < now) {
      removedUids.push(uid);
      continue;
    }

    if (stored.userSub !== userSub) {
      removedUids.push(uid);
      continue;
    }

    newUids.push(uid);
  }

  for (const uid of removedUids) {
    await AsyncStorage.removeItem(`inapp-notification-${uid}`);
  }
  await storeUidsUnsafe(newUids);
};

/**
 * Removes all inapp notifications from storage, without acquiring the
 * storage lock.
 */
const removeAllStateUnsafe = async (): Promise<void> => {
  const uids = await fetchStoredUidsUnsafe();

  for (const uid of uids) {
    if (AsyncStorage.getItem(`inapp-notification-${uid}`) !== null) {
      await AsyncStorage.removeItem(`inapp-notification-${uid}`);
    }
  }

  await storeUidsUnsafe([]);
};
