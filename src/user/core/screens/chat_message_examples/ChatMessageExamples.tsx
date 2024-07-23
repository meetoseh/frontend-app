import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import { GridDarkGrayBackground } from '../../../../shared/components/GridDarkGrayBackground';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import {
  StandardScreenTransition,
  useStandardTransitionsState,
} from '../../../../shared/hooks/useStandardTransitions';
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import {
  useEntranceTransition,
  useTransitionProp,
} from '../../../../shared/lib/TransitionProp';
import { ScreenComponentProps } from '../../models/Screen';
import { ChatMessageExamplesMappedParams } from './ChatMessageExamplesParams';
import { ChatMessageExamplesResources } from './ChatMessageExamplesResources';
import { styles } from './ChatMessageExamplesStyles';
import { Fragment, ReactElement } from 'react';
import { screenOut } from '../../lib/screenOut';
import { View, Text } from 'react-native';
import { TextStyleForwarder } from '../../../../shared/components/TextStyleForwarder';
import { FilledInvertedButton } from '../../../../shared/components/FilledInvertedButton';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { setVWC } from '../../../../shared/lib/setVWC';

/**
 * An interstitial screen designed specifically to help provide examples
 * of how to use the journal chat screen
 */
export const ChatMessageExamples = ({
  ctx,
  screen,
  startPop,
}: ScreenComponentProps<
  'chat_message_examples',
  ChatMessageExamplesResources,
  ChatMessageExamplesMappedParams
>): ReactElement => {
  const transition = useTransitionProp(
    (): StandardScreenTransition => screen.parameters.entrance
  );
  useEntranceTransition(transition);

  const transitionState = useStandardTransitionsState(transition);

  const workingVWC = useWritableValueWithCallbacks(() => false);

  return (
    <GridFullscreenContainer
      windowSizeImmediate={ctx.windowSizeImmediate}
      modals={false}
      statusBar="light"
    >
      <GridDarkGrayBackground />
      <GridContentContainer
        contentWidthVWC={ctx.contentWidth}
        left={transitionState.left}
        opacity={transitionState.opacity}
        justifyContent="flex-start"
        gridSizeVWC={ctx.windowSizeImmediate}
        scrollable
      >
        <RenderGuardedComponent
          props={ctx.topBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
        <VerticalSpacer height={0} flexGrow={2} />
        <Text style={styles.header}>{screen.parameters.header}</Text>
        <VerticalSpacer height={0} maxHeight={16} flexGrow={1} />
        <Text style={styles.body}>{screen.parameters.body}</Text>
        <VerticalSpacer height={0} maxHeight={48} flexGrow={1} />
        {screen.parameters.messages.map((message, index) => (
          <Fragment key={index}>
            {index > 0 && (
              <VerticalSpacer height={0} maxHeight={24} flexGrow={1} />
            )}
            <View
              style={
                index % 2 === 0
                  ? styles.messageEvenContainer
                  : styles.messageOddContainer
              }
            >
              <View style={styles.message}>
                <Text style={styles.messageText}>{message}</Text>
              </View>
            </View>
          </Fragment>
        ))}
        <VerticalSpacer height={8} flexGrow={1} />
        <TextStyleForwarder
          component={(styleVWC) => (
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
              setTextStyle={(s) => setVWC(styleVWC, s)}
            >
              <RenderGuardedComponent
                props={styleVWC}
                component={(s) => (
                  <Text style={s}>{screen.parameters.cta}</Text>
                )}
              />
            </FilledInvertedButton>
          )}
        />
        <VerticalSpacer height={0} maxHeight={32} flexGrow={1} />
        <RenderGuardedComponent
          props={ctx.botBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
      </GridContentContainer>
    </GridFullscreenContainer>
  );
};
