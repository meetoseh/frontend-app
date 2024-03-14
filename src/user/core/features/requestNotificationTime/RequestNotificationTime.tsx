import { FeatureComponentProps } from '../../models/Feature';
import { styles } from './RequestNotificationTimeStyles';
import { ReactElement, useCallback, useContext } from 'react';
import {
  Channel,
  RequestNotificationTimeState,
} from './RequestNotificationTimeState';
import {
  ChannelSettings,
  RequestNotificationTimeResources,
} from './RequestNotificationTimeResources';
import { useStartSession } from '../../../../shared/hooks/useInappNotificationSession';
import {
  Callbacks,
  createWritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../../shared/lib/Callbacks';
import {
  ModalContext,
  Modals,
  ModalsOutlet,
  addModalWithCallbackToRemove,
} from '../../../../shared/contexts/ModalContext';
import { useErrorModal } from '../../../../shared/hooks/useErrorModal';
import { setVWC } from '../../../../shared/lib/setVWC';
import { LoginContext } from '../../../../shared/contexts/LoginContext';
import { useTimezone } from '../../../../shared/hooks/useTimezone';
import { TimeRange } from './EditTimeRange';
import { DEFAULT_DAYS, DEFAULT_TIME_RANGE } from './constants';
import { apiFetch } from '../../../../shared/lib/apiFetch';
import { describeError } from '../../../../shared/lib/describeError';
import { View, Text, StyleProp, TextStyle } from 'react-native';
import { SvgLinearGradientBackground } from '../../../../shared/anim/SvgLinearGradientBackground';
import * as Colors from '../../../../styling/colors';
import { FullscreenView } from '../../../../shared/components/FullscreenView';
import { StatusBar } from 'expo-status-bar';
import { useContentWidth } from '../../../../shared/lib/useContentWidth';
import { FilledInvertedButton } from '../../../../shared/components/FilledInvertedButton';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { CloseButton } from '../../../../shared/components/CloseButton';
import { ChannelSelector } from './ChannelSelector';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { nameForChannel } from './formatUtils';
import { EditReminderTime } from './EditReminderTime';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import { useSavingModal } from '../../../../shared/hooks/useSavingModal';
import { YesNoModal } from '../../../../shared/components/YesNoModal';
import { DayOfWeek } from '../../../../shared/models/DayOfWeek';

/**
 * Asks the user what times they want to receive notifications on various
 * channels
 */
export const RequestNotificationTime = ({
  state,
  resources,
}: FeatureComponentProps<
  RequestNotificationTimeState,
  RequestNotificationTimeResources
>) => {
  const loginContextRaw = useContext(LoginContext);
  const timezone = useTimezone();
  const inClickCooldown = useWritableValueWithCallbacks(() => true);

  useValueWithCallbacksEffect(inClickCooldown, (v) => {
    if (!v) {
      return undefined;
    }

    let active = true;
    let timeout: NodeJS.Timeout | null = setTimeout(() => {
      timeout = null;
      if (active) {
        setVWC(inClickCooldown, false);
      }
    }, 1000);
    return () => {
      active = false;
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }
    };
  });

  const currentChannel = useWritableValueWithCallbacks<Channel>(
    () => resources.get().channels[0]
  );
  const finishedChannels = useWritableValueWithCallbacks<Set<Channel>>(
    () => new Set()
  );
  const error = useWritableValueWithCallbacks<ReactElement | null>(() => null);
  const saving = useWritableValueWithCallbacks<boolean>(() => false);
  const overlaySaving = useWritableValueWithCallbacks<boolean>(() => false);
  const promptingSaveChangesBeforeClose = useWritableValueWithCallbacks(
    () => false
  );

  const getExistingTimeRange = useCallback((): TimeRange => {
    const existingSettings =
      resources.get().currentSettings?.[currentChannel.get()];
    if (existingSettings === null || existingSettings === undefined) {
      return Object.assign({}, DEFAULT_TIME_RANGE);
    }
    return { start: existingSettings.start, end: existingSettings.end };
  }, [resources, currentChannel]);

  const getExistingDays = useCallback((): Set<DayOfWeek> => {
    const existingSettings =
      resources.get().currentSettings?.[currentChannel.get()];
    if (existingSettings === null || existingSettings === undefined) {
      return new Set<DayOfWeek>(DEFAULT_DAYS);
    }
    return new Set(existingSettings.days);
  }, [resources, currentChannel]);

  const timeRange =
    useWritableValueWithCallbacks<TimeRange>(getExistingTimeRange);
  const days = useWritableValueWithCallbacks<Set<DayOfWeek>>(getExistingDays);

  useStartSession(
    {
      type: 'callbacks',
      props: () => resources.get().session,
      callbacks: resources.callbacks,
    },
    {
      onStart: () => {
        const session = resources.get().session;
        session?.storeAction('open', { channels: resources.get().channels });
      },
    }
  );

  const modals = useWritableValueWithCallbacks<Modals>(() => []);
  useErrorModal(modals, error, 'Set Reminders');
  useSavingModal(modals, overlaySaving, { message: 'Saving Reminders' });

  const trySaveSettingsWithoutTracking = useCallback(
    async (channel: string, days: DayOfWeek[], start: number, end: number) => {
      const loginRaw = loginContextRaw.value.get();
      if (loginRaw.state !== 'logged-in') {
        return;
      }
      const login = loginRaw;
      const response = await apiFetch(
        '/api/1/users/me/attributes/notification_time',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({
            days_of_week: days,
            time_range: { start, end },
            channel,
            timezone: timezone.timeZone,
            timezone_technique: timezone.guessed ? 'app-guessed' : 'app',
          }),
        },
        login
      );

      if (!response.ok) {
        throw response;
      }
    },
    [loginContextRaw, timezone]
  );

  const checkIfSavePromptRequired = useCallback((): boolean => {
    const savingChannel = currentChannel.get();
    const savingDays = Array.from(days.get());
    const savingStart = timeRange.get().start;
    const savingEnd = timeRange.get().end;

    const savingExistingSettings =
      resources.get().currentSettings?.[savingChannel];
    const lastWasChanged =
      savingExistingSettings === null ||
      savingExistingSettings === undefined ||
      savingExistingSettings.start !== savingStart ||
      savingExistingSettings.end !== savingEnd ||
      savingExistingSettings.days.size !== savingDays.length ||
      savingDays.some((d) => !savingExistingSettings.days.has(d));

    return lastWasChanged;
  }, [currentChannel, days, timeRange, resources]);

  const saveSettingsAndTrack = useCallback(
    async (
      reason: 'continue' | 'tap_channel' | 'x_and_confirm',
      nextChannel: Channel | null,
      opts?: {
        doNotFinish?: boolean;
        noOverlay?: boolean;
      }
    ): Promise<{
      channel: Channel;
      days: DayOfWeek[];
      start: number;
      end: number;
      changed: boolean;
      error: boolean;
    }> => {
      const savingChannel = currentChannel.get();
      const savingDays = Array.from(days.get());
      const savingStart = timeRange.get().start;
      const savingEnd = timeRange.get().end;

      const savingExistingSettings =
        resources.get().currentSettings?.[savingChannel];
      const lastWasChanged =
        savingExistingSettings === null ||
        savingExistingSettings === undefined ||
        savingExistingSettings.start !== savingStart ||
        savingExistingSettings.end !== savingEnd ||
        savingExistingSettings.days.size !== savingDays.length ||
        savingDays.some((d) => !savingExistingSettings.days.has(d));

      const saveRequired = lastWasChanged || !savingExistingSettings?.isReal;

      let saveError = false;
      let overlaySavingTimeout: NodeJS.Timeout | null = null;
      setVWC(saving, true);
      setVWC(error, null);
      if (nextChannel !== null) {
        // play the animation immediately to make the ui seem more
        // responsive. we can't have nothing happen for more than 100ms
        // without confusing the user, and this buys us an extra 350ms
        setVWC(currentChannel, nextChannel);
        overlaySavingTimeout = setTimeout(() => {
          overlaySavingTimeout = null;
          setVWC(overlaySaving, !opts?.noOverlay);
        }, 450);
      } else {
        overlaySavingTimeout = setTimeout(() => {
          overlaySavingTimeout = null;
          setVWC(overlaySaving, !opts?.noOverlay);
        }, 100);
      }
      try {
        if (saveRequired) {
          try {
            await trySaveSettingsWithoutTracking(
              savingChannel,
              savingDays,
              savingStart,
              savingEnd
            );
          } catch (e) {
            console.error('failed to save settings due to error');
            setVWC(currentChannel, savingChannel);
            setVWC(error, await describeError(e));
            saveError = true;
          }
        }
        const session = resources.get().session;
        if (session) {
          session.storeAction('set_reminders', {
            channel: savingChannel,
            time: { start: savingStart, end: savingEnd },
            days: savingDays,
            next_channel: saveError ? savingChannel : nextChannel,
            reason,
            error: saveError,
            save_required: saveRequired,
          });
        }
        if (!saveError) {
          resources.get().setCurrentSettings(
            (() => {
              const old = resources.get().currentSettings;
              const newSettings = { ...old };
              newSettings[savingChannel] = {
                days: new Set(savingDays),
                start: savingStart,
                end: savingEnd,
                isReal: true,
              };
              return newSettings as Record<Channel, ChannelSettings>;
            })()
          );
          finishedChannels.get().add(savingChannel);
          if (nextChannel !== null) {
            setVWC(currentChannel, nextChannel);
          } else if (!opts?.doNotFinish) {
            session?.reset();
            state.get().ian?.onShown();
            state.get().setClientRequested(false);
          }
        }

        return {
          channel: savingChannel,
          days: savingDays,
          start: savingStart,
          end: savingEnd,
          changed: lastWasChanged,
          error: saveError,
        };
      } finally {
        if (overlaySavingTimeout !== null) {
          clearTimeout(overlaySavingTimeout);
        }
        setVWC(overlaySaving, false);
        setVWC(saving, false);
      }
    },
    [
      trySaveSettingsWithoutTracking,
      currentChannel,
      days,
      resources,
      error,
      timeRange,
      finishedChannels,
      state,
      saving,
      overlaySaving,
    ]
  );

  const onContinueChannel = useCallback(() => {
    if (saving.get()) {
      return;
    }

    const finished = finishedChannels.get();
    const current = currentChannel.get();
    const shown = resources.get().channels;

    const nextChannel =
      shown.find((c) => !finished.has(c) && c !== current) ?? null;
    saveSettingsAndTrack('continue', nextChannel).then((res) => {
      if (!res.error) {
        updateTimeRange(res.changed);
        updateDays(res.changed);
      }
    });

    function updateTimeRange(lastWasChanged: boolean) {
      if (lastWasChanged) {
        return;
      }

      setVWC(timeRange, getExistingTimeRange());
    }

    function updateDays(lastWasChanged: boolean) {
      if (lastWasChanged) {
        const mostRestrictiveInterpration = new Set<DayOfWeek>();
        const justSetTo = days.get();
        const existingForNew = getExistingDays();

        for (const day of Array.from(justSetTo)) {
          if (existingForNew.has(day)) {
            mostRestrictiveInterpration.add(day);
          }
        }

        setVWC(days, mostRestrictiveInterpration);
        return;
      }

      setVWC(days, getExistingDays());
    }
  }, [
    currentChannel,
    finishedChannels,
    resources,
    days,
    timeRange,
    getExistingTimeRange,
    getExistingDays,
    saveSettingsAndTrack,
    saving,
  ]);

  const onTapChannel = useCallback(
    (channel: Channel) => {
      if (channel === currentChannel.get()) {
        return;
      }
      if (saving.get()) {
        return;
      }

      const session = resources.get().session;
      session?.storeAction('tap_channel', {
        channel: channel,
        already_seen: finishedChannels.get().has(channel),
      });

      saveSettingsAndTrack('tap_channel', channel).then((res) => {
        if (!res.error) {
          setVWC(days, getExistingDays());
          setVWC(timeRange, getExistingTimeRange());
        }
      });
    },
    [
      currentChannel,
      finishedChannels,
      resources,
      days,
      timeRange,
      getExistingDays,
      getExistingTimeRange,
      saveSettingsAndTrack,
      saving,
    ]
  );

  const handleFinish = useCallback(() => {
    resources.get().session?.reset();
    state.get().ian?.onShown();
    state.get().setClientRequested(false);
  }, [resources, state]);

  useValueWithCallbacksEffect(promptingSaveChangesBeforeClose, (visible) => {
    if (!visible) {
      return undefined;
    }

    const channel = currentChannel.get();
    const dismissed = new Callbacks<undefined>();
    dismissed.add(() => {
      setVWC(promptingSaveChangesBeforeClose, false);
    });
    const requestDismiss = createWritableValueWithCallbacks<() => void>(
      () => () => {
        dismissed.call(undefined);
      }
    );

    return addModalWithCallbackToRemove(
      modals,
      <YesNoModal
        title="Save Changes?"
        body={`Do you want to save your changes to ${nameForChannel(
          channel
        )} reminders?`}
        cta1="Yes"
        cta2="No"
        emphasize={1}
        onClickOne={async () => {
          const result = await saveSettingsAndTrack('x_and_confirm', null, {
            doNotFinish: true,
            noOverlay: true,
          });
          if (!result.error) {
            dismissed.add(handleFinish);
            requestDismiss.get()();
          }
        }}
        onClickTwo={async () => {
          resources.get().session?.storeAction('discard_changes', null);
          dismissed.add(handleFinish);
          requestDismiss.get()();
        }}
        onDismiss={() => {
          dismissed.call(undefined);
        }}
        requestDismiss={requestDismiss}
      />
    );
  });

  const contentWidth = useContentWidth();
  const continueTextStyle = useWritableValueWithCallbacks<StyleProp<TextStyle>>(
    () => undefined
  );

  return (
    <View style={styles.container}>
      <SvgLinearGradientBackground
        state={{
          type: 'react-rerender',
          props: Colors.STANDARD_BLACK_GRAY_GRADIENT_SVG,
        }}
      >
        <ModalContext.Provider value={{ modals }}>
          <FullscreenView style={styles.background}>
            <CloseButton
              onPress={() => {
                if (!checkIfSavePromptRequired()) {
                  const session = resources.get().session;
                  session?.storeAction('x', { save_prompt: false });
                  handleFinish();
                } else {
                  setVWC(promptingSaveChangesBeforeClose, true);
                }
              }}
            />
            <View style={styles.content}>
              <ChannelSelector
                current={currentChannel}
                all={useMappedValueWithCallbacks(resources, (r) => r.channels)}
                onTap={onTapChannel}
              />
              <RenderGuardedComponent
                props={currentChannel}
                component={(c) => (
                  <Text style={{ ...styles.title, maxWidth: contentWidth }}>
                    When would you like {nameForChannel(c)} reminders?
                  </Text>
                )}
              />
              <Text style={{ ...styles.subtitle, maxWidth: contentWidth }}>
                You can choose the days and the time that you&rsquo;d like us to
                send you reminders.
              </Text>

              <View style={styles.form}>
                <EditReminderTime
                  timeRange={timeRange}
                  days={days}
                  channel={currentChannel}
                  onOpenTimeRange={() => {
                    resources.get().session?.storeAction('open_time', null);
                  }}
                  onClosedTimeRange={() => {
                    resources.get().session?.storeAction('close_time', {
                      channel: currentChannel.get(),
                      ...timeRange.get(),
                    });
                  }}
                  onOpenDays={() => {
                    resources.get().session?.storeAction('open_days', null);
                  }}
                  onClosedDays={() => {
                    resources.get().session?.storeAction('close_days', {
                      channel: currentChannel.get(),
                      days: Array.from(days.get()),
                    });
                  }}
                />
              </View>

              <FilledInvertedButton
                onPress={onContinueChannel}
                setTextStyle={(s) => {
                  setVWC(continueTextStyle, s);
                }}
                width={contentWidth}
              >
                <RenderGuardedComponent
                  props={continueTextStyle}
                  component={(s) => <Text style={s}>Continue</Text>}
                />
              </FilledInvertedButton>
            </View>
          </FullscreenView>
        </ModalContext.Provider>
        <ModalsOutlet modals={modals} />
      </SvgLinearGradientBackground>
      <StatusBar style="light" />
    </View>
  );
};
