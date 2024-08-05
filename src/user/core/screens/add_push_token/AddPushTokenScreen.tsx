import { Platform } from 'react-native';
import { createValueWithCallbacksEffect } from '../../../../shared/hooks/createValueWithCallbacksEffect';
import { createMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { createWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { convertUsingMapper } from '../../../../shared/lib/CrudFetcher';
import { setVWC } from '../../../../shared/lib/setVWC';
import { RequestResult } from '../../../../shared/requests/RequestHandler';
import { unwrapRequestResult } from '../../../../shared/requests/unwrapRequestResult';
import { createLoginContextRequest } from '../../lib/createLoginContextRequest';
import { OsehScreen } from '../../models/Screen';
import { screenImageWithConfigurableSizeKeyMap } from '../../models/ScreenImage';
import { ReminderSettings } from '../reminder_times/lib/createReminderSettingsHandler';
import { AddPushToken } from './AddPushToken';
import {
  AddPushTokenAPIParams,
  AddPushTokenMappedParams,
} from './AddPushTokenParams';
import { AddPushTokenResources } from './AddPushTokenResources';
import {
  OsehNotificationsPermission,
  createOsehNotificationPermissionsRequest,
} from './lib/createNotificationPermissionsStatusHandler';
import { initImage } from '../../lib/initImage';
import { convertScreenConfigurableTriggerWithOldVersion } from '../../models/ScreenConfigurableTrigger';
import { convertTriggerWithExit } from '../../lib/convertTriggerWithExit';

/**
 * If the user doesn't already have notifications enabled on the current device,
 * this will prompt them to see if they want to allow notifications. If they choose
 * yes, presents the native popup.
 *
 * Optionally, they can configure their push reminder times as part of this operation.
 *
 * This screen only exists in native.
 *
 * Presenting the native popup will result in updating the users notification permissions
 * status, which will in turn cause us to potentially fetch a new expo token and sync
 * it with the server (see lib/keepExpoTokenSynced.ts).
 */
export const AddPushTokenScreen: OsehScreen<
  'add_push_token',
  AddPushTokenResources,
  AddPushTokenAPIParams,
  AddPushTokenMappedParams
> = {
  slug: 'add_push_token',
  paramMapper: (params) => ({
    entrance: params.entrance,
    header: params.header,
    message: params.message,
    image:
      params.image === null || params.image === undefined
        ? null
        : {
            ios: convertUsingMapper(
              params.image.ios,
              screenImageWithConfigurableSizeKeyMap
            ),
            other: convertUsingMapper(
              params.image.other,
              screenImageWithConfigurableSizeKeyMap
            ),
          },
    times: params.times,
    cta: {
      text: params.cta.text,
      success: convertScreenConfigurableTriggerWithOldVersion(
        params.cta.success,
        params.cta.successv75
      ),
      failure: convertScreenConfigurableTriggerWithOldVersion(
        params.cta.failure,
        params.cta.failurev75
      ),
      exit: params.cta.exit,
    },
    back: convertTriggerWithExit(params.back),
    nav:
      params.nav.type === 'header-and-footer'
        ? {
            type: params.nav.type,
            title: params.nav.title,
            home: {
              trigger: convertScreenConfigurableTriggerWithOldVersion(
                params.nav.home.trigger,
                params.nav.home.triggerv75
              ),
            },
            series: {
              trigger: convertScreenConfigurableTriggerWithOldVersion(
                params.nav.series.trigger,
                params.nav.series.triggerv75
              ),
            },
          }
        : params.nav,
    __mapped: true,
  }),
  initInstanceResources: (ctx, screen, refreshScreen) => {
    const getPermissionsStatus = () =>
      ctx.resources.notificationPermissionsHandler.request({
        ref: createOsehNotificationPermissionsRequest(),
        refreshRef: () => ({
          promise: Promise.resolve({
            type: 'success',
            data: createOsehNotificationPermissionsRequest(),
            error: undefined,
            retryAt: undefined,
          }),
          cancel: () => {},
          done: () => true,
        }),
      });

    const permissionsRequest =
      createWritableValueWithCallbacks<RequestResult<OsehNotificationsPermission> | null>(
        null
      );
    const cleanupPermissionsRequest = (() => {
      const req = getPermissionsStatus();
      setVWC(permissionsRequest, req);
      return () => {
        req.release();
        if (Object.is(permissionsRequest.get(), req)) {
          setVWC(permissionsRequest, null);
        }
      };
    })();

    const [permissions, cleanupPermissionsUnwrapper] = unwrapRequestResult(
      permissionsRequest,
      (d) => d.data,
      (v) =>
        v === null || v.type === 'loading'
          ? null
          : { granted: false, canAskAgain: false, expires: 'never' as const }
    );

    const getSettings = () =>
      createLoginContextRequest({
        ctx,
        handler: ctx.resources.reminderSettingsHandler,
      });

    const settingsRequest =
      createWritableValueWithCallbacks<RequestResult<ReminderSettings> | null>(
        null
      );
    const cleanupSettingsRequester = createValueWithCallbacksEffect(
      ctx.login.value,
      (user) => {
        if (user.state !== 'logged-in') {
          return undefined;
        }

        const req = getSettings();
        setVWC(settingsRequest, req);
        return () => {
          req.release();
          if (Object.is(settingsRequest.get(), req)) {
            setVWC(settingsRequest, null);
          }
        };
      },
      {
        applyBeforeCancel: true,
      }
    );
    const [settings, cleanupSettingsUnwrapper] = unwrapRequestResult(
      settingsRequest,
      (d) => d.data,
      () => null
    );

    const [ready, cleanupReady] = createMappedValueWithCallbacks(
      permissions,
      (p) => p !== null
    );

    const platformImage = Platform.select({
      ios: screen.parameters.image?.ios,
      default: screen.parameters.image?.other,
    });
    const image = initImage({
      ctx,
      screen,
      refreshScreen,
      paramMapper: (p) =>
        Platform.select({
          ios: p.image?.ios?.image,
          default: p.image?.other?.image,
        }) ?? null,
      sizeMapper: () => ({
        width: platformImage?.width ?? 0,
        height: platformImage?.height ?? 0,
      }),
    });

    return {
      ready,
      permissions,
      settings,
      image: image.image,
      dispose: () => {
        cleanupPermissionsRequest();
        cleanupPermissionsUnwrapper();
        cleanupSettingsRequester();
        cleanupSettingsUnwrapper();
        cleanupReady();
        image.dispose();
      },
    };
  },
  component: (props) => <AddPushToken {...props} />,
};
