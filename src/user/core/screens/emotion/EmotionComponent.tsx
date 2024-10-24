import { ReactElement } from 'react';
import { ScreenComponentProps } from '../../models/Screen';
import { GridDarkGrayBackground } from '../../../../shared/components/GridDarkGrayBackground';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import { styles } from './EmotionStyles';
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
import { EmotionResources } from './EmotionResources';
import { EmotionMappedParams } from './EmotionParams';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { trackClassTaken } from '../home/lib/trackClassTaken';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { Pressable, View, Text } from 'react-native';
import { FilledInvertedButton } from '../../../../shared/components/FilledInvertedButton';
import { TextStyleForwarder } from '../../../../shared/components/TextStyleForwarder';
import { setVWC } from '../../../../shared/lib/setVWC';
import { FilledPremiumButton } from '../../../../shared/components/FilledPremiumButton';
import { configurableScreenOut } from '../../lib/configurableScreenOut';
import { OsehColors } from '../../../../shared/OsehColors';
import { Back } from '../../../../shared/components/icons/Back';

/**
 * A relatively basic screen which presents an emotion and allows the user to
 * take a 1-minute or longer class based on that emotion.
 *
 * This is suffixed with "Component" to avoid naming conflicts.
 */
export const EmotionComponent = ({
  ctx,
  screen,
  startPop,
}: ScreenComponentProps<
  'emotion',
  EmotionResources,
  EmotionMappedParams
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
        {screen.parameters.back && (
          <View style={styles.back}>
            <Pressable
              onPress={() => {
                const btn = screen.parameters.back;
                if (btn === null) {
                  return;
                }
                configurableScreenOut(
                  workingVWC,
                  startPop,
                  transition,
                  btn.exit,
                  btn.trigger
                );
              }}
            >
              <Back
                icon={{ width: 20 }}
                container={{ width: 36, height: 52 }}
                startPadding={{ x: { fraction: 0 }, y: { fraction: 1 } }}
                color={OsehColors.v4.primary.light}
              />
            </Pressable>
          </View>
        )}
        <VerticalSpacer height={0} flexGrow={1} />
        <Text style={styles.header}>{screen.parameters.header}</Text>
        <VerticalSpacer height={6} />
        <Text style={styles.emotion}>{screen.parameters.emotion}</Text>
        {screen.parameters.subheader && (
          <>
            <VerticalSpacer height={16} />
            <Text style={styles.subheader}>{screen.parameters.subheader}</Text>
          </>
        )}
        <VerticalSpacer height={0} flexGrow={1} />
        {screen.parameters.short && (
          <TextStyleForwarder
            component={(styleVWC) => (
              <FilledInvertedButton
                onPress={() => {
                  const btn = screen.parameters.short;
                  if (btn === null) {
                    return;
                  }
                  configurableScreenOut(
                    workingVWC,
                    startPop,
                    transition,
                    btn.exit,
                    btn.trigger,
                    {
                      endpoint: '/api/1/users/me/screens/pop_to_emotion_class',
                      parameters: {
                        emotion: screen.parameters.emotion,
                        premium: false,
                      },
                      beforeDone: async () => {
                        trackClassTaken(ctx);
                      },
                    }
                  );
                }}
                setTextStyle={(s) => setVWC(styleVWC, s)}
              >
                <RenderGuardedComponent
                  props={styleVWC}
                  component={(s) => (
                    <Text style={s}>{screen.parameters.short?.text}</Text>
                  )}
                />
              </FilledInvertedButton>
            )}
          />
        )}
        {screen.parameters.short && screen.parameters.long && (
          <VerticalSpacer height={12} />
        )}
        {screen.parameters.long && (
          <TextStyleForwarder
            component={(styleVWC) => (
              <FilledPremiumButton
                onPress={() => {
                  const btn = screen.parameters.long;
                  if (btn === null) {
                    return;
                  }
                  configurableScreenOut(
                    workingVWC,
                    startPop,
                    transition,
                    btn.exit,
                    btn.trigger,
                    {
                      endpoint: '/api/1/users/me/screens/pop_to_emotion_class',
                      parameters: {
                        emotion: screen.parameters.emotion,
                        premium: true,
                      },
                      beforeDone: async () => {
                        trackClassTaken(ctx);
                      },
                    }
                  );
                }}
                setTextStyle={(s) => setVWC(styleVWC, s)}
              >
                <RenderGuardedComponent
                  props={styleVWC}
                  component={(s) => (
                    <Text style={s}>{screen.parameters.long?.text}</Text>
                  )}
                />
              </FilledPremiumButton>
            )}
          />
        )}
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
