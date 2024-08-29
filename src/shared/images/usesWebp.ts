/**
 * Native only: the resolved value of USES_WEBP
 */
export const USES_WEBP_STATIC = true;

/**
 * If webp support is available.
 */
export const USES_WEBP: Promise<boolean> = Promise.resolve(USES_WEBP_STATIC);
