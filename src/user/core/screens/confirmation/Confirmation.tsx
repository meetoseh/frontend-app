import { ReactElement } from 'react';
import { ScreenComponentProps } from '../../models/Screen';
import { ConfirmationMappedParams } from './ConfirmationParams';
import { ConfirmationResources } from './ConfirmationResources';
import { Text, TextStyle, StyleProp } from 'react-native';
import {
  useEntranceTransition,
  useTransitionProp,
} from '../../../../shared/lib/TransitionProp';
import {
  StandardScreenTransition,
  useStandardTransitionsState,
} from '../../../../shared/hooks/useStandardTransitions';
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { GridDarkGrayBackground } from '../../../../shared/components/GridDarkGrayBackground';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { styles } from './ConfirmationStyles';
import { FilledInvertedButton } from '../../../../shared/components/FilledInvertedButton';
import { screenOut } from '../../lib/screenOut';
import { setVWC } from '../../../../shared/lib/setVWC';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { WipeTransitionOverlay } from '../../../../shared/components/WipeTransitionOverlay';

/**
 * A basic confirmation screen with a header and message
 */
export const Confirmation = ({
  ctx,
  screen,
  startPop,
}: ScreenComponentProps<
  'confirmation',
  ConfirmationResources,
  ConfirmationMappedParams
>): ReactElement => {
  const transition = useTransitionProp(
    (): StandardScreenTransition => screen.parameters.entrance
  );
  useEntranceTransition(transition);

  const transitionState = useStandardTransitionsState(transition);

  const workingVWC = useWritableValueWithCallbacks(() => false);

  const ctaTextStyleVWC = useWritableValueWithCallbacks<StyleProp<TextStyle>>(
    () => undefined
  );

  return (
    <GridFullscreenContainer
      windowSizeImmediate={ctx.windowSizeImmediate}
      statusBar={true}
      modals={false}
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
        <VerticalSpacer height={0} flexGrow={1} />
        <Text style={styles.header}>{screen.parameters.header}</Text>
        <VerticalSpacer height={16} />
        <Text style={styles.message}>{screen.parameters.message}</Text>
        <VerticalSpacer height={24} />
        <FilledInvertedButton
          onPress={() => {
            screenOut(
              workingVWC,
              startPop,
              transition,
              screen.parameters.exit,
              screen.parameters.trigger
            );
          }}
          setTextStyle={(s) => setVWC(ctaTextStyleVWC, s)}
        >
          <RenderGuardedComponent
            props={ctaTextStyleVWC}
            component={(s) => <Text style={s}>{screen.parameters.cta}</Text>}
          />
        </FilledInvertedButton>
        <VerticalSpacer height={0} flexGrow={1} />
      </GridContentContainer>
      <WipeTransitionOverlay wipe={transitionState.wipe} />
    </GridFullscreenContainer>
  );
};
