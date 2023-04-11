import { ReactElement } from 'react';

/**
 * Describes a screen, similiar to Screen, except where the state is not
 * exposed. This should never be extended directly, but rather, the stateless
 * variant should be implemented and converted using an adapter function as the
 * stateless variant is much less error-prone to implement as there is less
 * implied functionality.
 */
export interface StatefulScreen {
  /**
   * True if the screen wants to be presented, false if it does not. Note that
   * when this is true the screen is not necessarily ready to be mounted, it
   * just knows it wants to be mounted.
   *
   * This should be undefined if the screen isn't sure if it's required yet. No
   * later screens will be presented while this is undefined, instead preferring
   * a splash screen.
   */
  readonly required: boolean | undefined;

  /**
   * A property-like object which can be set to false if the screen should not
   * load necessary resources for rendering and true if the screen should render
   * the necessary resources for rendering. Note that the screen isn't actually
   * ready to render until ready is true.
   */
  load: boolean;

  /**
   * True if the screen is ready to be mounted, false otherwise
   */
  readonly ready: boolean;

  /**
   * Can be called to retrieve the component to mount for this screen. This
   * result should not be memoized and should only be fetched when both
   * required and ready.
   */
  component(): ReactElement;
}
