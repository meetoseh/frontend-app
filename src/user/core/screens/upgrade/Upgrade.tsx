import { Fragment, ReactElement } from 'react';
import { ScreenComponentProps } from '../../models/Screen';
import { UpgradeCopy, UpgradeMappedParams } from './UpgradeParams';
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
import { GridBlackBackground } from '../../../../shared/components/GridBlackBackground';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import { GridImageBackground } from '../../../../shared/components/GridImageBackground';
import { useReactManagedValueAsValueWithCallbacks } from '../../../../shared/hooks/useReactManagedValueAsValueWithCallbacks';
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
  entitlementKeyMap,
} from '../settings/lib/createEntitlementRequestHandler';
import {
  ErrorBanner,
  ErrorBannerText,
} from '../../../../shared/components/ErrorBanner';
import { ScreenImageParsed } from '../../models/ScreenImage';
import {
  ParsedPeriod,
  extractPaidIntervalLength,
  extractTrialLength,
} from './lib/purchasesStoreProductHelper';
import { Check } from '../series_details/icons/Check';
import { createPriceIdentifier } from './lib/PriceIdentifier';
import { ContentContainer } from '../../../../shared/components/ContentContainer';
import { ScreenContext } from '../../hooks/useScreenContext';
import { configurableScreenOut } from '../../lib/configurableScreenOut';
import { Close } from '../../../../shared/components/icons/Close';
import { OsehColors } from '../../../../shared/OsehColors';
import { Back } from '../../../../shared/components/icons/Back';

type Copy = UpgradeCopy<ScreenImageParsed>;

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

  const subscribeErrorVWC = useWritableValueWithCallbacks<ReactElement | null>(
    () => null
  );
  useErrorModal(modals, subscribeErrorVWC, 'starting checkout session');

  const windowWidth = useMappedValueWithCallbacks(
    ctx.windowSizeImmediate,
    (s) => s.width
  );

  return (
    <GridFullscreenContainer
      windowSizeImmediate={ctx.windowSizeImmediate}
      modals={modals}
      statusBar
    >
      <GridBlackBackground />
      <GridContentContainer
        contentWidthVWC={windowWidth}
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
            thumbhash={useMappedValueWithCallbacks(
              resources.copy,
              (c) => c?.image?.thumbhash ?? null
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
        contentWidthVWC={windowWidth}
        left={transitionState.left}
        opacity={transitionState.opacity}
        justifyContent="flex-start"
        gridSizeVWC={ctx.windowSizeImmediate}
        scrollable
      >
        <RenderGuardedComponent
          props={ctx.topBarHeight}
          component={(h) => <VerticalSpacer height={h} />}
        />
        {screen.parameters.backVariant === 'back' ? (
          <View style={styles.topBack}>
            <Pressable
              onPress={() => {
                configurableScreenOut(
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
              style={styles.back}
            >
              <Back
                icon={{ width: 20 }}
                container={{ width: 20, height: 20 }}
                startPadding={{ x: { fraction: 0.5 }, y: { fraction: 0.5 } }}
                color={OsehColors.v4.primary.light}
              />
            </Pressable>
          </View>
        ) : (
          <View style={styles.topX}>
            <Pressable
              onPress={() => {
                configurableScreenOut(
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
              style={styles.x}
            >
              <Close
                icon={{ width: 24 }}
                container={{ width: 56, height: 56 }}
                startPadding={{
                  x: { fraction: 0.5 },
                  y: { fraction: 0.5 },
                }}
                color={OsehColors.v4.primary.light}
              />
            </Pressable>
          </View>
        )}

        <VerticalSpacer height={16} flexGrow={1} />
        <RenderGuardedComponent
          props={useMappedValuesWithCallbacks(
            [resources.copy, resources.trial],
            () => ({
              copy: resources.copy.get(),
              trial: resources.trial.get(),
            })
          )}
          component={(params) => <Marketing {...params} ctx={ctx} />}
        />
        <RenderGuardedComponent
          props={useMappedValuesWithCallbacks(
            [
              resources.offering,
              resources.prices,
              resources.trial,
              ctx.contentWidth,
            ],
            () => ({
              offering: resources.offering.get(),
              prices: resources.prices.get(),
              trial: resources.trial.get(),
              contentWidth: ctx.contentWidth.get(),
            })
          )}
          component={({ offering, prices, trial, contentWidth }) => (
            <>
              {trial !== null &&
              trial.count > 0 &&
              offering?.packages.length === 1 ? (
                <>
                  <ContentContainer
                    contentWidthVWC={ctx.contentWidth}
                    alignSelf="center"
                    justifyContent="flex-start"
                  >
                    <Text style={styles.oneOfferWithTrialInfo}>
                      Unlimited access for {makeTrialPretty(trial)}, then{' '}
                      {(() => {
                        const priceVWC = prices.get(
                          createPriceIdentifier(
                            offering.packages[0].platformProductIdentifier,
                            offering.packages[0].platformProductPlanIdentifier
                          )
                        );
                        if (priceVWC === undefined) {
                          return 'loading...';
                        }
                        const price = priceVWC.get();
                        if (price === null) {
                          return 'loading...';
                        }
                        const paidInterval = extractPaidIntervalLength(
                          offering.packages[0],
                          price
                        );
                        const perStr =
                          paidInterval === null
                            ? ' for life'
                            : ISO8601_PERIOD_TO_SHORTHAND[
                                paidInterval.iso8601
                              ] ?? ` / ${paidInterval.iso8601}`;
                        return `${price.product.priceString}${perStr}`;
                      })()}
                    </Text>
                  </ContentContainer>
                  <VerticalSpacer height={2} flexGrow={1} maxHeight={16} />
                </>
              ) : (
                <>
                  <ContentContainer
                    contentWidthVWC={ctx.contentWidth}
                    alignSelf="center"
                    justifyContent="flex-start"
                  >
                    <View
                      style={
                        offering?.packages?.length === 2
                          ? styles.offers2
                          : styles.offers
                      }
                    >
                      {offering?.packages?.map((pkg, idx) => {
                        const priceVWC = prices.get(
                          createPriceIdentifier(
                            pkg.platformProductIdentifier,
                            pkg.platformProductPlanIdentifier
                          )
                        );
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
                                    activeIdxVWC={resources.activePackageIdx}
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
                      <VerticalSpacer height={24} />
                    </View>
                  </ContentContainer>
                  <VerticalSpacer height={8} flexGrow={1} maxHeight={24} />
                </>
              )}
            </>
          )}
        />
        <ContentContainer
          contentWidthVWC={ctx.contentWidth}
          alignSelf="center"
          justifyContent="flex-start"
        >
          <TextStyleForwarder
            component={(styleVWC) => (
              <FilledPremiumButton
                onPress={async () => {
                  if (workingVWC.get()) {
                    return;
                  }

                  const idx = resources.activePackageIdx.get();
                  const pkg = resources.offering.get()?.packages?.[idx];
                  if (pkg === null || pkg === undefined) {
                    trace({
                      type: 'error',
                      message: 'subscribe pressed but pkg is null or undefined',
                    });
                    screenOut(
                      workingVWC,
                      startPop,
                      transition,
                      screen.parameters.exit,
                      'skip'
                    );
                    return;
                  }

                  const priceId = createPriceIdentifier(
                    pkg.platformProductIdentifier,
                    pkg.platformProductPlanIdentifier
                  );
                  const prices = resources.prices.get();
                  const priceVWC = prices.get(priceId);
                  const price = priceVWC?.get();
                  if (price === null || price === undefined) {
                    trace({
                      type: 'error',
                      message:
                        'subscribe pressed but price is null or undefined',
                      platformProductIdentifier: pkg.platformProductIdentifier,
                      platformProductPlanIdentifier:
                        pkg.platformProductPlanIdentifier,
                      validIdentifiers: Array.from(
                        resources.prices.get().keys()
                      ),
                      priceVWCIsAvailable:
                        priceVWC !== undefined && priceVWC !== null,
                    });
                    screenOut(
                      workingVWC,
                      startPop,
                      transition,
                      screen.parameters.exit,
                      'skip'
                    );
                    return;
                  }

                  const loginContext = ctx.login.value.get();
                  if (loginContext.state !== 'logged-in') {
                    trace({
                      type: 'error',
                      message: 'subscribe pressed but not logged in',
                    });
                    screenOut(
                      workingVWC,
                      startPop,
                      transition,
                      screen.parameters.exit,
                      'skip'
                    );
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
                      type: newHavePro
                        ? 'subscribeSuccess'
                        : 'subscribeFailure',
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
                      ctx.resources.journalEntryManagerHandler.evictAll();
                      ctx.resources.journalEntryMetadataHandler.evictAll();
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
                          Purchases in Settings. You can contact customer
                          support at hi@oseh.com
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
                  props={useMappedValuesWithCallbacks(
                    [styleVWC, resources.trial],
                    () => {
                      const trial = resources.trial.get();
                      return {
                        style: styleVWC.get(),
                        text:
                          trial === null || trial.count === 0
                            ? 'Subscribe'
                            : `Try ${makeTrialPretty(trial)} free`,
                      };
                    }
                  )}
                  component={({ style, text }) => (
                    <Text style={style}>{text}</Text>
                  )}
                />
              </FilledPremiumButton>
            )}
          />
        </ContentContainer>
        <VerticalSpacer height={16} />

        <ContentContainer
          contentWidthVWC={ctx.contentWidth}
          alignSelf="center"
          justifyContent="flex-start"
        >
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
        </ContentContainer>
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

  const trial = extractTrialLength(pkg, price);
  const period = extractPaidIntervalLength(pkg, price);
  const perStr =
    period === null
      ? ' for life'
      : ISO8601_PERIOD_TO_SHORTHAND[period.iso8601] ?? ` / ${period.iso8601}`;

  const frequencyStr =
    period === null
      ? 'Billed once'
      : ISO8601_PERIOD_TO_FREQUENCY[period.iso8601] ??
        `Billed once per ${period.iso8601}`;

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
          {trial !== null && (
            <Text
              style={Object.assign(
                {},
                styles.offerFrequency,
                active ? styles.offerFrequencyActive : undefined
              )}
            >
              {makeTrialPretty(trial)} free then
            </Text>
          )}

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

          {trial === null && (
            <Text
              style={Object.assign(
                {},
                styles.offerFrequency,
                active ? styles.offerFrequencyActive : undefined
              )}
            >
              {frequencyStr}
            </Text>
          )}
        </Pressable>
      )}
    />
  );
};

const Marketing = ({
  copy,
  trial,
  ctx,
}: {
  copy: Copy;
  trial: ParsedPeriod | null;
  ctx: ScreenContext;
}): ReactElement => {
  return (
    <>
      <ContentContainer
        contentWidthVWC={ctx.contentWidth}
        alignSelf="center"
        justifyContent="flex-start"
      >
        <Text style={styles.header}>
          {substituteOfferInfo({ text: copy.header, trial })}
        </Text>
      </ContentContainer>
      {copy.body.type === 'checklist' && (
        <MarketingChecklist items={copy.body.items} ctx={ctx} />
      )}
      {copy.body.type === 'sequence' && (
        <MarketingSequence items={copy.body.items} ctx={ctx} />
      )}
    </>
  );
};

const MarketingChecklist = ({
  items,
  ctx,
}: {
  items: string[];
  ctx: ScreenContext;
}): ReactElement => (
  <>
    <VerticalSpacer height={16} />
    <ContentContainer
      contentWidthVWC={ctx.contentWidth}
      alignSelf="center"
      justifyContent="flex-start"
    >
      {items.map((item, idx) => (
        <Fragment key={idx}>
          {idx !== 0 && <VerticalSpacer height={8} />}
          <View style={styles.checklistItem}>
            <Check />
            <HorizontalSpacer width={16} />
            <Text style={styles.checklistText}>{item}</Text>
          </View>
        </Fragment>
      ))}
    </ContentContainer>
    <VerticalSpacer height={8} flexGrow={1} maxHeight={40} />
  </>
);

const MarketingSequence = ({
  items,
  ctx,
}: {
  items: {
    /** The icon utf-8 character */
    icon: string;
    /** The title */
    title: string;
    /** The body */
    body: string;
  }[];
  ctx: ScreenContext;
}): ReactElement => (
  <>
    <VerticalSpacer height={8} flexGrow={1} maxHeight={48} />
    <ContentContainer
      contentWidthVWC={ctx.contentWidth}
      alignSelf="center"
      justifyContent="flex-start"
    >
      {items.map((item, idx) => (
        <Fragment key={idx}>
          {idx !== 0 && <VerticalSpacer height={24} />}
          <View style={styles.sequenceItem}>
            <Text style={styles.sequenceIcon}>{item.icon}</Text>
            <HorizontalSpacer width={16} />
            <View style={styles.sequenceText}>
              <Text style={styles.sequenceTitle}>{item.title}</Text>
              <VerticalSpacer height={8} />
              <Text style={styles.sequenceBody}>{item.body}</Text>
            </View>
          </View>
        </Fragment>
      ))}
    </ContentContainer>
    <VerticalSpacer height={8} flexGrow={1} maxHeight={60} />
  </>
);

const unitToPretty = {
  d: { singular: 'day', plural: 'days' },
  w: { singular: 'week', plural: 'weeks' },
  m: { singular: 'month', plural: 'months' },
  y: { singular: 'year', plural: 'years' },
} as const;

const makeTrialPretty = ({ count, unit }: ParsedPeriod): string => {
  return `${count.toLocaleString()} ${
    unitToPretty[unit][count === 1 ? 'singular' : 'plural']
  }`;
};

const substituteOfferInfo = ({
  text,
  trial,
}: {
  text: string;
  trial: ParsedPeriod | null;
}) => {
  return text
    .replace(/\[trial_interval_count\]/g, trial?.count.toString() ?? '?')
    .replace(
      /\[trial_interval_unit_autoplural\]/g,
      trial === null
        ? '????'
        : trial.count === 1
        ? unitToPretty[trial.unit].singular
        : unitToPretty[trial.unit].plural
    )
    .replace(
      /\[trial_interval_unit_singular\]/g,
      trial === null ? '???' : unitToPretty[trial.unit].singular
    );
};
