import { ReactElement, useEffect } from 'react';
import { SplashScreen } from '../splash/SplashScreen';
import { useSettingsHomeState } from './hooks/useSettingsHomeState';
import { SettingsHome } from './screens/SettingsHome';

type SettingsRouterProps = {
  /**
   * Called when the user wants to return to the previous screen, usually
   * the current daily event.
   */
  onBack: (error?: ReactElement | null) => void;

  /**
   * Called when the user should be taken to the upgrade screen. This is
   * usually called when the user clicks on the upgrade button in the
   * settings screen.
   */
  onGotoUpgrade: (error?: ReactElement | null) => void;

  /**
   * If specified, shown as the error initially. This is used to show errors
   * that occurred during earlier screens and which usually can be resolved
   * in the settings screen.
   */
  initialError: ReactElement | null;

  /**
   * Called when the settings screen is first able to render without a splash
   * screen. This is useful when the parent component may already have to render
   * a splash screen, as going splash screen to splash screen resets the animation
   * and looks bad.
   */
  onReady: () => void;
};

/**
 * The main component used outside of this module. This component is responsible
 * for selecting the correct settings screen to render and sharing state across
 * the settings screens.
 */
export const SettingsRouter = ({
  onBack,
  onGotoUpgrade,
  initialError,
  onReady,
}: SettingsRouterProps): ReactElement => {
  const homeState = useSettingsHomeState();

  useEffect(() => {
    if (homeState.loaded) {
      onReady();
    }
  }, [homeState.loaded, onReady]);

  useEffect(() => {
    if (homeState.error) {
      onBack(homeState.error);
    }
  }, [homeState.error, onBack]);

  if (!homeState.loaded) {
    return <SplashScreen />;
  }

  return (
    <SettingsHome
      onBack={onBack}
      onGotoUpgrade={onGotoUpgrade}
      state={homeState}
      initialError={initialError}
    />
  );
};
