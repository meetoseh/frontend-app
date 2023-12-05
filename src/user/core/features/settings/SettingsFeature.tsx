import { ReactElement, useCallback, useContext } from "react";
import { useWritableValueWithCallbacks } from "../../../../shared/lib/Callbacks";
import { setVWC } from "../../../../shared/lib/setVWC";
import { Feature } from "../../models/Feature";
import { useMappedValuesWithCallbacks } from "../../../../shared/hooks/useMappedValuesWithCallbacks";
import { SettingsState } from "./SettingsState";
import { SettingsResources } from "./SettingsResources";
import { LoginContext } from "../../../../shared/contexts/LoginContext";
import { useValueWithCallbacksEffect } from "../../../../shared/hooks/useValueWithCallbacksEffect";
import { Settings } from "./Settings";
import { useMappedValueWithCallbacks } from "../../../../shared/hooks/useMappedValueWithCallbacks";
import { apiFetch } from "../../../../shared/lib/apiFetch";
import { describeError } from "../../../../shared/lib/describeError";

/**
 * Simple link page where the user can perform some key actions, like logging out.
 */
export const SettingsFeature: Feature<SettingsState, SettingsResources> = {
  identifier: "settings",
  useWorldState: () => {
    const showVWC = useWritableValueWithCallbacks<boolean>(() => false);
    const setShow = useCallback(
      (wants: boolean) => {
        setVWC(showVWC, wants);
      },
      [showVWC]
    );

    return useMappedValuesWithCallbacks(
      [showVWC],
      (): SettingsState => ({
        show: showVWC.get(),
        setShow,
      })
    );
  },
  useResources: (stateVWC, requiredVWC, allStatesVWC) => {
    const loginContext = useContext(LoginContext);
    const haveProVWC = useWritableValueWithCallbacks<boolean | undefined>(
      () => undefined
    );
    const loadErrorVWC = useWritableValueWithCallbacks<ReactElement | null>(
      () => null
    );
    const gotoEditTimesVWC = useMappedValueWithCallbacks(
      allStatesVWC,
      (allStates) => {
        return () => {
          allStates.requestNotificationTime.setClientRequested(true);
        };
      },
      {
        inputEqualityFn: (a, b) => {
          return (
            a.requestNotificationTime.setClientRequested ===
            b.requestNotificationTime.setClientRequested
          );
        },
      }
    );
    const gotoMyLibraryVWC = useMappedValueWithCallbacks(
      allStatesVWC,
      (allStates) => {
        return () => {
          allStates.favorites.setTab("courses", false);
          allStates.favorites.setShow(true, true);
        };
      },
      {
        inputEqualityFn: (a, b) => {
          return (
            a.favorites.setTab === b.favorites.setTab &&
            a.favorites.setShow === b.favorites.setShow
          );
        },
      }
    );

    useValueWithCallbacksEffect(
      requiredVWC,
      useCallback(
        (required: boolean) => {
          if (!required || loginContext.state !== "logged-in") {
            return undefined;
          }

          let active = true;
          fetchHavePro();
          return () => {
            active = false;
          };

          async function fetchHaveProInner() {
            let response = await apiFetch(
              "/api/1/users/me/entitlements/pro",
              {
                method: "GET",
                headers: {
                  Pragma: "no-cache",
                },
              },
              loginContext
            );
            if (!active) {
              return;
            }

            if (response.status === 429) {
              response = await apiFetch(
                "/api/1/users/me/entitlements/pro",
                {
                  method: "GET",
                },
                loginContext
              );
              if (!active) {
                return;
              }
            }

            if (!response.ok) {
              throw response;
            }

            const data: { is_active: boolean } = await response.json();
            if (!active) {
              return;
            }

            setVWC(haveProVWC, data.is_active);
          }

          async function fetchHavePro() {
            try {
              await fetchHaveProInner();
            } catch (e) {
              const err = await describeError(e);
              if (active) {
                setVWC(loadErrorVWC, err);
              }
            }
          }
        },
        [loginContext, haveProVWC, loadErrorVWC]
      )
    );

    return useMappedValuesWithCallbacks(
      [haveProVWC, loadErrorVWC, gotoEditTimesVWC],
      (): SettingsResources => {
        if (loadErrorVWC.get() !== null) {
          return {
            loading: false,
            havePro: undefined,
            loadError: loadErrorVWC.get(),
            gotoEditReminderTimes: () => {},
            gotoMyLibrary: () => {},
          };
        }

        return {
          loading: haveProVWC.get() === undefined,
          havePro: haveProVWC.get(),
          loadError: null,
          gotoEditReminderTimes: gotoEditTimesVWC.get(),
          gotoMyLibrary: gotoMyLibraryVWC.get(),
        };
      }
    );
  },
  isRequired: (state) => state.show,
  component: (state, resources) => (
    <Settings state={state} resources={resources} />
  ),
};
