import { StatusBar } from 'expo-status-bar';
import {
  MutableRefObject,
  ReactElement,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { View } from 'react-native';
import { styles } from './SplashScreenStyles';
import AnimatedLottieView from 'lottie-react-native';
import {
  useWindowSize,
  useWindowSizeValueWithCallbacks,
} from '../../shared/hooks/useWindowSize';
import {
  Callbacks,
  useWritableValueWithCallbacks,
} from '../../shared/lib/Callbacks';
import { useForwardBackwardEffect } from '../../shared/hooks/useForwardBackwardEffect';
import { adaptValueWithCallbacksAsVariableStrategyProps } from '../../shared/lib/adaptValueWithCallbacksAsVariableStrategyProps';
import { RenderGuardedComponent } from '../../shared/components/RenderGuardedComponent';
import { useMappedValueWithCallbacks } from '../../shared/hooks/useMappedValueWithCallbacks';
import { InlineOsehSpinner } from '../../shared/components/InlineOsehSpinner';

const BRANDMARK_HOLD_TIME_MS = { forward: 750, backward: 500 };
const BRANDMARK_WIDTH = (windowSize: {
  width: number;
  height: number;
}): number => Math.min(0.5 * windowSize.width, 0.5 * windowSize.height, 135);
const BRANDMARK_NATURAL_ASPECT_RATIO = 1341 / 1080;
/** The initial frame of the brandmark animation, aka the in point, aka "ip" */
const BRANDMARK_INPOINT = 0;
/** The final frame of the brandmark animation; aka the out point, aka "op" */
const BRANDMARK_OUTPOINT = 44;

const WORDMARK_HOLD_TIME_MS = { forward: 750, backward: 500 };
const WORDMARK_WIDTH = (windowSize: {
  width: number;
  height: number;
}): number => Math.min(0.75 * windowSize.width, 0.75 * windowSize.height, 163);
const WORDMARK_NATURAL_ASPECT_RATIO = 1407 / 615;
const WORDMARK_INPOINT = 0;
const WORDMARK_OUTPOINT = 86;

type SplashScreenProps = {
  /**
   * The style to use for the spinner. Defaults to 'brandmark'
   */
  type?: 'wordmark' | 'brandmark' | undefined;
};
/**
 * Shows a fun animation and image which is typically used while the app is
 * loading.
 */
export const SplashScreen = ({ type }: SplashScreenProps): ReactElement => {
  const realStyle = type ?? 'brandmark';

  if (realStyle === 'brandmark') {
    return <FastInlineOsehSpinnerSplashScreen />;
  }

  return <LottieSplashScreen type={realStyle} />;
};

const FastInlineOsehSpinnerSplashScreen = (): ReactElement => {
  const windowSizeVWC = useWindowSizeValueWithCallbacks();
  const renderedSize = useMappedValueWithCallbacks(
    windowSizeVWC,
    (windowSize) => ({
      width: BRANDMARK_WIDTH(windowSize),
    })
  );

  return (
    <View style={styles.fastContainer}>
      <InlineOsehSpinner
        size={{
          type: 'callbacks',
          props: renderedSize.get,
          callbacks: renderedSize.callbacks,
        }}
      />
      <StatusBar style="light" />
    </View>
  );
};

const LottieSplashScreen = ({ type }: SplashScreenProps): ReactElement => {
  const realType = type ?? 'brandmark';

  const playerVWC = useWritableValueWithCallbacks<
    AnimatedLottieView | undefined
  >(() => undefined);
  const playerCallbackScheduled = useRef<boolean>(false);
  const setPlayerRef = useCallback(
    (player: AnimatedLottieView) => {
      playerVWC.set(player);
      if (!playerCallbackScheduled.current) {
        playerCallbackScheduled.current = true;
        setTimeout(() => {
          playerCallbackScheduled.current = false;
          playerVWC.callbacks.call(undefined);
        }, 0);
      }
    },
    [playerVWC]
  );

  const animationFinished = useRef<Callbacks<boolean>>() as MutableRefObject<
    Callbacks<boolean>
  >;
  if (animationFinished.current === undefined) {
    animationFinished.current = new Callbacks<boolean>();
  }
  const onAnimationFinishWrapper = useCallback((isCanceled: boolean) => {
    animationFinished.current.call(isCanceled);
  }, []);

  const windowSize = useWindowSize();

  const { playerStyle: playerStyleBrandmark } = useForwardBackwardEffect({
    enabled: { type: 'react-rerender', props: realType === 'brandmark' },
    player: adaptValueWithCallbacksAsVariableStrategyProps(playerVWC),
    onAnimationFinished: animationFinished.current,
    animationPoints: {
      type: 'react-rerender',
      props: { in: BRANDMARK_INPOINT, out: BRANDMARK_OUTPOINT },
    },
    size: {
      type: 'react-rerender',
      props: {
        aspectRatio: BRANDMARK_NATURAL_ASPECT_RATIO,
        width: BRANDMARK_WIDTH(windowSize),
      },
    },
    holdTime: { type: 'react-rerender', props: BRANDMARK_HOLD_TIME_MS },
  });
  const { playerStyle: playerStyleWordmark } = useForwardBackwardEffect({
    enabled: { type: 'react-rerender', props: realType === 'wordmark' },
    player: adaptValueWithCallbacksAsVariableStrategyProps(playerVWC),
    onAnimationFinished: animationFinished.current,
    animationPoints: {
      type: 'react-rerender',
      props: { in: WORDMARK_INPOINT, out: WORDMARK_OUTPOINT },
    },
    size: {
      type: 'react-rerender',
      props: {
        aspectRatio: WORDMARK_NATURAL_ASPECT_RATIO,
        width: WORDMARK_WIDTH(windowSize),
      },
    },
    holdTime: { type: 'react-rerender', props: WORDMARK_HOLD_TIME_MS },
  });

  const containerStyle = useMemo(() => {
    return Object.assign({}, styles.container, {
      width: windowSize.width,
      height: windowSize.height,
    });
  }, [windowSize]);

  const playerStyleVWC =
    realType === 'brandmark' ? playerStyleBrandmark : playerStyleWordmark;
  return (
    <View style={containerStyle}>
      <RenderGuardedComponent
        props={playerStyleVWC}
        component={(playerStyle) => (
          <AnimatedLottieView
            key={realType}
            autoPlay={false}
            loop={false}
            ref={setPlayerRef}
            style={playerStyle}
            onAnimationFinish={onAnimationFinishWrapper}
            source={
              realType === 'wordmark'
                ? require('./assets/wordmark.lottie.json')
                : require('./assets/brandmark.lottie.json')
            }
          />
        )}
      />
      <StatusBar style="light" />
    </View>
  );
};
