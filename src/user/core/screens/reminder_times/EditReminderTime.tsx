import {
  Callbacks,
  ValueWithCallbacks,
  WritableValueWithCallbacks,
  createWritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../../shared/lib/Callbacks';
import { EditTimeRange, TimeRange, areRangesEqual } from './EditTimeRange';
import { styles } from './EditReminderTimeStyles';
import {
  PropsWithChildren,
  ReactElement,
  useCallback,
  useContext,
  useRef,
} from 'react';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import {
  ModalContext,
  addModalWithCallbackToRemove,
} from '../../../../shared/contexts/ModalContext';
import { setVWC } from '../../../../shared/lib/setVWC';
import { SlideInModal } from '../../../../shared/components/SlideInModal';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { EditDays } from './EditDays';
import {
  makeDaysOfWeekPretty,
  makeTimeRangePretty,
  nameForChannel,
} from './formatUtils';
import { View, Text, Pressable } from 'react-native';
import { DayOfWeek } from '../../../../shared/models/DayOfWeek';
import { Channel } from './lib/Channel';
import { Forward } from '../../../../shared/components/icons/Forward';
import { OsehColors } from '../../../../shared/OsehColors';

export type EditReminderTimeProps = {
  /**
   * Used to report the current time range selection. This component fully
   * supports external writes. If the user is currently editing the time range
   * then writing to this will trigger an undesirable rerender, so this should
   * be only be modified due to some other user input.
   */
  timeRange: WritableValueWithCallbacks<TimeRange>;

  /**
   * Used to report the current days selection. This component
   * fully supports external writes. If the user is currently editing
   * the time range this will trigger an undesirable rerender, so this
   * should be only be modified due to some other user input.
   */
  days: WritableValueWithCallbacks<Set<DayOfWeek>>;

  /**
   * The channel that the user is currently editing, to provide additional
   * context.
   */
  channel?: ValueWithCallbacks<Channel>;

  /**
   * If specified, invoked when the user begins to modify the time range.
   */
  onOpenTimeRange?: () => void;

  /**
   * If specified, invoked when the user finishes modifying the time range.
   * Called just after writing to the time range.
   */
  onClosedTimeRange?: (newValue: TimeRange) => void;

  /**
   * If specified, invoked when the user begins to modify the days.
   */
  onOpenDays?: () => void;

  /**
   * If specified, invoked when the user finishes modifying the days.
   * Called just after writing to the days.
   */
  onClosedDays?: (newValue: Set<DayOfWeek>) => void;
};

function areSetsEqual<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size !== b.size) {
    return false;
  }

  const iter = a.values();
  let next = iter.next();
  while (!next.done) {
    if (!b.has(next.value)) {
      return false;
    }
    next = iter.next();
  }

  return true;
}

/**
 * Shows a simple section with a section header and then two
 * subcomponents, one for showing the time range and one for
 * showing the days. The user can tap either of these to open
 * a modal for editing them.
 *
 * Requires a modal context.
 */
export const EditReminderTime = ({
  timeRange,
  days,
  channel,
  onOpenTimeRange,
  onClosedTimeRange,
  onOpenDays,
  onClosedDays,
}: EditReminderTimeProps): ReactElement => {
  const modalContext = useContext(ModalContext);
  const editingTimeRange = useWritableValueWithCallbacks(() => false);
  const editingDays = useWritableValueWithCallbacks(() => false);

  const onOpenTimeRangeRef = useRef(onOpenTimeRange);
  onOpenTimeRangeRef.current = onOpenTimeRange;

  const onClosedTimeRangeRef = useRef(onClosedTimeRange);
  onClosedTimeRangeRef.current = onClosedTimeRange;

  const onOpenDaysRef = useRef(onOpenDays);
  onOpenDaysRef.current = onOpenDays;

  const onClosedDaysRef = useRef(onClosedDays);
  onClosedDaysRef.current = onClosedDays;

  useValueWithCallbacksEffect(
    editingTimeRange,
    useCallback(
      (visible) => {
        if (!visible) {
          return undefined;
        }

        const cancelers = new Callbacks<undefined>();
        const guardedTimeRange = createWritableValueWithCallbacks<TimeRange>(
          timeRange.get()
        );
        const disabled = createWritableValueWithCallbacks<boolean>(true);
        const requestClose = createWritableValueWithCallbacks<() => void>(
          () => {}
        );
        const inputKey = createWritableValueWithCallbacks<number>(0);

        let reportedClose = false;
        const reportClose = () => {
          if (reportedClose) {
            return;
          }

          timeRange.callbacks.remove(timeRangeCallback);
          setVWC(timeRange, guardedTimeRange.get(), areRangesEqual);
          onClosedTimeRangeRef.current?.(guardedTimeRange.get());
        };

        const timeRangeCallback = () => {
          setVWC(guardedTimeRange, timeRange.get(), areRangesEqual);
          setVWC(inputKey, inputKey.get() + 1);
        };
        timeRange.callbacks.add(timeRangeCallback);
        cancelers.add(() => {
          timeRange.callbacks.remove(timeRangeCallback);
        });

        cancelers.add(
          addModalWithCallbackToRemove(
            modalContext.modals,
            <SlideInModal
              title="Time"
              onClosing={() => {
                reportClose();
              }}
              onClosed={() => {
                reportClose();
                setVWC(editingTimeRange, false);
              }}
              requestClose={requestClose}
              animating={disabled}
            >
              <RenderGuardedComponent
                props={inputKey}
                component={(key) => (
                  <EditTimeRange
                    key={key}
                    timeRange={guardedTimeRange}
                    disabled={disabled}
                    onContinue={requestClose}
                  />
                )}
              />
            </SlideInModal>
          )
        );

        return () => {
          cancelers.call(undefined);
          cancelers.clear();
        };
      },
      [editingTimeRange, timeRange, modalContext.modals]
    )
  );

  useValueWithCallbacksEffect(
    editingDays,
    useCallback(
      (visible) => {
        if (!visible) {
          return undefined;
        }

        const cancelers = new Callbacks<undefined>();
        const guardedDays = createWritableValueWithCallbacks<Set<DayOfWeek>>(
          days.get()
        );
        const disabled = createWritableValueWithCallbacks<boolean>(true);
        const requestClose = createWritableValueWithCallbacks<() => void>(
          () => {}
        );
        const inputKey = createWritableValueWithCallbacks<number>(0);

        let reportedClose = false;
        const reportClose = () => {
          if (reportedClose) {
            return;
          }

          days.callbacks.remove(daysCallback);
          setVWC(days, guardedDays.get(), areSetsEqual);
          onClosedDaysRef.current?.(guardedDays.get());
        };

        const daysCallback = () => {
          setVWC(guardedDays, days.get(), areSetsEqual);
          setVWC(inputKey, inputKey.get() + 1);
        };
        days.callbacks.add(daysCallback);
        cancelers.add(() => {
          days.callbacks.remove(daysCallback);
        });

        cancelers.add(
          addModalWithCallbackToRemove(
            modalContext.modals,
            <SlideInModal
              title="Repeat"
              onClosed={() => {
                reportClose();
                setVWC(editingDays, false);
              }}
              onClosing={() => {
                reportClose();
              }}
              requestClose={requestClose}
              animating={disabled}
            >
              <RenderGuardedComponent
                props={inputKey}
                component={(key) => (
                  <EditDays
                    key={key}
                    days={guardedDays}
                    disabled={disabled}
                    onContinue={requestClose}
                  />
                )}
              />
            </SlideInModal>
          )
        );

        return () => {
          cancelers.call(undefined);
          cancelers.clear();
        };
      },
      [editingDays, days, modalContext.modals]
    )
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>We&rsquo;ll remind you:</Text>
      <View style={styles.options}>
        <Option
          onPress={() => {
            onOpenTimeRangeRef.current?.();
            setVWC(editingTimeRange, true);
          }}
        >
          <View style={styles.optionTextContainer}>
            <RenderGuardedComponent
              props={timeRange}
              component={(range) => (
                <>
                  {range.start !== range.end ? (
                    <Text style={styles.optionText}>Between </Text>
                  ) : (
                    <Text style={styles.optionText}>At </Text>
                  )}
                  <Text style={styles.optionTextStrong}>
                    {makeTimeRangePretty(range.start, range.end)}
                  </Text>
                </>
              )}
            />
          </View>
          <Forward
            icon={{ width: 20 }}
            container={{ width: 20, height: 20 }}
            startPadding={{ x: { fraction: 0.5 }, y: { fraction: 0.5 } }}
            color={OsehColors.v4.primary.light}
          />
        </Option>
        <Option
          notFirst
          onPress={() => {
            onOpenDaysRef.current?.();
            setVWC(editingDays, true);
          }}
        >
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionText}>Repeat </Text>
            <RenderGuardedComponent
              props={days}
              component={(days) => (
                <Text style={styles.optionTextStrong}>
                  {makeDaysOfWeekPretty(Array.from(days))}
                  {days.size === 0 && (
                    <>
                      {' '}
                      (No
                      {channel && (
                        <RenderGuardedComponent
                          props={channel}
                          component={(ch) => <> {nameForChannel(ch)}</>}
                        />
                      )}{' '}
                      reminders)
                    </>
                  )}
                </Text>
              )}
            />
          </View>
          <Forward
            icon={{ width: 20 }}
            container={{ width: 20, height: 20 }}
            startPadding={{ x: { fraction: 0.5 }, y: { fraction: 0.5 } }}
            color={OsehColors.v4.primary.light}
          />
        </Option>
      </View>
    </View>
  );
};

const Option = ({
  onPress,
  notFirst,
  children,
}: PropsWithChildren<{
  onPress: () => void;
  notFirst?: boolean;
}>): ReactElement => {
  const containerRef = useRef<View>(null);
  const pressingIn = useWritableValueWithCallbacks(() => false);

  const handlePressIn = useCallback(() => {
    setVWC(pressingIn, true);
  }, [pressingIn]);

  const handlePressOut = useCallback(() => {
    setVWC(pressingIn, false);
  }, [pressingIn]);

  useValueWithCallbacksEffect(pressingIn, (pressing) => {
    const ref = containerRef.current;
    if (ref === null) {
      return undefined;
    }

    ref.setNativeProps({
      style: Object.assign(
        {},
        styles.option,
        notFirst ? styles.optionNotFirst : undefined,
        pressing
          ? {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            }
          : {
              backgroundColor: 'transparent',
            }
      ),
    });
  });

  return (
    <Pressable
      style={Object.assign(
        {},
        styles.option,
        notFirst ? styles.optionNotFirst : undefined,
        pressingIn.get()
          ? {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }
          : {
              backgroundColor: 'transparent',
            }
      )}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      ref={containerRef}
    >
      {children}
    </Pressable>
  );
};
