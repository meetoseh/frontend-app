import { ReactElement, useCallback, useEffect } from 'react';
import { ScreenComponentProps } from '../../models/Screen';
import { Text, Platform, View, Pressable } from 'react-native';
import {
  playExitTransition,
  useEntranceTransition,
  useTransitionProp,
} from '../../../../shared/lib/TransitionProp';
import {
  StandardScreenTransition,
  useStandardTransitionsState,
} from '../../../../shared/hooks/useStandardTransitions';
import {
  createWritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../../shared/lib/Callbacks';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { GridDarkGrayBackground } from '../../../../shared/components/GridDarkGrayBackground';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { styles } from './AddPushTokenStyles';
import { FilledInvertedButton } from '../../../../shared/components/FilledInvertedButton';
import { setVWC } from '../../../../shared/lib/setVWC';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { WipeTransitionOverlay } from '../../../../shared/components/WipeTransitionOverlay';
import { AddPushTokenResources } from './AddPushTokenResources';
import { AddPushTokenMappedParams } from './AddPushTokenParams';
import { TextStyleForwarder } from '../../../../shared/components/TextStyleForwarder';
import { OsehImageFromState } from '../../../../shared/images/OsehImageFromState';
import { DEFAULT_DAYS, DEFAULT_TIME_RANGE } from '../reminder_times/constants';
import { TimeRange } from '../reminder_times/EditTimeRange';
import { DayOfWeek } from '../../../../shared/models/DayOfWeek';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import { useWorkingModal } from '../../../../shared/hooks/useWorkingModal';
import { useErrorModal } from '../../../../shared/hooks/useErrorModal';
import { Modals } from '../../../../shared/contexts/ModalContext';
import { useTimezone } from '../../../../shared/hooks/useTimezone';
import { apiFetch } from '../../../../shared/lib/apiFetch';
import { requestPermissionsAsync } from 'expo-notifications';
import {
  OsehNotificationsPermission,
  createOsehNotificationPermissionsRequest,
} from './lib/createNotificationPermissionsStatusHandler';
import { EditReminderTime } from '../reminder_times/EditReminderTime';
import { Channel } from '../reminder_times/lib/Channel';
import {
  GRID_SIMPLE_NAVIGATION_FOREGROUND_BOTTOM_HEIGHT,
  GRID_SIMPLE_NAVIGATION_FOREGROUND_TOP_HEIGHT,
  GridSimpleNavigationForeground,
} from '../../../../shared/components/GridSimpleNavigationForeground';
import { LinkButton } from '../../../../shared/components/LinkButton';
import { HorizontalSpacer } from '../../../../shared/components/HorizontalSpacer';
import { screenWithWorking } from '../../lib/screenWithWorking';
import { waitForValueWithCallbacksConditionCancelable } from '../../../../shared/lib/waitForValueWithCallbacksCondition';
import { configurableScreenOut } from '../../lib/configurableScreenOut';
import { areScreenConfigurableTriggersEqual } from '../../models/ScreenConfigurableTrigger';
import { Close } from '../../../../shared/components/icons/Close';
import { OsehColors } from '../../../../shared/OsehColors';
import { Back } from '../../../../shared/components/icons/Back';
import { adaptExitTransition } from '../../lib/adaptExitTransition';
import {
  chooseErrorFromStatus,
  DisplayableError,
} from '../../../../shared/lib/errors';

/**
 * If the user doesn't already have notifications enabled on the current device,
 * this will prompt them to see if they want to allow notifications. If they choose
 * yes, presents the native popup.
 *
 * If they already have notifications enabled, this just skips itself.
 *
 * Optionally, they can configure their push reminder times as part of this operation.
 *
 * This screen only exists in native.
 *
 * Presenting the native popup will result in updating the users notification permissions
 * status, which will in turn cause us to potentially fetch a new expo token and sync
 * it with the server (see lib/keepExpoTokenSynced.ts).
 */
export const AddPushToken = ({
  ctx,
  screen,
  startPop,
  trace,
  resources,
}: ScreenComponentProps<
  'add_push_token',
  AddPushTokenResources,
  AddPushTokenMappedParams
>): ReactElement => {
  const modals = useWritableValueWithCallbacks<Modals>(() => []);
  const transition = useTransitionProp(
    (): StandardScreenTransition => screen.parameters.entrance
  );
  useEntranceTransition(transition);

  const transitionState = useStandardTransitionsState(transition);

  const workingVWC = useWritableValueWithCallbacks(() => false);

  useEffect(() => {
    const active = createWritableValueWithCallbacks(true);
    checkPermissions();
    return () => {
      setVWC(active, false);
    };

    async function checkPermissions() {
      if (!active.get()) {
        return;
      }

      const nonLoadingCancelable = waitForValueWithCallbacksConditionCancelable(
        resources.permissions,
        (v) => v !== null
      );
      active.callbacks.add(nonLoadingCancelable.cancel);
      if (!active.get()) {
        nonLoadingCancelable.cancel();
      }

      let permissions: Awaited<typeof nonLoadingCancelable.promise>;
      try {
        permissions = await nonLoadingCancelable.promise;
      } catch (e) {
        if (!active.get()) {
          return;
        }
        trace({ type: 'check-permissions-error', error: `${e}` });
        return;
      } finally {
        active.callbacks.remove(nonLoadingCancelable.cancel);
      }

      if (!active.get()) {
        return;
      }

      if (permissions === null) {
        throw new Error('impossible');
      }

      if (workingVWC.get()) {
        return;
      }

      if (permissions.granted || !permissions.canAskAgain) {
        setVWC(workingVWC, true);
        try {
          trace({
            type: 'skip',
            reason: permissions.granted
              ? 'already have permission'
              : 'cannot open native dialog',
            granted: permissions.granted,
            canAskAgain: permissions.canAskAgain,
          });
          startPop({ slug: 'skip', parameters: {} })();
        } finally {
          setVWC(workingVWC, false);
        }
      }
    }
  }, [resources.permissions, trace, startPop, workingVWC]);

  const getExistingTimeRange = (): TimeRange => {
    const settings = resources.settings.get();
    if (settings === null) {
      return { ...DEFAULT_TIME_RANGE };
    }
    return { start: settings.push.start, end: settings.push.end };
  };

  const getExistingDays = (): Set<DayOfWeek> => {
    const settings = resources.settings.get();
    if (settings === null) {
      return new Set(DEFAULT_DAYS);
    }

    return new Set(settings.push.days);
  };

  const timeRangeVWC =
    useWritableValueWithCallbacks<TimeRange>(getExistingTimeRange);
  const daysVWC =
    useWritableValueWithCallbacks<Set<DayOfWeek>>(getExistingDays);

  useValueWithCallbacksEffect(resources.settings, () => {
    setVWC(timeRangeVWC, getExistingTimeRange());
    setVWC(daysVWC, getExistingDays());
    return undefined;
  });

  const savingVWC = useWritableValueWithCallbacks<boolean>(() => false);
  const savingErrorVWC = useWritableValueWithCallbacks<DisplayableError | null>(
    () => null
  );

  useWorkingModal(modals, savingVWC, 200);
  useErrorModal(modals, savingErrorVWC, { topBarHeightVWC: ctx.topBarHeight });

  const timezone = useTimezone();

  /**
   * If there are unsaved changes, returns a function to save which resolves
   * to true on success and false on error. If there are no unsaved changes,
   * returns null.
   */
  const prepareSave = useCallback((): (() => Promise<boolean>) | null => {
    if (savingVWC.get()) {
      throw new Error('Already saving');
    }

    if (!screen.parameters.times) {
      return async () => true;
    }

    const savingDays = Array.from(daysVWC.get());
    const savingStart = timeRangeVWC.get().start;
    const savingEnd = timeRangeVWC.get().end;

    const settings = resources.settings.get();
    if (
      settings !== null &&
      settings.push.start === savingStart &&
      settings.push.end === savingEnd &&
      savingDays.length === settings.push.days.size &&
      savingDays.every((d) => settings.push.days.has(d))
    ) {
      return null;
    }

    return async () => {
      if (savingVWC.get()) {
        return false;
      }

      const loginContextUnch = ctx.login.value.get();
      if (loginContextUnch.state !== 'logged-in') {
        setVWC(
          savingErrorVWC,
          new DisplayableError(
            'server-refresh-required',
            'save reminder times',
            'not logged in'
          )
        );
        return false;
      }

      const loginContext = loginContextUnch;
      setVWC(savingVWC, true);
      setVWC(savingErrorVWC, null);
      try {
        let response;
        try {
          response = await apiFetch(
            '/api/1/users/me/attributes/notification_time',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json; charset=utf-8' },
              body: JSON.stringify({
                days_of_week: savingDays,
                time_range: { start: savingStart, end: savingEnd },
                channel: 'push',
                timezone: timezone.timeZone,
                timezone_technique: timezone.timeZoneTechnique,
              }),
            },
            loginContext
          );
        } catch {
          throw new DisplayableError('connectivity', 'save reminder times');
        }

        if (!response.ok) {
          throw chooseErrorFromStatus(response.status, 'save reminder times');
        }
        ctx.resources.reminderChannelsHandler.evictOrReplace(
          loginContext,
          (old) => {
            if (old === undefined) {
              return { type: 'make-request', data: undefined };
            }

            if (!old.unconfiguredChannels.has('push')) {
              return { type: 'data', data: old };
            }

            const newChannels = new Set(old.unconfiguredChannels);
            newChannels.delete('push');
            return {
              type: 'data',
              data: { ...old, unconfiguredChannels: newChannels },
            };
          }
        );
        ctx.resources.reminderSettingsHandler.evictOrReplace(
          loginContext,
          (old) => {
            if (old === undefined) {
              return { type: 'make-request', data: undefined };
            }

            return {
              type: 'data',
              data: {
                ...old,
                push: {
                  start: savingStart,
                  end: savingEnd,
                  days: new Set(savingDays),
                  isReal: true,
                },
              },
            };
          }
        );
        return true;
      } catch (e) {
        setVWC(
          savingErrorVWC,
          new DisplayableError('client', 'save reminder times', `${e}`)
        );
        return false;
      } finally {
        setVWC(savingVWC, false);
      }
    };
  }, [
    timeRangeVWC,
    daysVWC,
    timezone,
    ctx.login,
    ctx.resources,
    resources.settings,
    savingErrorVWC,
    savingVWC,
    screen.parameters.times,
  ]);

  /**
   * Requests permissions using the native dialog, updates our model of the
   * permissions everywhere, and returns the new permissions
   */
  const requestUsingNativeDialog =
    useCallback(async (): Promise<OsehNotificationsPermission> => {
      let result: OsehNotificationsPermission;
      try {
        const nativeResult = await requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: false,
            allowSound: false,
            allowDisplayInCarPlay: false,
            allowCriticalAlerts: false,
            provideAppNotificationSettings: false,
            allowProvisional: false,
          },
        });
        result = {
          granted: nativeResult.granted,
          canAskAgain: nativeResult.canAskAgain,
          expires: nativeResult.expires,
        };
      } catch (e) {
        console.error(`Error requesting notification permissions: ${e}`);
        result = {
          granted: false,
          canAskAgain: false,
          expires: 'never',
        };
      }

      ctx.resources.notificationPermissionsHandler.evictOrReplace(
        createOsehNotificationPermissionsRequest(),
        () => ({ type: 'data', data: result })
      );
      return result;
    }, [ctx]);

  const pushChannelVWC = useWritableValueWithCallbacks<Channel>(() => 'push');

  const onBack = () => {
    configurableScreenOut(
      workingVWC,
      startPop,
      transition,
      screen.parameters.back.exit,
      screen.parameters.back.trigger,
      {
        beforeDone: async () => {
          trace({ type: 'back' });
        },
      }
    );
  };

  const onCTA = () => {
    screenWithWorking(workingVWC, async () => {
      setVWC(
        transition.animation,
        await adaptExitTransition(screen.parameters.cta.exit)
      );
      const exitTransition = playExitTransition(transition);

      const saver = prepareSave();
      const savePromise = saver === null ? Promise.resolve(true) : saver();

      let finishPop: (() => void) | null = null;
      if (
        areScreenConfigurableTriggersEqual(
          screen.parameters.cta.success,
          screen.parameters.cta.failure
        )
      ) {
        const trigger = screen.parameters.cta.success;
        finishPop = startPop(
          trigger.type === 'pop'
            ? null
            : { slug: trigger.flow, parameters: trigger.parameters },
          trigger.endpoint ?? undefined
        );
      }

      trace({ type: 'request-using-native-dialog', step: 'opening' });
      const newPermission = await requestUsingNativeDialog();
      trace({
        type: 'request-using-native-dialog',
        step: 'closed',
        granted: newPermission.granted,
        canAskAgain: newPermission.canAskAgain,
      });

      if (finishPop == null) {
        const trigger = newPermission.granted
          ? screen.parameters.cta.success
          : screen.parameters.cta.failure;

        finishPop = startPop(
          trigger.type === 'pop'
            ? null
            : { slug: trigger.flow, parameters: trigger.parameters },
          trigger.endpoint ?? undefined
        );
      }

      await exitTransition.promise;
      await savePromise;
      finishPop();
    });
  };

  return (
    <GridFullscreenContainer
      windowSizeImmediate={ctx.windowSizeImmediate}
      statusBar={true}
      modals={modals}
    >
      <GridDarkGrayBackground />
      <GridContentContainer
        contentWidthVWC={ctx.contentWidth}
        left={transitionState.left}
        opacity={transitionState.opacity}
        gridSizeVWC={ctx.windowSizeImmediate}
        justifyContent="flex-start"
        scrollable={false}
      >
        <RenderGuardedComponent
          props={ctx.topBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
        {screen.parameters.nav.type === 'header-and-footer' && (
          <VerticalSpacer
            height={GRID_SIMPLE_NAVIGATION_FOREGROUND_TOP_HEIGHT}
          />
        )}
        {screen.parameters.nav.type === 'x' && (
          <View style={styles.row}>
            <HorizontalSpacer width={0} flexGrow={1} />
            <Pressable onPress={onBack}>
              <Close
                icon={{ width: 24 }}
                container={{ width: 56, height: 56 }}
                startPadding={{
                  x: { fraction: 0.5 },
                  y: { fraction: 0.5 },
                }}
                color={OsehColors.v4.primary.light}
              />
            </Pressable>
          </View>
        )}
        {screen.parameters.nav.type === 'arrow' && (
          <View style={styles.row}>
            <Pressable onPress={onBack}>
              <Back
                icon={{ width: 20 }}
                container={{ width: 56, height: 56 }}
                startPadding={{ x: { fraction: 0.5 }, y: { fraction: 0.5 } }}
                color={OsehColors.v4.primary.light}
              />
            </Pressable>
          </View>
        )}
        <VerticalSpacer height={0} flexGrow={3} />
        {screen.parameters.image !== null && (
          <RenderGuardedComponent
            props={resources.image}
            component={(image) => {
              const info = Platform.select({
                ios: screen.parameters.image?.ios,
                default: screen.parameters.image?.other,
              });
              if (info === undefined) {
                return <></>;
              }

              return (
                <>
                  <OsehImageFromState
                    state={{
                      loading: image === null,
                      localUrl: image?.croppedUrl ?? null,
                      displayWidth: info.width,
                      displayHeight: info.height,
                      alt: '',
                      thumbhash: info.image.thumbhash,
                    }}
                    style={styles.image}
                  />
                  <VerticalSpacer height={24} flexGrow={1} />
                </>
              );
            }}
          />
        )}
        <Text style={styles.header}>{screen.parameters.header}</Text>
        {screen.parameters.message !== null && (
          <>
            <VerticalSpacer height={16} />
            <Text style={styles.message}>{screen.parameters.message}</Text>
          </>
        )}
        {screen.parameters.times && (
          <>
            <VerticalSpacer height={24} />
            <EditReminderTime
              timeRange={timeRangeVWC}
              days={daysVWC}
              channel={pushChannelVWC}
              onOpenTimeRange={() => {
                trace({
                  type: 'open_time',
                  channel: 'push',
                  time: timeRangeVWC.get(),
                });
              }}
              onClosedTimeRange={() => {
                trace({
                  type: 'close_time',
                  channel: 'push',
                  time: timeRangeVWC.get(),
                });
              }}
              onOpenDays={() => {
                trace({
                  type: 'open_days',
                  channel: 'push',
                  days: Array.from(daysVWC.get()),
                });
              }}
              onClosedDays={() => {
                trace({
                  type: 'close_days',
                  channel: 'push',
                  days: Array.from(daysVWC.get()),
                });
              }}
            />
          </>
        )}
        <VerticalSpacer height={24} />
        <TextStyleForwarder
          component={(styleVWC) => (
            <FilledInvertedButton
              onPress={onCTA}
              setTextStyle={(s) => setVWC(styleVWC, s)}
            >
              <RenderGuardedComponent
                props={styleVWC}
                component={(s) => (
                  <Text style={s}>{screen.parameters.cta.text}</Text>
                )}
              />
            </FilledInvertedButton>
          )}
        />
        {screen.parameters.nav.type === 'link-button' && (
          <>
            <VerticalSpacer height={8} />
            <TextStyleForwarder
              component={(styleVWC) => (
                <LinkButton
                  onPress={onBack}
                  setTextStyle={(s) => setVWC(styleVWC, s)}
                >
                  <RenderGuardedComponent
                    props={styleVWC}
                    component={(s) => (
                      <Text style={s}>
                        {screen.parameters.nav.type === 'link-button'
                          ? screen.parameters.nav.back
                          : 'Skip'}
                      </Text>
                    )}
                  />
                </LinkButton>
              )}
            />
          </>
        )}
        <VerticalSpacer height={32} />
        <RenderGuardedComponent
          props={ctx.botBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
        {screen.parameters.nav.type === 'header-and-footer' && (
          <VerticalSpacer
            height={GRID_SIMPLE_NAVIGATION_FOREGROUND_BOTTOM_HEIGHT}
          />
        )}
      </GridContentContainer>
      {screen.parameters.nav.type === 'header-and-footer' && (
        <GridSimpleNavigationForeground
          workingVWC={workingVWC}
          startPop={startPop}
          gridSize={ctx.windowSizeImmediate}
          transitionState={transitionState}
          transition={transition}
          trace={trace}
          back={screen.parameters.back}
          home={{
            trigger: screen.parameters.nav.home.trigger,
            exit: { type: 'fade', ms: 350 },
          }}
          series={{
            trigger: screen.parameters.nav.series.trigger,
            exit: { type: 'fade', ms: 350 },
          }}
          topBarHeight={ctx.topBarHeight}
          botBarHeight={ctx.botBarHeight}
          account={null}
          title={screen.parameters.nav.title}
        />
      )}
      <WipeTransitionOverlay wipe={transitionState.wipe} />
    </GridFullscreenContainer>
  );
};
