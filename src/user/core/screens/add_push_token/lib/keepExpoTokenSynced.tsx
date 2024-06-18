import { createValueWithCallbacksEffect } from '../../../../../shared/hooks/createValueWithCallbacksEffect';
import { mapCancelable } from '../../../../../shared/lib/mapCancelable';
import { waitForValueWithCallbacksConditionCancelable } from '../../../../../shared/lib/waitForValueWithCallbacksCondition';
import { Result } from '../../../../../shared/requests/RequestHandler';
import { createChainedRequest } from '../../../../../shared/requests/createChainedRequest';
import { ScreenContext } from '../../../hooks/useScreenContext';
import { OsehExpoTokenSyncRequest } from './createExpoTokenSyncHandler';
import {
  OsehNotificationPermissionsRequest,
  OsehNotificationsPermission,
  createOsehNotificationPermissionsRequest,
} from './createNotificationPermissionsStatusHandler';

/**
 * Keeps the users expo push token synced on the server if we have permission
 * to send notifications. Returns a cleanup function.
 *
 * This is currently used on App.tsx as a useEffect implementation.
 */
export const keepExpoTokenSynced = (ctx: ScreenContext): (() => void) => {
  const getPermissions = () =>
    ctx.resources.notificationPermissionsHandler.request({
      ref: createOsehNotificationPermissionsRequest(),
      refreshRef: () => ({
        promise: Promise.resolve({
          type: 'success',
          data: createOsehNotificationPermissionsRequest(),
          error: undefined,
          retryAt: undefined,
        }),
        done: () => true,
        cancel: () => {},
      }),
    });

  return createValueWithCallbacksEffect(ctx.login.value, (loginContextRaw) => {
    if (loginContextRaw.state !== 'logged-in') {
      return undefined;
    }
    const loginContext = loginContextRaw;

    const permissionsRequest = getPermissions();
    const cleanupPermissionsHandler = createValueWithCallbacksEffect(
      permissionsRequest.data,
      (permissionsDataRaw) => {
        if (
          permissionsDataRaw.type !== 'success' ||
          !permissionsDataRaw.data.granted
        ) {
          return undefined;
        }
        const permissionsData = permissionsDataRaw;
        const permissions =
          permissionsDataRaw.data as typeof permissionsDataRaw.data & {
            granted: true;
          };
        if (!permissions.granted) {
          return undefined;
        }

        const tokenRequest = ctx.resources.expoTokenHandler.request({
          ref: permissions,
          refreshRef: () => {
            permissionsData.reportExpired();
            return mapCancelable(
              waitForValueWithCallbacksConditionCancelable(
                permissionsRequest.data,
                (d) => !Object.is(d, permissionsData) && d.type !== 'loading'
              ),
              (
                res
              ): Result<OsehNotificationsPermission & { granted: true }> => {
                if (res.type === 'success') {
                  if (res.data.granted) {
                    return {
                      type: 'success',
                      data: res.data as typeof res.data & { granted: true },
                      error: undefined,
                      retryAt: undefined,
                    };
                  } else {
                    return {
                      type: 'error',
                      data: undefined,
                      error: <>Notification permissions have been revoked</>,
                      retryAt: undefined,
                    };
                  }
                }
                if (res.type === 'error') {
                  return {
                    type: 'error',
                    data: undefined,
                    error: res.error,
                    retryAt: undefined,
                  };
                }
                if (res.type === 'released') {
                  return {
                    type: 'error',
                    data: undefined,
                    error: <>this reference has been released</>,
                    retryAt: undefined,
                  };
                }
                return {
                  type: 'error',
                  data: undefined,
                  error: <>impossible</>,
                  retryAt: undefined,
                };
              }
            );
          },
        });

        const cleanupTokenHandler = createValueWithCallbacksEffect(
          tokenRequest.data,
          (tokenDataRaw) => {
            if (tokenDataRaw.type !== 'success') {
              return undefined;
            }

            const tokenData = tokenDataRaw;
            const token = tokenData.data;
            const syncRequest = ctx.resources.expoTokenSyncHandler.request({
              ref: {
                user: loginContext,
                token,
              },
              refreshRef: () => {
                tokenData.reportExpired();
                return mapCancelable(
                  waitForValueWithCallbacksConditionCancelable(
                    syncRequest.data,
                    (d) => !Object.is(d, tokenData) && d.type !== 'loading'
                  ),
                  (res): Result<OsehExpoTokenSyncRequest> => {
                    const newLoginContext = ctx.login.value.get();
                    const newUser =
                      newLoginContext.state === 'logged-in' &&
                      newLoginContext.userAttributes.sub ===
                        loginContext.userAttributes.sub
                        ? newLoginContext
                        : loginContext;

                    if (res.type === 'success') {
                      return {
                        type: 'success',
                        data: {
                          user: newUser,
                          token: res.data,
                        },
                        error: undefined,
                        retryAt: undefined,
                      };
                    }

                    return {
                      type: 'error',
                      data: undefined,
                      error: res.error ?? <>failed to refresh sync request</>,
                      retryAt: undefined,
                    };
                  }
                );
              },
            });

            const cleanupLogger = createValueWithCallbacksEffect(
              syncRequest.data,
              (syncDataRaw) => {
                if (syncDataRaw.type === 'success') {
                  ctx.resources.reminderChannelsHandler.evictOrReplace(
                    loginContext,
                    (old) => {
                      if (old === undefined) {
                        return { type: 'make-request', data: undefined };
                      }

                      if (old.potentialChannels.has('push')) {
                        return {
                          type: 'data',
                          data: old,
                        };
                      }

                      const newPotential = new Set(old.potentialChannels);
                      newPotential.add('push');
                      return {
                        type: 'data',
                        data: { ...old, potentialChannels: newPotential },
                      };
                    }
                  );

                  const syncData = syncDataRaw;
                  const expireTime = syncData.data.expiresAt.getTime();
                  const timeUntilExpirationMs = expireTime - Date.now();
                  const timeUntilExpirationMinutes =
                    timeUntilExpirationMs / 1000 / 60;
                  console.log(
                    `Successfully synced expo token with server (${timeUntilExpirationMinutes.toLocaleString(
                      undefined,
                      { maximumFractionDigits: 0 }
                    )} minutes until next refresh)`
                  );

                  let timeout: NodeJS.Timeout | null = setTimeout(() => {
                    console.log('Reporting expo token sync as expired');
                    timeout = null;
                    syncData.reportExpired();
                  }, Math.max(1000, timeUntilExpirationMs));

                  return () => {
                    if (timeout !== null) {
                      clearTimeout(timeout);
                      timeout = null;
                    }
                  };
                } else if (syncDataRaw.type === 'error') {
                  console.log('Failed to sync expo token with server');
                }
                return undefined;
              }
            );

            return () => {
              cleanupLogger();
              syncRequest.release();
            };
          }
        );

        return () => {
          cleanupTokenHandler();
          tokenRequest.release();
        };
      }
    );

    return () => {
      cleanupPermissionsHandler();
      permissionsRequest.release();
    };
  });
};
