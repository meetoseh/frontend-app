import { ReactElement } from 'react';
import { ScreenComponentProps } from '../../models/Screen';
import { GridDarkGrayBackground } from '../../../../shared/components/GridDarkGrayBackground';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import { styles } from './CompletionStyles';
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
import { screenOut } from '../../lib/screenOut';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { CompletionResources } from './CompletionResources';
import { CompletionMappedParams } from './CompletionParams';
import { GridConfetti } from '../../../../shared/components/GridConfetti';
import HugeCheck from './icons/HugeCheck';
import { View, Text, TextStyle, StyleProp } from 'react-native';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { FilledPremiumButton } from '../../../../shared/components/FilledPremiumButton';
import { setVWC } from '../../../../shared/lib/setVWC';

/**
 * A basic completion screen that shows some confetti and includes a call to action
 */
export const Completion = ({
  ctx,
  screen,
  startPop,
}: ScreenComponentProps<
  'completion',
  CompletionResources,
  CompletionMappedParams
>): ReactElement => {
  const transition = useTransitionProp(
    (): StandardScreenTransition => screen.parameters.entrance
  );
  useEntranceTransition(transition);

  const transitionState = useStandardTransitionsState(transition);

  const workingVWC = useWritableValueWithCallbacks(() => false);

  const buttonTextStyleVWC = useWritableValueWithCallbacks<
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
        gridSizeVWC={ctx.windowSizeImmediate}
        justifyContent="flex-start"
        scrollable={false}
      >
        <RenderGuardedComponent
          props={ctx.topBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
        <VerticalSpacer height={0} flexGrow={2} />
        <View style={styles.check}>
          <HugeCheck />
        </View>
        <VerticalSpacer height={0} flexGrow={1} />
        {screen.parameters.subtitle !== null && (
          <>
            <Text style={styles.subtitle}>{screen.parameters.subtitle}</Text>
            <VerticalSpacer height={16} />
          </>
        )}
        <Text style={styles.title}>{screen.parameters.title}</Text>
        <VerticalSpacer height={40} />
        <FilledPremiumButton
          onPress={() => {
            screenOut(
              workingVWC,
              startPop,
              transition,
              screen.parameters.cta.exit,
              screen.parameters.cta.trigger
            );
          }}
          setTextStyle={(s) => setVWC(buttonTextStyleVWC, s)}
        >
          <RenderGuardedComponent
            props={buttonTextStyleVWC}
            component={(s) => (
              <Text style={s}>{screen.parameters.cta.text}</Text>
            )}
          />
        </FilledPremiumButton>
        <VerticalSpacer height={32} />

        <RenderGuardedComponent
          props={ctx.botBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
      </GridContentContainer>
      <GridConfetti windowSizeImmediate={ctx.windowSizeImmediate} />
      <WipeTransitionOverlay wipe={transitionState.wipe} />
    </GridFullscreenContainer>
  );
};
