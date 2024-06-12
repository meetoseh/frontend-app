import { ReactElement, useCallback } from 'react';
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
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import {
  GRID_SIMPLE_NAVIGATION_FOREGROUND_BOTTOM_HEIGHT,
  GRID_SIMPLE_NAVIGATION_FOREGROUND_TOP_HEIGHT,
  GridSimpleNavigationForeground,
} from '../../../../shared/components/GridSimpleNavigationForeground';
import { AddPhoneResources } from './AddPhoneResources';
import { AddPhoneMappedParams } from './AddPhoneParams';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import Messages from './icons/Messages';
import { styles } from './AddPhoneStyles';
import { setVWC } from '../../../../shared/lib/setVWC';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { screenOut } from '../../lib/screenOut';
import { useErrorModal } from '../../../../shared/hooks/useErrorModal';
import { Modals } from '../../../../shared/contexts/ModalContext';
import { describeError } from '../../../../shared/lib/describeError';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { useTimezone } from '../../../../shared/hooks/useTimezone';
import { View, Text, StyleProp, TextStyle } from 'react-native';
import { OsehTextInput } from '../../../../shared/forms/OsehTextInput';
import { FilledInvertedButton } from '../../../../shared/components/FilledInvertedButton';
import { LinkButton } from '../../../../shared/components/LinkButton';
import * as Linking from 'expo-linking';
import { useKeyboardVisibleValueWithCallbacks } from '../../../../shared/lib/useKeyboardVisibleValueWithCallbacks';

/**
 * Allows the user to add a phone number; they need to verify the phone number
 * by entering a code that we send to them. Verification is performed on the next
 * screen, but sending the code occurs when they click the button.
 */
export const AddPhone = ({
  ctx,
  screen,
  startPop,
  trace,
}: ScreenComponentProps<
  'add_phone',
  AddPhoneResources,
  AddPhoneMappedParams
>): ReactElement => {
  const modals = useWritableValueWithCallbacks<Modals>(() => []);
  const transition = useTransitionProp(
    (): StandardScreenTransition => screen.parameters.entrance
  );
  useEntranceTransition(transition);

  const transitionState = useStandardTransitionsState(transition);

  const workingVWC = useWritableValueWithCallbacks(() => false);

  const phoneVWC = useWritableValueWithCallbacks(() => '');
  const errorPhoneVWC = useWritableValueWithCallbacks<boolean>(() => false);
  const formatAndSetPhone = useCallback(
    async (newValue: string) => {
      setVWC(errorPhoneVWC, false);

      if (newValue === '+') {
        setVWC(phoneVWC, '+');
        return;
      }

      if (newValue[0] === '+' && newValue[1] !== '1') {
        // international number; we'll just let them type it
        setVWC(phoneVWC, newValue);
        return;
      }

      let stripped = newValue.replace(/[^0-9]/g, '');

      if (newValue.endsWith('-')) {
        // they backspaced a space
        stripped = stripped.slice(0, -1);
      }

      if (stripped.length === 0) {
        setVWC(phoneVWC, '');
        return;
      }

      let result = stripped;
      if (result[0] !== '1') {
        result = '+1' + result;
      } else {
        result = '+' + result;
      }

      // +1123
      if (result.length >= 5) {
        result = result.slice(0, 5) + ' - ' + result.slice(5);
      }

      // +1123 - 456
      if (result.length >= 11) {
        result = result.slice(0, 11) + ' - ' + result.slice(11);
      }

      setVWC(phoneVWC, result);
    },
    [phoneVWC, errorPhoneVWC]
  );
  const phoneFormatCorrect = useMappedValueWithCallbacks(phoneVWC, (phone) => {
    if (phone.length < 3) {
      return false;
    }

    if (phone[0] === '+' && phone[1] !== '1') {
      // we don't bother validating international numbers
      return true;
    }

    // +1123 - 456 - 7890
    return phone.length === 18;
  });

  const errorVWC = useWritableValueWithCallbacks<ReactElement | null>(
    () => null
  );
  useErrorModal(modals, errorVWC, 'sending code to phone');

  const timezone = useTimezone();

  const ctaTextStyleVWC = useWritableValueWithCallbacks<StyleProp<TextStyle>>(
    () => undefined
  );
  const backTextStyleVWC = useWritableValueWithCallbacks<StyleProp<TextStyle>>(
    () => undefined
  );

  const keyboardVisible = useKeyboardVisibleValueWithCallbacks();

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
        scrollable={true}
      >
        <RenderGuardedComponent
          props={ctx.topBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
        {screen.parameters.nav.type === 'nav' && (
          <VerticalSpacer
            height={GRID_SIMPLE_NAVIGATION_FOREGROUND_TOP_HEIGHT}
          />
        )}
        <RenderGuardedComponent
          props={keyboardVisible}
          component={(v) =>
            v ? (
              <VerticalSpacer height={16} />
            ) : (
              <>
                <VerticalSpacer height={0} flexGrow={1} />
                <View style={styles.messages}>
                  <Messages width={111} height={111} />
                </View>
                <VerticalSpacer height={24} />
              </>
            )
          }
        />
        <Text style={styles.header}>{screen.parameters.header}</Text>
        <VerticalSpacer height={16} />
        <Text style={styles.message}>{screen.parameters.message}</Text>
        <RenderGuardedComponent
          props={keyboardVisible}
          component={(v) => (
            <VerticalSpacer height={v ? 32 : 0} flexGrow={v ? 0 : 1} />
          )}
        />
        <RenderGuardedComponent
          props={useMappedValuesWithCallbacks([workingVWC], () => ({
            disabled: workingVWC.get(),
          }))}
          component={({ disabled }) => (
            <OsehTextInput
              type="tel"
              label="Phone Number"
              defaultValue={phoneVWC.get()}
              inputStyle="white"
              onChange={formatAndSetPhone}
              disabled={disabled}
            />
          )}
          applyInstantly
        />
        <RenderGuardedComponent
          props={keyboardVisible}
          component={(v) => (
            <VerticalSpacer height={v ? 32 : 0} flexGrow={v ? 0 : 1} />
          )}
        />
        <FilledInvertedButton
          onPress={() => {
            if (!phoneFormatCorrect.get()) {
              setVWC(errorPhoneVWC, true);
              return;
            }

            screenOut(
              workingVWC,
              startPop,
              transition,
              screen.parameters.cta.exit,
              screen.parameters.cta.trigger,
              {
                endpoint: '/api/1/users/me/screens/pop_to_phone_verify',
                parameters: {
                  phone_number: phoneVWC.get(),
                  receive_notifications: screen.parameters.reminders,
                  timezone,
                  timezone_technique: 'browser',
                },
                onError: async (err) => {
                  const described = await describeError(err);
                  setVWC(errorVWC, described);
                },
              }
            );
          }}
          setTextStyle={(s) => setVWC(ctaTextStyleVWC, s)}
        >
          <RenderGuardedComponent
            props={ctaTextStyleVWC}
            component={(s) => (
              <Text style={s}>{screen.parameters.cta.text}</Text>
            )}
          />
        </FilledInvertedButton>
        {screen.parameters.nav.type === 'no-nav' && (
          <>
            <VerticalSpacer height={16} />
            <LinkButton
              onPress={() => {
                screenOut(
                  workingVWC,
                  startPop,
                  transition,
                  screen.parameters.back.exit,
                  screen.parameters.back.trigger
                );
              }}
              setTextStyle={(s) => setVWC(backTextStyleVWC, s)}
            >
              <RenderGuardedComponent
                props={backTextStyleVWC}
                component={(s) => (
                  <Text style={s}>
                    {screen.parameters.nav.type === 'no-nav'
                      ? screen.parameters.nav.back
                      : ''}
                  </Text>
                )}
              />
            </LinkButton>
          </>
        )}
        {screen.parameters.legal !== null && (
          <>
            <VerticalSpacer height={16} />
            <Text style={styles.legal}>
              {((fmt) => {
                const result: ReactElement[] = [];

                const nextLiteralRegex = /\[([^\]]+)\]/g;

                let handledUpTo = 0;
                while (true) {
                  const match = nextLiteralRegex.exec(fmt);
                  if (match === null) {
                    result.push(
                      <Text key={result.length}>{fmt.slice(handledUpTo)}</Text>
                    );
                    break;
                  }

                  const literal = match[1];

                  if (match.index > handledUpTo) {
                    result.push(
                      <Text key={result.length}>
                        {fmt.slice(handledUpTo, match.index)}
                      </Text>
                    );
                  }

                  if (literal === 'Terms') {
                    result.push(
                      <Text
                        key={result.length}
                        style={styles.legalLink}
                        onPress={() => {
                          Linking.openURL('https://www.oseh.com/terms');
                        }}
                      >
                        {literal}
                      </Text>
                    );
                  } else if (literal === 'Privacy Policy') {
                    result.push(
                      <Text
                        key={result.length}
                        style={styles.legalLink}
                        onPress={() => {
                          Linking.openURL('https://www.oseh.com/privacy');
                        }}
                      >
                        {literal}
                      </Text>
                    );
                  } else {
                    result.push(<Text key={result.length}>{literal}</Text>);
                  }
                  handledUpTo = match.index + match[0].length;
                }

                return <>{result}</>;
              })(screen.parameters.legal.replaceAll('\n', ' '))}
            </Text>
          </>
        )}
        <RenderGuardedComponent
          props={keyboardVisible}
          component={(v) => (
            <VerticalSpacer height={v ? 0 : 32} flexGrow={v ? 1 : 0} />
          )}
        />
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
