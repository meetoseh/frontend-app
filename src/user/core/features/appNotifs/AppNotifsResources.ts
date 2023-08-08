import { InappNotificationSession } from "../../../../shared/hooks/useInappNotificationSession";

/**
 * The resources required for displaying the screen asking the user to
 * allow notifications. Note that this is referring to our screen, which
 * we always show before the native dialog, not the native dialog itself.
 */
export type AppNotifsResources = {
  /**
   * The inapp notification session to report user interactions with, or
   * null if it's not available.
   */
  session: InappNotificationSession | null;

  /**
   * True if we are still loading resources required for presenting the
   * screen, false otherwise.
   */
  loading: boolean;
};
