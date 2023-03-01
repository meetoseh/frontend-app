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
}: DailyEventRouterProps) => {
  return (
    <DailyEventScreen
      event={event}
      onGotoSettings={onGotoSettings}
      onGotoJourney={onGotoJourney}
      onReload={onReload}
      onReady={onReady}
    />
  );
};
