import { ReactElement, useCallback } from "react";
import { FeatureComponentProps } from "../../models/Feature";
import { AppNotifsResources } from "./AppNotifsResources";
import { AppNotifsState } from "./AppNotifsState";
import { useStartSession } from "../../../../shared/hooks/useInappNotificationSession";
import { adaptValueWithCallbacksAsVariableStrategyProps } from "../../../../shared/lib/adaptValueWithCallbacksAsVariableStrategyProps";
import { useMappedValueWithCallbacks } from "../../../../shared/hooks/useMappedValueWithCallbacks";
import { useWritableValueWithCallbacks } from "../../../../shared/lib/Callbacks";
import { Platform, View, Text, StyleProp, TextStyle } from "react-native";
import { setVWC } from "../../../../shared/lib/setVWC";
import { useValueWithCallbacksEffect } from "../../../../shared/hooks/useValueWithCallbacksEffect";
import { styles } from "./AppNotifsStyles";
import { LinearGradientBackground } from "../../../../shared/anim/LinearGradientBackground";
import { STANDARD_BLACK_GRAY_GRADIENT } from "../../../../styling/colors";
import { useWindowSize } from "../../../../shared/hooks/useWindowSize";
import { StatusBar } from "expo-status-bar";
import OsehBrandmarkWhite from "./icons/OsehBrandmarkWhite";
import Svg, { Circle } from "react-native-svg";
import { FilledInvertedButton } from "../../../../shared/components/FilledInvertedButton";
import { RenderGuardedComponent } from "../../../../shared/components/RenderGuardedComponent";
import { LinkButton } from "../../../../shared/components/LinkButton";

/**
 * Displays our screen asking the user if they want to receive notifications. We
 * use this screen before the native dialog both to provide context and because
 * we may not get another chance to use the native dialog if they say no.
 */
export const AppNotifs = ({
  state,
  resources,
}: FeatureComponentProps<AppNotifsState, AppNotifsResources>): ReactElement => {
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
    session.storeAction("open", {
      last_requested_locally:
        state.get().lastRequestedLocally?.getTime() ?? null,
      platform: Platform.OS,
    });
    setVWC(sentOpen, true);
    return undefined;
  });

  const nativePromptIsOpen = useWritableValueWithCallbacks(() => false);
  const isSkipping = useWritableValueWithCallbacks(() => false);
  const doOpenNative = useCallback(async () => {
    if (nativePromptIsOpen.get() || isSkipping.get()) {
      return;
    }

    const session = resources.get().session;
    setVWC(nativePromptIsOpen, true);
    try {
      session?.storeAction("open_native", null);
      const newStatus = await state.get().requestUsingNativeDialog();
      session?.storeAction("close_native", {
        granted: newStatus.granted,
        error: null,
      });
    } catch (e) {
      session?.storeAction("close_native", {
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
  }, [isSkipping, nativePromptIsOpen, state, resources]);

  const doSkip = useCallback(async () => {
    if (nativePromptIsOpen.get() || isSkipping.get()) {
      return;
    }

    const session = resources.get().session;
    setVWC(isSkipping, true);
    try {
      await session?.storeAction("skip", null);
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

  const windowSize = useWindowSize();

  return (
    <View style={styles.container}>
      <LinearGradientBackground
        state={{
          type: "react-rerender",
          props: STANDARD_BLACK_GRAY_GRADIENT,
        }}
      >
        <View
          style={{
            ...styles.background,
            width: windowSize.width,
            height: windowSize.height,
          }}
        >
          <View style={{ ...styles.content, width: windowSize.width - 64 }}>
            <View style={styles.appWithBadge}>
              <View style={styles.appIcon}>
                <OsehBrandmarkWhite />
              </View>
              <View style={styles.appBadge}>
                <Svg width={38} height={38} viewBox="0 0 38 38">
                  <Circle cx={19} cy={19} r={19} fill="#FF0000" />
                </Svg>
              </View>
            </View>
            <Text style={styles.title}>
              Oseh is much better with&nbsp;notifications
            </Text>
            <Text style={styles.subtitle}>
              Grow your habit with daily reminders
            </Text>
            <FilledInvertedButton
              onPress={doOpenNative}
              setTextStyle={useCallback(
                (s: StyleProp<TextStyle>) => setVWC(textStyleVWC, s),
                [textStyleVWC]
              )}
              fullWidth
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
              fullWidth
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
        </View>
      </LinearGradientBackground>
      <StatusBar style="light" />
    </View>
  );
};
