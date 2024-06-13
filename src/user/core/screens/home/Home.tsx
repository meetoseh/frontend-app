import { ReactElement } from 'react';
import { ScreenComponentProps } from '../../models/Screen';
import { HomeMappedParams } from './HomeParams';
import { HomeResources } from './HomeResources';
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
import { GridBlackBackground } from '../../../../shared/components/GridBlackBackground';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { GridImageBackground } from '../../../../shared/components/GridImageBackground';
import { styles } from './HomeStyles';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { GoalPill } from './components/GoalPill';
import { screenOut } from '../../lib/screenOut';
import { EmotionsPicker } from './components/EmotionsPicker';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { Image, View, Text } from 'react-native';
import { BottomNavBarMinimal } from '../../../bottomNav/BottomNavBar';

/**
 * The standard home screen with options to take a class by emotion,
 * go to settings, or view the available series
 */
export const Home = ({
  ctx,
  screen,
  resources,
  startPop,
}: ScreenComponentProps<
  'home',
  HomeResources,
  HomeMappedParams
>): ReactElement => {
  const transition = useTransitionProp(
    (): StandardScreenTransition => screen.parameters.entrance
  );
  useEntranceTransition(transition);

  const transitionState = useStandardTransitionsState(transition);

  const workingVWC = useWritableValueWithCallbacks(() => false);
  const windowWidthVWC = useMappedValueWithCallbacks(
    ctx.windowSizeImmediate,
    (s) => s.width
  );

  return (
    <GridFullscreenContainer
      windowSizeImmediate={ctx.windowSizeImmediate}
      statusBar
      modals={false}
    >
      <GridBlackBackground />
      <GridContentContainer
        contentWidthVWC={windowWidthVWC}
        left={transitionState.left}
        opacity={transitionState.opacity}
        justifyContent="flex-start"
        gridSizeVWC={ctx.windowSizeImmediate}
        scrollable={false}
      >
        <GridFullscreenContainer
          windowSizeImmediate={resources.imageSizeImmediate}
          statusBar={false}
          modals={false}
        >
          <GridImageBackground
            image={resources.image}
            thumbhash={resources.imageThumbhash}
            size={resources.imageSizeImmediate}
          />
          <GridContentContainer
            contentWidthVWC={ctx.contentWidth}
            gridSizeVWC={resources.imageSizeImmediate}
            justifyContent="flex-start"
            scrollable={false}
          >
            <RenderGuardedComponent
              props={ctx.topBarHeight}
              component={(h) => <VerticalSpacer height={h} />}
            />
            <VerticalSpacer height={0} flexGrow={3} />
            <View style={styles.headerCopy}>
              <View style={styles.headerLine}>
                <RenderGuardedComponent
                  props={useMappedValueWithCallbacks(
                    resources.copy,
                    (c) => c?.headline
                  )}
                  component={(header) => (
                    <Text style={styles.header}>{header}</Text>
                  )}
                />
                <RenderGuardedComponent
                  props={resources.profilePicture}
                  component={(picture) =>
                    picture === null ? (
                      <></>
                    ) : (
                      <Image
                        source={{
                          uri: picture.croppedUrl,
                          width: 32,
                          height: 32,
                        }}
                        borderRadius={16}
                      />
                    )
                  }
                />
              </View>
              <VerticalSpacer height={4} />
              <RenderGuardedComponent
                props={useMappedValueWithCallbacks(
                  resources.copy,
                  (c) => c?.subheadline
                )}
                component={(subheader) => (
                  <Text style={styles.subheader}>{subheader}</Text>
                )}
              />
            </View>
            <VerticalSpacer height={0} flexGrow={1} />
            <View style={styles.goal}>
              <GoalPill
                streak={resources.streak}
                updateGoal={() => {
                  screenOut(
                    workingVWC,
                    startPop,
                    transition,
                    screen.parameters.goal.exit,
                    screen.parameters.goal.trigger
                  );
                }}
              />
            </View>
            <VerticalSpacer height={0} flexGrow={1} />
          </GridContentContainer>
        </GridFullscreenContainer>
        <EmotionsPicker
          emotions={resources.emotions}
          onTapEmotion={(emotion) => {
            screenOut(
              workingVWC,
              startPop,
              transition,
              screen.parameters.emotion.exit,
              screen.parameters.emotion.trigger,
              {
                parameters: { emotion: emotion.word },
              }
            );
          }}
          expectedHeight={useMappedValuesWithCallbacks(
            [ctx.windowSizeImmediate, resources.imageSizeImmediate],
            () => {
              return (
                ctx.windowSizeImmediate.get().height -
                resources.imageSizeImmediate.get().height -
                67 /* bottom nav */ -
                ctx.botBarHeight.get()
              );
            }
          )}
          contentWidth={windowWidthVWC}
          question="How do you want to feel today?"
        />
        <BottomNavBarMinimal
          active="home"
          clickHandlers={{
            series: () => {
              screenOut(
                workingVWC,
                startPop,
                transition,
                screen.parameters.series.exit,
                screen.parameters.series.trigger
              );
            },
            account: () => {
              screenOut(
                workingVWC,
                startPop,
                transition,
                screen.parameters.account.exit,
                screen.parameters.account.trigger
              );
            },
          }}
          widthVWC={windowWidthVWC}
          paddingBottomVWC={ctx.botBarHeight}
        />
      </GridContentContainer>
    </GridFullscreenContainer>
  );
};
