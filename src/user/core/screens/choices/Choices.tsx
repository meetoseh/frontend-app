import { ReactElement, useEffect, useMemo } from 'react';
import { ScreenComponentProps } from '../../models/Screen';
import { GridDarkGrayBackground } from '../../../../shared/components/GridDarkGrayBackground';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import { styles } from './ChoicesStyles';
import {
  useEntranceTransition,
  useTransitionProp,
} from '../../../../shared/lib/TransitionProp';
import {
  StandardScreenTransition,
  useStandardTransitionsState,
} from '../../../../shared/hooks/useStandardTransitions';
import { WipeTransitionOverlay } from '../../../../shared/components/WipeTransitionOverlay';
import {
  WritableValueWithTypedCallbacks,
  downgradeTypedVWC,
  useWritableValueWithCallbacks,
} from '../../../../shared/lib/Callbacks';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { ChoicesResources } from './ChoicesResources';
import { ChoicesMappedParams } from './ChoicesParams';
import { AutoBold } from '../../../../shared/components/AutoBold';
import { SurveyCheckboxGroup } from '../../../../shared/components/SurveyCheckboxGroup';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { StyleProp, Text, TextStyle } from 'react-native';
import { FilledInvertedButton } from '../../../../shared/components/FilledInvertedButton';
import { setVWC } from '../../../../shared/lib/setVWC';
import { configurableScreenOut } from '../../lib/configurableScreenOut';

/**
 * Asks the user a question and they select their response. Can choose one or
 * multiple depending on how the screen is configured.
 */
export const Choices = ({
  ctx,
  screen,
  resources,
  trace,
  startPop,
}: ScreenComponentProps<
  'choices',
  ChoicesResources,
  ChoicesMappedParams
>): ReactElement => {
  const transition = useTransitionProp(
    (): StandardScreenTransition => screen.parameters.entrance
  );
  useEntranceTransition(transition);

  const transitionState = useStandardTransitionsState(transition);

  const workingVWC = useWritableValueWithCallbacks(() => false);

  const choicesMapped = useMemo(
    () =>
      screen.parameters.choices.map((c, idx) => ({
        slug: makeSlug(c, idx),
        element: <>{c}</>,
      })),
    [screen.parameters.choices]
  );
  const checkedVWC = useWritableValueWithCallbacks<string[]>(
    () => []
  ) as WritableValueWithTypedCallbacks<
    string[],
    { action: 'checked' | 'unchecked'; changed: string } | undefined
  >;

  useEffect(() => {
    checkedVWC.callbacks.add(handleEvent);
    return () => {
      checkedVWC.callbacks.remove(handleEvent);
    };

    function handleEvent(
      event: { action: 'checked' | 'unchecked'; changed: string } | undefined
    ) {
      if (event === undefined) {
        trace({
          type: 'checked-changed',
          slug: screen.parameters.slug,
          value: checkedVWC.get(),
        });
        return;
      }

      trace({
        type: 'checked-changed',
        slug: screen.parameters.slug,
        action: event.action,
        changed: event.changed,
        value: checkedVWC.get(),
      });
    }
  }, [checkedVWC, resources, screen.parameters.slug, trace]);

  const canContinueVWC = useMappedValueWithCallbacks(
    downgradeTypedVWC(checkedVWC),
    (checked) => checked.length > 0 || !screen.parameters.enforce
  );

  const continueTextStyleVWC = useWritableValueWithCallbacks<
    StyleProp<TextStyle>
  >(() => undefined);

  return (
    <GridFullscreenContainer
      windowSizeImmediate={ctx.windowSizeImmediate}
      modals={false}
      statusBar
    >
      <GridDarkGrayBackground />
      <GridContentContainer
        contentWidthVWC={ctx.contentWidth}
        left={transitionState.left}
        opacity={transitionState.opacity}
        justifyContent="flex-start"
        gridSizeVWC={ctx.windowSizeImmediate}
        scrollable={true}
      >
        <RenderGuardedComponent
          props={ctx.topBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
        <VerticalSpacer height={32} />
        <Text style={styles.top}>{screen.parameters.top}</Text>
        <VerticalSpacer height={0} flexGrow={1} />
        <Text style={styles.header}>{screen.parameters.header}</Text>
        {screen.parameters.message === null ? null : (
          <>
            <VerticalSpacer height={16} />
            <AutoBold
              style={styles.message}
              message={screen.parameters.message}
            />
          </>
        )}
        <VerticalSpacer height={32} />
        <SurveyCheckboxGroup
          choices={choicesMapped}
          checked={checkedVWC}
          variant={screen.parameters.multiple ? 'square' : 'round'}
          multiple={screen.parameters.multiple}
          uncheck={screen.parameters.multiple}
        />
        <VerticalSpacer height={0} flexGrow={1} />
        <RenderGuardedComponent
          props={canContinueVWC}
          component={(canContinue) => (
            <FilledInvertedButton
              disabled={!canContinue}
              onPress={() => {
                if (!canContinue) {
                  return;
                }

                configurableScreenOut(
                  workingVWC,
                  startPop,
                  transition,
                  screen.parameters.exit,
                  screen.parameters.trigger,
                  {
                    beforeDone: async () => {
                      trace({
                        type: 'cta',
                        slug: screen.parameters.slug,
                        value: checkedVWC.get(),
                      });
                    },
                  }
                );
              }}
              setTextStyle={(s) => setVWC(continueTextStyleVWC, s)}
            >
              <RenderGuardedComponent
                props={continueTextStyleVWC}
                component={(s) => (
                  <Text style={s}>{screen.parameters.cta}</Text>
                )}
              />
            </FilledInvertedButton>
          )}
        />
        <VerticalSpacer height={32} />
        <RenderGuardedComponent
          props={ctx.botBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
      </GridContentContainer>
      <WipeTransitionOverlay wipe={transitionState.wipe} />
    </GridFullscreenContainer>
  );
};

const makeSlug = (choice: string, idx: number): string => `[${idx}] ${choice}`;
