import React, { ReactElement, useCallback, useContext } from 'react';
import { ScreenComponentProps } from '../../models/Screen';
import { GridDarkGrayBackground } from '../../../../shared/components/GridDarkGrayBackground';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import {
  useEntranceTransition,
  useTransitionProp,
} from '../../../../shared/lib/TransitionProp';
import {
  StandardScreenTransition,
  useStandardTransitionsState,
} from '../../../../shared/hooks/useStandardTransitions';
import { WipeTransitionOverlay } from '../../../../shared/components/WipeTransitionOverlay';
import {
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../../shared/lib/Callbacks';
import { ReminderTimesResources } from './ReminderTimesResources';
import { ReminderTimesMappedParams } from './ReminderTimesParams';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import {
  GRID_SIMPLE_NAVIGATION_FOREGROUND_BOTTOM_HEIGHT,
  GRID_SIMPLE_NAVIGATION_FOREGROUND_TOP_HEIGHT,
  GridSimpleNavigationForeground,
} from '../../../../shared/components/GridSimpleNavigationForeground';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { useValuesWithCallbacksEffect } from '../../../../shared/hooks/useValuesWithCallbacksEffect';
import { screenOut } from '../../lib/screenOut';
import { ChannelSelector } from '../../features/requestNotificationTime/ChannelSelector';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { Channel } from './lib/Channel';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import { setVWC } from '../../../../shared/lib/setVWC';
import { styles } from './ReminderTimesStyles';
import { EditReminderTime } from '../../features/requestNotificationTime/EditReminderTime';
import { TimeRange } from '../../features/requestNotificationTime/EditTimeRange';
import { DayOfWeek } from '../../../../shared/models/DayOfWeek';
import {
  DEFAULT_DAYS,
  DEFAULT_TIME_RANGE,
} from '../../features/requestNotificationTime/constants';
import Back from '../../../../shared/components/icons/Back';
import { apiFetch } from '../../../../shared/lib/apiFetch';
import { Modals } from '../../../../shared/contexts/ModalContext';
import { useErrorModal } from '../../../../shared/hooks/useErrorModal';
import { describeError } from '../../../../shared/lib/describeError';
import { useTimezone } from '../../../../shared/hooks/useTimezone';
import { screenWithWorking } from '../../lib/screenWithWorking';
import { showYesNoModal } from '../../../../shared/lib/showYesNoModal';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { useWorkingModal } from '../../../../shared/hooks/useWorkingModal';
import { Pressable, View, ViewStyle, Text, TextStyle } from 'react-native';
import { TextStyleForwarder } from '../../../../shared/components/TextStyleForwarder';
import { FilledInvertedButton } from '../../../../shared/components/FilledInvertedButton';
import { ContentContainer } from '../../../../shared/components/ContentContainer';

/**
 * Allows the user to update their notification settings
 */
export const ReminderTimes = ({
  ctx,
  screen,
  resources,
  trace,
  startPop,
}: ScreenComponentProps<
  'reminder_times',
  ReminderTimesResources,
  ReminderTimesMappedParams
>): ReactElement => {
  const modals = useWritableValueWithCallbacks<Modals>(() => []);

  const transition = useTransitionProp(
    (): StandardScreenTransition => screen.parameters.entrance
  );
  useEntranceTransition(transition);

  const transitionState = useStandardTransitionsState(transition);

  const workingVWC = useWritableValueWithCallbacks(() => false);

  const effectiveChannelsVWC = useMappedValueWithCallbacks(
    resources.channelsInfo,
    () => {
      const channelsInfo = resources.channelsInfo.get();
      if (channelsInfo === null) {
        return [];
      }

      return screen.parameters.channels.filter((c) =>
        channelsInfo.potentialChannels.has(c)
      );
    },
    {
      inputEqualityFn: () => false,
    }
  );

  useValuesWithCallbacksEffect(
    [effectiveChannelsVWC, resources.channelsInfo],
    () => {
      const channelsInfo = resources.channelsInfo.get();
      if (channelsInfo === null) {
        return;
      }
      const effective = effectiveChannelsVWC.get();
      if (effective.length === 0) {
        screenOut(
          workingVWC,
          startPop,
          transition,
          screen.parameters.back.exit,
          'skip',
          {
            beforeDone: async () => {
              trace({ type: 'skip', reason: 'no channels' });
            },
          }
        );
      }
      return undefined;
    }
  );

  const currentChannelVWC = useWritableValueWithCallbacks<Channel>(
    () => effectiveChannelsVWC.get()[0] ?? screen.parameters.channels[0]
  );
  useValueWithCallbacksEffect(effectiveChannelsVWC, () => {
    const current = currentChannelVWC.get();
    const effective = effectiveChannelsVWC.get();

    if (!effective.includes(current) && effective.length > 0) {
      setVWC(currentChannelVWC, effective[0]);
    }
    return undefined;
  });

  const getExistingTimeRange = (): TimeRange => {
    const channel = currentChannelVWC.get();
    const settings = resources.settings.get();
    if (settings === null) {
      return { ...DEFAULT_TIME_RANGE };
    }

    const setting = settings[channel];
    if (setting === null || setting === undefined) {
      return { ...DEFAULT_TIME_RANGE };
    }

    return { start: setting.start, end: setting.end };
  };

  const getExistingDays = (): Set<DayOfWeek> => {
    const channel = currentChannelVWC.get();
    const settings = resources.settings.get();
    if (settings === null) {
      return new Set(DEFAULT_DAYS);
    }

    const setting = settings[channel];
    if (setting === null || setting === undefined) {
      return new Set(DEFAULT_DAYS);
    }

    return new Set(setting.days);
  };

  const timeRangeVWC =
    useWritableValueWithCallbacks<TimeRange>(getExistingTimeRange);
  const daysVWC =
    useWritableValueWithCallbacks<Set<DayOfWeek>>(getExistingDays);

  useValuesWithCallbacksEffect([currentChannelVWC, resources.settings], () => {
    setVWC(timeRangeVWC, getExistingTimeRange());
    setVWC(daysVWC, getExistingDays());
    return undefined;
  });

  const savingVWC = useWritableValueWithCallbacks<boolean>(() => false);
  const savingErrorVWC = useWritableValueWithCallbacks<ReactElement | null>(
    () => null
  );

  useWorkingModal(modals, savingVWC, 200);
  useErrorModal(modals, savingErrorVWC, 'saving');

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

    const savingDays = Array.from(daysVWC.get());
    const savingStart = timeRangeVWC.get().start;
    const savingEnd = timeRangeVWC.get().end;

    const channel = currentChannelVWC.get();
    const settingsMap = resources.settings.get();

    if (settingsMap === null) {
      return null;
    }

    const settingsRaw = settingsMap[channel];
    if (settingsRaw === null || settingsRaw === undefined) {
      return null;
    }
    const settings = settingsRaw;

    if (
      settings.start === savingStart &&
      settings.end === savingEnd &&
      settings.days.size === savingDays.length &&
      savingDays.every((d) => settings.days.has(d))
    ) {
      return null;
    }

    console.log(
      'found difference:',
      settings,
      savingStart,
      savingEnd,
      savingDays
    );

    return async () => {
      if (savingVWC.get()) {
        return false;
      }

      const loginContextUnch = ctx.login.value.get();
      if (loginContextUnch.state !== 'logged-in') {
        setVWC(savingErrorVWC, <>Not logged in</>);
        return false;
      }

      const loginContext = loginContextUnch;
      setVWC(savingVWC, true);
      setVWC(savingErrorVWC, null);
      try {
        const response = await apiFetch(
          '/api/1/users/me/attributes/notification_time',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({
              days_of_week: savingDays,
              time_range: { start: savingStart, end: savingEnd },
              channel,
              timezone,
              timezone_technique: 'browser',
            }),
          },
          loginContext
        );

        if (!response.ok) {
          throw response;
        }

        ctx.resources.reminderChannelsHandler.evictOrReplace(
          loginContext,
          () => {
            const channelsInfo = resources.channelsInfo.get();
            if (channelsInfo === null) {
              return { type: 'make-request', data: undefined };
            }

            const newUnconfigured = new Set(channelsInfo.unconfiguredChannels);
            newUnconfigured.delete(channel);

            return {
              type: 'data',
              data: {
                unconfiguredChannels: newUnconfigured,
                potentialChannels: channelsInfo.potentialChannels,
              },
            };
          }
        );
        ctx.resources.reminderSettingsHandler.evictOrReplace(
          loginContext,
          () => {
            return {
              type: 'data',
              data: {
                ...settingsMap,
                [channel]: {
                  start: savingStart,
                  end: savingEnd,
                  days: new Set(savingDays),
                },
              },
            };
          }
        );
        return true;
      } catch (e) {
        setVWC(savingErrorVWC, await describeError(e));
        return false;
      } finally {
        setVWC(savingVWC, false);
      }
    };
  }, [
    ctx.login.value,
    currentChannelVWC,
    daysVWC,
    resources.settings,
    savingErrorVWC,
    savingVWC,
    timeRangeVWC,
    timezone,
    ctx.resources.reminderChannelsHandler,
    ctx.resources.reminderSettingsHandler,
    resources.channelsInfo,
  ]);

  const handleBack = useCallback(
    ({
      trigger,
      exit,
    }: {
      trigger: string | null;
      exit: StandardScreenTransition;
    }) => {
      screenWithWorking(workingVWC, async () => {
        const finish = () =>
          screenOut(null, startPop, transition, exit, trigger);
        const save = prepareSave();
        if (save === null) {
          trace({ type: 'back', draft: false });
          await finish();
          return;
        }

        const draft = screen.parameters.back.draft;
        const channel = currentChannelVWC.get();

        if (draft.type === 'save') {
          trace({
            type: 'back',
            draft: true,
            technique: 'save',
            step: 'start',
          });
          const result = await save();
          trace({
            type: 'back',
            draft: true,
            technique: 'save',
            step: 'end',
            result,
          });
          if (result) {
            await finish();
          }
        } else if (draft.type === 'discard') {
          trace({ type: 'back', draft: true, technique: 'discard' });
          await finish();
        } else if (draft.type === 'confirm') {
          trace({
            type: 'back',
            draft: true,
            technique: 'confirm',
            step: 'start',
          });
          const confirmation = await showYesNoModal(modals, {
            title: draft.title,
            body: formatChannelText(draft.message, channel),
            cta1: formatChannelText(draft.save, channel),
            cta2: draft.discard,
            emphasize: 1,
          }).promise;
          if (confirmation === null) {
            trace({
              type: 'back',
              draft: true,
              technique: 'confirm',
              step: 'cancel',
            });
            return;
          }

          if (confirmation) {
            trace({
              type: 'back',
              draft: true,
              technique: 'confirm',
              step: 'save',
            });
            const result = await save();
            trace({
              type: 'back',
              draft: true,
              technique: 'confirm',
              step: 'end',
              result,
            });
            if (result) {
              await finish();
            }
          } else {
            trace({
              type: 'back',
              draft: true,
              technique: 'confirm',
              step: 'discard',
            });
            await finish();
          }
        } else {
          trace({
            type: 'back',
            draft: true,
            technique: 'unknown-becomes-discard',
          });
          await finish();
        }
      });
    },
    [
      prepareSave,
      screen,
      currentChannelVWC,
      modals,
      startPop,
      transition,
      trace,
      workingVWC,
    ]
  );

  const seenChannelsVWC = useWritableValueWithCallbacks<Set<Channel>>(
    () => new Set()
  );
  useValueWithCallbacksEffect(currentChannelVWC, (c) => {
    const seen = seenChannelsVWC.get();
    if (seen.has(c)) {
      return undefined;
    }

    const newSeen = new Set(seen);
    newSeen.add(c);
    setVWC(seenChannelsVWC, newSeen);
    trace({ type: 'channel_seen', channel: c });
    return undefined;
  });

  const haveMoreChannelsVWC = useMappedValuesWithCallbacks(
    [seenChannelsVWC, effectiveChannelsVWC],
    () => {
      const seen = seenChannelsVWC.get();
      const effective = effectiveChannelsVWC.get();
      return (
        effective.length > seen.size || effective.some((c) => !seen.has(c))
      );
    }
  );

  const windowWidth = useMappedValueWithCallbacks(
    ctx.windowSizeImmediate,
    (s) => s.width
  );

  return (
    <GridFullscreenContainer
      windowSizeImmediate={ctx.windowSizeImmediate}
      modals={modals}
      statusBar
    >
      <GridDarkGrayBackground />
      <GridContentContainer
        contentWidthVWC={windowWidth}
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
        {screen.parameters.nav.type === 'nav' ? (
          <VerticalSpacer
            height={GRID_SIMPLE_NAVIGATION_FOREGROUND_TOP_HEIGHT}
          />
        ) : (
          <ContentContainer
            contentWidthVWC={ctx.contentWidth}
            justifyContent="flex-start"
          >
            <View style={styles.backWrapper}>
              <Pressable onPress={() => handleBack(screen.parameters.back)}>
                <Back />
              </Pressable>
            </View>
          </ContentContainer>
        )}
        <VerticalSpacer height={0} flexBasis={0} flexGrow={3} />
        <ChannelSelector
          current={currentChannelVWC}
          all={effectiveChannelsVWC}
          onTap={(c) => setVWC(currentChannelVWC, c)}
          noTopPadding
        />
        <VerticalSpacer height={4} flexBasis={4} flexGrow={1} />
        <ContentContainer
          contentWidthVWC={ctx.contentWidth}
          justifyContent="flex-start"
        >
          <ChannelText
            format={screen.parameters.header}
            channel={currentChannelVWC}
            style={styles.title}
          />
        </ContentContainer>
        <VerticalSpacer height={16} />
        <ContentContainer
          contentWidthVWC={ctx.contentWidth}
          justifyContent="flex-start"
        >
          <ChannelText
            format={screen.parameters.message}
            channel={currentChannelVWC}
            style={styles.description}
          />
        </ContentContainer>
        <VerticalSpacer height={16} flexBasis={16} flexGrow={3} />
        <ContentContainer
          contentWidthVWC={ctx.contentWidth}
          justifyContent="flex-start"
        >
          <EditReminderTime
            timeRange={timeRangeVWC}
            days={daysVWC}
            channel={currentChannelVWC}
            onOpenTimeRange={() => {
              trace({
                type: 'open_time',
                channel: currentChannelVWC.get(),
                time: timeRangeVWC.get(),
              });
            }}
            onClosedTimeRange={() => {
              trace({
                type: 'close_time',
                channel: currentChannelVWC.get(),
                time: timeRangeVWC.get(),
              });
            }}
            onOpenDays={() => {
              trace({
                type: 'open_days',
                channel: currentChannelVWC.get(),
                days: Array.from(daysVWC.get()),
              });
            }}
            onClosedDays={() => {
              trace({
                type: 'close_days',
                channel: currentChannelVWC.get(),
                days: Array.from(daysVWC.get()),
              });
            }}
          />
        </ContentContainer>
        <VerticalSpacer height={16} flexBasis={16} flexGrow={2} />
        <ContentContainer
          contentWidthVWC={ctx.contentWidth}
          justifyContent="flex-start"
        >
          <TextStyleForwarder
            component={(styleVWC) => (
              <FilledInvertedButton
                onPress={() => {
                  screenWithWorking(workingVWC, async () => {
                    const exit = () =>
                      screenOut(
                        null,
                        startPop,
                        transition,
                        screen.parameters.cta.exit,
                        screen.parameters.cta.trigger
                      );
                    const save = prepareSave();
                    if (screen.parameters.cta.next === null) {
                      if (save === null) {
                        trace({
                          type: 'cta',
                          channel: currentChannelVWC.get(),
                          draft: false,
                          continueStrat: 'disabled',
                        });
                        await exit();
                      } else {
                        trace({
                          type: 'cta',
                          channel: currentChannelVWC.get(),
                          draft: true,
                          continueStrat: 'disabled',
                          step: 'start',
                        });
                        const result = await save();
                        trace({
                          type: 'cta',
                          channel: currentChannelVWC.get(),
                          draft: true,
                          continueStrat: 'disabled',
                          step: 'end',
                          result,
                        });
                        if (result) {
                          await exit();
                        }
                      }
                      return;
                    }

                    if (save !== null) {
                      trace({
                        type: 'cta',
                        channel: currentChannelVWC.get(),
                        draft: true,
                        continueStrat: 'try-next',
                        step: 'save-start',
                      });
                      const result = await save();
                      if (!result) {
                        trace({
                          type: 'cta',
                          channel: currentChannelVWC.get(),
                          draft: true,
                          continueStrat: 'try-next',
                          step: 'save-end',
                          result: false,
                        });
                        return;
                      }
                    }

                    const channels = effectiveChannelsVWC.get();
                    const seen = seenChannelsVWC.get();
                    const next = channels.find((c) => !seen.has(c));
                    if (next !== undefined) {
                      trace({
                        type: 'cta',
                        channel: currentChannelVWC.get(),
                        continueStrat: 'next',
                      });
                      setVWC(currentChannelVWC, next);
                      return;
                    } else {
                      trace({
                        type: 'cta',
                        channel: currentChannelVWC.get(),
                        continueStrat: 'exit',
                      });
                      await exit();
                    }
                  });
                }}
                setTextStyle={(s) => setVWC(styleVWC, s)}
              >
                {screen.parameters.cta.next === null ? (
                  <RenderGuardedComponent
                    props={styleVWC}
                    component={(s) => (
                      <Text style={s}>{screen.parameters.cta.final}</Text>
                    )}
                  />
                ) : (
                  <RenderGuardedComponent
                    props={haveMoreChannelsVWC}
                    component={(haveMore) => (
                      <RenderGuardedComponent
                        props={styleVWC}
                        component={(s) => (
                          <Text style={s}>
                            {haveMore
                              ? screen.parameters.cta.next
                              : screen.parameters.cta.final}
                          </Text>
                        )}
                      />
                    )}
                  />
                )}
              </FilledInvertedButton>
            )}
          />
        </ContentContainer>
        <VerticalSpacer height={16} flexBasis={16} flexGrow={1} />

        {screen.parameters.nav.type === 'nav' && (
          <VerticalSpacer
            height={GRID_SIMPLE_NAVIGATION_FOREGROUND_BOTTOM_HEIGHT}
          />
        )}
        <RenderGuardedComponent
          props={ctx.botBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
      </GridContentContainer>
      {screen.parameters.nav.type === 'nav' && (
        <GridSimpleNavigationForeground
          workingVWC={workingVWC}
          startPop={startPop}
          gridSize={ctx.windowSizeImmediate}
          transitionState={transitionState}
          transition={transition}
          trace={trace}
          back={() => handleBack(screen.parameters.back)}
          home={() => {
            if (screen.parameters.nav.type !== 'nav') {
              return;
            }

            handleBack({
              trigger: screen.parameters.nav.home.trigger,
              exit: { type: 'fade', ms: 350 },
            });
          }}
          series={() => {
            if (screen.parameters.nav.type !== 'nav') {
              return;
            }

            handleBack({
              trigger: screen.parameters.nav.series.trigger,
              exit: { type: 'fade', ms: 350 },
            });
          }}
          account={null}
          title={screen.parameters.nav.title}
          topBarHeight={ctx.topBarHeight}
          botBarHeight={ctx.botBarHeight}
        />
      )}
      <WipeTransitionOverlay wipe={transitionState.wipe} />
    </GridFullscreenContainer>
  );
};

const ChannelText = ({
  format,
  channel,
  style,
}: {
  format: string;
  channel: ValueWithCallbacks<Channel>;
  style: TextStyle | undefined;
}): ReactElement => {
  return (
    <RenderGuardedComponent
      props={useMappedValueWithCallbacks(channel, (c) =>
        formatChannelText(format, c)
      )}
      component={(text) => <Text style={style}>{text}</Text>}
    />
  );
};

const formatChannelText = (format: string, channel: Channel): string =>
  format.replace(/\[channel\]/g, channel).replace(/'/g, '’');