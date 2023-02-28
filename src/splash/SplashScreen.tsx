import { StatusBar } from 'expo-status-bar';
import {
  Dispatch,
  ReactElement,
  RefObject,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { View, ViewStyle } from 'react-native';
import { styles } from './SplashScreenStyles';
import LottieView from 'lottie-react-native';
import AnimatedLottieView from 'lottie-react-native';
import { useScreenSize } from '../shared/hooks/useScreenSize';

const BRANDMARK_HOLD_TIME_MS = { forward: 750, backward: 500 };
const BRANDMARK_WIDTH = (windowSize: { width: number; height: number }): number =>
  Math.min(0.75 * windowSize.width, 0.75 * windowSize.height, 250);
const BRANDMARK_NATURAL_ASPECT_RATIO = 1341 / 1080;
/** The initial frame of the brandmark animation, aka the in point, aka "ip" */
const BRANDMARK_INPOINT = 0;
/** The final frame of the brandmark animation; aka the out point, aka "op" */
const BRANDMARK_OUTPOINT = 44;

const WORDMARK_HOLD_TIME_MS = { forward: 750, backward: 500 };
const WORDMARK_WIDTH = (windowSize: { width: number; height: number }): number =>
  Math.min(0.75 * windowSize.width, 0.75 * windowSize.height, 163);
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
  const realType = type ?? 'brandmark';

  const animation = useRef<AnimatedLottieView>(null);
  const [playerStyle, setPlayerStyle] = useState<ViewStyle>({});
  const onAnimationFinishRef = useRef<((isCanceled: boolean) => void) | null>(null);
  const screenSize = useScreenSize();

  const onAnimationFinishWrapper = useCallback((isCanceled: boolean) => {
    if (onAnimationFinishRef.current) {
      onAnimationFinishRef.current(isCanceled);
    }
  }, []);

  const setOnAnimationFinish = useCallback((cb: ((isCanceled: boolean) => void) | null) => {
    onAnimationFinishRef.current = cb;
  }, []);

  useForwardBackwardEffect({
    style: realType,
    expectedStyle: 'brandmark',
    playerRef: animation,
    windowSize: screenSize,
    setOnAnimationFinish,
    setPlayerStyle,
    naturalAspectRatio: BRANDMARK_NATURAL_ASPECT_RATIO,
    desiredWidth: BRANDMARK_WIDTH,
    holdTime: BRANDMARK_HOLD_TIME_MS,
  });
  useForwardBackwardEffect({
    style: realType,
    expectedStyle: 'wordmark',
    playerRef: animation,
    windowSize: screenSize,
    setOnAnimationFinish,
    setPlayerStyle,
    naturalAspectRatio: WORDMARK_NATURAL_ASPECT_RATIO,
    desiredWidth: WORDMARK_WIDTH,
    holdTime: WORDMARK_HOLD_TIME_MS,
  });

  return (
    <View style={styles.container}>
      <LottieView
        key={realType}
        autoPlay={false}
        autoSize={false}
        loop={false}
        ref={animation}
        style={playerStyle}
        onAnimationFinish={onAnimationFinishWrapper}
        source={
          realType === 'wordmark'
            ? require('./assets/wordmark.lottie.json')
            : require('./assets/brandmark.lottie.json')
        }
      />
      <StatusBar style="auto" />
    </View>
  );
};

const useForwardBackwardEffect = ({
  style,
  expectedStyle,
  playerRef,
  setOnAnimationFinish,
  windowSize,
  setPlayerStyle,
  naturalAspectRatio,
  desiredWidth,
  holdTime,
}: {
  style: 'wordmark' | 'brandmark';
  expectedStyle: 'wordmark' | 'brandmark';
  playerRef: RefObject<AnimatedLottieView | undefined>;
  setOnAnimationFinish: (cb: ((isCanceled: boolean) => void) | null) => void;
  windowSize: { width: number; height: number };
  setPlayerStyle: Dispatch<SetStateAction<ViewStyle>>;
  naturalAspectRatio: number;
  desiredWidth: (windowSize: { width: number; height: number }) => number;
  holdTime: { forward: number; backward: number };
}) => {
  useEffect(() => {
    if (style !== expectedStyle) {
      return;
    }

    const player = playerRef.current;
    if (player === null || player === undefined) {
      return;
    }
    const inpoint = style === 'wordmark' ? WORDMARK_INPOINT : BRANDMARK_INPOINT;
    const outpoint = style === 'wordmark' ? WORDMARK_OUTPOINT : BRANDMARK_OUTPOINT;

    let onAnimFinish: (() => void) | null = null;
    setOnAnimationFinish((isCanceled) => {
      if (isCanceled) {
        return;
      }
      onAnimFinish?.();
    });

    const desWidth = Math.floor(desiredWidth(windowSize));
    setPlayerStyle({
      width: desWidth,
      height: Math.floor(desWidth / naturalAspectRatio),
    });

    let state: 'forward' | 'holding-after-forward' | 'backward' | 'holding-after-backward' =
      'forward';
    let holdTimeout: NodeJS.Timeout | null = null;
    player.play(inpoint, outpoint);

    const onComplete = () => {
      if (state !== 'forward' && state !== 'backward') {
        return;
      }

      holdTimeout = setTimeout(onHoldFinished, holdTime[state]);
      state = state === 'forward' ? 'holding-after-forward' : 'holding-after-backward';
      onAnimFinish = null;
    };
    onAnimFinish = onComplete;

    const onHoldFinished = () => {
      if (state !== 'holding-after-forward' && state !== 'holding-after-backward') {
        return;
      }

      holdTimeout = null;

      onAnimFinish = onComplete;
      if (state === 'holding-after-forward') {
        player.play(outpoint, inpoint);
        state = 'backward';
      } else {
        player.play(inpoint, outpoint);
        state = 'forward';
      }
    };

    return () => {
      if (holdTimeout !== null) {
        clearTimeout(holdTimeout);
        holdTimeout = null;
      }

      setOnAnimationFinish(null);
    };
  }, [
    desiredWidth,
    holdTime,
    naturalAspectRatio,
    playerRef,
    setOnAnimationFinish,
    setPlayerStyle,
    style,
    windowSize,
    expectedStyle,
  ]);
};
