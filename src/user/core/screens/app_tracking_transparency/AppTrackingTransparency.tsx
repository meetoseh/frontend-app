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
import { AppTrackingTransparencyResources } from './AppTrackingTransparencyResources';
import { AppTrackingTransparencyMappedParams } from './AppTrackingTransparencyParams';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { GridDarkGrayBackground } from '../../../../shared/components/GridDarkGrayBackground';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { createOsehTrackingPermissionsRequest } from './lib/trackingPermissionHandler';
import { screenWithWorking } from '../../lib/screenWithWorking';
import { configurableScreenOut } from '../../lib/configurableScreenOut';

/**
 * A basic confirmation screen with a header and message
 */
export const AppTrackingTransparency = ({
  ctx,
  screen,
  startPop,
  trace,
}: ScreenComponentProps<
  'app_tracking_transparency',
  AppTrackingTransparencyResources,
  AppTrackingTransparencyMappedParams
>): ReactElement => {
  const transition = useTransitionProp(
    (): StandardScreenTransition => ({ type: 'none', ms: 0 })
  );
  useEntranceTransition(transition);

  const transitionState = useStandardTransitionsState(transition);

  const workingVWC = useWritableValueWithCallbacks(() => false);

  useEffect(() => {
    // use a timeout to ensure we don't double-popup in dev
    let active = true;
    let timeout: NodeJS.Timeout | null = setTimeout(handle, 100);
    return () => {
      active = false;
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }
    };

    async function handle() {
      timeout = null;
      if (!active) {
        return;
      }

      screenWithWorking(workingVWC, async () => {
        trace({ type: 'app-tracking-transparency', step: 'open' });
        const permissions = await requestTrackingPermissionsAsync();
        trace({
          type: 'app-tracking-transparency',
          step: 'close',
          granted: permissions.granted,
        });
        ctx.resources.trackingPermissionHandler.evictOrReplace(
          createOsehTrackingPermissionsRequest(),
          () => ({
            type: 'data',
            data: {
              granted: permissions.granted,
              expires: permissions.expires,
              canAskAgain: permissions.canAskAgain,
            },
          })
        );
        if (active) {
          configurableScreenOut(
            null,
            startPop,
            transition,
            { type: 'none', ms: 0 },
            permissions.granted
              ? screen.parameters.success
              : screen.parameters.failure
          );
        }
      });
    }
  }, []);

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
