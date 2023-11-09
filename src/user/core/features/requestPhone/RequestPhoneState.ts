import { InappNotification } from "../../../../shared/hooks/useInappNotification";

/**
 * Information about a recently added phone number
 */
export type NewPhoneInfo = {
  /**
   * True if the phone is eligible to receive daily reminders, false
   * otherwise
   */
  enabled: boolean;
};

/**
 * Describes the state required to determine if we need to request a users
 * phone number.
 */
export type RequestPhoneState = {
  /**
   * If loaded, the onboarding phone number in-app notification
   */
  onboardingPhoneNumberIAN: InappNotification | null;

  /**
   * Whether the user has a phone number associated with their account.
   */
  hasPhoneNumber: boolean | undefined;

  /**
   * Details if the user has added a phone number this session, null otherwise.
   * This is intended to be used by other states.
   */
  justAddedPhoneNumber: NewPhoneInfo | null;

  /**
   * Should be called when the user adds a new phone number to update
   * justAddedPhoneNumber.
   *
   * @param info The new phone number they just added
   */
  onAddedPhoneNumber: (info: NewPhoneInfo) => void;
};
