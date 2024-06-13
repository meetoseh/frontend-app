import { ReactElement } from 'react';
import { View, Text } from 'react-native';
import { ScreenComponentProps } from '../../models/Screen';
import { GridDarkGrayBackground } from '../../../../shared/components/GridDarkGrayBackground';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import { styles } from './ImageInterstitialStyles';
import {
  playExitTransition,
  useEntranceTransition,
  useTransitionProp,
} from '../../../../shared/lib/TransitionProp';
import {
  StandardScreenTransition,
  useStandardTransitionsState,
} from '../../../../shared/hooks/useStandardTransitions';
import { WipeTransitionOverlay } from '../../../../shared/components/WipeTransitionOverlay';
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { setVWC } from '../../../../shared/lib/setVWC';
import { ImageInterstitialResources } from './ImageInterstitialResources';
import { ImageInterstitialMappedParams } from './ImageInterstitialParams';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { OsehImageFromState } from '../../../../shared/images/OsehImageFromState';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { FilledInvertedButton } from '../../../../shared/components/FilledInvertedButton';
import { screenOut } from '../../lib/screenOut';
import { TextStyleForwarder } from '../../../../shared/components/TextStyleForwarder';

/**
 * A basic image interstitial; top message, image, header, subheader, button with CTA
 */
export const ImageInterstitial = ({
  ctx,
  screen,
  resources,
  startPop,
  trace,
}: ScreenComponentProps<
  'image_interstitial',
  ImageInterstitialResources,
  ImageInterstitialMappedParams
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
        justifyContent="flex-start"
        gridSizeVWC={ctx.windowSizeImmediate}
        scrollable={false}
      >
        <RenderGuardedComponent
          props={ctx.topBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
        <VerticalSpacer height={32} />
        <Text style={styles.topMessage}>{screen.parameters.top}</Text>
        <VerticalSpacer height={0} flexGrow={1} />
        <RenderGuardedComponent
          props={useMappedValuesWithCallbacks(
            [resources.image, resources.imageSizeImmediate],
            () => ({
              image: resources.image.get(),
              size: resources.imageSizeImmediate.get(),
            })
          )}
          component={({ image, size }) => (
            <OsehImageFromState
              state={{
                loading: image.type !== 'success',
                localUrl:
                  image.type === 'success' ? image.data.croppedUrl : null,
                displayWidth: size.width,
                displayHeight: size.height,
                alt: '',
                thumbhash: screen.parameters.image.thumbhash,
              }}
              style={{ borderRadius: 10 }}
            />
          )}
        />
        <VerticalSpacer height={32} />
        <Text style={styles.header}>{screen.parameters.header}</Text>
        <VerticalSpacer height={16} />
        <Text style={styles.message}>{screen.parameters.message}</Text>
        <VerticalSpacer height={0} flexGrow={1} />
        <TextStyleForwarder
          component={(styleVWC) => (
            <FilledInvertedButton
              onPress={() => {
                screenOut(
                  workingVWC,
                  startPop,
                  transition,
                  screen.parameters.exit,
                  screen.parameters.trigger,
                  {
                    beforeDone: async () => {
                      trace({ type: 'cta' });
                    },
                  }
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
