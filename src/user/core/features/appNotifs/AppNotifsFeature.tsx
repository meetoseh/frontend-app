import {
  AndroidImportance,
  dismissAllNotificationsAsync,
  getExpoPushTokenAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  setNotificationChannelAsync,
} from "expo-notifications";
import * as AppNotifsStore from "./AppNotifsStore";
import { useWritableValueWithCallbacks } from "../../../../shared/lib/Callbacks";
import { Feature } from "../../models/Feature";
import { AppNotifsResources } from "./AppNotifsResources";
import {
  AppNotifsState,
  NotificationPermissionsStatusWithoutStatus,
} from "./AppNotifsState";
import { useCallback, useContext, useEffect } from "react";
import { useValueWithCallbacksEffect } from "../../../../shared/hooks/useValueWithCallbacksEffect";
import { setVWC } from "../../../../shared/lib/setVWC";
import { useMappedValuesWithCallbacks } from "../../../../shared/hooks/useMappedValuesWithCallbacks";
import { AppState, AppStateStatus, Platform } from "react-native";
import { useInappNotificationSessionValueWithCallbacks } from "../../../../shared/hooks/useInappNotificationSession";
import { adaptValueWithCallbacksAsVariableStrategyProps } from "../../../../shared/lib/adaptValueWithCallbacksAsVariableStrategyProps";
import { useMappedValueWithCallbacks } from "../../../../shared/hooks/useMappedValueWithCallbacks";
import { AppNotifs } from "./AppNotifs";
import Constants from "expo-constants";
import { LoginContext } from "../../../../shared/contexts/LoginContext";
import { apiFetch } from "../../../../shared/lib/apiFetch";

/**
 * Our custom screen that we present to request notifications, which the user is
 * always shown before the native dialog in case they don't want to receive
 * notifications, since we would like to have more than one chance to ask.
 */
export const AppNotifsFeature: Feature<AppNotifsState, AppNotifsResources> = {
  identifier: "appNotifs",
  useWorldState() {
    const initializedSuccessfullyVWC = useWritableValueWithCallbacks(
      () => false
    );
    // i can't for the life of me figure out how to import the correct
    // PermissionsStatus for defaulting in case of an error, so we just
    // omit it instead
    const permissionsStatusVWC =
      useWritableValueWithCallbacks<NotificationPermissionsStatusWithoutStatus | null>(
        () => null
      );
    const lastRequestedLocallyVWC = useWritableValueWithCallbacks<
      Date | null | undefined
    >(() => undefined);
    const expoTokenVWC = useWritableValueWithCallbacks<
      string | null | undefined
    >(() => undefined);

    useEffect(() => {
      if (initializedSuccessfullyVWC.get()) {
        return;
      }
      let active = true;

      if (Platform.OS === "android") {
        initializeNotificationsAndroid();
      } else {
        initializeNotificationsGeneric();
      }

      return () => {
        active = false;
      };

      async function initializeNotificationsAndroid() {
        if (!active) {
          return;
        }

        try {
          await setNotificationChannelAsync("default", {
            name: "default",
            importance: AndroidImportance.LOW,
            vibrationPattern: [0, 250, 250, 250],
            enableVibrate: true,
            enableLights: true,
            lightColor: "#1A383C7C",
          });
          if (!active) {
            return;
          }
          await dismissAllNotificationsIfInForeground();
          if (active) {
            setVWC(initializedSuccessfullyVWC, true);
          }
        } catch (e) {
          if (active) {
            console.error(`Error initializing notifications (android): ${e}`);
            setVWC(initializedSuccessfullyVWC, false);
          }
        }
      }

      async function initializeNotificationsGeneric() {
        if (!active) {
          return;
        }
        try {
          await dismissAllNotificationsIfInForeground();
          if (active) {
            setVWC(initializedSuccessfullyVWC, true);
          }
        } catch (e) {
          if (active) {
            console.error(`Error initializing notifications (generic): ${e}`);
            setVWC(initializedSuccessfullyVWC, false);
          }
        }
      }

      async function dismissAllNotificationsIfInForeground() {
        if (AppState.currentState === "active") {
          await dismissAllNotificationsAsync();
        }
      }
    }, [initializedSuccessfullyVWC]);

    useValueWithCallbacksEffect(
      initializedSuccessfullyVWC,
      useCallback((initializedSuccessfully) => {
        if (!initializedSuccessfully) {
          return undefined;
        }

        const subscription = AppState.addEventListener("change", listener);
        return () => {
          subscription.remove();
        };

        function listener(nextAppState: AppStateStatus) {
          if (nextAppState === "active") {
            dismissAllNotificationsAsync();
          }
        }
      }, [])
    );

    useValueWithCallbacksEffect(
      initializedSuccessfullyVWC,
      useCallback(
        (initializedSuccessfully) => {
          if (!initializedSuccessfully) {
            setVWC(permissionsStatusVWC, null);
            return;
          }

          if (permissionsStatusVWC.get() !== null) {
            return;
          }

          let active = true;
          fetchPermissionsStatus();
          return () => {
            active = false;
          };

          async function fetchPermissionsStatus() {
            if (!active) {
              return;
            }
            try {
              const newPermissionsStatus = await getPermissionsAsync();
              if (active) {
                setVWC(permissionsStatusVWC, newPermissionsStatus);
              }
            } catch (e) {
              if (!active) {
                return;
              }

              console.error(`Error fetching permissions status: ${e}`);
              setVWC(permissionsStatusVWC, {
                granted: false,
                canAskAgain: false,
                expires: "never",
              });
            }
          }
        },
        [permissionsStatusVWC]
      )
    );

    useValueWithCallbacksEffect(
      permissionsStatusVWC,
      useCallback(
        (permissionsStatus) => {
          let active = true;
          fetchExpoToken();
          return () => {
            active = false;
          };

          async function fetchExpoToken() {
            if (!active) {
              return;
            }
            if (permissionsStatus === null) {
              setVWC(expoTokenVWC, undefined);
              return;
            }
            if (!permissionsStatus.granted) {
              setVWC(expoTokenVWC, null);
              return;
            }
            const newExpoToken = await getExpoPushTokenAsync({
              projectId: Constants.expoConfig!.extra!.eas!.projectId,
            });
            if (active) {
              setVWC(expoTokenVWC, newExpoToken.data);
            }
          }
        },
        [expoTokenVWC]
      )
    );

    const loginContext = useContext(LoginContext);
    useValueWithCallbacksEffect(
      expoTokenVWC,
      useCallback(
        (expoTokenRaw) => {
          if (
            expoTokenRaw === null ||
            expoTokenRaw === undefined ||
            loginContext.state !== "logged-in"
          ) {
            return undefined;
          }
          const expoToken = expoTokenRaw;

          let active = true;
          maybeSendAssociation();
          return () => {
            active = false;
          };

          async function maybeSendAssociationInner() {
            if (
              loginContext.state !== "logged-in" ||
              loginContext.userAttributes === null
            ) {
              return;
            }

            const storedAssociation =
              await AppNotifsStore.retrieveStoredTokenUserAssociation();
            if (!active) {
              return;
            }

            if (
              storedAssociation !== null &&
              storedAssociation.userSub === loginContext.userAttributes.sub &&
              storedAssociation.expoPushToken === expoToken &&
              Date.now() - storedAssociation.lastAssociatedAt.getTime() <
                86_400_000
            ) {
              return;
            }

            const response = await apiFetch(
              "/api/1/notifications/push/tokens/",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json; charset=utf-8",
                },
                body: JSON.stringify({
                  push_token: expoToken,
                  platform: Platform.OS,
                }),
              },
              loginContext
            );
            if (!response.ok) {
              throw response;
            }

            if (active) {
              await AppNotifsStore.storeTokenUserAssociation({
                userSub: loginContext.userAttributes.sub,
                expoPushToken: expoToken,
                lastAssociatedAt: new Date(),
              });
            }
          }

          async function maybeSendAssociation() {
            try {
              await maybeSendAssociationInner();
            } catch (e) {
              if (active) {
                console.log("error sending server push token association:", e);
              }
            }
          }
        },
        [loginContext]
      )
    );

    useEffect(() => {
      let active = true;
      fetchLastRequestedLocally();
      return () => {
        active = false;
      };

      async function fetchLastRequestedLocally() {
        const result = await AppNotifsStore.retrieveLastRequestedLocally();
        if (active) {
          setVWC(lastRequestedLocallyVWC, result, (a, b) => {
            if (
              a === null ||
              b === null ||
              a === undefined ||
              b === undefined
            ) {
              return a === b;
            }

            return a.getTime() === b.getTime();
          });
        }
      }
    }, [lastRequestedLocallyVWC]);

    const requestUsingNativeDialog =
      useCallback(async (): Promise<NotificationPermissionsStatusWithoutStatus> => {
        let result: NotificationPermissionsStatusWithoutStatus;
        try {
          result = await requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: false,
              allowSound: false,
              allowDisplayInCarPlay: false,
              allowCriticalAlerts: false,
              provideAppNotificationSettings: false,
              allowProvisional: false,
            },
          });
        } catch (e) {
          console.error(`Error requesting notification permissions: ${e}`);
          result = {
            granted: false,
            canAskAgain: false,
            expires: "never",
          };
        }

        setVWC(permissionsStatusVWC, result);
        return result;
      }, [permissionsStatusVWC]);

    const onDoneRequestingLocally = useCallback(async () => {
      const now = new Date();
      setVWC(lastRequestedLocallyVWC, now);
      await AppNotifsStore.setLastRequestedLocally(now);
    }, [lastRequestedLocallyVWC]);

    return useMappedValuesWithCallbacks(
      [
        initializedSuccessfullyVWC,
        permissionsStatusVWC,
        lastRequestedLocallyVWC,
        expoTokenVWC,
      ],
      useCallback(
        (): AppNotifsState => ({
          initializedSuccessfully: initializedSuccessfullyVWC.get(),
          permissionsStatus: permissionsStatusVWC.get(),
          lastRequestedLocally: lastRequestedLocallyVWC.get(),
          expoToken: expoTokenVWC.get(),
          requestUsingNativeDialog,
          onDoneRequestingLocally,
        }),
        [
          initializedSuccessfullyVWC,
          permissionsStatusVWC,
          lastRequestedLocallyVWC,
          expoTokenVWC,
          requestUsingNativeDialog,
          onDoneRequestingLocally,
        ]
      )
    );
  },
  isRequired(state) {
    if (state.initializedSuccessfully === null) {
      return undefined;
    }

    if (state.initializedSuccessfully === false) {
      return false;
    }

    if (state.permissionsStatus === null) {
      return undefined;
    }

    if (state.permissionsStatus.granted) {
      return false;
    }

    if (!state.permissionsStatus.canAskAgain) {
      return false;
    }

    if (state.lastRequestedLocally === undefined) {
      return undefined;
    }

    if (
      state.lastRequestedLocally !== null &&
      Date.now() - state.lastRequestedLocally.getTime() <
        1000 * 60 * 60 * 24 * 7
    ) {
      return false;
    }

    return true;
  },
  useResources(state, required) {
    const sessionVWC = useInappNotificationSessionValueWithCallbacks(
      adaptValueWithCallbacksAsVariableStrategyProps(
        useMappedValueWithCallbacks(required, (req) => ({
          uid: req ? "oseh_ian_k1hWlArw-lNX3v9_qxJahg" : null,
        }))
      )
    );

    return useMappedValueWithCallbacks(sessionVWC, (session) => ({
      session,
      loading: session === null,
    }));
  },
  component(state, resources) {
    return <AppNotifs state={state} resources={resources} />;
  },
};
