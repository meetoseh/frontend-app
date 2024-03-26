import { FeatureComponentProps } from '../../models/Feature';
import { ReactElement, useCallback, useContext, useEffect } from 'react';
import {
  WritableValueWithTypedCallbacks,
  useWritableValueWithCallbacks,
} from '../../../../shared/lib/Callbacks';
import { SurveyCheckboxGroup } from '../../../../shared/components/SurveyCheckboxGroup';
import { SurveyScreen } from '../../../../shared/components/SurveyScreen';
import { useStartSession } from '../../../../shared/hooks/useInappNotificationSession';
import { GoalDaysPerWeekState } from './GoalDaysPerWeekState';
import { GoalDaysPerWeekResources } from './GoalDaysPerWeekResources';
import { LoginContext } from '../../../../shared/contexts/LoginContext';
import { ModalContext } from '../../../../shared/contexts/ModalContext';
import { useWorkingModal } from '../../../../shared/hooks/useWorkingModal';
import { useDelayedValueWithCallbacks } from '../../../../shared/hooks/useDelayedValueWithCallbacks';
import { useErrorModal } from '../../../../shared/hooks/useErrorModal';
import { setVWC } from '../../../../shared/lib/setVWC';
import { apiFetch } from '../../../../shared/lib/apiFetch';
import { describeError } from '../../../../shared/lib/describeError';
import { Text } from 'react-native';

const _CHOICES = [
  { slug: '1', text: '1 day', element: <>1 day</> },
  { slug: '2', text: '2 days', element: <>2 days</> },
  { slug: '3', text: '3 days', element: <>3 days</> },
  { slug: '4', text: '4 days', element: <>4 days</> },
  { slug: '5', text: '5 days', element: <>5 days</> },
  { slug: '6', text: '6 days', element: <>6 days</> },
  { slug: '7', text: '7 days', element: <>7 days</> },
] as const;

type ChoiceSlug = (typeof _CHOICES)[number]['slug'];
const CHOICES = _CHOICES as readonly {
  slug: ChoiceSlug;
  text: string;
  element: ReactElement;
}[];

/**
 * Shows the actual goal days per week question
 */
export const GoalDaysPerWeek = ({
  state,
  resources,
}: FeatureComponentProps<GoalDaysPerWeekState, GoalDaysPerWeekResources>) => {
  const loginContextRaw = useContext(LoginContext);
  const modalContext = useContext(ModalContext);
  const checkedVWC = useWritableValueWithCallbacks<ChoiceSlug[]>(() => [
    resources.get().initialGoal.toString() as ChoiceSlug,
  ]) as WritableValueWithTypedCallbacks<
    ChoiceSlug[],
    { action: 'checked' | 'unchecked'; changed: ChoiceSlug } | undefined
  >;
  const errorVWC = useWritableValueWithCallbacks<ReactElement | null>(
    () => null
  );
  const savingVWC = useWritableValueWithCallbacks<boolean>(() => false);

  useErrorModal(modalContext.modals, errorVWC, 'saving goal');

  useWorkingModal(
    modalContext.modals,
    useDelayedValueWithCallbacks(savingVWC, 200)
  );

  useStartSession(
    {
      type: 'callbacks',
      props: () => resources.get().session,
      callbacks: resources.callbacks,
    },
    {
      onStart: () => {
        resources.get().session?.storeAction('open', {
          choice: parseInt(checkedVWC.get()[0], 10),
          back: state.get().forced?.back ?? null,
        });
      },
    }
  );

  useEffect(() => {
    checkedVWC.callbacks.add(handleEvent);
    return () => {
      checkedVWC.callbacks.remove(handleEvent);
    };

    function handleEvent(
      event:
        | { action: 'checked' | 'unchecked'; changed: ChoiceSlug }
        | undefined
    ) {
      if (event === undefined || event.action !== 'checked') {
        return;
      }

      resources.get().session?.storeAction('check', {
        value: parseInt(event.changed, 10),
      });
    }
  }, [checkedVWC, resources]);

  const trySave = useCallback(async () => {
    const loginContextUnch = loginContextRaw.value.get();
    if (loginContextUnch.state !== 'logged-in') {
      return;
    }
    const loginContext = loginContextUnch;
    const value = parseInt(checkedVWC.get()[0], 10);

    const response = await apiFetch(
      '/api/1/users/me/goal',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ days_per_week: value }),
        keepalive: true,
      },
      loginContext
    );
    if (response.ok) {
      resources.get().session?.storeAction('stored', { choice: value });
    }
  }, []);

  const handleAction = useCallback(
    async (action: 'continue' | 'back') => {
      const choice = parseInt(checkedVWC.get()[0], 10);
      resources.get().session?.storeAction(action, {
        choice,
      });
      setVWC(errorVWC, null);
      try {
        await trySave();
      } catch (e) {
        setVWC(errorVWC, await describeError(e));
        return;
      }
      resources.get().session?.reset();
      state.get().ian?.onShown();
      resources.get().onGoalSet(choice, action);
    },
    [resources, state]
  );

  return (
    <SurveyScreen
      title={{
        type: 'react-rerender',
        props: (
          <Text>
            How many days a week would you like to practice each week?
          </Text>
        ),
      }}
      subtitle={{
        type: 'react-rerender',
        props: <Text>We&rsquo;ll keep you motivated along the way</Text>,
      }}
      onBack={{
        type: 'callbacks',
        props: () => {
          const forced = state.get().forced;
          if (forced === null || forced.back === null) {
            return null;
          }
          return () => handleAction('back');
        },
        callbacks: state.callbacks,
      }}
      onContinue={{
        type: 'react-rerender',
        props: () => handleAction('continue'),
      }}
    >
      <SurveyCheckboxGroup
        choices={CHOICES}
        checked={checkedVWC}
        variant="round"
      />
    </SurveyScreen>
  );
};
