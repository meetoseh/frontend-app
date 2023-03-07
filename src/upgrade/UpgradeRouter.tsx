import { ReactElement, useEffect, useState } from 'react';
import { useUpgradeValuePropsState } from './hooks/useUpgradeValuePropsState';
import { UpgradeValuePropsScreen } from './screens/UpgradeValuePropsScreen';

type UpgradeRouterProps = {
  /**
   * Called when the user should return to the previous screen, either because
   * of a specific user interaction or an error that prevents this screen from
   * continuing.
   */
  onBack: (error?: ReactElement | null) => void;

  /**
   * A function to call when the upgrade screen can be shown without any spinners,
   * which is useful if the previous screen is managing the spinner.
   */
  onReady: () => void;

  /**
   * If an error is being forwarded from an earlier screen, it can be passed
   * here to be displayed.
   */
  initialError: ReactElement | null;
};

/**
 * Manages the user starting an Oseh+ subscription, which may involve multiple
 * screens.
 */
export const UpgradeRouter = ({
  onBack,
  initialError,
  onReady,
}: UpgradeRouterProps): ReactElement => {
  const [ready, setReady] = useState(false);
  const valuePropsState = useUpgradeValuePropsState();

  useEffect(() => {
    if (!ready) {
      if (valuePropsState.error) {
        onBack(valuePropsState.error);
      } else if (!valuePropsState.loading) {
        setReady(true);
      }
    }
  }, [ready, valuePropsState.loading, valuePropsState.error, onBack]);

  useEffect(() => {
    if (ready) {
      onReady();
    }
  }, [ready, onReady]);

  return (
    <UpgradeValuePropsScreen onBack={onBack} state={valuePropsState} initialError={initialError} />
  );
};
