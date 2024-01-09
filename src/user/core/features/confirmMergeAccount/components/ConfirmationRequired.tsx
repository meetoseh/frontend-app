import { ReactElement, useCallback, useContext, useMemo } from 'react';
import { FeatureComponentProps } from '../../../models/Feature';
import { ConfirmMergeAccountResources } from '../ConfirmMergeAccountResources';
import {
  ConfirmMergeAccountState,
  DailyReminderSettingsForConflict,
  EmailForConflict,
  OauthEmailConflictInfo,
  OauthPhoneConflictInfo,
  PhoneForConflict,
} from '../ConfirmMergeAccountState';
import { ConfirmMergeAccountWrapper } from './ConfirmMergeAccountWrapper';
import { styles } from './styles';
import { RenderGuardedComponent } from '../../../../../shared/components/RenderGuardedComponent';
import { useMappedValueWithCallbacks } from '../../../../../shared/hooks/useMappedValueWithCallbacks';
import {
  ValueWithCallbacks,
  WritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../../../shared/lib/Callbacks';
import { setVWC } from '../../../../../shared/lib/setVWC';
import { useErrorModal } from '../../../../../shared/hooks/useErrorModal';
import { ModalContext } from '../../../../../shared/contexts/ModalContext';
import { LoginContext } from '../../../../../shared/contexts/LoginContext';
import {
  ErrorBanner,
  ErrorBannerText,
} from '../../../../../shared/components/ErrorBanner';
import { apiFetch } from '../../../../../shared/lib/apiFetch';
import { describeError } from '../../../../../shared/lib/describeError';
import { StyleProp, Text, TextStyle, View } from 'react-native';
import { FilledInvertedButton } from '../../../../../shared/components/FilledInvertedButton';
import { Checkbox } from '../../../../../shared/components/Checkbox';

export const ConfirmationRequired = ({
  resources,
  state,
}: FeatureComponentProps<
  ConfirmMergeAccountState,
  ConfirmMergeAccountResources
>): ReactElement => {
  const modalContext = useContext(ModalContext);
  const loginContextRaw = useContext(LoginContext);
  const phoneHintVWC = useWritableValueWithCallbacks<string | null>(() => null);
  const phoneErrorVWC = useWritableValueWithCallbacks<string | null>(
    () => null
  );
  const emailHintVWC = useWritableValueWithCallbacks<string | null>(() => null);
  const emailErrorVWC = useWritableValueWithCallbacks<string | null>(
    () => null
  );
  const closeDisabled = useWritableValueWithCallbacks<boolean>(() => false);
  const modalError = useWritableValueWithCallbacks<ReactElement | null>(
    () => null
  );

  const mergeTextStyle = useWritableValueWithCallbacks<StyleProp<TextStyle>>(
    () => undefined
  );

  const onMerge = useCallback(async () => {
    if (closeDisabled.get()) {
      return;
    }
    const email = emailHintVWC.get();
    const phone = phoneHintVWC.get();
    const loginRaw = loginContextRaw.value.get();

    const s = state.get();
    if (
      s.result === false ||
      s.result === null ||
      s.result === undefined ||
      s.result.result !== 'confirmationRequired' ||
      s.result.conflictDetails === null ||
      s.confirmResult !== null ||
      loginRaw.state !== 'logged-in'
    ) {
      resources.get().session?.storeAction('confirm_start', {
        email,
        phone,
        error: "Invalid state for 'confirm_start' action",
      });
      setVWC(
        modalError,
        <ErrorBanner>
          <ErrorBannerText>
            Contact support at hi@oseh.com for assistance
          </ErrorBannerText>
        </ErrorBanner>
      );
      return;
    }
    const login = loginRaw;

    if (s.result.conflictDetails.email !== null && email === null) {
      resources.get().session?.storeAction('confirm_start', {
        email,
        phone,
        error: 'Email conflict but no email selected',
      });
      setVWC(
        emailErrorVWC,
        'You must select one. You will be able to turn off email reminders after merging.'
      );
      return;
    }

    if (s.result.conflictDetails.phone !== null && phone === null) {
      resources.get().session?.storeAction('confirm_start', {
        email,
        phone,
        error: 'Phone conflict but no phone selected',
      });
      setVWC(
        phoneErrorVWC,
        'You must select one. You will be able to turn off SMS reminders after merging.'
      );
      return;
    }

    setVWC(modalError, null);
    resources.get().session?.storeAction('confirm_start', {
      email,
      phone,
      error: null,
    });
    s.onResolvingConflict();
    try {
      const response = await apiFetch(
        '/api/1/oauth/merge/confirm',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: JSON.stringify({
            merge_token: s.result.conflictDetails.mergeJwt,
            email_hint: email,
            phone_hint: phone,
          }),
        },
        login
      );
      const status = response.status;
      resources.get().session?.storeAction('confirmed', {
        status,
      });

      if (status >= 200 && status < 300) {
        s.onResolveConflict(true, null);
      } else {
        s.onResolveConflict(false, await describeError(response));
      }
    } catch (e) {
      resources.get().session?.storeAction('confirmed', {
        error: `${e}`,
      });
      s.onResolveConflict(false, await describeError(e));
    }
  }, [
    state,
    closeDisabled,
    modalError,
    loginContextRaw,
    emailErrorVWC,
    phoneErrorVWC,
    resources,
    emailHintVWC,
    phoneHintVWC,
  ]);

  useErrorModal(modalContext.modals, modalError, 'confirm merge account');

  return (
    <ConfirmMergeAccountWrapper
      state={state}
      resources={resources}
      closeDisabled={closeDisabled}
    >
      <Text style={styles.title}>Merge Accounts</Text>
      <Text style={styles.description}>
        To merge your two accounts please let us know where you would like to
        receive your daily reminders:
      </Text>
      <RenderGuardedComponent
        props={useMappedValueWithCallbacks(state, (s) =>
          s.result === false ? undefined : s.result?.conflictDetails?.phone
        )}
        component={(conflict) =>
          conflict === null || conflict === undefined ? (
            <></>
          ) : (
            <ResolvePhoneConflict
              state={state}
              resources={resources}
              conflict={conflict}
              phoneHint={phoneHintVWC}
              error={phoneErrorVWC}
            />
          )
        }
      />
      <RenderGuardedComponent
        props={useMappedValueWithCallbacks(state, (s) =>
          s.result === false ? undefined : s.result?.conflictDetails?.email
        )}
        component={(conflict) =>
          conflict === null || conflict === undefined ? (
            <></>
          ) : (
            <ResolveEmailConflict
              state={state}
              resources={resources}
              conflict={conflict}
              emailHint={emailHintVWC}
              error={emailErrorVWC}
            />
          )
        }
      />
      <View style={styles.buttonContainer}>
        <RenderGuardedComponent
          props={closeDisabled}
          component={(disabled) => (
            <FilledInvertedButton
              onPress={onMerge}
              disabled={disabled}
              spinner={disabled}
              setTextStyle={(s) => setVWC(mergeTextStyle, s)}
            >
              <RenderGuardedComponent
                props={mergeTextStyle}
                component={(s) => <Text style={s}>Merge</Text>}
              />
            </FilledInvertedButton>
          )}
        />
      </View>
    </ConfirmMergeAccountWrapper>
  );
};

function makePhoneConflictGeneric(v: PhoneForConflict): GenericForConflict {
  return {
    identifier: v.phoneNumber,
    formatted: ((pn) => {
      if (pn.length === 12 && pn[0] === '+' && pn[1] === '1') {
        return `+1 (${pn.slice(2, 5)}) ${pn.slice(5, 8)}-${pn.slice(8, 12)}`;
      }
      return pn;
    })(v.phoneNumber),
    suppressed: v.suppressed,
    verified: v.verified,
    enabled: v.enabled,
  };
}

const ResolvePhoneConflict = ({
  state,
  resources,
  conflict,
  phoneHint,
  error,
}: {
  state: ValueWithCallbacks<ConfirmMergeAccountState>;
  resources: ValueWithCallbacks<ConfirmMergeAccountResources>;
  conflict: OauthPhoneConflictInfo;
  phoneHint: WritableValueWithCallbacks<string | null>;
  error: WritableValueWithCallbacks<string | null>;
}): ReactElement => {
  return (
    <ResolveConflict
      state={state}
      resources={resources}
      conflict={{
        original: conflict.original.map(makePhoneConflictGeneric),
        merging: conflict.merging.map(makePhoneConflictGeneric),
        originalSettings: conflict.originalSettings,
        mergingSettings: conflict.mergingSettings,
      }}
      hint={phoneHint}
      error={error}
      conflictName="SMS"
    />
  );
};

function makeEmailConflictGeneric(v: EmailForConflict): GenericForConflict {
  return {
    identifier: v.emailAddress,
    formatted: v.emailAddress,
    suppressed: v.suppressed,
    verified: v.verified,
    enabled: v.enabled,
  };
}

const ResolveEmailConflict = ({
  state,
  resources,
  conflict,
  emailHint,
  error,
}: {
  state: ValueWithCallbacks<ConfirmMergeAccountState>;
  resources: ValueWithCallbacks<ConfirmMergeAccountResources>;
  conflict: OauthEmailConflictInfo;
  emailHint: WritableValueWithCallbacks<string | null>;
  error: WritableValueWithCallbacks<string | null>;
}): ReactElement => {
  return (
    <ResolveConflict
      state={state}
      resources={resources}
      conflict={{
        original: conflict.original.map(makeEmailConflictGeneric),
        merging: conflict.merging.map(makeEmailConflictGeneric),
        originalSettings: conflict.originalSettings,
        mergingSettings: conflict.mergingSettings,
      }}
      hint={emailHint}
      error={error}
      conflictName="Email"
    />
  );
};

type GenericForConflict = {
  identifier: string;
  formatted: string;
  suppressed: boolean;
  verified: boolean;
  enabled: boolean;
};

type GenericConflictInfo = {
  original: GenericForConflict[];
  merging: GenericForConflict[];
  originalSettings: DailyReminderSettingsForConflict;
  mergingSettings: DailyReminderSettingsForConflict;
};

const ResolveConflict = ({
  conflict,
  hint,
  conflictName,
  error,
}: {
  state: ValueWithCallbacks<ConfirmMergeAccountState>;
  resources: ValueWithCallbacks<ConfirmMergeAccountResources>;
  conflict: GenericConflictInfo;
  hint: WritableValueWithCallbacks<string | null>;
  conflictName: string;
  error: WritableValueWithCallbacks<string | null>;
}): ReactElement => {
  const options: Pick<GenericForConflict, 'identifier' | 'formatted'>[] =
    useMemo(() => {
      const seenIdentifiers = new Set<string>();
      const result: Pick<GenericForConflict, 'identifier' | 'formatted'>[] = [];
      for (const c of conflict.original) {
        if (
          !c.suppressed &&
          c.verified &&
          c.enabled &&
          !seenIdentifiers.has(c.identifier)
        ) {
          seenIdentifiers.add(c.identifier);
          result.push({ identifier: c.identifier, formatted: c.formatted });
        }
      }
      for (const c of conflict.merging) {
        if (
          !c.suppressed &&
          c.verified &&
          c.enabled &&
          !seenIdentifiers.has(c.identifier)
        ) {
          seenIdentifiers.add(c.identifier);
          result.push({ identifier: c.identifier, formatted: c.formatted });
        }
      }
      return result;
    }, [conflict]);

  return (
    <View style={styles.resolveConflict}>
      <Text style={styles.resolveConflictTitle}>{conflictName} Reminders:</Text>
      <View style={styles.resolveConflictOptions}>
        <RenderGuardedComponent
          props={hint}
          component={(checkedIdentifier) => (
            <>
              {options.map((o, idx) => (
                <View
                  key={idx}
                  style={Object.assign(
                    {},
                    styles.resolveConflictOption,
                    idx < options.length - 1
                      ? styles.resolveConflictOptionNotLastChild
                      : undefined
                  )}
                >
                  <Checkbox
                    value={checkedIdentifier === o.identifier}
                    label={o.formatted}
                    setValue={(v) => {
                      if (v) {
                        setVWC(hint, o.identifier);
                        setVWC(error, null);
                      }
                    }}
                    checkboxStyle="whiteWide"
                  />
                </View>
              ))}
            </>
          )}
        />
      </View>
      <RenderGuardedComponent
        props={error}
        component={(error) => (
          <>
            {error && <Text style={styles.resolveConflictError}>{error}</Text>}
          </>
        )}
      />
    </View>
  );
};
