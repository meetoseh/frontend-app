import { ReactElement, useCallback, useContext, useEffect } from 'react';
import { FeatureComponentProps } from '../../models/Feature';
import { UpgradeResources } from './UpgradeResources';
import { UpgradeState } from './UpgradeState';
import { useWindowSizeValueWithCallbacks } from '../../../../shared/hooks/useWindowSize';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { OsehImageProps } from '../../../../shared/images/OsehImageProps';
import { useOsehImageStateValueWithCallbacks } from '../../../../shared/images/useOsehImageStateValueWithCallbacks';
import { adaptValueWithCallbacksAsVariableStrategyProps } from '../../../../shared/lib/adaptValueWithCallbacksAsVariableStrategyProps';
import { styles } from './UpgradeStyles';
import {
  WritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../../shared/lib/Callbacks';
import { useValuesWithCallbacksEffect } from '../../../../shared/hooks/useValuesWithCallbacksEffect';
import { setVWC } from '../../../../shared/lib/setVWC';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import { RevenueCatPackage } from './models/RevenueCatPackage';
import { PurchasesStoreProduct } from './models/PurchasesStoreProduct';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { useStartSession } from '../../../../shared/hooks/useInappNotificationSession';
import { RevenueCatPlatform } from './lib/RevenueCatPlatform';
import { Modals, ModalsOutlet } from '../../../../shared/contexts/ModalContext';
import { useErrorModal } from '../../../../shared/hooks/useErrorModal';
import { LoginContext } from '../../../../shared/contexts/LoginContext';
import { describeError } from '../../../../shared/lib/describeError';
import {
  Pressable,
  View,
  Text,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import Clock from './assets/Clock';
import Sheet from './assets/Sheet';
import Series from './assets/Series';
import Browse from './assets/Browse';
import { StatusBar } from 'expo-status-bar';
import Close from '../../../../shared/icons/Close';
import { useTopBarHeight } from '../../../../shared/hooks/useTopBarHeight';
import { useContentWidth } from '../../../../shared/lib/useContentWidth';
import { useBotBarHeight } from '../../../../shared/hooks/useBotBarHeight';
import { OsehImageFromStateValueWithCallbacks } from '../../../../shared/images/OsehImageFromStateValueWithCallbacks';
import { SvgLinearGradient } from '../../../../shared/anim/SvgLinearGradient';
import { FilledPremiumButton } from '../../../../shared/components/FilledPremiumButton';

/**
 * Allows the user to upgrade to Oseh+, if they are eligible to do so
 */
export const Upgrade = ({
  state,
  resources,
}: FeatureComponentProps<UpgradeState, UpgradeResources>): ReactElement => {
  const modals = useWritableValueWithCallbacks<Modals>(() => []);
  const loginContextRaw = useContext(LoginContext);
  const windowSizeVWC = useWindowSizeValueWithCallbacks();
  const backgroundImageProps = useMappedValueWithCallbacks(
    windowSizeVWC,
    (size): OsehImageProps => ({
      uid: 'oseh_if_qWZHxhR86u_wttPwkoa1Yw',
      jwt: null,
      displayWidth: size.width,
      displayHeight: size.height - 410,
      alt: '',
      isPublic: true,
    })
  );
  const backgroundImageState = useOsehImageStateValueWithCallbacks(
    adaptValueWithCallbacksAsVariableStrategyProps(backgroundImageProps),
    resources.get().imageHandler
  );
  useStartSession(
    {
      type: 'callbacks',
      props: () => resources.get().session,
      callbacks: resources.callbacks,
    },
    {
      onStart: () => {
        const ctx = state.get().context;
        const res = resources.get();
        const offer = res.offer;
        const session = res.session;

        session?.storeAction('open', {
          context: {
            type: ctx?.type ?? 'generic',
            ...(ctx?.type === 'series'
              ? { series: ctx.course.uid }
              : ctx?.type === 'longerClasses'
              ? { emotion: ctx.emotion }
              : {}),
          },
          platform: RevenueCatPlatform,
          offering:
            offer.type !== 'success'
              ? null
              : {
                  id: offer.offering.identifier,
                  products: offer.offering.packages.map((p) => p.identifier),
                },
          initial: offer?.offering?.packages?.[0]?.identifier ?? null,
        });
      },
    }
  );

  const backgroundRefVWC = useWritableValueWithCallbacks<HTMLDivElement | null>(
    () => null
  );
  useValuesWithCallbacksEffect([windowSizeVWC, backgroundRefVWC], () => {
    const size = windowSizeVWC.get();
    const bknd = backgroundRefVWC.get();
    if (bknd !== null) {
      bknd.style.minHeight = `${size.height}px`;
    }
    return undefined;
  });

  const offerVWC = useMappedValueWithCallbacks(
    resources,
    (r) => r.offer.offering
  );
  const activePackageIdxVWC = useWritableValueWithCallbacks<number>(() => 0);

  useValueWithCallbacksEffect(offerVWC, (offer) => {
    const activePackageIdx = activePackageIdxVWC.get();
    if (
      offer === null ||
      offer === undefined ||
      offer.packages.length <= activePackageIdx
    ) {
      setVWC(activePackageIdxVWC, 0);
    }
    return undefined;
  });

  const offersAndPricesVWC = useMappedValueWithCallbacks(
    resources,
    (r): [RevenueCatPackage, PurchasesStoreProduct][] => {
      const offer = r.offer.offering;
      const price = r.offerPrice;

      if (offer === null || price.type !== 'success') {
        return [];
      }

      return offer.packages.map((pkg) => {
        const pkgPrice =
          price.pricesByPlatformProductId[
            pkg.platformProductIdentifier +
              (pkg.platformProductPlanIdentifier === null
                ? ''
                : ':' + pkg.platformProductPlanIdentifier)
          ];
        return [pkg, pkgPrice];
      });
    }
  );

  const activePriceVWC = useMappedValuesWithCallbacks(
    [offersAndPricesVWC, activePackageIdxVWC],
    (): PurchasesStoreProduct | undefined => {
      return (offersAndPricesVWC.get()[activePackageIdxVWC.get()] ?? [])[1];
    }
  );

  useEffect(() => {
    activePackageIdxVWC.callbacks.add(onSelectionChanged);
    return () => {
      activePackageIdxVWC.callbacks.remove(onSelectionChanged);
    };

    function onSelectionChanged() {
      const idx = activePackageIdxVWC.get();
      const offer = offerVWC.get();
      const pkg = offer?.packages[idx];
      if (pkg === undefined) {
        return;
      }

      resources
        .get()
        .session?.storeAction('package_selected', { package: pkg.identifier });
    }
  }, [activePackageIdxVWC, offerVWC, resources]);

  const subscribeErrorVWC = useWritableValueWithCallbacks<ReactElement | null>(
    () => null
  );
  useErrorModal(modals, subscribeErrorVWC, 'subscribing');

  const redirectingVWC = useWritableValueWithCallbacks<boolean>(() => false);
  const handleSubscribe = useCallback(async () => {
    const idx = activePackageIdxVWC.get();
    const offer = offerVWC.get();
    const pkg = offer?.packages[idx];
    if (pkg === undefined) {
      return;
    }

    const loginContextUnch = loginContextRaw.value.get();
    if (loginContextUnch.state !== 'logged-in') {
      return;
    }
    const loginContext = loginContextUnch;

    if (redirectingVWC.get()) {
      return;
    }
    setVWC(redirectingVWC, true);

    try {
      // TODO
      throw new Error('not implemented');
    } catch (e) {
      const err = await describeError(e);
      setVWC(subscribeErrorVWC, err);
    } finally {
      setVWC(redirectingVWC, false);
    }
  }, [
    activePackageIdxVWC,
    loginContextRaw.value,
    offerVWC,
    redirectingVWC,
    resources,
    subscribeErrorVWC,
  ]);

  const contentRef = useWritableValueWithCallbacks<View | null>(() => null);
  useValuesWithCallbacksEffect([contentRef, windowSizeVWC], () => {
    const content = contentRef.get();
    const size = windowSizeVWC.get();

    if (content === null) {
      return;
    }
    content.setNativeProps({
      style: {
        minHeight: size.height,
      },
    });
    return undefined;
  });

  const topBarHeight = useTopBarHeight();
  const botBarHeight = useBotBarHeight();
  const contentWidth = useContentWidth();

  const offerErrorVWC = useWritableValueWithCallbacks<ReactElement | null>(
    () => null
  );
  useValueWithCallbacksEffect(
    useMappedValueWithCallbacks(resources, (r) => r.offer.error),
    (err) => {
      setVWC(offerErrorVWC, err);
      return undefined;
    }
  );
  useErrorModal(modals, offerErrorVWC, 'loading offers');

  const subscribeTextStyleVWC = useWritableValueWithCallbacks<
    StyleProp<TextStyle>
  >(() => undefined);

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.content} ref={(r) => setVWC(contentRef, r)}>
          <View style={styles.imageBackground}>
            <OsehImageFromStateValueWithCallbacks
              state={backgroundImageState}
            />
          </View>
          <View style={styles.backgroundOverlay}>
            <SvgLinearGradient
              state={{
                stops: [
                  {
                    color: [20, 25, 28, 0],
                    offset: 0,
                  },
                  {
                    color: [20, 25, 28, 0],
                    offset: 0.15,
                  },
                  {
                    color: [20, 25, 28, 1],
                    offset: 0.2969,
                  },
                  {
                    color: [1, 1, 1, 1],
                    offset: 1,
                  },
                ],
                x1: 0.5,
                y1: 0,
                x2: 0.5,
                y2: 1,
              }}
            />
          </View>
          <View
            style={Object.assign({}, styles.closeContainer, {
              paddingTop: styles.closeContainer.paddingTop + topBarHeight,
            })}
          >
            <Pressable
              style={styles.closeButton}
              onPress={() => {
                resources.get().session?.storeAction('close', null);
                state.get().setContext(null, true);
              }}
            >
              <Close />
            </Pressable>
          </View>
          <View style={styles.contentInnerContainer}>
            <View
              style={Object.assign({}, styles.contentInner, {
                width: contentWidth,
                paddingBottom: styles.contentInner.paddingBottom + botBarHeight,
              })}
            >
              <RenderGuardedComponent
                props={useMappedValueWithCallbacks(state, (s) => s.context)}
                component={(ctx) => (
                  <>
                    <Text style={styles.title}>
                      {(() => {
                        if (ctx?.type === 'series') {
                          return 'Get this series and more with Oseh+';
                        } else if (ctx?.type === 'longerClasses') {
                          return 'Extend your practice with longer classes on Oseh+';
                        } else {
                          return 'A deeper practice starts with Oseh+';
                        }
                      })()}
                    </Text>
                    <View style={styles.valueProps}>
                      {valuePropsByContext(ctx?.type ?? 'generic').map(
                        (prop, idx) => (
                          <View key={idx} style={styles.valueProp}>
                            <View style={styles.valuePropIcon}>
                              {prop.icon}
                            </View>
                            <Text style={styles.valuePropText}>
                              {prop.text}
                            </Text>
                          </View>
                        )
                      )}
                    </View>
                  </>
                )}
              />
              <RenderGuardedComponent
                props={offersAndPricesVWC}
                component={(offersAndPrices) => {
                  return (
                    <View
                      style={
                        offersAndPrices.length === 2
                          ? styles.offers2
                          : styles.offers
                      }
                    >
                      {offersAndPrices.map(([pkg, pkgPrice], idx) => (
                        <Offer
                          key={idx}
                          pkg={pkg}
                          price={pkgPrice}
                          idx={idx}
                          activeIdxVWC={activePackageIdxVWC}
                          offerStyle={
                            offersAndPrices.length === 2
                              ? styles.offer2
                              : undefined
                          }
                        />
                      ))}
                    </View>
                  );
                }}
              />
              <View style={styles.subscribeContainer}>
                <FilledPremiumButton
                  onPress={handleSubscribe}
                  setTextStyle={(s) => setVWC(subscribeTextStyleVWC, s)}
                >
                  <RenderGuardedComponent
                    props={subscribeTextStyleVWC}
                    component={(s) => <Text style={s}>Subscribe</Text>}
                  />
                </FilledPremiumButton>
              </View>
              <RenderGuardedComponent
                props={activePriceVWC}
                component={(activePrice) => {
                  if (
                    activePrice === undefined ||
                    activePrice.productCategory !== 'SUBSCRIPTION'
                  ) {
                    return <></>;
                  }
                  return (
                    <View style={styles.disclaimer}>
                      <Text style={styles.disclaimerTitle}>Cancel anytime</Text>
                      <Text style={styles.disclaimerBody}>
                        You will be notified before subscription renewal.
                      </Text>
                    </View>
                  );
                }}
              />
            </View>
          </View>
        </View>
        <ModalsOutlet modals={modals} />
      </View>
      <StatusBar style="light" />
    </View>
  );
};

const ISO8601_PERIOD_TO_SHORTHAND: Record<string, string> = {
  P7D: '/wk',
  P1M: '/mo',
  P2M: '/2mo',
  P3M: '/3mo',
  P6M: '/6mo',
  P1Y: '/yr',
};

const ISO8601_PERIOD_TO_FREQUENCY: Record<string, string> = {
  P7D: 'Billed weekly',
  P1M: 'Billed monthly',
  P2M: 'Billed every other month',
  P3M: 'Billed quarterly',
  P6M: 'Billed semi-annually',
  P1Y: 'Billed annually',
};

const Offer = ({
  pkg,
  price,
  idx,
  activeIdxVWC,
  offerStyle: layoutStyle,
}: {
  pkg: RevenueCatPackage;
  price: PurchasesStoreProduct;
  idx: number;
  activeIdxVWC: WritableValueWithCallbacks<number>;
  offerStyle: ViewStyle | undefined;
}): ReactElement => {
  const iso8601Period =
    price.defaultOption?.pricingPhases[0].billingPeriod.iso8601;
  const perStr =
    iso8601Period === undefined
      ? ' for life'
      : ISO8601_PERIOD_TO_SHORTHAND[iso8601Period] ?? ` / ${iso8601Period}`;

  const frequencyStr =
    iso8601Period === undefined
      ? 'Billed once'
      : ISO8601_PERIOD_TO_FREQUENCY[iso8601Period] ??
        `Billed once per ${iso8601Period}`;

  const isActiveVWC = useMappedValueWithCallbacks(
    activeIdxVWC,
    (activeIdx) => activeIdx === idx
  );

  return (
    <RenderGuardedComponent
      props={isActiveVWC}
      component={(isActive) => (
        <Pressable
          style={Object.assign(
            {},
            styles.offer,
            layoutStyle,
            isActive ? styles.offerActive : undefined
          )}
          onPress={() => {
            setVWC(activeIdxVWC, idx);
          }}
        >
          <Text
            style={Object.assign(
              {},
              styles.offerPrice,
              isActive ? styles.offerPriceActive : undefined
            )}
          >
            {price.priceString}
            {perStr}
          </Text>

          <Text
            style={Object.assign(
              {},
              styles.offerFrequency,
              isActive ? styles.offerFrequencyActive : undefined
            )}
          >
            {frequencyStr}
          </Text>
        </Pressable>
      )}
    />
  );
};

export const valuePropsByContext = (
  typ: string
): { icon: ReactElement; text: string }[] => {
  if (typ === 'onboarding') {
    return [
      {
        icon: <Text style={styles.valuePropIconEmoji}>🌈</Text>,
        text: 'Reduce stress & anxiety',
      },
      {
        icon: <Text style={styles.valuePropIconEmoji}>🧠</Text>,
        text: 'Sharpen mental clarity',
      },
      {
        icon: <Text style={styles.valuePropIconEmoji}>❤️</Text>,
        text: 'Connect with yourself',
      },
      {
        icon: <Text style={styles.valuePropIconEmoji}>🌙</Text>,
        text: 'Improve sleep quality',
      },
    ];
  } else if (typ === 'past') {
    return [
      {
        icon: <Clock />,
        text: 'Take longer classes',
      },
      {
        icon: <Sheet />,
        text: 'Access the entire library',
      },
      {
        icon: <Series />,
        text: 'Explore expert-led series',
      },
      { icon: <Text>🧘</Text>, text: 'Reclaim your calm' },
    ];
  } else {
    return [
      {
        icon: <Clock />,
        text: 'Unlock longer classes',
      },
      {
        icon: <Sheet />,
        text: 'Access the entire library',
      },
      {
        icon: <Series />,
        text: 'Explore expert-led series',
      },
      {
        icon: <Browse />,
        text: 'Enhanced content browsing',
      },
    ];
  }
};
