/**
 * If svg support is available, i.e., we can render arbitrary SVG
 * files without transforming them into a different format.
 */
export const USES_SVG: Promise<boolean> = Promise.resolve(false);
/** Native only: the resolved value of USES_SVG */
export const USES_SVG_STATIC = true;
