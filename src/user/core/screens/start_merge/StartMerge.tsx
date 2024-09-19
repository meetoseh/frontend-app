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
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { screenOut } from '../../lib/screenOut';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { StartMergeResources } from './StartMergeResources';
import { StartMergeMappedParams } from './StartMergeParams';
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
import { MergeProvider } from '../settings/lib/MergeProvider';
import { trackMerge } from '../settings/lib/trackMerge';
import { ProviderItem, ProvidersList } from '../login/components/ProvidersList';
import { configurableScreenOut } from '../../lib/configurableScreenOut';

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

  const cleanedProviders = useMemo(() => {
    const result: { provider: MergeProvider; url: string }[] = [];
    for (const provider of screen.parameters.providers) {
      if (
        provider.provider in LOGIN_NAMES_BY_PROVIDER &&
        provider.provider !== 'Silent'
      ) {
        result.push(provider);
      }
    }
    return result;
  }, [screen.parameters.providers]);

  useEffect(() => {
    if (cleanedProviders.length === 0) {
      screenWithWorking(workingVWC, async () => {
        trace({ type: 'skip', reason: 'no useful providers in list' });
        const trigger = screen.parameters.skip.trigger;
        startPop(
          trigger.type === 'pop'
            ? null
            : { slug: trigger.flow, parameters: trigger.parameters },
          trigger.endpoint ?? undefined
        )();
      });
    }
  }, [
    cleanedProviders,
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
      cleanedProviders.forEach((btn) => {
        result[btn.provider] = () => btn.url;
      });
      return result;
    }, [cleanedProviders]),
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
          items={cleanedProviders.map(
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
                configurableScreenOut(
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
