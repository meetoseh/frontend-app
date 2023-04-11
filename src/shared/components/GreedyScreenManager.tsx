import { ReactElement, useEffect, useState } from 'react';
import { StatefulScreen } from '../models/StatefulScreen';
import { SplashScreen } from '../../splash/SplashScreen';

type GreedyScreenManagerProps = {
  /**
   * The screens to render, in order of priority. The first screen which is
   * required will be rendered, and the resources for up to the given maximum
   * number of screens which are also required but aren't the earliest required
   * screen will be loaded.
   *
   * This array should be memoized if possible.
   */
  screens: StatefulScreen[];

  /**
   * The maximum number of screens to preload. If unspecified, a cautious
   * default will be used.
   */
  maxPreload?: number;
};

/**
 * A greedy screen manager, which accepts a list of screens and renders the
 * first one (by ascending index) that is required, rendering an empty
 * fragment if none of them are required, and a splash screen if that screen
 * is loading.
 *
 * If there is a screen whose required value is undefined before there is
 * a required screen, loads none of the screens and renders a splash screen.
 *
 * This will also load the resources for up to the given maximum number of
 * screens which are also required but aren't the earliest required screen,
 * preferring lower-indexed screens.
 */
export const GreedyScreenManager = ({
  screens,
  maxPreload = 3,
}: GreedyScreenManagerProps): ReactElement => {
  const [component, setComponent] = useState<ReactElement>(<></>);

  useEffect(() => {
    let showSplash = false;
    let earliestRequiredIndex = -1;
    for (let i = 0; i < screens.length; i++) {
      if (screens[i].required === undefined) {
        showSplash = true;
        break;
      }
      if (screens[i].required) {
        earliestRequiredIndex = i;
      }
    }

    if (earliestRequiredIndex < 0) {
      for (let i = 0; i < screens.length; i++) {
        if (screens[i].load) {
          screens[i].load = false;
        }
      }
      setComponent(showSplash ? <SplashScreen type="brandmark" /> : <></>);
      return;
    }

    let preloaded = 0;
    for (let i = 0; i < screens.length; i++) {
      if (i < earliestRequiredIndex) {
        if (screens[i].load) {
          screens[i].load = false;
        }
      } else if (i === earliestRequiredIndex) {
        if (!screens[i].load) {
          screens[i].load = true;
        }

        if (screens[i].ready) {
          setComponent(screens[i].component());
        } else {
          setComponent(<SplashScreen type="brandmark" />);
        }
      } else if (preloaded < maxPreload) {
        if (!screens[i].load) {
          screens[i].load = true;
        }

        preloaded++;
      } else {
        if (screens[i].load) {
          screens[i].load = false;
        }
      }
    }
  }, [screens, maxPreload]);

  return component;
};
