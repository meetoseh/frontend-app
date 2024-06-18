import { ReactElement, useEffect, useMemo } from 'react';
import { CustomPop, ScreenComponentProps } from '../../models/Screen';
import { GridDarkGrayBackground } from '../../../../shared/components/GridDarkGrayBackground';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import { styles } from './StartMergeStyles';
import {
  useEntranceTransition,
  useTransitionProp,
} from '../../../../shared/lib/TransitionProp';
import {
  StandardScreenTransition,
  useStandardTransitionsState,
} from '../../../../shared/hooks/useStandardTransitions';
import { WipeTransitionOverlay } from '../../../../shared/components/WipeTransitionOverlay';
import {
  createWritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../../shared/lib/Callbacks';
import { screenOut } from '../../lib/screenOut';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { StartMergeResources } from './StartMergeResources';
import { StartMergeMappedParams } from './StartMergeParams';
import {
  ProvidersList,
  ProviderItem,
} from '../../features/login/components/ProvidersList';
import { screenWithWorking } from '../../lib/screenWithWorking';
import { Text } from 'react-native';
import {
  LOGIN_ICONS_BY_PROVIDER,
  LOGIN_NAMES_BY_PROVIDER,
} from '../login/Login';
import { OauthProvider } from '../../../login/lib/OauthProvider';
import { TextStyleForwarder } from '../../../../shared/components/TextStyleForwarder';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { OutlineWhiteButton } from '../../../../shared/components/OutlineWhiteButton';
import { setVWC } from '../../../../shared/lib/setVWC';
import { useManageConnectWithProvider } from '../settings/hooks/useManageConnectWithProvider';
import { Modals } from '../../../../shared/contexts/ModalContext';
import { useErrorModal } from '../../../../shared/hooks/useErrorModal';
import { MergeProvider } from '../../features/mergeAccount/MergeAccountState';
import { trackMerge } from '../settings/lib/trackMerge';

/**
 * Allows the user to merge their account using one of the indicated providers.
 */
export const StartMerge = ({
  ctx,
  screen,
  trace,
  startPop,
}: ScreenComponentProps<
  'start_merge',
  StartMergeResources,
  StartMergeMappedParams
>): ReactElement => {
  const modals = useWritableValueWithCallbacks<Modals>(() => []);
  const transition = useTransitionProp(
    (): StandardScreenTransition => screen.parameters.entrance
  );
  useEntranceTransition(transition);

  const transitionState = useStandardTransitionsState(transition);

  const workingVWC = useWritableValueWithCallbacks(() => false);

  useEffect(() => {
    if (screen.parameters.providers.length === 0) {
      screenWithWorking(workingVWC, async () => {
        trace({ type: 'skip', reason: 'no providers in list' });
        startPop(
          screen.parameters.skip.trigger === null
            ? null
            : {
                slug: screen.parameters.skip.trigger,
                parameters: {},
              }
        )();
      });
    }
  }, [
    screen.parameters.providers,
    startPop,
    trace,
    workingVWC,
    screen.parameters.skip.trigger,
  ]);

  const mergeError = useWritableValueWithCallbacks<ReactElement | null>(
    () => null
  );
  useErrorModal(modals, mergeError, 'merging');

  const manageConnectWithProvider = useManageConnectWithProvider({
    mergeError,
    modals,
    onSecureLoginCompleted: (mergeToken) => {
      if (mergeToken === null) {
        return;
      }
      screenOut(
        workingVWC,
        startPop,
        transition,
        { type: 'fade', ms: 350 },
        CustomPop,
        {
          endpoint: '/api/1/users/me/screens/empty_with_merge_token',
          parameters: {
            merge_token: mergeToken,
          },
          afterDone: () => {
            trackMerge(ctx);
          },
        }
      );
    },
    links: useMemo(() => {
      const result: { [provider in MergeProvider]?: () => string | undefined } =
        {};
      screen.parameters.providers.forEach((btn) => {
        result[btn.provider] = () => btn.url;
      });
      return result;
    }, [screen.parameters.providers]),
  });

  return (
    <GridFullscreenContainer
      windowSizeImmediate={ctx.windowSizeImmediate}
      modals={modals}
      statusBar
    >
      <GridDarkGrayBackground />
      <GridContentContainer
        contentWidthVWC={ctx.contentWidth}
        left={transitionState.left}
        opacity={transitionState.opacity}
        gridSizeVWC={ctx.windowSizeImmediate}
        justifyContent="flex-start"
        scrollable={false}
      >
        <RenderGuardedComponent
          props={ctx.topBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
        <VerticalSpacer height={0} flexGrow={1} />
        <Text style={styles.header}>{screen.parameters.header}</Text>
        {screen.parameters.message !== null && (
          <>
            <VerticalSpacer height={16} />
            <Text style={styles.message}>{screen.parameters.message}</Text>
          </>
        )}
        <VerticalSpacer height={24} />
        <ProvidersList
          items={screen.parameters.providers.map(
            ({ provider }): ProviderItem<OauthProvider> => ({
              key: provider,
              icon: LOGIN_ICONS_BY_PROVIDER[provider](),
              name: LOGIN_NAMES_BY_PROVIDER[provider],
            })
          )}
          onItemPressed={(provider) => {
            manageConnectWithProvider(
              provider,
              LOGIN_NAMES_BY_PROVIDER[provider]
            );
          }}
        />
        <VerticalSpacer height={0} flexGrow={1} />
        <TextStyleForwarder
          component={(styleVWC) => (
            <OutlineWhiteButton
              onPress={() => {
                screenOut(
                  workingVWC,
                  startPop,
                  transition,
                  screen.parameters.skip.exit,
                  screen.parameters.skip.trigger,
                  {
                    beforeDone: async () => {
                      trace({ type: 'skip' });
                    },
                  }
                );
              }}
              setTextStyle={(s) => setVWC(styleVWC, s)}
            >
              <RenderGuardedComponent
                props={styleVWC}
                component={(s) => (
                  <Text style={s}>{screen.parameters.skip.text}</Text>
                )}
              />
            </OutlineWhiteButton>
          )}
        />
        <VerticalSpacer height={32} />
        <RenderGuardedComponent
          props={ctx.botBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
      </GridContentContainer>
      <WipeTransitionOverlay wipe={transitionState.wipe} />
    </GridFullscreenContainer>
  );
};