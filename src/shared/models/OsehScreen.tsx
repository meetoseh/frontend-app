import { ReactElement } from 'react';
import { ScreenResources } from './ScreenResources';
import { ScreenState } from './ScreenState';
import { SharedState } from './SharedState';

/**
 * Describes a generic screen, which hoists the state required to determine if
 * the screen should be displayed up, and exposes a hook for loading the
 * resources for said screen.
 *
 * This allows a ScreenManager to select which screen to display, load resources
 * independently of mounting the screen, show splash screens, etc.
 *
 * Note that this is the stateless variant, i.e., the state and resources are
 * exposed as hooks and passed to the other functions. The useStatefulScreen
 * function exposed in lib can be used to convert this to a StatefulScreen,
 * which can be used in e.g. arrays and thus is suitable for a ScreenManager.
 */
export type OsehScreen<T extends ScreenState, J extends ScreenResources, S extends SharedState> = {
  /**
   * Acts as a standard react hook for the state of this step as is pertinent
   * to determining if this step should be rendered. This is also the only
   * state that other steps will be able to access.
   */
  useState: () => T;

  /**
   * Returns the new shared state based on the given shared state and our
   * current state. Must return the same shared state unless an update is
   * required.
   *
   * Should be left undefined if a no-op
   */
  updateSharedState?: (state: T, sharedState: S) => S;

  /**
   * A standard react hook for the resources required to render the component
   * for this step. The resources can depend on this steps state and on other
   * steps states.
   *
   * The `load` hint indicates whether or not this screen should actually attempt
   * to load resources. If false, the returned resources should perpetually be in
   * the loading state.
   */
  useResources: (state: T, load: boolean, allStates: S) => J;

  /**
   * Creates the component for this step. from just this steps state and resources.
   */
  component: (state: T, resources: J) => ReactElement;
};
