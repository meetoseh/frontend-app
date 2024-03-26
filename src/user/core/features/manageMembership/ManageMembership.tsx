import { ReactElement, useCallback } from 'react';
import { ManageMembershipState } from './ManageMembershipState';
import { ManageMembershipResources } from './ManageMembershipResources';
import { FeatureComponentProps } from '../../models/Feature';
import { styles } from './ManageMembershipStyles';
import { SvgLinearGradientBackground } from '../../../../shared/anim/SvgLinearGradientBackground';
import {
  Pressable,
  View,
  Text,
  StyleProp,
  TextStyle,
  Linking,
} from 'react-native';
import { useWindowSizeValueWithCallbacks } from '../../../../shared/hooks/useWindowSize';
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { useValuesWithCallbacksEffect } from '../../../../shared/hooks/useValuesWithCallbacksEffect';
import { DARK_BLACK_GRAY_GRADIENT_SVG } from '../../../../styling/colors';
import { StatusBar } from 'expo-status-bar';
import { Modals, ModalsOutlet } from '../../../../shared/contexts/ModalContext';
import Back from '../gotoEmotion/assets/Back';
import { useTopBarHeight } from '../../../../shared/hooks/useTopBarHeight';
import { debugView } from '../../../../shared/lib/debugView';
import { useErrorModal } from '../../../../shared/hooks/useErrorModal';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import { setVWC } from '../../../../shared/lib/setVWC';
import { FilledPremiumButton } from '../../../../shared/components/FilledPremiumButton';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { valuePropsByContext } from '../upgrade/Upgrade';
import { FilledInvertedButton } from '../../../../shared/components/FilledInvertedButton';
import { useContentWidth } from '../../../../shared/lib/useContentWidth';

/**
 * Tells the user if they have a membership. If they do, directs them to the
 * right place to manage it (if applicable)
 */
export const ManageMembership = ({
  state,
  resources,
}: FeatureComponentProps<
  ManageMembershipState,
  ManageMembershipResources
>): ReactElement => {
  const modals = useWritableValueWithCallbacks<Modals>(() => []);
  const windowSizeVWC = useWindowSizeValueWithCallbacks();
  const backgroundContainerRef = useWritableValueWithCallbacks<View | null>(
    () => null
  );
  useValuesWithCallbacksEffect([backgroundContainerRef, windowSizeVWC], () => {
    const size = windowSizeVWC.get();
    const ele = backgroundContainerRef.get();
    if (ele !== null) {
      ele.setNativeProps({ style: { minHeight: size.height } });
    }
    return undefined;
  });

  const topBarHeight = useTopBarHeight();

  const shownErrorVWC = useWritableValueWithCallbacks<ReactElement | null>(
    () => null
  );
  useValueWithCallbacksEffect(
    useMappedValueWithCallbacks(resources, (r) => r.havePro.error),
    useCallback(
      (error) => {
        setVWC(shownErrorVWC, error ?? null);
        return undefined;
      },
      [shownErrorVWC]
    )
  );
  useErrorModal(modals, shownErrorVWC, 'loading membership status');

  const upgradeTextStyleVWC = useWritableValueWithCallbacks<
    StyleProp<TextStyle>
  >(() => undefined);
  const customerPortalTextStyleVWC = useWritableValueWithCallbacks<
    StyleProp<TextStyle>
  >(() => undefined);

  const contentWidth = useContentWidth();

  return (
    <View>
      <SvgLinearGradientBackground
        containerStyle={Object.assign({}, styles.backgroundContainer, {
          minHeight: windowSizeVWC.get().height,
        })}
        state={{
          type: 'react-rerender',
          props: DARK_BLACK_GRAY_GRADIENT_SVG,
        }}
        refVWC={backgroundContainerRef}
      >
        <View style={styles.background}>
          <View style={styles.content}>
            <View
              style={Object.assign({}, styles.header, {
                paddingTop: topBarHeight,
                minHeight: styles.header.minHeight + topBarHeight,
              })}
            >
              <View style={styles.headerLeft}>
                <Pressable
                  onPress={() => resources.get().gotoSettings()}
                  style={styles.back}
                >
                  <Back />
                </Pressable>
              </View>
              <View style={styles.headerCenter}>
                <Text style={styles.headerText}>Manage Membership</Text>
              </View>
              <View style={styles.headerRight} />
            </View>
            <View
              style={Object.assign({}, styles.contentInner, {
                width: contentWidth,
              })}
            >
              <Text style={styles.title}>Status</Text>
              <RenderGuardedComponent
                props={useMappedValueWithCallbacks(resources, (r) => r.havePro)}
                component={(havePro) => {
                  if (havePro.type === 'error') {
                    return (
                      <Text style={styles.statusDetails}>
                        There was an error loading your membership status.
                        Contact support at{' '}
                        <Text
                          style={styles.storeInfoDetailsListItemLinkText}
                          onPress={() => {
                            Linking.openURL('mailto:hi@oseh.com');
                          }}
                        >
                          hi@oseh.com
                        </Text>{' '}
                        if the problem persists.
                      </Text>
                    );
                  }

                  if (havePro.type === 'loading') {
                    return <Text style={styles.statusDetails}>Loading...</Text>;
                  }

                  if (!havePro.value) {
                    return (
                      <>
                        <Text style={styles.statusDetails}>
                          You do not have an Oseh+ subscription
                        </Text>
                        <View style={styles.upgradeContainer}>
                          <FilledPremiumButton
                            onPress={() => {
                              resources.get().gotoUpgrade();
                            }}
                            setTextStyle={(s) => setVWC(upgradeTextStyleVWC, s)}
                            width={contentWidth}
                          >
                            <RenderGuardedComponent
                              props={upgradeTextStyleVWC}
                              component={(s) => (
                                <Text style={s}>Upgrade to Oseh+</Text>
                              )}
                            />
                          </FilledPremiumButton>
                        </View>
                      </>
                    );
                  }

                  if (havePro.recurrence.type === 'lifetime') {
                    return (
                      <>
                        <Text style={styles.statusDetails}>
                          You have lifetime access to Oseh+
                        </Text>
                        <View style={styles.lifetimeProps}>
                          <Text style={styles.lifetimePropsTitle}>
                            You can...
                          </Text>
                          <View style={styles.valueProps}>
                            {valuePropsByContext('past').map(
                              ({ icon, text }, idx) => (
                                <View key={idx} style={styles.valueProp}>
                                  <View style={styles.valuePropIcon}>
                                    {icon}
                                  </View>
                                  <Text style={styles.valuePropText}>
                                    {text}
                                  </Text>
                                </View>
                              )
                            )}
                          </View>
                        </View>
                      </>
                    );
                  }

                  if (havePro.platform === 'promotional') {
                    return (
                      <Text style={styles.statusDetails}>
                        You have promotional access to Oseh+ until
                        {havePro.recurrence.cycleEndsAt.toLocaleDateString(
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

                  if (!havePro.recurrence.autoRenews) {
                    return (
                      <Text style={styles.statusDetails}>
                        You have access to Oseh+ until{' '}
                        {havePro.recurrence.cycleEndsAt.toLocaleDateString(
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
                    }[havePro.recurrence.period.iso8601] ?? 'membership';
                  const details = (
                    <Text style={styles.statusDetails}>
                      Your {simpleMembershipId} will renew on{' '}
                      {havePro.recurrence.cycleEndsAt.toLocaleDateString()}
                    </Text>
                  );

                  if (havePro.platform === 'stripe') {
                    return (
                      <>
                        {details}
                        <View style={styles.storeInfo}>
                          <Text style={styles.storeInfoTitle}>
                            Manage through the Web:
                          </Text>
                          <View style={styles.storeInfoDetailsList}>
                            <Text style={styles.storeInfoDetailsListItem}>
                              • On any device, visit{' '}
                              <Text
                                style={styles.storeInfoDetailsListItemLinkText}
                                onPress={() => {
                                  Linking.openURL('https://oseh.io');
                                }}
                              >
                                https://oseh.io
                              </Text>{' '}
                              on your web browser and login
                            </Text>
                            <Text style={styles.storeInfoDetailsListItem}>
                              • Tap Account in the bottom right
                            </Text>
                            <Text style={styles.storeInfoDetailsListItem}>
                              • Tap Manage Membership
                            </Text>
                            <Text style={styles.storeInfoDetailsListItem}>
                              • Tap Go to Customer Portal
                            </Text>
                          </View>
                        </View>
                      </>
                    );
                  }

                  if (havePro.platform === 'ios') {
                    return (
                      <>
                        {details}
                        <View style={styles.storeInfo}>
                          <Text style={styles.storeInfoTitle}>
                            Manage through the App Store:
                          </Text>
                          <View style={styles.storeInfoDetailsList}>
                            <Text style={styles.storeInfoDetailsListItem}>
                              • On your apple device, visit the App Store
                            </Text>
                            <Text style={styles.storeInfoDetailsListItem}>
                              • Tap Settings
                            </Text>
                            <Text style={styles.storeInfoDetailsListItem}>
                              • Tap Subscriptions
                            </Text>
                            <Text style={styles.storeInfoDetailsListItem}>
                              • Tap Oseh
                            </Text>
                          </View>
                        </View>
                      </>
                    );
                  }

                  if (havePro.platform === 'google') {
                    return (
                      <>
                        {details}
                        <View style={styles.storeInfo}>
                          <Text style={styles.storeInfoTitle}>
                            Manage through Google Play:
                          </Text>
                          <View style={styles.storeInfoDetailsList}>
                            <Text style={styles.storeInfoDetailsListItem}>
                              • On your Android device, go to{' '}
                              <Text
                                style={styles.storeInfoDetailsListItemLinkText}
                                onPress={() =>
                                  Linking.openURL(
                                    'https://play.google.com/store/account/subscriptions'
                                  )
                                }
                              >
                                subscriptions in Google Play
                              </Text>
                            </Text>
                            <Text style={styles.storeInfoDetailsListItem}>
                              • Find Oseh in the list of subscriptions
                            </Text>
                            <Text style={styles.storeInfoDetailsListItem}>
                              • Click Manage
                            </Text>
                          </View>
                        </View>
                      </>
                    );
                  }

                  return (
                    <>
                      {details}
                      <View style={styles.storeInfo}>
                        <Text style={styles.storeInfoTitle}>
                          Your membership will renew through {havePro.platform}
                        </Text>
                      </View>
                    </>
                  );
                }}
              />
            </View>
          </View>
        </View>
      </SvgLinearGradientBackground>
      <ModalsOutlet modals={modals} />
      <StatusBar style="light" />
    </View>
  );
};
