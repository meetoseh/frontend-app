export type AppTrackingTransparencyAPIParams = {
  /** The client flow slug to trigger if they accept the native dialog */
  success: string | null;

  /** The client flow slug to trigger if they reject the native dialog */
  failure: string | null;
};

export type AppTrackingTransparencyMappedParams =
  AppTrackingTransparencyAPIParams & {
    __mapped: true;
  };
