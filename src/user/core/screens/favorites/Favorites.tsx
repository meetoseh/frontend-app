import { ReactElement, useCallback, useMemo } from 'react';
import { PeekedScreen, ScreenComponentProps } from '../../models/Screen';
import { GridDarkGrayBackground } from '../../../../shared/components/GridDarkGrayBackground';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import { styles } from './FavoritesStyles';
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
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../../shared/lib/Callbacks';
import { FavoritesResources } from './FavoritesResources';
import { FavoritesMappedParams } from './FavoritesParams';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { MyLibraryTabs } from './components/MyLibraryTabs';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { InfiniteList } from '../../../../shared/components/InfiniteList';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { MinimalJourney } from '../../../favorites/lib/MinimalJourney';
import { OsehImageStateRequestHandler } from '../../../../shared/images/useOsehImageStateRequestHandler';
import { ScreenContext } from '../../hooks/useScreenContext';
import { HistoryItem } from '../../../favorites/components/HistoryItem';
import { trackFavoritesChanged } from '../home/lib/trackFavoritesChanged';
import { InfiniteListing } from '../../../../shared/lib/InfiniteListing';
import { useValueWithCallbacksEffect } from '../../../../shared/hooks/useValueWithCallbacksEffect';
import { setVWC } from '../../../../shared/lib/setVWC';
import { trackClassTaken } from '../home/lib/trackClassTaken';
import {
  GRID_SIMPLE_NAVIGATION_FOREGROUND_BOTTOM_HEIGHT,
  GRID_SIMPLE_NAVIGATION_FOREGROUND_TOP_HEIGHT,
  GridSimpleNavigationForeground,
} from '../../../../shared/components/GridSimpleNavigationForeground';
import { Text, View } from 'react-native';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { configurableScreenOut } from '../../lib/configurableScreenOut';

/**
 * Allows the user to see their list of favorites, go to their history or owned
 * content, or use the bottom nav to navigate to home or series, or the back button
 * at the top left to, usually, go back to the main settings screen.
 */
export const Favorites = ({
  ctx,
  screen,
  resources,
  trace,
  startPop,
}: ScreenComponentProps<
  'favorites',
  FavoritesResources,
  FavoritesMappedParams
>): ReactElement => {
  const transition = useTransitionProp(
    (): StandardScreenTransition => screen.parameters.entrance
  );
  useEntranceTransition(transition);

  const transitionState = useStandardTransitionsState(transition);

  const workingVWC = useWritableValueWithCallbacks(() => false);

  const resetList = useCallback(() => {
    const list = resources.list.get();
    if (list !== null) {
      list.reset();
    }
  }, [resources.list]);

  const showJourney = useCallback(
    async (journey: MinimalJourney) => {
      configurableScreenOut(
        workingVWC,
        startPop,
        transition,
        screen.parameters.journey.exit,
        screen.parameters.journey.trigger,
        {
          endpoint: '/api/1/users/me/screens/pop_to_history_class',
          parameters: {
            journey_uid: journey.uid,
          },
          beforeDone: async () => {
            trace({ type: 'journey', uid: journey.uid, title: journey.title });
          },
          afterDone: () => {
            resetList();
            trackClassTaken(ctx);
          },
        }
      );
    },
    [workingVWC, screen, transition, startPop, trace, resetList, ctx]
  );

  const boundComponent = useMemo<
    (
      item: ValueWithCallbacks<MinimalJourney>,
      replaceItem: (item: MinimalJourney) => void,
      previous: ValueWithCallbacks<MinimalJourney | null>,
      next: ValueWithCallbacks<MinimalJourney | null>
    ) => ReactElement
  >(() => {
    return (item, setItem) => (
      <HistoryItemComponent
        gotoJourney={showJourney}
        item={item}
        setItem={setItem}
        replaceItem={(isItem, newItem) => {
          // eslint-disable-next-line react/prop-types
          resources.list.get()?.replaceItem(isItem, newItem);
        }}
        // eslint-disable-next-line react/prop-types
        imageHandler={resources.imageHandler}
        ctx={ctx}
        screen={screen}
        // eslint-disable-next-line react/prop-types
        list={resources.list}
      />
    );
  }, [showJourney, resources.imageHandler, resources.list, ctx, screen]);

  const tabsHeightGuessVWC = useMappedValueWithCallbacks(
    ctx.fontScale,
    (s) => 29.34 * s
  );
  const tabsHeightVWC = useWritableValueWithCallbacks(() =>
    tabsHeightGuessVWC.get()
  );

  return (
    <GridFullscreenContainer
      windowSizeImmediate={ctx.windowSizeImmediate}
      modals
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
          height={GRID_SIMPLE_NAVIGATION_FOREGROUND_TOP_HEIGHT + 24}
        />
        <View
          style={styles.tabsWrapper}
          onLayout={(e) =>
            setVWC(
              tabsHeightVWC,
              e?.nativeEvent?.layout?.height ?? tabsHeightGuessVWC.get()
            )
          }
        >
          <MyLibraryTabs
            active="favorites"
            contentWidth={ctx.contentWidth}
            onHistory={() => {
              configurableScreenOut(
                workingVWC,
                startPop,
                transition,
                screen.parameters.history.exit,
                screen.parameters.history.trigger,
                {
                  beforeDone: async () => {
                    trace({ type: 'my-library-tabs', key: 'history' });
                    trackClassTaken(ctx);
                  },
                  afterDone: () => {
                    resetList();
                  },
                }
              );
            }}
            onOwned={() => {
              configurableScreenOut(
                workingVWC,
                startPop,
                transition,
                screen.parameters.owned.exit,
                screen.parameters.owned.trigger,
                {
                  beforeDone: async () => {
                    trace({ type: 'my-library-tabs', key: 'owned' });
                  },
                  afterDone: () => {
                    resetList();
                  },
                }
              );
            }}
          />
        </View>
        <VerticalSpacer height={32} />
        <RenderGuardedComponent
          props={useMappedValuesWithCallbacks(
            [
              resources.list,
              ctx.windowSizeImmediate,
              ctx.topBarHeight,
              ctx.botBarHeight,
              ctx.contentWidth,
              tabsHeightVWC,
            ],
            () => ({
              list: resources.list.get(),
              listHeight:
                ctx.windowSizeImmediate.get().height -
                ctx.topBarHeight.get() -
                GRID_SIMPLE_NAVIGATION_FOREGROUND_TOP_HEIGHT -
                24 -
                tabsHeightVWC.get() -
                32 -
                GRID_SIMPLE_NAVIGATION_FOREGROUND_BOTTOM_HEIGHT -
                ctx.botBarHeight.get(),
              listWidth: ctx.contentWidth.get(),
            }),
            {
              outputEqualityFn: (a, b) =>
                Object.is(a.list, b.list) &&
                a.listHeight === b.listHeight &&
                a.listWidth === b.listWidth,
            }
          )}
          component={({ list, listHeight, listWidth }) =>
            list === null ? (
              <></>
            ) : (
              <InfiniteList
                listing={list}
                component={boundComponent}
                itemComparer={compareJourneys}
                width={listWidth}
                height={listHeight}
                gap={10}
                initialComponentHeight={75}
                emptyElement={
                  <Text style={styles.empty}>
                    You haven&rsquo;t favorited any classes yet.
                  </Text>
                }
                noScrollBar
              />
            )
          }
        />
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
        account={null}
        title="My Library"
        topBarHeight={ctx.topBarHeight}
        botBarHeight={ctx.botBarHeight}
      />
      <WipeTransitionOverlay wipe={transitionState.wipe} />
    </GridFullscreenContainer>
  );
};

const compareJourneys = (a: MinimalJourney, b: MinimalJourney) =>
  a.uid === b.uid;

const HistoryItemComponent = ({
  gotoJourney: gotoJourneyOuter,
  item: itemVWC,
  setItem,
  imageHandler,
  ctx,
  list: listVWC,
}: {
  gotoJourney: (journey: MinimalJourney) => void;
  item: ValueWithCallbacks<MinimalJourney>;
  setItem: (item: MinimalJourney) => void;
  replaceItem: (
    isItem: (i: MinimalJourney) => boolean,
    newItem: (oldItem: MinimalJourney) => MinimalJourney
  ) => void;
  imageHandler: OsehImageStateRequestHandler;
  ctx: ScreenContext;
  screen: PeekedScreen<string, FavoritesMappedParams>;
  list: ValueWithCallbacks<InfiniteListing<MinimalJourney> | null>;
}): ReactElement => {
  const separator = useWritableValueWithCallbacks(() => false);
  const padBottomVWC = useWritableValueWithCallbacks(() => 0);
  useValueWithCallbacksEffect(itemVWC, (item) => {
    const listRaw = listVWC.get();
    if (listRaw === null) {
      setVWC(padBottomVWC, 0);
      return undefined;
    }
    const list = listRaw;

    list.itemsChanged.add(recheck);
    recheck();
    return () => list.itemsChanged.remove(recheck);

    function recheck() {
      setVWC(
        padBottomVWC,
        list.items !== null &&
          list.items.length > 0 &&
          Object.is(list.items[list.items.length - 1], item) &&
          list.definitelyNoneBelow
          ? 24
          : 0
      );
    }
  });

  return (
    <HistoryItem
      item={itemVWC}
      setItem={setItem}
      separator={separator}
      onClick={() => gotoJourneyOuter(itemVWC.get())}
      instructorImages={imageHandler}
      toggledFavorited={() => {
        trackFavoritesChanged(ctx, { skipFavoritesList: true });

        const item = itemVWC.get();
        ctx.resources.journeyLikeStateHandler.evictOrReplace(
          { journey: { uid: item.uid } },
          () => ({ type: 'make-request', data: undefined })
        );
      }}
      padBottom={padBottomVWC}
      width={ctx.contentWidth}
    />
  );
};
