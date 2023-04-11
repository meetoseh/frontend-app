/**
 * Describes the state necessary to determine if a screen should be rendered, as
 * well as any other state that other screens might need to access in order to
 * either load their resources or determine if they are required. Other screens
 * cannot use this state directly within their components, though they can
 * forward it through their resources.
 */
export type ScreenState = {
  /**
   * True if this state indicates the screen neeeds to be rendered, false if it
   * does not, undefined if unsure. Note that while this is undefined, no later
   * screens will be presented, instead preferring a splash screen.
   */
  required: boolean | undefined;
};
