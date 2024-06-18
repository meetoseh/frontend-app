import { RequestHandler } from '../../../../../shared/requests/RequestHandler';
import { createGetDataFromRefUsingSignal } from '../../../../../shared/images/createGetDataFromRefUsingSignal';
import { getExpoPushTokenAsync } from 'expo-notifications';
import { OsehNotificationsPermission } from './createNotificationPermissionsStatusHandler';
import Constants from 'expo-constants';

export type OsehExpoToken = {
  /** The expo token that can be sent to our backend server */
  token: string;
};

/**
 * Creates a request handler for expo to generate a unique token that allows
 * sending push tokens to this device. Requires that we have permission to
 * send notifications.
 */
export const createExpoTokenRequestHandler = ({
  logging = 'none',
  maxStale = 100,
  maxRetries = 3,
}: {
  logging?: 'buffer' | 'direct' | 'none';
  maxStale?: number;
  maxRetries?: number;
}): RequestHandler<
  { granted: true },
  OsehNotificationsPermission & { granted: true },
  OsehExpoToken
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

const getRefUid = (ref: { granted: true }): string => 'expoTokenRequest';
const getDataFromRef = createGetDataFromRefUsingSignal({
  inner: async (
    ref: OsehNotificationsPermission & { granted: true },
    signal
  ): Promise<OsehExpoToken> => {
    const newExpoToken = await getExpoPushTokenAsync({
      projectId: Constants.expoConfig!.extra!.eas!.projectId,
    });
    return {
      token: newExpoToken.data,
    };
  },
});
const compareRefs = (a: { granted: true }, b: { granted: true }): number => 0;
