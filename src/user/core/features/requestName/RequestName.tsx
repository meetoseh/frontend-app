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
import { OsehImageBackgroundFromStateValueWithCallbacks } from '../../../../shared/images/OsehImageBackgroundFromStateValueWithCallbacks';
import { useKeyboardVisibleValueWithCallbacks } from '../../../../shared/lib/useKeyboardVisibleValueWithCallbacks';
import { useContentWidth } from '../../../../shared/lib/useContentWidth';
import { FilledInvertedButton } from '../../../../shared/components/FilledInvertedButton';

/**
 * Prompts the user their name.
 */
export const RequestName = ({
  resources,
}: FeatureComponentProps<
  RequestNameState,
  RequestNameResources
>): ReactElement => {
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

  return (
    <OsehImageBackgroundFromStateValueWithCallbacks
      state={useMappedValueWithCallbacks(resources, (r) => r.background)}
      styleVWC={useMappedValueWithCallbacks(keyboardVisibleVWC, (v) => {
        if (v) {
          return { ...styles.containerKeyboardVisible, width: contentWidth };
        } else {
          return { ...styles.container, width: contentWidth };
        }
      })}
    >
      <Text style={styles.title}>What{RSQUO}s Your Name?</Text>
      <OsehTextInput
        type="text"
        label="First Name"
        onChange={(v) => setVWC(firstNameVWC, v)}
        bonusTextInputProps={{ autoComplete: 'name-given' }}
        disabled={false}
        inputStyle={'white'}
      />
      <View style={styles.inputSpacing} />
      <OsehTextInput
        type="text"
        label="Last Name"
        onChange={(v) => setVWC(lastNameVWC, v)}
        bonusTextInputProps={{ autoComplete: 'name-family' }}
        disabled={false}
        inputStyle={'white'}
      />
      <View style={styles.inputSubmitSpacing} />
      <RenderGuardedComponent
        props={savingVWC}
        component={(saving) => (
          <FilledInvertedButton
            onPress={onSubmit}
            disabled={saving}
            setTextStyle={updateSaveTextStyleVWC}
            width={contentWidth}
          >
            <RenderGuardedComponent
              props={saveTextStyleVWC}
              component={(saveTextStyle) => (
                <Text style={saveTextStyle}>Save</Text>
              )}
            />
          </FilledInvertedButton>
        )}
      />
      <ModalsOutlet modals={modals} />
    </OsehImageBackgroundFromStateValueWithCallbacks>
  );
};
