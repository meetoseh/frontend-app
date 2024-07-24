import { ReactElement } from 'react';
import { ScreenComponentProps } from '../../models/Screen';
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
import { styles } from './AnimatedImageInterstitialStyles';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { OsehImageFromState } from '../../../../shared/images/OsehImageFromState';
import { ScreenTextContent } from '../../components/ScreenTextContent';
import { screenOut } from '../../lib/screenOut';
import { WipeTransitionOverlay } from '../../../../shared/components/WipeTransitionOverlay';
import { Text, View } from 'react-native';
import { TextStyleForwarder } from '../../../../shared/components/TextStyleForwarder';
import { FilledInvertedButton } from '../../../../shared/components/FilledInvertedButton';
import { setVWC } from '../../../../shared/lib/setVWC';
import { AnimatedImageInterstitialResources } from './AnimatedImageInterstitialResources';
import { AnimatedImageInterstitialMappedParams } from './AnimatedImageInterstitialParams';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { ContentContainer } from '../../../../shared/components/ContentContainer';
import { PIAnimatedImage } from './components/PIAnimatedImage';

/**
 * An animated image interstitial formed from 2 images being moved, rotated, scaled, and
 * faded.
 */
export const AnimatedImageInterstitial = ({
  ctx,
  screen,
  resources,
  startPop,
}: ScreenComponentProps<
  'animated_image_interstitial',
  AnimatedImageInterstitialResources,
  AnimatedImageInterstitialMappedParams
>): ReactElement => {
  const transition = useTransitionProp(
    (): StandardScreenTransition => screen.parameters.entrance
  );
  useEntranceTransition(transition);

  const windowWidthVWC = useMappedValueWithCallbacks(
    ctx.windowSizeImmediate,
    (s) => s.width
  );
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
        contentWidthVWC={windowWidthVWC}
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
        <VerticalSpacer height={0} maxHeight={32} flexGrow={1} />
        <ContentContainer contentWidthVWC={ctx.contentWidth}>
          <Text style={styles.top}>{screen.parameters.top}</Text>
        </ContentContainer>
        <VerticalSpacer height={8} flexGrow={1} />
        <RenderGuardedComponent
          props={useMappedValuesWithCallbacks(
            [
              resources.image1,
              resources.imageSizeImmediate1,
              resources.image2,
              resources.imageSizeImmediate2,
              windowWidthVWC,
              resources.precomputedBeziers,
            ],
            () => ({
              image1: resources.image1.get(),
              size1: resources.imageSizeImmediate1.get(),
              image2: resources.image2.get(),
              size2: resources.imageSizeImmediate2.get(),
              boxWidth: windowWidthVWC.get(),
              boxHeight: screen.parameters.height,
              precomputed: resources.precomputedBeziers.get(),
            })
          )}
          component={({
            image1,
            size1,
            image2,
            size2,
            boxWidth,
            boxHeight,
            precomputed,
          }) => (
            <View style={[styles.box, { width: boxWidth, height: boxHeight }]}>
              {image1 !== null && (
                <PIAnimatedImage
                  src={image1.croppedUrl}
                  width={size1.width}
                  height={size1.height}
                  boxWidth={boxWidth}
                  boxHeight={boxHeight}
                  animation={screen.parameters.animation1}
                  precomputed={precomputed}
                />
              )}
              {image2 !== null && (
                <PIAnimatedImage
                  src={image2.croppedUrl}
                  width={size2.width}
                  height={size2.height}
                  boxWidth={boxWidth}
                  boxHeight={boxHeight}
                  animation={screen.parameters.animation2}
                  precomputed={precomputed}
                />
              )}
            </View>
          )}
        />
        <VerticalSpacer height={8} maxHeight={32} flexGrow={1} />
        <ContentContainer contentWidthVWC={ctx.contentWidth}>
          <ScreenTextContent content={screen.parameters.content} />
        </ContentContainer>
        <VerticalSpacer height={8} flexGrow={1} />
        <ContentContainer contentWidthVWC={ctx.contentWidth}>
          <TextStyleForwarder
            component={(styleVWC) => (
              <FilledInvertedButton
                onPress={async () => {
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
        </ContentContainer>
        <VerticalSpacer height={0} maxHeight={32} flexGrow={1} />
        <RenderGuardedComponent
          props={ctx.botBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
      </GridContentContainer>
      <WipeTransitionOverlay wipe={transitionState.wipe} />
    </GridFullscreenContainer>
  );
};
