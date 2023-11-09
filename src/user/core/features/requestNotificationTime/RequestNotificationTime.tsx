import { FeatureComponentProps } from "../../models/Feature";
import { styles } from "./RequestNotificationTimeStyles";
import { ReactElement, useCallback, useContext } from "react";
import {
  Channel,
  RequestNotificationTimeState,
} from "./RequestNotificationTimeState";
import {
  ChannelSettings,
  DayOfWeek,
  RequestNotificationTimeResources,
} from "./RequestNotificationTimeResources";
import { useStartSession } from "../../../../shared/hooks/useInappNotificationSession";
import { useWritableValueWithCallbacks } from "../../../../shared/lib/Callbacks";
import {
  ModalContext,
  Modals,
  ModalsOutlet,
} from "../../../../shared/contexts/ModalContext";
import { useErrorModal } from "../../../../shared/hooks/useErrorModal";
import { setVWC } from "../../../../shared/lib/setVWC";
import { LoginContext } from "../../../../shared/contexts/LoginContext";
import { useTimezone } from "../../../../shared/hooks/useTimezone";
import { TimeRange } from "./EditTimeRange";
import { DEFAULT_DAYS, DEFAULT_TIME_RANGE } from "./constants";
import { apiFetch } from "../../../../shared/lib/apiFetch";
import { describeError } from "../../../../shared/lib/describeError";
import { View, Text, StyleProp, TextStyle } from "react-native";
import { SvgLinearGradientBackground } from "../../../../shared/anim/SvgLinearGradientBackground";
import * as Colors from "../../../../styling/colors";
import { FullscreenView } from "../../../../shared/components/FullscreenView";
import { StatusBar } from "expo-status-bar";
import { useContentWidth } from "../../../../shared/lib/useContentWidth";
import { FilledInvertedButton } from "../../../../shared/components/FilledInvertedButton";
import { RenderGuardedComponent } from "../../../../shared/components/RenderGuardedComponent";
import { CloseButton } from "../../../../shared/components/CloseButton";
import { ChannelSelector } from "./ChannelSelector";
import { useMappedValueWithCallbacks } from "../../../../shared/hooks/useMappedValueWithCallbacks";
import { nameForChannel } from "./formatUtils";
import { EditReminderTime } from "./EditReminderTime";
import { useValueWithCallbacksEffect } from "../../../../shared/hooks/useValueWithCallbacksEffect";

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
  const loginContext = useContext(LoginContext);
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
      type: "callbacks",
      props: () => resources.get().session,
      callbacks: resources.callbacks,
    },
    {
      onStart: () => {
        const session = resources.get().session;
        session?.storeAction("open", { channels: resources.get().channels });
      },
    }
  );

  const modals = useWritableValueWithCallbacks<Modals>(() => []);
  useErrorModal(modals, error, "Set Reminders");

  const onContinueChannel = useCallback(() => {
    if (inClickCooldown.get()) {
      return;
    }

    setVWC(inClickCooldown, true);
    saveSettings();

    async function saveSettingsInner(
      channel: string,
      days: DayOfWeek[],
      start: number,
      end: number
    ) {
      const response = await apiFetch(
        "/api/1/users/me/attributes/notification_time",
        {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            days_of_week: days,
            time_range: { start, end },
            channel,
            timezone: timezone.timeZone,
            timezone_technique: timezone.guessed ? "app-guessed" : "app",
          }),
        },
        loginContext
      );

      if (!response.ok) {
        throw response;
      }
    }

    async function saveSettings() {
      if (saving.get()) {
        return;
      }

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

      setVWC(error, null);
      setVWC(saving, true);
      try {
        await saveSettingsInner(
          savingChannel,
          savingDays,
          savingStart,
          savingEnd
        );
        resources.get().setCurrentSettings(
          (() => {
            const old = resources.get().currentSettings;
            const newSettings = { ...old };
            newSettings[savingChannel] = {
              days: new Set(savingDays),
              start: savingStart,
              end: savingEnd,
            };
            return newSettings as Record<Channel, ChannelSettings>;
          })()
        );
        gotoNextChannelOrFinish(lastWasChanged, {
          channel: savingChannel,
          time: { start: savingStart, end: savingEnd },
          days: savingDays,
          error: false,
        });
      } catch (e) {
        resources.get().session?.storeAction("set_reminders", {
          channel: savingChannel,
          time: { start: savingStart, end: savingEnd },
          days: savingDays,
          next_channel: null,
          error: true,
        });
        const err = await describeError(e);
        setVWC(error, err);
      } finally {
        setVWC(saving, false);
      }
    }

    function gotoNextChannelOrFinish(
      lastWasChanged: boolean,
      ianDebug: {
        channel: Channel;
        time: { start: number; end: number };
        days: DayOfWeek[];
        error: false;
      }
    ) {
      const oldCurrentChannel = currentChannel.get();
      const oldFinishedChannels = finishedChannels.get();
      const availableChannels = resources.get().channels;

      const newFinishedChannels = new Set(oldFinishedChannels);
      newFinishedChannels.add(oldCurrentChannel);

      const newCurrentChannel = availableChannels.find(
        (c) => !newFinishedChannels.has(c)
      );
      const session = resources.get().session;
      if (newCurrentChannel === undefined) {
        session
          ?.storeAction("set_reminders", { ...ianDebug, next_channel: null })
          ?.finally(() => {
            session?.reset();
          });
        state.get().ian?.onShown();
        state.get().setClientRequested(false);
        return;
      } else {
        session?.storeAction("set_reminders", {
          ...ianDebug,
          next_channel: newCurrentChannel,
        });
        setVWC(currentChannel, newCurrentChannel);
        setVWC(finishedChannels, newFinishedChannels);
        updateDays(lastWasChanged);
        updateTimeRange(lastWasChanged);
      }
    }

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
    state,
    saving,
    days,
    error,
    loginContext,
    timeRange,
    timezone,
    getExistingTimeRange,
    getExistingDays,
    inClickCooldown,
  ]);

  const contentWidth = useContentWidth();
  const continueTextStyle = useWritableValueWithCallbacks<StyleProp<TextStyle>>(
    () => undefined
  );

  return (
    <View style={styles.container}>
      <SvgLinearGradientBackground
        state={{
          type: "react-rerender",
          props: Colors.STANDARD_BLACK_GRAY_GRADIENT_SVG,
        }}
      >
        <ModalContext.Provider value={{ modals }}>
          <FullscreenView style={styles.background}>
            <CloseButton
              onPress={() => {
                const session = resources.get().session;
                session?.storeAction("x", null)?.finally(() => {
                  session?.reset();
                });
                state.get().ian?.onShown();
                state.get().setClientRequested(false);
              }}
            />
            <View style={styles.content}>
              <ChannelSelector
                current={currentChannel}
                all={useMappedValueWithCallbacks(resources, (r) => r.channels)}
                onTap={(channel) => {
                  if (channel === currentChannel.get()) {
                    return;
                  }

                  const session = resources.get().session;
                  session?.storeAction("tap_channel", {
                    channel: channel,
                    already_seen: finishedChannels.get().has(channel),
                  });

                  setVWC(currentChannel, channel);

                  const setting = resources.get().currentSettings?.[channel];
                  if (setting !== null && setting !== undefined) {
                    setVWC(timeRange, {
                      start: setting.start,
                      end: setting.end,
                    });
                    setVWC(days, new Set(setting.days));
                  }
                }}
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
                    resources.get().session?.storeAction("open_time", null);
                  }}
                  onClosedTimeRange={() => {
                    resources.get().session?.storeAction("close_time", {
                      channel: currentChannel.get(),
                      ...timeRange.get(),
                    });
                  }}
                  onOpenDays={() => {
                    resources.get().session?.storeAction("open_days", null);
                  }}
                  onClosedDays={() => {
                    resources.get().session?.storeAction("close_days", {
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
