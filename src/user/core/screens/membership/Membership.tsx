import { Fragment, ReactElement } from 'react';
import { ScreenComponentProps } from '../../models/Screen';
import { GridDarkGrayBackground } from '../../../../shared/components/GridDarkGrayBackground';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
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
import { MembershipResources } from './MembershipResources';
import { MembershipMappedParams } from './MembershipParams';
import {
  GRID_SIMPLE_NAVIGATION_FOREGROUND_BOTTOM_HEIGHT,
  GRID_SIMPLE_NAVIGATION_FOREGROUND_TOP_HEIGHT,
  GridSimpleNavigationForeground,
} from '../../../../shared/components/GridSimpleNavigationForeground';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { styles } from './MembershipStyles';
import { screenOut } from '../../lib/screenOut';
import { Clock } from '../upgrade/icons/Clock';
import { Sheet } from '../upgrade/icons/Sheet';
import { Series } from '../upgrade/icons/Series';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import { setVWC } from '../../../../shared/lib/setVWC';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { View, Text } from 'react-native';
import * as Linking from 'expo-linking';
import { TextStyleForwarder } from '../../../../shared/components/TextStyleForwarder';
import { FilledPremiumButton } from '../../../../shared/components/FilledPremiumButton';
import { HorizontalSpacer } from '../../../../shared/components/HorizontalSpacer';
import { FilledInvertedButton } from '../../../../shared/components/FilledInvertedButton';

/**
 * Gives the user basic information about their membership status, and directs
 * them to the appropriate place to update their membership if they want to.
 */
export const Membership = ({
  ctx,
  screen,
  resources,
  trace,
  startPop,
}: ScreenComponentProps<
  'membership',
  MembershipResources,
  MembershipMappedParams
>): ReactElement => {
  const transition = useTransitionProp(
    (): StandardScreenTransition => screen.parameters.entrance
  );
  useEntranceTransition(transition);

  const transitionState = useStandardTransitionsState(transition);

  const workingVWC = useWritableValueWithCallbacks(() => false);

  const isUrlExpired = useWritableValueWithCallbacks(() => false);
  useValueWithCallbacksEffect(resources.manageUrl, (manageUrlRaw) => {
    if (manageUrlRaw === null) {
      setVWC(isUrlExpired, false);
      return undefined;
    }
    const expiresAt = manageUrlRaw.expiresAt;
    if (expiresAt.getTime() < Date.now()) {
      setVWC(isUrlExpired, true);
      return undefined;
    }

    setVWC(isUrlExpired, false);
    let timeout: NodeJS.Timeout | null = setTimeout(() => {
      timeout = null;
      setVWC(isUrlExpired, true);
    }, expiresAt.getTime() - Date.now());
    return () => {
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }
    };
  });

  const wantGotoManageUrl = useWritableValueWithCallbacks(() => false);
  const manageUrlProps = useMappedValuesWithCallbacks(
    [resources.manageUrl, isUrlExpired],
    (): {
      onClick: (() => void) | string | undefined;
      onLinkClick: (() => void) | undefined;
      disabled: boolean;
      spinner: boolean;
    } => {
      const url = resources.manageUrl.get();
      if (url === null) {
        return {
          onClick: () => {
            trace({
              type: 'manage-via-stripe',
              action: 'click',
              result: 'url-is-null',
            });
          },
          onLinkClick: undefined,
          disabled: true,
          spinner: true,
        };
      }

      const isExpired = isUrlExpired.get();
      if (isExpired) {
        return {
          onClick: () => {
            trace({
              type: 'manage-via-stripe',
              action: 'click',
              result: 'url-is-expired',
            });
            setVWC(wantGotoManageUrl, true);
            url.reportExpired();
          },
          onLinkClick: undefined,
          disabled: false,
          spinner: wantGotoManageUrl.get(),
        };
      }

      if (wantGotoManageUrl.get()) {
        trace({
          type: 'manage-via-stripe',
          action: 'now-available',
          result: 'redirect',
        });
        window.location.assign(url.url);
        return {
          onClick: undefined,
          onLinkClick: undefined,
          disabled: true,
          spinner: true,
        };
      }

      return {
        onClick: url.url,
        onLinkClick: () => {
          trace({
            type: 'manage-via-stripe',
            action: 'click',
            result: 'native-link',
          });
        },
        disabled: false,
        spinner: false,
      };
    }
  );

  return (
    <GridFullscreenContainer
      windowSizeImmediate={ctx.windowSizeImmediate}
      modals={false}
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
        <VerticalSpacer
          height={GRID_SIMPLE_NAVIGATION_FOREGROUND_TOP_HEIGHT + 32}
        />
        <RenderGuardedComponent
          props={resources.pro}
          component={(entitlement) => {
            if (entitlement === null) {
              return (
                <Text style={styles.statusDetails}>
                  Loading your membership status. If this lasts more than a few
                  seconds, contact support at{' '}
                  <Text
                    onPress={() => {
                      Linking.openURL('mailto:hi@oseh.com');
                    }}
                    style={styles.statusDetailsLink}
                  >
                    hi@oseh.com
                  </Text>
                </Text>
              );
            }

            if (!entitlement.isActive) {
              return (
                <>
                  <Text style={styles.statusDetails}>
                    You do not have an Oseh+ subscription
                  </Text>
                  <VerticalSpacer height={24} />
                  <TextStyleForwarder
                    component={(styleVWC) => (
                      <FilledPremiumButton
                        onPress={() => {
                          screenOut(
                            workingVWC,
                            startPop,
                            transition,
                            screen.parameters.upgrade.exit,
                            screen.parameters.upgrade.trigger
                          );
                        }}
                        setTextStyle={(s) => setVWC(styleVWC, s)}
                      >
                        <RenderGuardedComponent
                          props={styleVWC}
                          component={(s) => (
                            <Text style={s}>Upgrade to Oseh+</Text>
                          )}
                        />
                      </FilledPremiumButton>
                    )}
                  />
                </>
              );
            }

            if (
              entitlement.activeInfo === null &&
              entitlement.expirationDate !== null
            ) {
              return (
                <Text style={styles.statusDetails}>
                  You have Oseh+ until{' '}
                  {entitlement.expirationDate.toLocaleDateString()}. Contact
                  <Text
                    onPress={() => {
                      Linking.openURL('mailto:hi@oseh.com');
                    }}
                    style={styles.statusDetailsLink}
                  >
                    hi@oseh.com
                  </Text>{' '}
                  via email if you have any questions.
                </Text>
              );
            }

            if (
              entitlement.activeInfo === null ||
              entitlement.activeInfo.recurrence.type === 'lifetime'
            ) {
              return (
                <>
                  <Text style={styles.statusDetails}>
                    You have lifetime access to Oseh+
                  </Text>
                  <VerticalSpacer height={24} />
                  <Text style={styles.lifetimePropsTitle}>You can...</Text>
                  <VerticalSpacer height={8} />
                  {[
                    { icon: <Clock />, text: 'Take longer classes' },
                    {
                      icon: <Sheet />,
                      text: 'Access the entire library',
                    },
                    {
                      icon: <Series />,
                      text: 'Explore expert-led series',
                    },
                    {
                      icon: (
                        <Text style={{ fontSize: 17, lineHeight: 24 }}>🧘</Text>
                      ),
                      text: 'Reclaim your calm',
                    },
                  ].map(({ icon, text }, idx) => (
                    <Fragment key={idx}>
                      {idx !== 0 && <VerticalSpacer height={8} />}
                      <View style={styles.valueProp}>
                        {icon}
                        <HorizontalSpacer width={8} />
                        <Text style={styles.valuePropText}>{text}</Text>
                      </View>
                    </Fragment>
                  ))}
                </>
              );
            }

            if (entitlement.activeInfo.platform === 'promotional') {
              return (
                <Text style={styles.statusDetails}>
                  You have promotional access to Oseh+ until
                  {entitlement.activeInfo.recurrence.cycleEndsAt.toLocaleDateString(
                    undefined,
                    {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }
                  )}
                </Text>
              );
            }

            if (!entitlement.activeInfo.recurrence.autoRenews) {
              return (
                <Text style={styles.statusDetails}>
                  You have access to Oseh+ until{' '}
                  {entitlement.activeInfo.recurrence.cycleEndsAt.toLocaleDateString(
                    undefined,
                    {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }
                  )}
                </Text>
              );
            }

            const simpleMembershipId =
              {
                P7D: 'weekly membership',
                P1M: 'monthly membership',
                P2M: 'bimonthly membership',
                P3M: 'quarterly membership',
                P6M: 'semiannual membership',
                P1Y: 'annual membership',
                PT5M: '5-minute (weekly or monthly test) membership',
                PT10M: '10-minute (quarterly test) membership',
                PT15M: '15-minute (semiannual test) membership',
                PT30M: '30-minute (annual test) membership',
              }[entitlement.activeInfo.recurrence.period.iso8601] ??
              'membership';
            const details = (
              <Text style={styles.statusDetails}>
                Your {simpleMembershipId} will renew on{' '}
                {entitlement.activeInfo.recurrence.cycleEndsAt.toLocaleDateString()}
              </Text>
            );

            if (entitlement.activeInfo.platform === 'stripe') {
              return (
                <>
                  {details}
                  <VerticalSpacer height={24} />
                  <RenderGuardedComponent
                    props={manageUrlProps}
                    component={(props) => (
                      <TextStyleForwarder
                        component={(styleVWC) => (
                          <FilledInvertedButton
                            onPress={() => {
                              if (typeof props.onClick === 'string') {
                                props.onLinkClick?.();
                                Linking.openURL(props.onClick);
                              } else {
                                props.onClick?.();
                              }
                            }}
                            disabled={props.disabled}
                            spinner={props.spinner}
                            setTextStyle={(s) => setVWC(styleVWC, s)}
                          >
                            <RenderGuardedComponent
                              props={styleVWC}
                              component={(s) => (
                                <Text style={s}>Go to Customer Portal</Text>
                              )}
                            />
                          </FilledInvertedButton>
                        )}
                      />
                    )}
                  />
                </>
              );
            }

            if (entitlement.activeInfo.platform === 'ios') {
              return (
                <>
                  {details}
                  <VerticalSpacer height={24} />
                  <Text style={styles.storeInfoTitle}>
                    Manage through the App Store:
                  </Text>
                  <VerticalSpacer height={8} />
                  <Text style={styles.storeInfo}>
                    • On your apple device, visit the App Store
                  </Text>
                  <VerticalSpacer height={4} />
                  <Text style={styles.storeInfo}>• Tap Settings</Text>
                  <VerticalSpacer height={4} />
                  <Text style={styles.storeInfo}>• Tap Subscriptions</Text>
                  <VerticalSpacer height={4} />
                  <Text style={styles.storeInfo}>• Tap Oseh</Text>
                </>
              );
            }

            if (entitlement.activeInfo.platform === 'google') {
              return (
                <>
                  {details}
                  <VerticalSpacer height={24} />
                  <Text style={styles.storeInfoTitle}>
                    Manage through Google Play:
                  </Text>
                  <VerticalSpacer height={8} />
                  <Text style={styles.storeInfo}>
                    • On your Android device, go to{' '}
                    <Text
                      onPress={() =>
                        Linking.openURL(
                          'https://play.google.com/store/account/subscriptions'
                        )
                      }
                      style={styles.storeInfoLink}
                    >
                      subscriptions in Google Play
                    </Text>
                  </Text>
                  <VerticalSpacer height={4} />
                  <Text style={styles.storeInfo}>
                    • Find Oseh in the list of subscriptions
                  </Text>
                  <VerticalSpacer height={4} />
                  <Text style={styles.storeInfo}>• Click Manage</Text>
                </>
              );
            }

            return (
              <>
                {details}
                <VerticalSpacer height={24} />
                <Text style={styles.storeInfoTitle}>
                  Your membership will renew through{' '}
                  {entitlement.activeInfo.platform}
                </Text>
              </>
            );
          }}
        />
        <VerticalSpacer height={0} flexGrow={1} />
        <VerticalSpacer
          height={GRID_SIMPLE_NAVIGATION_FOREGROUND_BOTTOM_HEIGHT}
        />
        <RenderGuardedComponent
          props={ctx.botBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
      </GridContentContainer>
      <GridSimpleNavigationForeground
        workingVWC={workingVWC}
        startPop={startPop}
        gridSize={ctx.windowSizeImmediate}
        transitionState={transitionState}
        transition={transition}
        trace={trace}
        back={screen.parameters.back}
        home={screen.parameters.home}
        series={screen.parameters.series}
        topBarHeight={ctx.topBarHeight}
        botBarHeight={ctx.botBarHeight}
        account={null}
        title="Manage Membership"
      />
      <WipeTransitionOverlay wipe={transitionState.wipe} />
    </GridFullscreenContainer>
  );
};
