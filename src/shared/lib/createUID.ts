/**
 * On the web, equivalent to python `secrets.token_urlsafe(16)`. On native,
 * a faster and less random version.
 */
export const createUID = () => {
  return (
    Math.random().toString(36).substring(2) +
    Math.random().toString(36).substring(2)
  );
};
