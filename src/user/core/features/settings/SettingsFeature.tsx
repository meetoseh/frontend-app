import { ReactElement, useCallback, useContext, useEffect } from 'react';
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { setVWC } from '../../../../shared/lib/setVWC';
import { Feature } from '../../models/Feature';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { SettingsState } from './SettingsState';
import { SettingsResources } from './SettingsResources';
import { LoginContext } from '../../../../shared/contexts/LoginContext';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import { Settings } from './Settings';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { useIdentities } from './hooks/useIdentities';
import { apiFetch } from '../../../../shared/lib/apiFetch';
import { describeError } from '../../../../shared/lib/describeError';
import { useFeatureFlag } from '../../../../shared/lib/useFeatureFlag';
import { useValuesWithCallbacksEffect } from '../../../../shared/hooks/useValuesWithCallbacksEffect';

/**
 * Simple link page where the user can perform some key actions, like logging out.
 */
export const SettingsFeature: Feature<SettingsState, SettingsResources> = {
  identifier: 'settings',
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
    const loginContextRaw = useContext(LoginContext);
    const purchasesVWC = useMappedValueWithCallbacks(
      allStatesVWC,
      (s) => s.purchases,
      { outputEqualityFn: Object.is }
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
          allStates.favorites.setTab('courses', false);
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

    const isMerging = useMappedValueWithCallbacks(
      allStatesVWC,
      (s) =>
        s.confirmMergeAccount.mergeToken !== null &&
        s.confirmMergeAccount.mergeToken !== undefined
    );

    const identitiesVWC = useIdentities(
      useMappedValuesWithCallbacks(
        [requiredVWC, isMerging],
        () => !requiredVWC.get() || isMerging.get()
      )
    );

    const confirmMergePassthroughsVWC = useMappedValueWithCallbacks(
      allStatesVWC,
      (allStates) => {
        const onShowingSecureLogin =
          allStates.confirmMergeAccount.onShowingSecureLogin;
        const onSecureLoginCompleted =
          allStates.confirmMergeAccount.onSecureLoginCompleted;

        return {
          onShowingSecureLogin,
          onSecureLoginCompleted,
        };
      },
      {
        inputEqualityFn: (a, b) => {
          return (
            Object.is(
              a.confirmMergeAccount.onShowingSecureLogin,
              b.confirmMergeAccount.onShowingSecureLogin
            ) &&
            Object.is(
              a.confirmMergeAccount.onSecureLoginCompleted,
              b.confirmMergeAccount.onSecureLoginCompleted
            )
          );
        },
      }
    );

    useValueWithCallbacksEffect(
      requiredVWC,
      useCallback(
        (req) => {
          if (req) {
            return purchasesVWC.get().addLoadRequest();
          }
          return undefined;
        },
        [purchasesVWC]
      )
    );

    return useMappedValuesWithCallbacks(
      [
        gotoEditTimesVWC,
        identitiesVWC,
        gotoMyLibraryVWC,
        confirmMergePassthroughsVWC,
        purchasesVWC,
      ],
      (): SettingsResources => {
        const purchases = purchasesVWC.get();
        return {
          loading:
            purchases.loaded === undefined ||
            identitiesVWC.get().type === 'loading',
          havePro: purchases.loaded?.havePro,
          loadError: null,
          identities: identitiesVWC.get(),
          gotoEditReminderTimes: gotoEditTimesVWC.get(),
          gotoMyLibrary: gotoMyLibraryVWC.get(),
          gotoSeries: () => {
            allStatesVWC.get().seriesList.setShow(true, true);
            stateVWC.get().setShow(false, false);
          },
          onRestorePurchases: async () => {
            const loginContextUnch = loginContextRaw.value.get();
            if (loginContextUnch.state !== 'logged-in') {
              return;
            }
            const ctx = loginContextUnch;

            const purchases = allStatesVWC.get().purchases;
            if (purchases.loaded !== undefined) {
              await purchases.loaded.restorePurchases(ctx);
            }
          },
          gotoManageMembership: () => {
            allStatesVWC.get().manageMembership.setShow(true, true);
            stateVWC.get().setShow(false, false);
          },
          ...confirmMergePassthroughsVWC.get(),
        };
      }
    );
  },
  isRequired: (state) => state.show,
  component: (state, resources) => (
    <Settings state={state} resources={resources} />
  ),
};
