import { InappNotificationSession } from "../../../../shared/hooks/useInappNotificationSession";

/**
 * The resources required to render the request phone step.
 */
export type RequestPhoneResources = {
  /**
   * The in-app notification session, which will either be for the standard
   * phone number notification or for the onboarding phone number notification,
   * as appropriate.
   */
  session: InappNotificationSession | null;

  /**
   * True if app notifications are available to the user and hence we don't
   * need to ask for permission to send daily notifications via SMS to the
   * user, false if they are not available and we will want to do that via
   * SMS, null if we don't know yet.
   */
  appNotifsEnabled: boolean | null;

  /**
   * True if still waiting for more resources to load, false otherwise.
   */
  loading: boolean;
};
