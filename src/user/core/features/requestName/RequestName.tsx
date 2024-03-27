import { ReactElement, useCallback, useContext } from 'react';
import { StyleProp, Text, TextStyle, View } from 'react-native';
import { LoginContext } from '../../../../shared/contexts/LoginContext';
import { RequestNameResources } from './RequestNameResources';
import { RequestNameState } from './RequestNameState';
import { FeatureComponentProps } from '../../models/Feature';
import { styles } from './RequestNameStyles';
import { RSQUO } from '../../../../shared/lib/HtmlEntities';
import { OsehTextInput } from '../../../../shared/forms/OsehTextInput';
import { apiFetch } from '../../../../shared/lib/apiFetch';
import { describeError } from '../../../../shared/lib/describeError';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { setVWC } from '../../../../shared/lib/setVWC';
import { Modals, ModalsOutlet } from '../../../../shared/contexts/ModalContext';
import { useErrorModal } from '../../../../shared/hooks/useErrorModal';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { useKeyboardVisibleValueWithCallbacks } from '../../../../shared/lib/useKeyboardVisibleValueWithCallbacks';
import { useContentWidth } from '../../../../shared/lib/useContentWidth';
import { FilledInvertedButton } from '../../../../shared/components/FilledInvertedButton';
import { STANDARD_DARK_BLACK_GRAY_GRADIENT_SVG } from '../../../../styling/colors';
import { StatusBar } from 'expo-status-bar';
import { useWindowSizeValueWithCallbacks } from '../../../../shared/hooks/useWindowSize';
import { useValuesWithCallbacksEffect } from '../../../../shared/hooks/useValuesWithCallbacksEffect';
import { SvgLinearGradient } from '../../../../shared/anim/SvgLinearGradient';
import { useTopBarHeight } from '../../../../shared/hooks/useTopBarHeight';
import { useBotBarHeight } from '../../../../shared/hooks/useBotBarHeight';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';

/**
 * Prompts the user their name.
 */
export const RequestName = ({
  state,
  resources,
}: FeatureComponentProps<
  RequestNameState,
  RequestNameResources
>): ReactElement => {
  const windowSizeVWC = useWindowSizeValueWithCallbacks();
  const loginContextRaw = useContext(LoginContext);
  const firstNameVWC = useWritableValueWithCallbacks(() => '');
  const lastNameVWC = useWritableValueWithCallbacks(() => '');
  const errorVWC = useWritableValueWithCallbacks<ReactElement | null>(
    () => null
  );
  const savingVWC = useWritableValueWithCallbacks(() => false);
  const keyboardVisibleVWC = useKeyboardVisibleValueWithCallbacks();

  // When keyboard is visible it'd be nice if they moved to the top of the screen
  // so it's easy to get to the last name field

  const saveTextStyleVWC = useWritableValueWithCallbacks<StyleProp<TextStyle>>(
    () => ({})
  );
  const updateSaveTextStyleVWC = useCallback(
    (v: StyleProp<TextStyle>) => {
      setVWC(saveTextStyleVWC, v);
    },
    [saveTextStyleVWC]
  );

  const onSubmit = useCallback(async () => {
    if (savingVWC.get()) {
      return;
    }
    const loginRaw = loginContextRaw.value.get();
    if (loginRaw.state !== 'logged-in') {
      return;
    }
    const login = loginRaw;

    setVWC(savingVWC, true);
    const firstName = firstNameVWC.get();
    const lastName = lastNameVWC.get();
    try {
      const response = await apiFetch(
        '/api/1/users/me/attributes/name',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: JSON.stringify({
            given_name: firstName,
            family_name: lastName,
          }),
        },
        login
      );

      if (!response.ok) {
        throw response;
      }

      const data: { given_name: string; family_name: string } =
        await response.json();
      loginContextRaw.setUserAttributes({
        ...login.userAttributes,
        name: data.given_name + ' ' + data.family_name,
        givenName: data.given_name,
        familyName: data.family_name,
      });
    } catch (e) {
      console.error(e);
      const err = await describeError(e);
      setVWC(errorVWC, err);
      throw new Error('Network request failed');
    } finally {
      setVWC(savingVWC, false);
    }
  }, [loginContextRaw, firstNameVWC, lastNameVWC, savingVWC, errorVWC]);

  const modals = useWritableValueWithCallbacks<Modals>(() => []);
  useErrorModal(modals, errorVWC, 'request name');

  const contentWidth = useContentWidth();

  const foregroundRef = useWritableValueWithCallbacks<View | null>(() => null);
  const foregroundStyleVWC = useMappedValueWithCallbacks(
    windowSizeVWC,
    (size) => ({
      width: size.width,
      height: size.height,
    })
  );

  useValuesWithCallbacksEffect([foregroundRef, foregroundStyleVWC], () => {
    const ele = foregroundRef.get();
    const style = foregroundStyleVWC.get();
    if (ele !== null) {
      ele.setNativeProps({ style: Object.assign({}, style) });
    }
    return undefined;
  });

  const topBarHeight = useTopBarHeight();
  const botBarHeight = useBotBarHeight();
  const continueTextStyleVWC = useWritableValueWithCallbacks<
    StyleProp<TextStyle>
  >(() => undefined);
  const disabledVWC = useMappedValuesWithCallbacks(
    [firstNameVWC, lastNameVWC, savingVWC],
    () =>
      firstNameVWC.get().length === 0 ||
      lastNameVWC.get().length === 0 ||
      savingVWC.get()
  );

  const buttonStateVWC = useMappedValuesWithCallbacks(
    [disabledVWC, savingVWC],
    () => ({
      disabled: disabledVWC.get(),
      spinner: savingVWC.get(),
    })
  );

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <SvgLinearGradient state={STANDARD_DARK_BLACK_GRAY_GRADIENT_SVG} />
      </View>
      <View
        style={Object.assign({}, styles.foreground, foregroundStyleVWC.get())}
        ref={(r) => setVWC(foregroundRef, r)}
      >
        <View style={{ height: topBarHeight }} />
        <View
          style={Object.assign({}, styles.content, { width: contentWidth })}
        >
          <RenderGuardedComponent
            props={keyboardVisibleVWC}
            component={(keyboardVis) => (
              <View
                style={
                  keyboardVis
                    ? styles.keyboardVisiblePadding
                    : styles.contentSpacer
                }
              />
            )}
          />
          <View style={styles.form}>
            <Text style={styles.title}>What{RSQUO}s your name?</Text>
            <OsehTextInput
              label="First Name"
              defaultValue={firstNameVWC.get()}
              onChange={(v) => setVWC(firstNameVWC, v)}
              disabled={false}
              inputStyle="white"
            />
            <OsehTextInput
              label="Last Name"
              defaultValue={lastNameVWC.get()}
              onChange={(v) => setVWC(lastNameVWC, v)}
              disabled={false}
              inputStyle="white"
            />
          </View>
          <RenderGuardedComponent
            props={keyboardVisibleVWC}
            component={(keyboardVis) => (
              <View
                style={
                  keyboardVis
                    ? styles.keyboardVisiblePadding
                    : styles.contentSpacer
                }
              />
            )}
          />
          <View style={styles.footer}>
            <RenderGuardedComponent
              props={buttonStateVWC}
              component={({ disabled, spinner }) => (
                <FilledInvertedButton
                  width={contentWidth}
                  setTextStyle={(s) => setVWC(continueTextStyleVWC, s)}
                  disabled={disabled}
                  spinner={spinner}
                  onPress={onSubmit}
                >
                  <RenderGuardedComponent
                    props={continueTextStyleVWC}
                    component={(s) => <Text style={s}>Continue</Text>}
                  />
                </FilledInvertedButton>
              )}
            />
          </View>
        </View>
        <View style={{ height: botBarHeight }} />
      </View>
      <ModalsOutlet modals={modals} />
      <StatusBar style="light" />
    </View>
  );
};
