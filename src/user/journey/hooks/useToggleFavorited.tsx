import { useCallback, useContext } from 'react';
import { VariableStrategyProps } from '../../../shared/anim/VariableStrategyProps';
import { Modals } from '../../../shared/contexts/ModalContext';
import {
  ValueWithCallbacks,
  WritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../shared/lib/Callbacks';
import { useFavoritedModal } from '../../favorites/hooks/useFavoritedModal';
import { adaptValueWithCallbacksAsVariableStrategyProps } from '../../../shared/lib/adaptValueWithCallbacksAsVariableStrategyProps';
import { useUnfavoritableModal } from '../../favorites/hooks/useUnfavoritableModal';
import { useUnfavoritedModal } from '../../favorites/hooks/useUnfavoritedModal';
import { useErrorModal } from '../../../shared/hooks/useErrorModal';
import { LoginContext } from '../../../shared/contexts/LoginContext';
import { toggleFavorited } from '../lib/toggleFavorited';
import { setVWC } from '../../../shared/lib/setVWC';
import { DisplayableError } from '../../../shared/lib/errors';

type UseToggleFavoritedProps = {
  /**
   * The modals to use for displaying liked/unliked/unfavoritable
   */
  modals: WritableValueWithCallbacks<Modals>;

  /**
   * The journey whose favorited state should be toggled
   */
  journey: VariableStrategyProps<{ uid: string }>;

  /**
   * The shared state for the journey, including if it's currently
   * favorited.
   */
  shared: ValueWithCallbacks<{
    favorited: boolean | null;
    setFavorited: (v: boolean) => void;
  }>;
  /**
   * If we know that the journey is not favoritable we can
   * skip the network request by setting this to true. If we know the journey is
   * favoritable, we can set this to false to help us distinguish error messages.
   * If we known know leave this undefined or set it undefined and we will assume
   * that a 404 when liking means that the journey is not favoritable.
   */
  knownUnfavoritable?: VariableStrategyProps<boolean | undefined>;

  /**
   * If specified, we write this to true when we're working and false when we're
   * done. This is useful for disabling buttons while we're working.
   */
  working?: WritableValueWithCallbacks<boolean>;

  /** The height of the top bar for positioning errors */
  topBarHeight: ValueWithCallbacks<number>;
};
/**
 * Creates a function which will toggle the favorited state of the given
 * journey. This is a hook-like function, and the result is memoized.
 *
 * This will handle the liked/unliked modals and will report errors via
 * useErrorModal.
 */
export const useToggleFavorited = ({
  modals,
  journey,
  shared,
  knownUnfavoritable,
  working: workingVWC,
  topBarHeight: topBarHeightVWC,
}: UseToggleFavoritedProps): (() => Promise<void>) => {
  const loginContextRaw = useContext(LoginContext);
  const showLikedUntilVWC = useWritableValueWithCallbacks<number | undefined>(
    () => undefined
  );
  const showUnlikedUntilVWC = useWritableValueWithCallbacks<number | undefined>(
    () => undefined
  );
  const showUnlikableUntilVWC = useWritableValueWithCallbacks<
    number | undefined
  >(() => undefined);
  const errorVWC = useWritableValueWithCallbacks<DisplayableError | null>(
    () => null
  );
  const counterVWC = useWritableValueWithCallbacks<number>(() => 0);

  useFavoritedModal(
    adaptValueWithCallbacksAsVariableStrategyProps(showLikedUntilVWC),
    modals
  );
  useUnfavoritedModal(
    adaptValueWithCallbacksAsVariableStrategyProps(showUnlikedUntilVWC),
    modals
  );
  useUnfavoritableModal(
    adaptValueWithCallbacksAsVariableStrategyProps(showUnlikableUntilVWC),
    modals
  );
  useErrorModal(modals, errorVWC, { topBarHeightVWC });

  return useCallback(async () => {
    const id = counterVWC.get() + 1;
    setVWC(counterVWC, id);
    if (workingVWC !== undefined) {
      setVWC(workingVWC, true);
    }

    try {
      await toggleFavorited(
        loginContextRaw,
        journey.type === 'react-rerender' ? journey.props : journey.props(),
        shared,
        showLikedUntilVWC,
        showUnlikedUntilVWC,
        showUnlikableUntilVWC,
        errorVWC,
        ((v) => {
          if (v === undefined) {
            return undefined;
          }
          if (v.type === 'react-rerender') {
            return v.props;
          }
          return v.props();
        })(knownUnfavoritable)
      );
    } finally {
      if (counterVWC.get() === id && workingVWC !== undefined) {
        setVWC(workingVWC, false);
      }
    }
  }, [
    loginContextRaw,
    showLikedUntilVWC,
    showUnlikedUntilVWC,
    showUnlikableUntilVWC,
    errorVWC,
    knownUnfavoritable,
    journey,
    shared,
    workingVWC,
    counterVWC,
  ]);
};
