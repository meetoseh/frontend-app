import { Fragment, ReactElement } from 'react';
import { ScreenComponentProps } from '../../models/Screen';
import { SimpleNavMappedParams } from './SimpleNavParams';
import { SimpleNavResources } from './SimpleNavResources';
import {
  StandardScreenTransition,
  useStandardTransitionsState,
} from '../../../../shared/hooks/useStandardTransitions';
import {
  useEntranceTransition,
  useTransitionProp,
} from '../../../../shared/lib/TransitionProp';
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { GridDarkGrayBackground } from '../../../../shared/components/GridDarkGrayBackground';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { screenOut } from '../../lib/screenOut';
import { styles } from './SimpleNavStyles';
import { Close } from '../interactive_prompt_screen/icons/Close';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { ContentContainer } from '../../../../shared/components/ContentContainer';
import { View, Pressable, Text, Linking } from 'react-native';

/**
 * A basic navigation screen with primary and secondary sections
 */
export const SimpleNav = ({
  ctx,
  screen,
  startPop,
  trace,
}: ScreenComponentProps<
  'simple_nav',
  SimpleNavResources,
  SimpleNavMappedParams
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
        contentWidthVWC={useMappedValueWithCallbacks(
          ctx.windowSizeImmediate,
          (v) => v.width
        )}
        left={transitionState.left}
        opacity={transitionState.opacity}
        gridSizeVWC={ctx.windowSizeImmediate}
        justifyContent="flex-start"
        scrollable={false}
      >
        <View style={styles.close}>
          <Pressable
            onPress={() => {
              screenOut(
                workingVWC,
                startPop,
                transition,
                screen.parameters.exit,
                screen.parameters.close,
                {
                  beforeDone: async () => {
                    trace({ type: 'close' });
                  },
                }
              );
            }}
          >
            <Close />
          </Pressable>
        </View>
        <VerticalSpacer height={0} flexGrow={1} />
        <ContentContainer contentWidthVWC={ctx.contentWidth}>
          {screen.parameters.primary.map((item, i) => (
            <Fragment key={`primary-${i}`}>
              {i !== 0 && <VerticalSpacer height={16} />}
              <Pressable
                style={styles.primary}
                onPress={() => {
                  if (item.type === 'trigger') {
                    screenOut(
                      workingVWC,
                      startPop,
                      transition,
                      screen.parameters.exit,
                      item.trigger,
                      {
                        beforeDone: async () => {
                          trace({
                            type: 'primary',
                            text: item.text,
                            trigger: item.trigger,
                          });
                        },
                      }
                    );
                  } else {
                    trace({ type: 'primary', text: item.text, url: item.url });
                    Linking.openURL(item.url);
                  }
                }}
              >
                <Text style={styles.primaryText}>{item.text}</Text>
              </Pressable>
            </Fragment>
          ))}
        </ContentContainer>
        <VerticalSpacer height={0} flexGrow={5} />
        <ContentContainer contentWidthVWC={ctx.contentWidth}>
          {screen.parameters.secondary.map((item, i) => (
            <Fragment key={`secondary-${i}`}>
              {/* we put 4px padding on button to make easier to click */}
              {i !== 0 && <VerticalSpacer height={8} />}
              <Pressable
                style={styles.secondary}
                onPress={() => {
                  if (item.type === 'trigger') {
                    screenOut(
                      workingVWC,
                      startPop,
                      transition,
                      screen.parameters.exit,
                      item.trigger,
                      {
                        beforeDone: async () => {
                          trace({
                            type: 'secondary',
                            text: item.text,
                            trigger: item.trigger,
                          });
                        },
                      }
                    );
                  } else {
                    trace({
                      type: 'secondary',
                      text: item.text,
                      url: item.url,
                    });
                    Linking.openURL(item.url);
                  }
                }}
              >
                <Text style={styles.secondaryText}>{item.text}</Text>
              </Pressable>
            </Fragment>
          ))}
        </ContentContainer>
        <VerticalSpacer height={0} flexGrow={1} maxHeight={48} />
      </GridContentContainer>
    </GridFullscreenContainer>
  );
};
