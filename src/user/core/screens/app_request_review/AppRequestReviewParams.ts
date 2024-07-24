export type AppRequestReviewAPIParams = {
  /** The client flow slug to trigger after presenting the native popup */
  trigger: string | null;
};

export type AppRequestReviewMappedParams = AppRequestReviewAPIParams & {
  __mapped: true;
};
