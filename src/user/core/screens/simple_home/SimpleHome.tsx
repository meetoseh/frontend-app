import { ReactElement } from 'react';
import { ScreenComponentProps } from '../../models/Screen';
import { SimpleHomeMappedParams } from './SimpleHomeParams';
import { SimpleHomeResources } from './SimpleHomeResources';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { GridImageBackground } from '../../../../shared/components/GridImageBackground';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { styles } from './SimpleHomeStyles';
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
import { FavoritesShortcut } from './icons/FavoritesShortcut';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { GoalPill } from '../home/components/GoalPill';
import { WipeTransitionOverlay } from '../../../../shared/components/WipeTransitionOverlay';
import { OpacityTransitionOverlay } from '../../../../shared/components/OpacityTransitionOverlay';
import { Pressable, View, Text } from 'react-native';
import { FilledInvertedButton } from '../../../../shared/components/FilledInvertedButton';
import { TextStyleForwarder } from '../../../../shared/components/TextStyleForwarder';
import { setVWC } from '../../../../shared/lib/setVWC';
import { LinkButton } from '../../../../shared/components/LinkButton';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { ContentContainer } from '../../../../shared/components/ContentContainer';
import { configurableScreenOut } from '../../lib/configurableScreenOut';
import { RoundMenu } from '../../../../shared/components/icons/RoundMenu';
import { OsehColors } from '../../../../shared/OsehColors';

/**
 * The version of the home screen with the home copy and goal pill in
 * the center. At the bottom is one or two call to actions, and the top
 * has some simple shortcuts to settings or favorites.
 */
export const SimpleHome = ({
  ctx,
  screen,
  resources,
  startPop,
  trace,
}: ScreenComponentProps<
  'simple_home',
  SimpleHomeResources,
  SimpleHomeMappedParams
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
          component={(topBarHeight) => <VerticalSpacer height={topBarHeight} />}
        />
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              trace({ type: 'nav' });
              configurableScreenOut(
                workingVWC,
                startPop,
                transition,
                screen.parameters.settings.exit,
                screen.parameters.settings.trigger
              );
            }}
          >
            <RoundMenu
              icon={{
                width: 18,
              }}
              container={{
                width: 48 + 24,
                height: 48 + 8,
              }}
              startPadding={{
                x: {
                  fixed: 24 + (48 - 18) / 2,
                },
                y: {
                  fixed: 8 + (48 - 12) / 2,
                },
              }}
              color={OsehColors.v4.primary.light}
            />
          </Pressable>
          <HorizontalSpacer width={0} flexGrow={1} />
          <Pressable
            onPress={() => {
              trace({ type: 'favorites' });
              configurableScreenOut(
                workingVWC,
                startPop,
                transition,
                screen.parameters.favorites.exit,
                screen.parameters.favorites.trigger
              );
            }}
            style={styles.favoritesWrapper}
          >
            <FavoritesShortcut />
          </Pressable>
        </View>
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
          <View style={styles.goal}>
            <GoalPill
              streak={resources.streak}
              updateGoal={() => {
                configurableScreenOut(
                  workingVWC,
                  startPop,
                  transition,
                  screen.parameters.goal.exit,
                  screen.parameters.goal.trigger
                );
              }}
            />
          </View>
        </ContentContainer>
        <VerticalSpacer height={0} maxHeight={48} flexGrow={3} />
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
        <VerticalSpacer height={0} flexGrow={1} />
        <ContentContainer contentWidthVWC={ctx.contentWidth}>
          <TextStyleForwarder
            component={(styleVWC) => (
              <FilledInvertedButton
                setTextStyle={(s) => setVWC(styleVWC, s)}
                onPress={() => {
                  trace({ type: 'cta' });
                  configurableScreenOut(
                    workingVWC,
                    startPop,
                    transition,
                    screen.parameters.cta.exit,
                    screen.parameters.cta.trigger
                  );
                }}
              >
                <RenderGuardedComponent
                  props={styleVWC}
                  component={(s) => (
                    <Text style={s}>{screen.parameters.cta.text}</Text>
                  )}
                />
              </FilledInvertedButton>
            )}
          />
        </ContentContainer>
        {screen.parameters.cta2 !== null && (
          <>
            <VerticalSpacer height={0} maxHeight={12} flexGrow={3} />
            <ContentContainer contentWidthVWC={ctx.contentWidth}>
              <TextStyleForwarder
                component={(styleVWC) => (
                  <LinkButton
                    setTextStyle={(s) => setVWC(styleVWC, s)}
                    onPress={() => {
                      const cta2 = screen.parameters.cta2;
                      if (cta2 === null) {
                        return;
                      }
                      trace({ type: 'cta2' });
                      configurableScreenOut(
                        workingVWC,
                        startPop,
                        transition,
                        cta2.exit,
                        cta2.trigger
                      );
                    }}
                  >
                    <RenderGuardedComponent
                      props={styleVWC}
                      component={(s) => (
                        <Text style={s}>{screen.parameters.cta2?.text}</Text>
                      )}
                    />
                  </LinkButton>
                )}
              />
            </ContentContainer>
          </>
        )}
        <VerticalSpacer height={56} />
      </GridContentContainer>
      <WipeTransitionOverlay wipe={transitionState.wipe} />
    </GridFullscreenContainer>
  );
};
