// inspired by https://github.com/sciactive/tinygesture, except we don't
// care about the touch end as we fire events either before the touch ends
// or not at all

/**
 * A direction a swipe can occur in, where a pre- implies that
 * the user has not yet completed the gesture but they appear to
 * be moving in that direction.
 */
export type SwipingDirection = 'horizontal' | 'pre-horizontal' | 'vertical' | 'pre-vertical';

/**
 * Handles computing gestures from touch events, without actually registering
 * any event listeners.
 */
export class GestureHandler {
  /**
   * If we're handling a touch, the x-coorindate where the
   * touch started.
   */
  public touchStartX: number | null;
  /**
   * If we're handling a touch, the y-coorindate where the
   * touch started.
   */
  public touchStartY: number | null;

  /**
   * The x-coordinate of the last touch move event, if we're handling
   * a touch, or null if we're not.
   */
  public touchMoveX: number | null;

  /**
   * The y-coordinate of the last touch move event, if we're handling
   * a touch, or null if we're not.
   */
  public touchMoveY: number | null;

  /**
   * True if we've already detected a gesture in this touch, false
   * if we have not, and null if we're not handling a touch.
   */
  public gestureDetected: boolean | null;

  /**
   * The minimum amount of movement in the x-direction before we
   * consider a gesture to be horizontal.
   */
  private thresholdX: number;

  /**
   * The minimum amount of movement in the y-direction before we
   * consider a gesture to be vertical.
   */
  private thresholdY: number;

  constructor(screenSize: { width: number; height: number }) {
    this.touchStartX = null;
    this.touchStartY = null;
    this.touchMoveX = null;
    this.touchMoveY = null;
    this.gestureDetected = null;
    this.thresholdX = Math.max(25, Math.floor(0.15 * screenSize.width));
    this.thresholdY = Math.max(25, Math.floor(0.15 * screenSize.height));
  }

  /**
   * The x-distance between the touch start and touch move events, if
   * we're handling a touch, or null if we're not.
   */
  get deltaX(): number | null {
    if (this.touchStartX === null || this.touchMoveX === null) {
      return null;
    }

    return this.touchMoveX - this.touchStartX;
  }

  /**
   * The y-distance between the touch start and touch move events, if
   * we're handling a touch, or null if we're not.
   */
  get deltaY(): number | null {
    if (this.touchStartY === null || this.touchMoveY === null) {
      return null;
    }

    return this.touchMoveY - this.touchStartY;
  }

  /**
   * Handles a touch starting
   * @param x The x-coordinate of the touch
   * @param y The y-coordinate of the touch
   */
  onTouchStart(x: number, y: number) {
    this.touchStartX = x;
    this.touchStartY = y;
    this.touchMoveX = x;
    this.touchMoveY = y;
    this.gestureDetected = false;
  }

  /**
   * Handles a touch moving. If we're not handling a touch, this is treated
   * as if it were a touch start.
   *
   * Returns the current swiping direction
   */
  onTouchMove(x: number, y: number): SwipingDirection {
    if (
      this.touchStartX === null ||
      this.touchStartY === null ||
      this.touchMoveX === null ||
      this.touchMoveY === null ||
      this.gestureDetected === null
    ) {
      this.onTouchStart(x, y);
      return 'pre-horizontal';
    }

    this.touchMoveX = x;
    this.touchMoveY = y;

    const dx = x - this.touchStartX;
    const dy = y - this.touchStartY;

    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    if (adx >= ady) {
      if (adx > this.thresholdX) {
        this.gestureDetected = true;
        return 'horizontal';
      }
    }

    if (ady > this.thresholdY) {
      this.gestureDetected = true;
      return 'vertical';
    }

    if (adx >= ady) {
      return 'pre-horizontal';
    }

    return 'pre-vertical';
  }

  /**
   * Resets the state of the gesture handler, so that it is ready to
   * handle a new touch.
   */
  onTouchEnd() {
    this.touchStartX = null;
    this.touchStartY = null;
    this.touchMoveX = null;
    this.touchMoveY = null;
    this.gestureDetected = null;
  }
}
