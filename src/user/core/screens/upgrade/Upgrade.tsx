import { Fragment, ReactElement } from 'react';
import { ScreenComponentProps } from '../../models/Screen';
import { UpgradeMappedParams } from './UpgradeParams';
import { UpgradeResources } from './UpgradeResources';
import {
  playEntranceTransition,
  playExitTransition,
  useEntranceTransition,
  useTransitionProp,
} from '../../../../shared/lib/TransitionProp';
import {
  StandardScreenTransition,
  useStandardTransitionsState,
} from '../../../../shared/hooks/useStandardTransitions';
import {
  WritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../../shared/lib/Callbacks';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { WipeTransitionOverlay } from '../../../../shared/components/WipeTransitionOverlay';
import { styles } from './UpgradeStyles';
import { setVWC } from '../../../../shared/lib/setVWC';
import { Back } from './icons/Back';
import { GridBlackBackground } from '../../../../shared/components/GridBlackBackground';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import { GridImageBackground } from '../../../../shared/components/GridImageBackground';
import { useReactManagedValueAsValueWithCallbacks } from '../../../../shared/hooks/useReactManagedValueAsValueWithCallbacks';
import { Clock } from './icons/Clock';
import { Sheet } from './icons/Sheet';
import { Series } from './icons/Series';
import { RevenueCatPackage } from './models/RevenueCatPackage';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { useErrorModal } from '../../../../shared/hooks/useErrorModal';
import { Modals } from '../../../../shared/contexts/ModalContext';
import { screenOut } from '../../lib/screenOut';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { View, Text, Pressable } from 'react-native';
import { SvgLinearGradient } from '../../../../shared/anim/SvgLinearGradient';
import { FilledPremiumButton } from '../../../../shared/components/FilledPremiumButton';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { apiFetch } from '../../../../shared/lib/apiFetch';
import { HorizontalSpacer } from '../../../../shared/components/HorizontalSpacer';
import { TextStyleForwarder } from '../../../../shared/components/TextStyleForwarder';
import * as Linking from 'expo-linking';
import { convertUsingMapper } from '../../../../shared/lib/CrudFetcher';
import {
  Entitlement,
  EntitlementAPI,
  entitlementKeyMap,
} from '../settings/lib/createEntitlementRequestHandler';
import { describeError } from '../../../../shared/lib/describeError';
import {
  ErrorBanner,
  ErrorBannerText,
} from '../../../../shared/components/ErrorBanner';

/**
 * The upgrade screen, based on the users current offer but with a configurable
 * title.
 */
export const Upgrade = ({
  ctx,
  screen,
  resources,
  startPop,
  trace,
}: ScreenComponentProps<
  'upgrade',
  UpgradeResources,
  UpgradeMappedParams
>): ReactElement => {
  const modals = useWritableValueWithCallbacks<Modals>(() => []);
  const transition = useTransitionProp(
    (): StandardScreenTransition => screen.parameters.entrance
  );
  useEntranceTransition(transition);

  const transitionState = useStandardTransitionsState(transition);

  const workingVWC = useWritableValueWithCallbacks(() => false);

  useValueWithCallbacksEffect(resources.shouldSkip, (shouldSkip) => {
    if (workingVWC.get()) {
      return undefined;
    }

    if (shouldSkip) {
      setVWC(workingVWC, true);
      startPop({ slug: 'skip', parameters: {} })();
    }
    return undefined;
  });

  const activePackageIdxVWC = useWritableValueWithCallbacks<number>(() => 0);
  useValueWithCallbacksEffect(resources.offering, (offer) => {
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

  const subscribeErrorVWC = useWritableValueWithCallbacks<ReactElement | null>(
    () => null
  );
  useErrorModal(modals, subscribeErrorVWC, 'starting checkout session');

  return (
    <GridFullscreenContainer
      windowSizeImmediate={ctx.windowSizeImmediate}
      modals={modals}
      statusBar
    >
      <GridBlackBackground />
      <GridContentContainer
        contentWidthVWC={useMappedValueWithCallbacks(
          ctx.windowSizeImmediate,
          (s) => s.width
        )}
        left={transitionState.left}
        opacity={transitionState.opacity}
        justifyContent="flex-start"
        gridSizeVWC={ctx.windowSizeImmediate}
        scrollable={false}
      >
        <GridFullscreenContainer
          windowSizeImmediate={resources.imageSizeImmediate}
          statusBar={false}
          modals={false}
        >
          <GridImageBackground
            image={resources.image}
            thumbhash={useReactManagedValueAsValueWithCallbacks(
              screen.parameters.image.thumbhash
            )}
            size={resources.imageSizeImmediate}
          />
          <SvgLinearGradient
            state={{
              stop1: { color: [0, 0, 0, 0], offset: 0 },
              stop2: { color: [0, 0, 0, 1], offset: 1 },
              x1: 0.5,
              y1: 0,
              x2: 0.5,
              y2: 1,
            }}
          />
        </GridFullscreenContainer>
      </GridContentContainer>
      <GridContentContainer
        contentWidthVWC={ctx.contentWidth}
        left={transitionState.left}
        opacity={transitionState.opacity}
        justifyContent="flex-start"
        gridSizeVWC={ctx.windowSizeImmediate}
        scrollable={false}
      >
        <RenderGuardedComponent
          props={ctx.topBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
        <VerticalSpacer height={20} />
        <View style={styles.top}>
          <Pressable
            onPress={() => {
              screenOut(
                workingVWC,
                startPop,
                transition,
                screen.parameters.exit,
                screen.parameters.back,
                {
                  beforeDone: async () => {
                    trace({ type: 'back' });
                  },
                }
              );
            }}
          >
            <Back />
          </Pressable>
        </View>
        <VerticalSpacer height={0} flexGrow={1} />
        <Text style={styles.header}>{screen.parameters.header}</Text>
        <VerticalSpacer height={16} />
        {[
          { icon: <Clock />, text: 'Unlock longer classes' },
          {
            icon: <Sheet />,
            text: 'Access the entire library',
          },
          {
            icon: <Series />,
            text: 'Explore expert-led series',
          },
          {
            icon: <Text style={{ fontSize: 17, lineHeight: 24 }}>🧘</Text>,
            text: 'Enhanced content browsing',
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
        <VerticalSpacer height={40} />
        <RenderGuardedComponent
          props={useMappedValuesWithCallbacks(
            [resources.offering, resources.prices, ctx.contentWidth],
            () => ({
              offering: resources.offering.get(),
              prices: resources.prices.get(),
              contentWidth: ctx.contentWidth.get(),
            })
          )}
          component={({ offering, prices, contentWidth }) => (
            <View
              style={
                offering?.packages?.length === 2
                  ? styles.offers2
                  : styles.offers
              }
            >
              {offering?.packages?.map((pkg, idx) => {
                const priceVWC = prices.get(pkg.platformProductIdentifier);
                if (priceVWC === null || priceVWC === undefined) {
                  return null;
                }
                return (
                  <Fragment key={idx}>
                    {idx !== 0 && offering?.packages?.length > 2 && (
                      <VerticalSpacer height={16} />
                    )}
                    {idx !== 0 && offering?.packages?.length === 2 && (
                      <HorizontalSpacer width={12} />
                    )}
                    <RenderGuardedComponent
                      props={priceVWC}
                      component={(price) =>
                        price === null ? (
                          <></>
                        ) : (
                          <Offer
                            pkg={pkg}
                            price={price}
                            idx={idx}
                            activeIdxVWC={activePackageIdxVWC}
                            width={
                              offering?.packages?.length === 2
                                ? contentWidth / 2 - 6
                                : contentWidth
                            }
                          />
                        )
                      }
                    />
                  </Fragment>
                );
              })}
            </View>
          )}
        />
        <VerticalSpacer height={24} />
        <TextStyleForwarder
          component={(styleVWC) => (
            <FilledPremiumButton
              onPress={async () => {
                if (workingVWC.get()) {
                  return;
                }

                const idx = activePackageIdxVWC.get();
                const pkg = resources.offering.get()?.packages?.[idx];
                if (pkg === null || pkg === undefined) {
                  trace({
                    type: 'error',
                    message: 'subscribe pressed but pkg is null or undefined',
                  });
                  return;
                }

                const price = resources.prices
                  .get()
                  .get(pkg.platformProductIdentifier)
                  ?.get();
                if (price === null || price === undefined) {
                  trace({
                    type: 'error',
                    message: 'subscribe pressed but price is null or undefined',
                  });
                  return;
                }

                const loginContext = ctx.login.value.get();
                if (loginContext.state !== 'logged-in') {
                  trace({
                    type: 'error',
                    message: 'subscribe pressed but not logged in',
                  });
                  return;
                }

                setVWC(workingVWC, true);
                trace({
                  type: 'subscribeStart',
                  pkg,
                  price,
                  technique: 'revenuecat',
                });
                const exitPromise = playExitTransition(transition);
                try {
                  await Purchases.purchasePackage(price);
                  trace({
                    type: 'subscribeFinished',
                    hint: 'checking result..',
                  });
                  // cancellations should have rejected, so we are pretty sure
                  // they purchased
                  const finishPop = startPop({
                    slug: screen.parameters.checkout.success,
                    parameters: {},
                  });
                  // give time for caches
                  await new Promise((r) => setTimeout(r, 3_000));
                  let data: Entitlement | undefined = undefined;
                  let newHavePro: boolean = false;
                  let tries = 0;
                  while (true) {
                    tries++;
                    const response = await apiFetch(
                      '/api/1/users/me/entitlements/pro',
                      {
                        method: 'GET',
                        headers: {
                          pragma: 'no-cache',
                        },
                      },
                      loginContext
                    );
                    if (!response.ok) {
                      if (response.status === 429) {
                        if (tries < 3) {
                          trace({ type: 'subscribeRateLimited' });
                          await new Promise((r) => setTimeout(r, 30_000));
                          continue;
                        }
                      }
                      throw response;
                    }
                    const dataRaw = await response.json();
                    data = convertUsingMapper(dataRaw, entitlementKeyMap);
                    newHavePro = data.isActive;
                    if (newHavePro) {
                      break;
                    }

                    if (tries < 3) {
                      trace({ type: 'subscribeNotYet' });
                      await new Promise((r) => setTimeout(r, 5_000));
                      continue;
                    } else {
                      break;
                    }
                  }

                  trace({
                    type: newHavePro ? 'subscribeSuccess' : 'subscribeFailure',
                  });

                  if (newHavePro) {
                    ctx.resources.entitlementsHandler.evictOrReplace(
                      { user: loginContext, entitlement: 'pro' },
                      () => ({
                        type: 'data',
                        data,
                      })
                    );
                    ctx.resources.seriesListHandler.evictAll();
                    ctx.resources.seriesJourneysHandler.evictAll();
                    await exitPromise.promise;
                    finishPop();
                    setVWC(workingVWC, false);
                  } else {
                    setVWC(workingVWC, false);
                    await exitPromise.promise;
                    playEntranceTransition(transition);
                  }
                } catch (e) {
                  trace({ type: 'subscribeError', error: `${e}` });
                  setVWC(
                    subscribeErrorVWC,
                    <ErrorBanner>
                      <ErrorBannerText>
                        {`${e}`}. If the purchase went through, use Restore
                        Purchases in Settings. You can contact customer support
                        at hi@oseh.com
                      </ErrorBannerText>
                    </ErrorBanner>
                  );
                  setVWC(workingVWC, false);
                  await exitPromise.promise;
                  playEntranceTransition(transition);
                }
              }}
              setTextStyle={(s) => setVWC(styleVWC, s)}
            >
              <RenderGuardedComponent
                props={styleVWC}
                component={(s) => <Text style={s}>Subscribe</Text>}
              />
            </FilledPremiumButton>
          )}
        />
        <VerticalSpacer height={16} />
        <Pressable
          onPress={() => {
            Linking.openURL('https://www.oseh.com/terms');
          }}
          style={styles.disclaimer}
        >
          <Text style={styles.disclaimerTitle}>Cancel anytime.</Text>
          <VerticalSpacer height={2} />
          <Text style={styles.disclaimerBody}>
            You will be notified before subscription renewal.
          </Text>
          <Text style={styles.disclaimerTerms}>Terms & Conditions</Text>
        </Pressable>
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
  width,
}: {
  pkg: RevenueCatPackage;
  price: PurchasesPackage;
  idx: number;
  activeIdxVWC: WritableValueWithCallbacks<number>;
  width: number;
}): ReactElement => {
  const isActiveVWC = useMappedValuesWithCallbacks(
    [activeIdxVWC, useReactManagedValueAsValueWithCallbacks(idx)],
    () => activeIdxVWC.get() === idx
  );

  const iso8601Period =
    price.product.defaultOption?.pricingPhases?.[0]?.billingPeriod?.iso8601 ??
    price.product.subscriptionPeriod ??
    undefined;
  const perStr =
    iso8601Period === undefined
      ? ' for life'
      : ISO8601_PERIOD_TO_SHORTHAND[iso8601Period] ?? ` / ${iso8601Period}`;

  const frequencyStr =
    iso8601Period === undefined
      ? 'Billed once'
      : ISO8601_PERIOD_TO_FREQUENCY[iso8601Period] ??
        `Billed once per ${iso8601Period}`;

  return (
    <RenderGuardedComponent
      props={isActiveVWC}
      component={(active) => (
        <Pressable
          style={Object.assign(
            { width },
            styles.offer,
            active ? styles.offerActive : undefined
          )}
          onPress={() => {
            setVWC(activeIdxVWC, idx);
          }}
        >
          <Text
            style={Object.assign(
              {},
              styles.offerPrice,
              active ? styles.offerPriceActive : undefined
            )}
          >
            {price.product.priceString}
            {perStr}
          </Text>

          <Text
            style={Object.assign(
              {},
              styles.offerFrequency,
              active ? styles.offerFrequencyActive : undefined
            )}
          >
            {frequencyStr}
          </Text>
        </Pressable>
      )}
    />
  );
};
