import { Dispatch, ReactElement, SetStateAction } from 'react';
import { JourneyRouterScreenId } from '../JourneyRouter';
import { JourneyRef } from './JourneyRef';
import { JourneyShared } from './JourneyShared';

export type JourneyScreenProps = {
  /**
   * The journey the screen is handling
   */
  journey: JourneyRef;

  /**
   * The shared state for the journey, to avoid repeating work
   */
  shared: JourneyShared;

  /**
   * Used to move to a different journey screen
   */
  setScreen: Dispatch<SetStateAction<JourneyRouterScreenId>>;

  /**
   * Should be called if we're done with the journey and should return back to
   * the home screen.
   *
   * May be passed an error, which will be shown to the user on the screen they
   * return to.
   */
  onJourneyFinished: (error?: ReactElement | null) => void;

  /**
   * The error to show to the user, if any.
   */
  error: ReactElement | null;

  /**
   * Sets the error to show to the user.
   */
  setError: Dispatch<SetStateAction<ReactElement | null>>;
};
