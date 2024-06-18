import { RequestHandler } from '../../../../../shared/requests/RequestHandler';
import { createGetDataFromRefUsingSignal } from '../../../../../shared/images/createGetDataFromRefUsingSignal';
import { getPermissionsAsync } from 'expo-notifications';

const notificationPermissionsRequest = Symbol(
  'osehNotificationPermissionsRequest'
);
/** Branded type for notification permissions, since we dont want to use a plain object for typing */
export type OsehNotificationPermissionsRequest = {
  __brand: typeof notificationPermissionsRequest;
};
export const createOsehNotificationPermissionsRequest = () =>
  ({} as OsehNotificationPermissionsRequest);

/** Retyped version of expo-notifications NotificationsPermissions, which includes non-primitives */
export type OsehNotificationsPermission = {
  /** True if we can send notifications, false otherwise */
  granted: boolean;
  /**
   * Irrelevant unless granted is false, in which case is true if we can still do
   * the native prompt and false if we cannot
   */
  canAskAgain: boolean;
  /**
   * When these permissions must be checked again as they may have changed in milliseconds
   * since the unix epoch, or 'never' if there is no known fixed time they need to be
   * rechecked
   */
  expires: number | 'never';
};
/**
 * Creates a request handler for the state of notification permissions on the
 * local device
 */
export const createNotificationPermissionsRequestHandler = ({
  logging = 'none',
  maxStale = 100,
  maxRetries = 3,
}: {
  logging?: 'buffer' | 'direct' | 'none';
  maxStale?: number;
  maxRetries?: number;
}): RequestHandler<
  OsehNotificationPermissionsRequest,
  OsehNotificationPermissionsRequest,
  OsehNotificationsPermission
> => {
  return new RequestHandler({
    getRefUid,
    getDataFromRef,
    compareRefs,
    logConfig: { logging },
    cacheConfig: { maxStale, keepActiveRequestsIntoStale: true },
    retryConfig: { maxRetries },
  });
};

const getRefUid = (ref: OsehNotificationPermissionsRequest): string =>
  'notificationPermissionsRequest';
const getDataFromRef = createGetDataFromRefUsingSignal({
  inner: async (
    ref: OsehNotificationPermissionsRequest,
    signal
  ): Promise<OsehNotificationsPermission> => {
    const newPermissionsStatus = await getPermissionsAsync();
    return {
      granted: newPermissionsStatus.granted,
      canAskAgain: newPermissionsStatus.canAskAgain,
      expires: newPermissionsStatus.expires,
    };
  },
});
const compareRefs = (
  a: OsehNotificationPermissionsRequest,
  b: OsehNotificationPermissionsRequest
): number => 0;
