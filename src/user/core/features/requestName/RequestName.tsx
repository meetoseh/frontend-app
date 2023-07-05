import { ReactElement, useCallback, useContext, useState } from "react";
import { StyleProp, Text, TextStyle, View } from "react-native";
import { LoginContext } from "../../../../shared/contexts/LoginContext";
import { RequestNameResources } from "./RequestNameResources";
import { RequestNameState } from "./RequestNameState";
import { FeatureComponentProps } from "../../models/Feature";
import { OsehImageBackgroundFromState } from "../../../../shared/images/OsehImageBackgroundFromState";
import { styles } from "./RequestNameStyles";
import { RSQUO } from "../../../../shared/lib/HtmlEntities";
import { OsehTextInput } from "../../../../shared/forms/OsehTextInput";
import { apiFetch } from "../../../../shared/lib/apiFetch";
import { describeError } from "../../../../shared/lib/describeError";
import { FilledPrimaryButton } from "../../../../shared/components/FilledPrimaryButton";
import { useUnwrappedValueWithCallbacks } from "../../../../shared/hooks/useUnwrappedValueWithCallbacks";
import { useMappedValueWithCallbacks } from "../../../../shared/hooks/useMappedValueWithCallbacks";

/**
 * Prompts the user their name.
 */
export const RequestName = ({
  resources,
}: FeatureComponentProps<
  RequestNameState,
  RequestNameResources
>): ReactElement => {
  const loginContext = useContext(LoginContext);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<ReactElement | null>(null);
  const [saving, setSaving] = useState(false);

  const [saveTextStyle, setSaveTextStyle] = useState<StyleProp<TextStyle>>(
    () => ({})
  );

  const onSubmit = useCallback(async () => {
    setSaving(true);
    try {
      const response = await apiFetch(
        "/api/1/users/me/attributes/name",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
          body: JSON.stringify({
            given_name: firstName,
            family_name: lastName,
          }),
        },
        loginContext
      );

      if (!response.ok) {
        throw response;
      }

      const data: { given_name: string; family_name: string } =
        await response.json();
      if (loginContext.userAttributes !== null) {
        loginContext.setUserAttributes({
          ...loginContext.userAttributes,
          name: data.given_name + " " + data.family_name,
          givenName: data.given_name,
          familyName: data.family_name,
        });
      }
    } catch (e) {
      console.error(e);
      const err = await describeError(e);
      setError(err);
      throw new Error("Network request failed");
    } finally {
      setSaving(false);
    }
  }, [loginContext, firstName, lastName]);

  return (
    <OsehImageBackgroundFromState
      state={useUnwrappedValueWithCallbacks(
        useMappedValueWithCallbacks(resources, (r) => r.background)
      )}
      style={styles.container}
    >
      {error}
      <Text style={styles.title}>What{RSQUO}s Your Name?</Text>
      <OsehTextInput
        type="text"
        label="First Name"
        value={firstName}
        onChange={setFirstName}
        bonusTextInputProps={{ autoComplete: "name-given" }}
        disabled={false}
        inputStyle={"white"}
      />
      <View style={styles.inputSpacing} />
      <OsehTextInput
        type="text"
        label="Last Name"
        value={lastName}
        onChange={setLastName}
        bonusTextInputProps={{ autoComplete: "name-family" }}
        disabled={false}
        inputStyle={"white"}
      />
      <View style={styles.inputSubmitSpacing} />
      <FilledPrimaryButton
        onPress={onSubmit}
        disabled={saving}
        setTextStyle={setSaveTextStyle}
        fullWidth
      >
        <Text style={saveTextStyle}>Save</Text>
      </FilledPrimaryButton>
    </OsehImageBackgroundFromState>
  );
};
