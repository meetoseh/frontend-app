export type LoginState = {
  /**
   * True if logging in is required, false if the user is already logged in.
   * Undefined if unsure because we are still loading the login state.
   */
  required?: boolean;

  /**
   * True if the user logged in and hasn't gone through onboarding,
   * false if the user either was already logged in or logged in and has already
   * gone through onboarding, undefined if unsure.
   */
  onboard: boolean | undefined;

  /**
   * Called to set the onboard value. This should only be used by components
   * reacting to new login JWTs or by components which manage the onboarding
   * process
   */
  setOnboard: (onboard: boolean) => void;
};
