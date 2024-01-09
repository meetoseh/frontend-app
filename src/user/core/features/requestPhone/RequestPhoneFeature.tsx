import { useContext } from 'react';
import { Feature } from '../../models/Feature';
import { LoginContext } from '../../../../shared/contexts/LoginContext';
import { RequestPhoneResources } from './RequestPhoneResources';
import { NewPhoneInfo, RequestPhoneState } from './RequestPhoneState';
import { RequestPhone } from './RequestPhone';
import { useInappNotificationValueWithCallbacks } from '../../../../shared/hooks/useInappNotification';
import { useInappNotificationSessionValueWithCallbacks } from '../../../../shared/hooks/useInappNotificationSession';
import { InterestsContext } from '../../../../shared/contexts/InterestsContext';
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { useReactManagedValueAsValueWithCallbacks } from '../../../../shared/hooks/useReactManagedValueAsValueWithCallbacks';
import { setVWC } from '../../../../shared/lib/setVWC';
import { useLogoutHandler } from '../../../../shared/hooks/useLogoutHandler';

export const RequestPhoneFeature: Feature<
  RequestPhoneState,
  RequestPhoneResources
> = {
  identifier: 'requestPhone',

  useWorldState: () => {
    const loginContextRaw = useContext(LoginContext);

    const onboardingPhoneNumberIANProps = useMappedValueWithCallbacks(
      loginContextRaw.value,
      (loginRaw) => {
        return {
          uid: 'oseh_ian_bljOnb8Xkxt-aU9Fm7Qq9w',
          suppress:
            loginRaw.state !== 'logged-in' ||
            loginRaw.userAttributes.phoneNumber !== null,
        };
      }
    );

    const onboardingPhoneNumberIAN = useInappNotificationValueWithCallbacks({
      type: 'callbacks',
      props: () => onboardingPhoneNumberIANProps.get(),
      callbacks: onboardingPhoneNumberIANProps.callbacks,
    });
    const hasPhoneNumber = useMappedValueWithCallbacks(
      loginContextRaw.value,
      (loginRaw) => {
        return (
          loginRaw.state === 'logged-in' &&
          loginRaw.userAttributes.phoneNumber !== null
        );
      }
    );

    const justAddedPhoneNumber =
      useWritableValueWithCallbacks<NewPhoneInfo | null>(() => null);

    useLogoutHandler(() => {
      setVWC(justAddedPhoneNumber, null);
    });

    return useMappedValuesWithCallbacks(
      [onboardingPhoneNumberIAN, justAddedPhoneNumber, hasPhoneNumber],
      (): RequestPhoneState => ({
        onboardingPhoneNumberIAN: onboardingPhoneNumberIAN.get(),
        hasPhoneNumber: hasPhoneNumber.get(),
        justAddedPhoneNumber: justAddedPhoneNumber.get(),
        onAddedPhoneNumber: (info) => {
          setVWC(justAddedPhoneNumber, info, () => false);
        },
      })
    );
  },

  useResources: (state, required, allStates) => {
    const ianUID = useMappedValueWithCallbacks(state, (s) =>
      !required
        ? null
        : s.onboardingPhoneNumberIAN?.showNow
        ? s.onboardingPhoneNumberIAN.uid
        : null
    );
    const appNotifsAvailable = useMappedValueWithCallbacks(allStates, (s) =>
      !required
        ? null
        : s.appNotifs.expoToken === undefined
        ? null
        : s.appNotifs.expoToken !== null
    );
    const session = useInappNotificationSessionValueWithCallbacks({
      type: 'callbacks',
      props: () => ({ uid: ianUID.get() }),
      callbacks: ianUID.callbacks,
    });
    const interestsRaw = useContext(InterestsContext);
    const interestsVWC = useReactManagedValueAsValueWithCallbacks(interestsRaw);

    return useMappedValuesWithCallbacks(
      [session, appNotifsAvailable, interestsVWC],
      () => ({
        session: session.get(),
        appNotifsEnabled: appNotifsAvailable.get(),
        loading:
          session.get() === null ||
          interestsVWC.get().state === 'loading' ||
          appNotifsAvailable.get() === null,
      })
    );
  },

  isRequired: (worldState, allStates) => {
    if (worldState.hasPhoneNumber === undefined) {
      return undefined;
    }

    if (worldState.hasPhoneNumber) {
      return false;
    }

    if (worldState.onboardingPhoneNumberIAN === null) {
      return undefined;
    }

    return (
      allStates.pickEmotionJourney.classesTakenThisSession > 0 &&
      worldState.onboardingPhoneNumberIAN.showNow
    );
  },

  component: (worldState, resources) => (
    <RequestPhone state={worldState} resources={resources} />
  ),
};
