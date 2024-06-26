import { useEffect, useMemo } from 'react';
import AnimatedLottieView from 'lottie-react-native';
import {
  VariableStrategyProps,
  useVariableStrategyPropsAsValueWithCallbacks,
} from '../anim/VariableStrategyProps';
import {
  Callbacks,
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../lib/Callbacks';
import { PixelRatio } from 'react-native';

type CalculableSize =
  | { width: number; height: number }
  | { width: number; aspectRatio: number }
  | { height: number; aspectRatio: number };

type UseForwardBackwardEffectProps = {
  /**
   * True if this hook should be managing the animation item, false
   * otherwise.
   */
  enabled: VariableStrategyProps<boolean>;

  /**
   * The player that should be managed by this hook.
   */
  player: VariableStrategyProps<AnimatedLottieView | undefined>;

  /**
   * The callbacks which are invoked when the player completes its
   * current animation, where the boolean is true if the animation
   * was cancelled and false if the animation completed normally.
   *
   * This is a different from react web, where we can use event
   * listeners on the underlying AnimationItem rather than having
   * to provide a single callback as a prop to the player, which
   * can then be used to fire callbacks.
   */
  onAnimationFinished: Callbacks<boolean>;

  /**
   * The first and last frame of the animation. Changing this value
   * takes effect on the next animation cycle.
   *
   * This is different from react web, where we don't need to know
   * the exact frame numbers to play in reverse.
   */
  animationPoints: VariableStrategyProps<{ in: number; out: number }>;

  /**
   * The size to render the animation at, in pixels. May swap
   * one of width, height for the desired aspect ratio in
   * width/height.
   */
  size: VariableStrategyProps<CalculableSize>;

  /**
   * Determines how long to wait on each end of the animation before
   * reversing direction. Changing this value takes into affect at
   * the start of the next hold period.
   */
  holdTime: VariableStrategyProps<{
    /**
     * After completing the animation in the forward direction, how
     * long to wait before reversing direction.
     */
    forward: number;
    /**
     * After completing the animation in the backward direction, how
     * long to wait before reversing direction.
     */
    backward: number;
  }>;
};

type UseForwardBackwardEffectResult = {
  /**
   * The style that should be used for the player. This is a subset
   * of ViewStyle.
   */
  playerStyle: ValueWithCallbacks<{ width: number; height: number }>;
};

const computeSize = (
  size: CalculableSize
): {
  width: number;
  height: number;
  paddingRight: number;
  paddingBottom: number;
} => {
  if ('width' in size && 'height' in size) {
    const dpi = PixelRatio.get();
    const scaledTarget = {
      width: size.width * dpi,
      height: size.height * dpi,
    };
    const scaledPadding = {
      paddingRight: Math.ceil(scaledTarget.width) - scaledTarget.width,
      paddingBottom: Math.ceil(scaledTarget.height) - scaledTarget.height,
    };

    return {
      width: scaledTarget.width / dpi,
      height: scaledTarget.height / dpi,
      paddingRight: scaledPadding.paddingRight / dpi,
      paddingBottom: scaledPadding.paddingBottom / dpi,
    };
  } else if ('width' in size && 'aspectRatio' in size) {
    return computeSize({
      width: size.width,
      height: size.width / size.aspectRatio,
    });
  } else {
    return computeSize({
      width: size.height * size.aspectRatio,
      height: size.height,
    });
  }
};

/**
 * Manages the given lottie player to go forward then backward in an
 * infinite loop, holding the specified period of time at each end.
 */
export const useForwardBackwardEffect = ({
  enabled: enabledVariableStrategy,
  player: playerVariableStrategy,
  onAnimationFinished,
  animationPoints: animationPointsVariableStrategy,
  size: sizeVariableStrategy,
  holdTime: holdTimeVariableStrategy,
}: UseForwardBackwardEffectProps): UseForwardBackwardEffectResult => {
  const enabledVWC = useVariableStrategyPropsAsValueWithCallbacks(
    enabledVariableStrategy
  );
  const playerVWC = useVariableStrategyPropsAsValueWithCallbacks(
    playerVariableStrategy
  );
  const animationPointsVWC = useVariableStrategyPropsAsValueWithCallbacks(
    animationPointsVariableStrategy
  );
  const sizeVWC =
    useVariableStrategyPropsAsValueWithCallbacks(sizeVariableStrategy);
  const holdTimeVWC = useVariableStrategyPropsAsValueWithCallbacks(
    holdTimeVariableStrategy
  );
  const playerSizeVWC = useWritableValueWithCallbacks<{
    width: number;
    height: number;
    paddingRight: number;
    paddingBottom: number;
  }>(() => computeSize(sizeVWC.get()));

  useEffect(() => {
    let playerManagerCanceler: (() => void) | null = null;
    enabledVWC.callbacks.add(handleEnabledChanged);
    sizeVWC.callbacks.add(updatePlayerSize);
    playerVWC.callbacks.add(handlePlayerChanged);
    updatePlayerSize();
    handlePlayerChanged();
    handleEnabledChanged();
    return () => {
      enabledVWC.callbacks.remove(handleEnabledChanged);
      sizeVWC.callbacks.remove(updatePlayerSize);
      playerVWC.callbacks.remove(handlePlayerChanged);
      if (playerManagerCanceler !== null) {
        playerManagerCanceler();
        playerManagerCanceler = null;
      }
    };

    function managePlayerState(player: AnimatedLottieView): () => void {
      /*
       * Unlike on the web, there's no way to know when the player
       * is loaded. So instead we just schedule the forward pass
       * immediately.
       */
      let state:
        | 'forward'
        | 'holding-after-forward'
        | 'backward'
        | 'holding-after-backward' = 'forward';
      let holdTimeout: NodeJS.Timeout | null = null;

      const onComplete = () => {
        if (state !== 'forward' && state !== 'backward') {
          return;
        }

        player.pause();
        holdTimeout = setTimeout(onHoldFinished, holdTimeVWC.get()[state]);
        state =
          state === 'forward'
            ? 'holding-after-forward'
            : 'holding-after-backward';
        onAnimationFinished.remove(onComplete);
      };

      const onHoldFinished = () => {
        if (
          state !== 'holding-after-forward' &&
          state !== 'holding-after-backward'
        ) {
          return;
        }

        holdTimeout = null;
        const { in: inpoint, out: outpoint } = animationPointsVWC.get();

        if (state === 'holding-after-forward') {
          player.play(outpoint, inpoint);
          state = 'backward';
        } else {
          player.play(inpoint, outpoint);
          state = 'forward';
        }

        onAnimationFinished.add(onComplete);
      };

      onAnimationFinished.add(onComplete);
      player.play(animationPointsVWC.get().in, animationPointsVWC.get().out);

      return () => {
        if (holdTimeout !== null) {
          clearTimeout(holdTimeout);
          holdTimeout = null;
        }

        if (state === 'forward' || state === 'backward') {
          onAnimationFinished.remove(onComplete);
        }
      };
    }

    function updatePlayerSize() {
      const correctSize = computeSize(sizeVWC.get());
      if (
        playerSizeVWC.get().width !== correctSize.width ||
        playerSizeVWC.get().height !== correctSize.height
      ) {
        playerSizeVWC.set(correctSize);
        playerSizeVWC.callbacks.call(undefined);
      }
    }

    function handlePlayerChanged() {
      if (playerManagerCanceler !== null) {
        playerManagerCanceler();
        playerManagerCanceler = null;
      }

      if (!enabledVWC.get()) {
        return;
      }

      const player = playerVWC.get();
      if (player === undefined || player === null) {
        return;
      }

      playerManagerCanceler = managePlayerState(player);
    }

    function handleEnabledChanged() {
      if (enabledVWC.get() !== (playerManagerCanceler !== null)) {
        handlePlayerChanged();
      }
    }
  }, [
    enabledVWC,
    playerVWC,
    sizeVWC,
    holdTimeVWC,
    playerSizeVWC,
    onAnimationFinished,
  ]);

  return useMemo(() => ({ playerStyle: playerSizeVWC }), [playerSizeVWC]);
};
