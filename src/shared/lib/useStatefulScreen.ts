import { ScreenResources } from '../models/ScreenResources';
import { ScreenState } from '../models/ScreenState';
import { SharedState } from '../models/SharedState';
import { OsehScreen } from '../models/OsehScreen';
import { StatefulScreen } from '../models/StatefulScreen';
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';

/**
 * Adapts a given stateless screen to a stateful one, wherein the result hides
 * the type parameters and exposes a simpler interface. The result is memoized
 * and generally only changes if something relevant changes to this screen
 * changes, i.e., not as a result of the shared state changing.
 *
 * @param screen The stateless screen to adapt
 * @param sharedState The shared state to pass to the screen
 * @param setSharedState The function to call to update the shared state, in case
 *   it depends on this screen.
 */
export function useStatefulScreen<
  T extends ScreenState,
  J extends ScreenResources,
  S extends SharedState
>(
  screen: OsehScreen<T, J, S>,
  sharedState: S,
  setSharedState: Dispatch<SetStateAction<S>>
): StatefulScreen {
  const state = screen.useState();
  const [load, setLoad] = useState<boolean>(false);
  const resources = screen.useResources(state, load, sharedState);

  useEffect(() => {
    if (screen.updateSharedState === undefined) {
      return;
    }

    const newSharedState = screen.updateSharedState.call(undefined, state, sharedState);
    if (newSharedState !== sharedState) {
      setSharedState(newSharedState);
    }
  }, [state, sharedState, setSharedState, screen.updateSharedState]);

  return useMemo(
    () => ({
      required: state.required,
      get load() {
        return load;
      },
      set load(value) {
        setLoad(value);
      },
      ready: !!state.required && load && !resources.loading,
      component: () => screen.component.call(undefined, state, resources),
    }),
    [state, load, resources, screen.component]
  );
}
