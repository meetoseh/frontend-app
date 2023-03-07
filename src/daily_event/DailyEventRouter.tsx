import { ReactElement } from 'react';
import { JourneyRef } from '../journey/models/JourneyRef';
import { DailyEvent } from './models/DailyEvent';
import { DailyEventScreen } from './screens/DailyEventScreen';

type DailyEventRouterProps = {
  /**
   * The event to show
   */
  event: DailyEvent;

  /**
   * The function to call if the user wants to go to their settings
   */
  onGotoSettings: () => void;

  /**
   * The function to call to display a journey that we've already
   * loaded.
   * @param journey The journey to go to
   */
  onGotoJourney: (journey: JourneyRef) => void;

  /**
   * The function to call if the user wants to refresh the current daily event
   */
  onReload: () => void;

  /**
   * If specified, called when the first screen is ready to be shown.
   */
  onReady?: () => void;

  /**
   * If specified, this is the error that should be shown to the user
   * initially. Useful if the user was trying to do something in a previous
   * screen and an error occurs preventing the earlier screen from being
   * displayed.
   */
  initialError: ReactElement | null;
};

/**
 * Manages the screens and transitions for the user to interact with
 * while looking at a daily event.
 */
export const DailyEventRouter = ({
  event,
  onGotoSettings,
  onGotoJourney,
  onReload,
  onReady,
  initialError,
}: DailyEventRouterProps) => {
  return (
    <DailyEventScreen
      event={event}
      onGotoSettings={onGotoSettings}
      onGotoJourney={onGotoJourney}
      onReload={onReload}
      onReady={onReady}
      initialError={initialError}
    />
  );
};
