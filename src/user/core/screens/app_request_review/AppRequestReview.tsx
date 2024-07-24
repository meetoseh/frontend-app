import { ReactElement, useEffect } from 'react';
import { ScreenComponentProps } from '../../models/Screen';
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
import { GridDarkGrayBackground } from '../../../../shared/components/GridDarkGrayBackground';
import { screenOut } from '../../lib/screenOut';
import { setVWC } from '../../../../shared/lib/setVWC';
import { AppRequestReviewResources } from './AppRequestReviewResources';
import { AppRequestReviewMappedParams } from './AppRequestReviewParams';
import { requestReview } from 'expo-store-review';

/**
 * A dark gray background while we present the native app request review native popup
 */
export const AppRequestReview = ({
  ctx,
  screen,
  startPop,
  trace,
}: ScreenComponentProps<
  'app_review_request',
  AppRequestReviewResources,
  AppRequestReviewMappedParams
>): ReactElement => {
  const transition = useTransitionProp(
    (): StandardScreenTransition => ({ type: 'none', ms: 0 })
  );
  useEntranceTransition(transition);

  const transitionState = useStandardTransitionsState(transition);

  const workingVWC = useWritableValueWithCallbacks(() => false);

  const handlingVWC = useWritableValueWithCallbacks(() => false);
  useEffect(() => {
    if (handlingVWC.get()) {
      return;
    }
    setVWC(handlingVWC, true);
    handle();
    return undefined;

    async function handle() {
      if (
        requestReview === null ||
        requestReview === undefined ||
        typeof requestReview !== 'function'
      ) {
        trace({
          type: 'detected-error',
          message: `requestReview is not a function (is ${typeof requestReview})`,
        });
        screenOut(
          workingVWC,
          startPop,
          transition,
          { type: 'none', ms: 0 },
          screen.parameters.trigger
        );
        return;
      }

      trace({ type: 'request-review-native', step: 'start' });
      try {
        await requestReview();
        trace({ type: 'request-review-native', step: 'success' });
      } catch (e) {
        trace({ type: 'request-review-native', step: 'catch', error: `${e}` });
      }
      screenOut(
        workingVWC,
        startPop,
        transition,
        { type: 'none', ms: 0 },
        screen.parameters.trigger
      );
    }
  }, [handlingVWC]);

  return (
    <GridFullscreenContainer
      windowSizeImmediate={ctx.windowSizeImmediate}
      statusBar={true}
      modals={false}
    >
      <GridDarkGrayBackground />
    </GridFullscreenContainer>
  );
};