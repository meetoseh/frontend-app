import { ReactElement } from 'react';
import { TextInterstitialParamsMapped } from './TextInterstitialParams';
import { TextInterstitialResources } from './TextInterstitialResources';
import { ScreenComponentProps } from '../../models/Screen';
import {
  useEntranceTransition,
  useTransitionProp,
} from '../../../../shared/lib/TransitionProp';
import {
  StandardScreenTransition,
  useStandardTransitionsState,
} from '../../../../shared/hooks/useStandardTransitions';
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { GridDarkGrayBackground } from '../../../../shared/components/GridDarkGrayBackground';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { OsehStyles } from '../../../../shared/OsehStyles';
import { ScreenTextContent } from '../../components/ScreenTextContent';
import { configurableScreenOut } from '../../lib/configurableScreenOut';
import { ScreenConfigurableTrigger } from '../../models/ScreenConfigurableTrigger';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { Text } from 'react-native';
import { FilledInvertedButton } from '../../../../shared/components/FilledInvertedButton';
import { TextStyleForwarder } from '../../../../shared/components/TextStyleForwarder';
import { setVWC } from '../../../../shared/lib/setVWC';
import { OutlineWhiteButton } from '../../../../shared/components/OutlineWhiteButton';
import { LinkButton } from '../../../../shared/components/LinkButton';

/**
 * A basic text interstitial screen with a optional top message, some main content,
 * and then some ctas at the bottom
 */
export const TextInterstitial = ({
  ctx,
  screen,
  startPop,
  trace,
}: ScreenComponentProps<
  'text_interstitial',
  TextInterstitialResources,
  TextInterstitialParamsMapped
>): ReactElement => {
  const transition = useTransitionProp(
    (): StandardScreenTransition => screen.parameters.entrance
  );
  useEntranceTransition(transition);

  const transitionState = useStandardTransitionsState(transition);

  const workingVWC = useWritableValueWithCallbacks(() => false);

  const makeOnClick =
    (
      btn: {
        exit: StandardScreenTransition;
        trigger: ScreenConfigurableTrigger;
      },
      label: string
    ) =>
    () => {
      configurableScreenOut(
        workingVWC,
        startPop,
        transition,
        btn.exit,
        btn.trigger,
        {
          beforeDone: async () => {
            trace({ type: 'cta', label });
          },
        }
      );
    };

  return (
    <GridFullscreenContainer
      windowSizeImmediate={ctx.windowSizeImmediate}
      statusBar="light"
      modals={false}
    >
      <GridDarkGrayBackground />
      <GridContentContainer
        contentWidthVWC={ctx.contentWidth}
        left={transitionState.left}
        opacity={transitionState.opacity}
        gridSizeVWC={ctx.windowSizeImmediate}
        justifyContent="flex-start"
        scrollable={true}
      >
        <RenderGuardedComponent
          props={ctx.topBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
        <VerticalSpacer height={32} />
        {screen.parameters.top !== null && (
          <Text
            style={[
              OsehStyles.typography.body,
              OsehStyles.colors.v4.primary.light,
            ]}
          >
            {screen.parameters.top}
          </Text>
        )}
        <VerticalSpacer height={32} flexGrow={1} />
        <ScreenTextContent content={screen.parameters.content} />
        <VerticalSpacer height={32} flexGrow={1} />
        {screen.parameters.primaryButton !== null && (
          <TextStyleForwarder
            component={(styleVWC) =>
              screen.parameters.primaryButton === null ? (
                <></>
              ) : (
                <FilledInvertedButton
                  onPress={makeOnClick(
                    screen.parameters.primaryButton,
                    'primary'
                  )}
                  setTextStyle={(s) => setVWC(styleVWC, s)}
                >
                  <RenderGuardedComponent
                    props={styleVWC}
                    component={(s) => (
                      <Text style={s}>
                        {screen.parameters.primaryButton?.text}
                      </Text>
                    )}
                  />
                </FilledInvertedButton>
              )
            }
          />
        )}
        {screen.parameters.primaryButton !== null &&
          screen.parameters.secondaryButton !== null && (
            <VerticalSpacer height={16} />
          )}
        {screen.parameters.secondaryButton !== null && (
          <TextStyleForwarder
            component={(styleVWC) =>
              screen.parameters.secondaryButton === null ? (
                <></>
              ) : (
                <OutlineWhiteButton
                  onPress={makeOnClick(
                    screen.parameters.secondaryButton,
                    'secondary'
                  )}
                  setTextStyle={(s) => setVWC(styleVWC, s)}
                >
                  <RenderGuardedComponent
                    props={styleVWC}
                    component={(s) => (
                      <Text style={s}>
                        {screen.parameters.secondaryButton?.text}
                      </Text>
                    )}
                  />
                </OutlineWhiteButton>
              )
            }
          />
        )}
        {(screen.parameters.primaryButton !== null ||
          screen.parameters.secondaryButton !== null) &&
          screen.parameters.tertiaryButton !== null && (
            <VerticalSpacer height={16} />
          )}
        {screen.parameters.tertiaryButton !== null && (
          <TextStyleForwarder
            component={(styleVWC) =>
              screen.parameters.tertiaryButton === null ? (
                <></>
              ) : (
                <LinkButton
                  onPress={makeOnClick(
                    screen.parameters.tertiaryButton,
                    'secondary'
                  )}
                  setTextStyle={(s) => setVWC(styleVWC, s)}
                >
                  <RenderGuardedComponent
                    props={styleVWC}
                    component={(s) => (
                      <Text style={s}>
                        {screen.parameters.tertiaryButton?.text}
                      </Text>
                    )}
                  />
                </LinkButton>
              )
            }
          />
        )}
        <VerticalSpacer height={32} />
        <RenderGuardedComponent
          props={ctx.botBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
      </GridContentContainer>
    </GridFullscreenContainer>
  );
};
