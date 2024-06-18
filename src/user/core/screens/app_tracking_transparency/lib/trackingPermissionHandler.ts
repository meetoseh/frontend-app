import { RequestHandler } from '../../../../../shared/requests/RequestHandler';
import { createGetDataFromRefUsingSignal } from '../../../../../shared/images/createGetDataFromRefUsingSignal';
import { getTrackingPermissionsAsync } from 'expo-tracking-transparency';

const trackingPermissionsRequest = Symbol('osehTrackingPermissionsRequest');
/** Branded type for tracking permissions, since we dont want to use a plain object for typing */
export type OsehTrackingPermissionsRequest = {
  __brand: typeof trackingPermissionsRequest;
};
export const createOsehTrackingPermissionsRequest = () =>
  ({} as OsehTrackingPermissionsRequest);

/** Retyped version of expo-tracking-transparency TrackingPermissions, which includes non-primitives */
export type OsehTrackingPermission = {
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
 * Creates a request handler for the state of tracking permissions on the
 * local device
 */
export const createTrackingPermissionRequestHandler = ({
  logging = 'none',
  maxStale = 100,
  maxRetries = 3,
}: {
  logging?: 'buffer' | 'direct' | 'none';
  maxStale?: number;
  maxRetries?: number;
}): RequestHandler<
  OsehTrackingPermissionsRequest,
  OsehTrackingPermissionsRequest,
  OsehTrackingPermission
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

const getRefUid = (ref: OsehTrackingPermissionsRequest): string =>
  'trackingPermissionsRequest';
const getDataFromRef = createGetDataFromRefUsingSignal({
  inner: async (
    ref: OsehTrackingPermissionsRequest,
    signal
  ): Promise<OsehTrackingPermission> => {
    const newPermissionsStatus = await getTrackingPermissionsAsync();
    return {
      granted: newPermissionsStatus.granted,
      canAskAgain: newPermissionsStatus.canAskAgain,
      expires: newPermissionsStatus.expires,
    };
  },
});
const compareRefs = (
  a: OsehTrackingPermissionsRequest,
  b: OsehTrackingPermissionsRequest
): number => 0;
