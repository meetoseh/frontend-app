import { ReactElement } from 'react';
import { ScreenComponentProps } from '../../models/Screen';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { GridImageBackground } from '../../../../shared/components/GridImageBackground';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { styles } from './HomeV4Styles';
import {
  useEntranceTransition,
  useTransitionProp,
} from '../../../../shared/lib/TransitionProp';
import {
  StandardScreenTransition,
  useStandardTransitionsState,
} from '../../../../shared/hooks/useStandardTransitions';
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { HorizontalSpacer } from '../../../../shared/components/HorizontalSpacer';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { WipeTransitionOverlay } from '../../../../shared/components/WipeTransitionOverlay';
import { OpacityTransitionOverlay } from '../../../../shared/components/OpacityTransitionOverlay';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { ContentContainer } from '../../../../shared/components/ContentContainer';
import { configurableScreenOut } from '../../lib/configurableScreenOut';
import { RoundMenu } from '../../../../shared/components/icons/RoundMenu';
import { OsehColors } from '../../../../shared/OsehColors';
import { HomeV4Resources } from './HomeV4Resources';
import { HomeV4MappedParams } from './HomeV4Params';
import { Play } from '../../../../shared/components/icons/Play';
import { HeartFilled } from '../../../../shared/components/icons/HeartFilled';
import { SendRight } from '../../../../shared/components/icons/SendRight';
import { GoalPill } from './components/GoalPillV4';
import { View, Pressable, Text } from 'react-native';

/**
 * Similiar to SimpleHome, but rearranged a bit. The version for iOS app version 4.2.1
 * aka v84.
 */
export const HomeV4 = ({
  ctx,
  screen,
  resources,
  startPop,
  trace,
}: ScreenComponentProps<
  'homev4',
  HomeV4Resources,
  HomeV4MappedParams
>): ReactElement => {
  const transition = useTransitionProp(
    (): StandardScreenTransition => screen.parameters.entrance
  );
  useEntranceTransition(transition);

  const transitionState = useStandardTransitionsState(transition);

  const workingVWC = useWritableValueWithCallbacks(() => false);
  const windowWidthVWC = useMappedValueWithCallbacks(
    ctx.windowSizeImmediate,
    (v) => v.width
  );

  return (
    <GridFullscreenContainer
      windowSizeImmediate={ctx.windowSizeImmediate}
      modals={false}
      statusBar="light"
    >
      <GridImageBackground
        image={resources.image}
        thumbhash={resources.imageThumbhash}
        size={ctx.windowSizeImmediate}
      />
      <OpacityTransitionOverlay opacity={transitionState.opacity} />
      <GridContentContainer
        contentWidthVWC={windowWidthVWC}
        gridSizeVWC={ctx.windowSizeImmediate}
        justifyContent="flex-start"
        left={transitionState.left}
        opacity={transitionState.opacity}
        scrollable={false}
      >
        <RenderGuardedComponent
          props={ctx.topBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
        <ContentContainer contentWidthVWC={ctx.contentWidth}>
          <View style={styles.row}>
            <Pressable
              onPress={() => {
                configurableScreenOut(
                  workingVWC,
                  startPop,
                  transition,
                  screen.parameters.menu.exit,
                  screen.parameters.menu.trigger,
                  {
                    afterDone: () => {
                      trace({ type: 'menu' });
                    },
                  }
                );
              }}
            >
              <RoundMenu
                icon={{ width: 18 }}
                container={{ width: 48 + 24, height: 48 + 8 }}
                startPadding={{
                  x: { fixed: 0 },
                  y: { fixed: 8 + (48 - 12) / 2 },
                }}
                color={OsehColors.v4.primary.light}
              />
            </Pressable>
          </View>
        </ContentContainer>
        <VerticalSpacer height={0} flexGrow={1} />
        <ContentContainer contentWidthVWC={ctx.contentWidth}>
          <RenderGuardedComponent
            props={resources.copy}
            component={(copy) => (
              <Text style={styles.headline}>{copy?.headline}</Text>
            )}
          />
        </ContentContainer>
        <VerticalSpacer height={0} maxHeight={24} flexGrow={3} />
        <ContentContainer contentWidthVWC={ctx.contentWidth}>
          <RenderGuardedComponent
            props={resources.copy}
            component={(copy) => {
              if (copy === null || copy === undefined) {
                return <></>;
              }

              if (copy.subheadline.startsWith('“')) {
                const sep = '” —';
                const parts = copy.subheadline.split(sep);
                if (parts.length === 2) {
                  const quote = parts[0].slice(1);
                  const author = parts[1];
                  return (
                    <>
                      <Text style={styles.subheadlineQuote}>{quote}</Text>
                      <VerticalSpacer height={12} />
                      <Text style={styles.subheadlineAuthor}>{author}</Text>
                    </>
                  );
                }
              }

              return <Text style={styles.subheadline}>{copy.subheadline}</Text>;
            }}
          />
        </ContentContainer>
        <VerticalSpacer height={0} maxHeight={48} flexGrow={3} />
        <ContentContainer contentWidthVWC={ctx.contentWidth}>
          <View style={styles.row}>
            <GoalPill
              streak={resources.streak}
              updateGoal={() => {
                configurableScreenOut(
                  workingVWC,
                  startPop,
                  transition,
                  screen.parameters.goal.exit,
                  screen.parameters.goal.trigger,
                  {
                    afterDone: () => {
                      trace({ type: 'goal' });
                    },
                  }
                );
              }}
            />
          </View>
        </ContentContainer>
        <VerticalSpacer height={0} flexGrow={1} />
        <ContentContainer contentWidthVWC={ctx.contentWidth}>
          <View style={styles.row}>
            <Pressable
              style={styles.bottomButton}
              onPress={() => {
                configurableScreenOut(
                  workingVWC,
                  startPop,
                  transition,
                  screen.parameters.classes.exit,
                  screen.parameters.classes.trigger,
                  {
                    afterDone: () => {
                      trace({ type: 'classes' });
                    },
                  }
                );
              }}
            >
              <Play
                icon={{ width: 28 }}
                container={{
                  width: 51,
                  height: 51,
                }}
                startPadding={{
                  x: { fixed: 9 },
                  y: { fraction: 0.5 },
                }}
                color={OsehColors.v4.primary.light}
              />
            </Pressable>
            <HorizontalSpacer width={0} maxWidth={24} flexGrow={1} />
            <Pressable
              style={styles.bottomButton}
              onPress={() => {
                configurableScreenOut(
                  workingVWC,
                  startPop,
                  transition,
                  screen.parameters.favorites.exit,
                  screen.parameters.favorites.trigger,
                  {
                    afterDone: () => {
                      trace({ type: 'favorites' });
                    },
                  }
                );
              }}
            >
              <HeartFilled
                icon={{ width: 24 }}
                container={{
                  width: 51,
                  height: 51,
                }}
                startPadding={{
                  x: { fraction: 0.5 },
                  y: { fraction: 0.5 },
                }}
                color={OsehColors.v4.primary.light}
              />
            </Pressable>
            <HorizontalSpacer width={0} maxWidth={24} flexGrow={1} />
            <Pressable
              style={styles.checkinButton}
              onPress={() => {
                configurableScreenOut(
                  workingVWC,
                  startPop,
                  transition,
                  screen.parameters.checkin.exit,
                  screen.parameters.checkin.trigger,
                  {
                    afterDone: () => {
                      trace({ type: 'checkin' });
                    },
                  }
                );
              }}
            >
              <View style={styles.column}>
                <VerticalSpacer height={12} />
                <View style={styles.row}>
                  <HorizontalSpacer width={20} />
                  <Text style={styles.checkinText}>
                    {screen.parameters.checkin.text}
                  </Text>
                  <HorizontalSpacer width={0} flexGrow={1} />
                  <SendRight
                    icon={{ width: 24 }}
                    container={{
                      width: 26,
                      height: 26,
                    }}
                    startPadding={{
                      x: { fraction: 0.5 },
                      y: { fraction: 0.5 },
                    }}
                    color={OsehColors.v4.primary.light}
                    color2={OsehColors.v4.primary.dark}
                  />
                  <HorizontalSpacer width={20} />
                </View>
                <VerticalSpacer height={12} />
              </View>
            </Pressable>
          </View>
        </ContentContainer>
        <VerticalSpacer height={56} />
        <RenderGuardedComponent
          props={ctx.botBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
      </GridContentContainer>
      <WipeTransitionOverlay wipe={transitionState.wipe} />
    </GridFullscreenContainer>
  );
};
