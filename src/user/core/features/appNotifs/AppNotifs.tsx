import { ReactElement, useCallback, useContext } from 'react';
import { FeatureComponentProps } from '../../models/Feature';
import { AppNotifsResources } from './AppNotifsResources';
import { AppNotifsState } from './AppNotifsState';
import { useStartSession } from '../../../../shared/hooks/useInappNotificationSession';
import { adaptValueWithCallbacksAsVariableStrategyProps } from '../../../../shared/lib/adaptValueWithCallbacksAsVariableStrategyProps';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { Platform, View, Text, StyleProp, TextStyle } from 'react-native';
import { setVWC } from '../../../../shared/lib/setVWC';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import { styles } from './AppNotifsStyles';
import { STANDARD_BLACK_GRAY_GRADIENT_SVG } from '../../../../styling/colors';
import { StatusBar } from 'expo-status-bar';
import * as SVG from 'react-native-svg';
import { FilledInvertedButton } from '../../../../shared/components/FilledInvertedButton';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { LinkButton } from '../../../../shared/components/LinkButton';
import { FullscreenView } from '../../../../shared/components/FullscreenView';
import { useContentWidth } from '../../../../shared/lib/useContentWidth';
import { SvgLinearGradientBackground } from '../../../../shared/anim/SvgLinearGradientBackground';
import { PartialPushIcon } from '../requestNotificationTime/partialIcons/PartialPushIcon';
import { useReactManagedValueAsValueWithCallbacks } from '../../../../shared/hooks/useReactManagedValueAsValueWithCallbacks';
import { TimeRange } from '../requestNotificationTime/EditTimeRange';
import {
  DEFAULT_DAYS,
  DEFAULT_TIME_RANGE,
} from '../requestNotificationTime/constants';
import { DayOfWeek } from '../requestNotificationTime/RequestNotificationTimeResources';
import { EditReminderTime } from '../requestNotificationTime/EditReminderTime';
import { ModalProvider } from '../../../../shared/contexts/ModalContext';
import { apiFetch } from '../../../../shared/lib/apiFetch';
import { LoginContext } from '../../../../shared/contexts/LoginContext';
import { useTimezone } from '../../../../shared/hooks/useTimezone';

/**
 * Displays our screen asking the user if they want to receive notifications. We
 * use this screen before the native dialog both to provide context and because
 * we may not get another chance to use the native dialog if they say no.
 */
export const AppNotifs = ({
  state,
  resources,
}: FeatureComponentProps<AppNotifsState, AppNotifsResources>): ReactElement => {
  const loginContextRaw = useContext(LoginContext);
  const timezone = useTimezone();

  useStartSession(
    adaptValueWithCallbacksAsVariableStrategyProps(
      useMappedValueWithCallbacks(resources, (r) => r.session)
    )
  );

  const sentOpen = useWritableValueWithCallbacks(() => false);
  useValueWithCallbacksEffect(resources, (res) => {
    const session = res.session;
    if (sentOpen.get() || session === null) {
      return undefined;
    }
    session.storeAction('open', {
      last_requested_locally:
        state.get().lastRequestedLocally?.getTime() ?? null,
      platform: Platform.OS,
    });
    setVWC(sentOpen, true);
    return undefined;
  });

  const nativePromptIsOpen = useWritableValueWithCallbacks(() => false);
  const isSkipping = useWritableValueWithCallbacks(() => false);

  const timeRange = useWritableValueWithCallbacks<TimeRange>(() => ({
    ...DEFAULT_TIME_RANGE,
  }));
  const days = useWritableValueWithCallbacks<Set<DayOfWeek>>(
    () => new Set(DEFAULT_DAYS)
  );

  const doOpenNative = useCallback(async () => {
    if (nativePromptIsOpen.get() || isSkipping.get()) {
      return;
    }

    const loginRaw = loginContextRaw.value.get();
    if (loginRaw.state !== 'logged-in') {
      return;
    }
    const login = loginRaw;

    const session = resources.get().session;
    setVWC(nativePromptIsOpen, true);
    try {
      session?.storeAction('open_native', {
        time_range: timeRange.get(),
        days: Array.from(days.get()),
      });
      const newStatus = await state.get().requestUsingNativeDialog();
      session?.storeAction('close_native', {
        granted: newStatus.granted,
        error: null,
      });

      if (newStatus.granted) {
        try {
          await apiFetch(
            '/api/1/users/me/attributes/notification_time',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json; charset=utf-8' },
              body: JSON.stringify({
                days_of_week: Array.from(days.get()),
                time_range: timeRange.get(),
                channel: 'push',
                timezone: timezone.timeZone,
                timezone_technique: timezone.guessed ? 'app-guessed' : 'app',
              }),
            },
            login
          );
        } catch (e) {
          console.log('Failed to set notification time', e);
        }
      }
    } catch (e) {
      session?.storeAction('close_native', {
        granted: false,
        error: `${e}`,
      });
    } finally {
      try {
        await state.get().onDoneRequestingLocally();
      } finally {
        setVWC(nativePromptIsOpen, false);
      }
    }
  }, [
    isSkipping,
    nativePromptIsOpen,
    state,
    resources,
    days,
    timeRange,
    timezone,
    loginContextRaw,
  ]);

  const doSkip = useCallback(async () => {
    if (nativePromptIsOpen.get() || isSkipping.get()) {
      return;
    }

    const session = resources.get().session;
    setVWC(isSkipping, true);
    try {
      await session?.storeAction('skip', null);
    } finally {
      try {
        await state.get().onDoneRequestingLocally();
      } finally {
        setVWC(isSkipping, false);
      }
    }
  }, [isSkipping, nativePromptIsOpen, state, resources]);

  const textStyleVWC = useWritableValueWithCallbacks<StyleProp<TextStyle>>(
    () => undefined
  );
  const linkTextStyleVWC = useWritableValueWithCallbacks<StyleProp<TextStyle>>(
    () => undefined
  );

  const contentWidth = useContentWidth();

  return (
    <View style={styles.container}>
      <SvgLinearGradientBackground
        state={{
          type: 'react-rerender',
          props: STANDARD_BLACK_GRAY_GRADIENT_SVG,
        }}
      >
        <FullscreenView style={styles.background}>
          <ModalProvider>
            <View style={{ ...styles.content, width: contentWidth }}>
              <SVG.Svg width="126" height="111" viewBox="-15 0 126 111">
                <SVG.Rect
                  x="0"
                  y="15"
                  width="96"
                  height="96"
                  fill="#446266"
                  rx="14.58"
                />
                <SVG.G transform="translate(-2, 13)">
                  <PartialPushIcon
                    color={useReactManagedValueAsValueWithCallbacks([
                      1, 1, 1, 1,
                    ])}
                  />
                </SVG.G>
                <SVG.Circle cx="93" y="18" r="18" fill="red" />
              </SVG.Svg>
              <Text style={styles.title}>
                Habits stick better with&nbsp;reminders
              </Text>
              <Text style={styles.subtitle}>
                78% of Oseh users stick with their habits when using
                notifications
              </Text>
              <EditReminderTime timeRange={timeRange} days={days} />
              <FilledInvertedButton
                onPress={doOpenNative}
                setTextStyle={useCallback(
                  (s: StyleProp<TextStyle>) => setVWC(textStyleVWC, s),
                  [textStyleVWC]
                )}
                width={contentWidth}
                marginTop={40}
              >
                <RenderGuardedComponent
                  props={textStyleVWC}
                  component={(textStyle) => (
                    <Text style={textStyle}>Allow Notifications</Text>
                  )}
                />
              </FilledInvertedButton>
              <LinkButton
                onPress={doSkip}
                width={contentWidth}
                marginTop={24}
                setTextStyle={useCallback(
                  (s: StyleProp<TextStyle>) => setVWC(linkTextStyleVWC, s),
                  [linkTextStyleVWC]
                )}
              >
                <RenderGuardedComponent
                  props={linkTextStyleVWC}
                  component={(textStyle) => <Text style={textStyle}>Skip</Text>}
                />
              </LinkButton>
            </View>
          </ModalProvider>
        </FullscreenView>
      </SvgLinearGradientBackground>
      <StatusBar style="light" />
    </View>
  );
};
