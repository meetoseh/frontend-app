import { ReactElement } from 'react';
import { ScreenComponentProps } from '../../models/Screen';
import { LargeImageInterstitialMappedParams } from './LargeImageInterstitialParams';
import { LargeImageInterstitialResources } from './LargeImageInterstitialResources';
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
import { styles } from './LargeImageInterstitialStyles';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { OsehImageFromState } from '../../../../shared/images/OsehImageFromState';
import { ScreenTextContent } from '../../components/ScreenTextContent';
import { WipeTransitionOverlay } from '../../../../shared/components/WipeTransitionOverlay';
import { Text, View } from 'react-native';
import { TextStyleForwarder } from '../../../../shared/components/TextStyleForwarder';
import { FilledInvertedButton } from '../../../../shared/components/FilledInvertedButton';
import { setVWC } from '../../../../shared/lib/setVWC';
import { configurableScreenOut } from '../../lib/configurableScreenOut';

/**
 * A somewhat sophisticated image interstitial; top message, image, variable
 * content, button with CTA. The image height has a few thresholds based on the
 * screen height so it can generally be taller.
 */
export const LargeImageInterstitial = ({
  ctx,
  screen,
  resources,
  startPop,
}: ScreenComponentProps<
  'large_image_interstitial',
  LargeImageInterstitialResources,
  LargeImageInterstitialMappedParams
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
        <VerticalSpacer height={0} maxHeight={32} flexGrow={1} />
        <Text style={styles.top}>{screen.parameters.top}</Text>
        <VerticalSpacer height={8} flexGrow={1} />
        <RenderGuardedComponent
          props={useMappedValuesWithCallbacks(
            [resources.image, resources.imageSizeImmediate],
            () => ({
              image: resources.image.get(),
              size: resources.imageSizeImmediate.get(),
            })
          )}
          component={({ image, size }) => (
            <View
              style={[styles.image, { width: size.width, height: size.height }]}
            >
              <OsehImageFromState
                state={{
                  loading: image === null,
                  localUrl: image?.croppedUrl ?? null,
                  displayWidth: size.width,
                  displayHeight: size.height,
                  alt: '',
                  thumbhash: screen.parameters.image.thumbhash,
                }}
                style={{
                  borderRadius: 10,
                }}
              />
            </View>
          )}
        />
        <VerticalSpacer height={8} maxHeight={32} flexGrow={1} />
        <ScreenTextContent content={screen.parameters.content} />
        <VerticalSpacer height={8} flexGrow={1} />
        <TextStyleForwarder
          component={(styleVWC) => (
            <FilledInvertedButton
              onPress={async () => {
                configurableScreenOut(
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
      <WipeTransitionOverlay wipe={transitionState.wipe} />
    </GridFullscreenContainer>
  );
};
