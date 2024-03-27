import { FeatureComponentProps } from '../../models/Feature';
import { AgeResources } from './AgeResources';
import { AgeState } from './AgeState';
import { ReactElement, useCallback, useEffect } from 'react';
import {
  WritableValueWithTypedCallbacks,
  useWritableValueWithCallbacks,
} from '../../../../shared/lib/Callbacks';
import { SurveyCheckboxGroup } from '../../../../shared/components/SurveyCheckboxGroup';
import { SurveyScreen } from '../../../../shared/components/SurveyScreen';
import { useStartSession } from '../../../../shared/hooks/useInappNotificationSession';

const _CHOICES = [
  { slug: '18-24', text: '18-24', element: <>18&ndash;24</> },
  { slug: '25-34', text: '25-34', element: <>25&ndash;34</> },
  { slug: '35-44', text: '35-44', element: <>35&ndash;44</> },
  { slug: '45-54', text: '45-54', element: <>45&ndash;54</> },
  { slug: '55-64', text: '55-64', element: <>55&ndash;64</> },
  { slug: '65+', text: '65+', element: <>65+</> },
] as const;

type ChoiceSlug = (typeof _CHOICES)[number]['slug'];
const CHOICES = _CHOICES as readonly {
  slug: ChoiceSlug;
  text: string;
  element: ReactElement;
}[];

/**
 * Shows the actual age question
 */
export const Age = ({
  state,
  resources,
}: FeatureComponentProps<AgeState, AgeResources>) => {
  const checkedVWC = useWritableValueWithCallbacks<ChoiceSlug[]>(
    () => []
  ) as WritableValueWithTypedCallbacks<
    ChoiceSlug[],
    { action: 'checked' | 'unchecked'; changed: ChoiceSlug } | undefined
  >;

  useStartSession(
    {
      type: 'callbacks',
      props: () => resources.get().session,
      callbacks: resources.callbacks,
    },
    {
      onStart: () => {
        resources.get().session?.storeAction('open', {
          choices: CHOICES.map(({ slug, text }) => ({ slug, text })),
          checked: checkedVWC.get(),
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
      if (event === undefined) {
        return;
      }

      resources
        .get()
        .session?.storeAction(
          event.action === 'checked' ? 'check' : 'uncheck',
          {
            slug: event.changed,
          }
        );
    }
  }, [checkedVWC, resources]);

  const handleBack = useCallback(() => {
    resources.get().session?.storeAction('back', {
      checked: checkedVWC.get(),
    });
    resources.get().session?.reset();
    state.get().ian?.onShown();
    resources.get().onBack();
  }, [resources, state]);

  const handleContinue = useCallback(() => {
    resources.get().session?.storeAction('continue', {
      checked: checkedVWC.get(),
    });
    resources.get().session?.reset();
    state.get().ian?.onShown();
    resources.get().onContinue();
  }, [resources, state]);

  return (
    <SurveyScreen
      title={{
        type: 'react-rerender',
        props: <>What&rsquo;s your age?</>,
      }}
      subtitle={{
        type: 'react-rerender',
        props: <>We&rsquo;ll use this to personalize your experience</>,
      }}
      onBack={{
        type: 'react-rerender',
        props: handleBack,
      }}
      onContinue={{
        type: 'react-rerender',
        props: handleContinue,
      }}
    >
      <SurveyCheckboxGroup
        choices={CHOICES}
        checked={checkedVWC}
        variant="round"
        uncheck
      />
    </SurveyScreen>
  );
};