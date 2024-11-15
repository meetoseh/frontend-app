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
import { styles } from './SimpleNavStyles';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { ContentContainer } from '../../../../shared/components/ContentContainer';
import { View, Pressable, Text, Linking } from 'react-native';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { configurableScreenOut } from '../../lib/configurableScreenOut';
import { Close } from '../../../../shared/components/icons/Close';
import { OsehColors } from '../../../../shared/OsehColors';

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
        <RenderGuardedComponent
          props={ctx.topBarHeight}
          component={(topBarHeight) => <VerticalSpacer height={topBarHeight} />}
        />
        <View style={styles.close}>
          <Pressable
            onPress={() => {
              configurableScreenOut(
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
            <Close
              icon={{
                width: 24,
              }}
              container={{
                width: 56,
                height: 56,
              }}
              startPadding={{
                x: {
                  fraction: 0.5,
                },
                y: {
                  fraction: 0.5,
                },
              }}
              color={OsehColors.v4.primary.light}
            />
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
                    configurableScreenOut(
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
                    configurableScreenOut(
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
        <RenderGuardedComponent
          props={ctx.botBarHeight}
          component={(botBarHeight) => <VerticalSpacer height={botBarHeight} />}
        />
      </GridContentContainer>
    </GridFullscreenContainer>
  );
};
