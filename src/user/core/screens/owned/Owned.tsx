import { ReactElement, useCallback, useMemo } from 'react';
import { PeekedScreen, ScreenComponentProps } from '../../models/Screen';
import { GridDarkGrayBackground } from '../../../../shared/components/GridDarkGrayBackground';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import { styles } from '../favorites/FavoritesStyles';
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
import { screenOut } from '../../lib/screenOut';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import { MyLibraryTabs } from '../favorites/components/MyLibraryTabs';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { InfiniteList } from '../../../../shared/components/InfiniteList';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { OsehImageStateRequestHandler } from '../../../../shared/images/useOsehImageStateRequestHandler';
import { ScreenContext } from '../../hooks/useScreenContext';
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
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { View, Text } from 'react-native';
import { MinimalCourseJourney } from '../../../favorites/lib/MinimalCourseJourney';
import { OwnedResources } from './OwnedResources';
import { OwnedMappedParams } from './OwnedParams';
import { CourseJourneyItem } from '../../../favorites/components/CourseJourneyItem';
import { configurableScreenOut } from '../../lib/configurableScreenOut';

/**
 * Allows the user to see their list of purchased content, go to their history
 * or favorites or use the bottom nav to navigate to home or series, or the back
 * button at the top left to, usually, go back to the main settings screen.
 */
export const Owned = ({
  ctx,
  screen,
  resources,
  trace,
  startPop,
}: ScreenComponentProps<
  'owned',
  OwnedResources,
  OwnedMappedParams
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
    async (journey: MinimalCourseJourney) => {
      configurableScreenOut(
        workingVWC,
        startPop,
        transition,
        screen.parameters.journey.exit,
        screen.parameters.journey.trigger,
        {
          endpoint: '/api/1/users/me/screens/pop_to_series_class',
          parameters: {
            series: {
              uid: journey.course.uid,
              jwt: journey.course.jwt,
            },
            journey: {
              uid: journey.journey.uid,
            },
          },
          beforeDone: async () => {
            trace({
              type: 'journey',
              uid: journey.journey.uid,
              title: journey.journey.title,
              course_uid: journey.course.uid,
              course_title: journey.course.title,
            });
          },
          afterDone: () => {
            // this will handle resetting the list
            trackClassTaken(ctx);
          },
        }
      );
    },
    [workingVWC, screen, transition, startPop, trace, ctx]
  );

  const boundComponent = useMemo<
    (
      item: ValueWithCallbacks<MinimalCourseJourney>,
      setItem: (newItem: MinimalCourseJourney) => void,
      previous: ValueWithCallbacks<MinimalCourseJourney | null>
    ) => ReactElement
  >(() => {
    return (item, setItem, previous) => (
      <HistoryItemComponent
        gotoJourney={showJourney}
        item={item}
        setItem={setItem}
        replaceItem={(isItem, newItem) => {
          resources.list.get()?.replaceItem(isItem, newItem);
        }}
        imageHandler={resources.imageHandler}
        ctx={ctx}
        screen={screen}
        list={resources.list}
        previous={previous}
        trace={trace}
      />
    );
  }, [showJourney, resources.imageHandler, resources.list, ctx, screen, trace]);

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
            active="owned"
            contentWidth={ctx.contentWidth}
            onFavorites={() => {
              configurableScreenOut(
                workingVWC,
                startPop,
                transition,
                screen.parameters.favorites.exit,
                screen.parameters.favorites.trigger,
                {
                  beforeDone: async () => {
                    trace({ type: 'my-library-tabs', key: 'favorites' });
                  },
                  afterDone: () => {
                    resetList();
                  },
                }
              );
            }}
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
                height={listHeight}
                gap={10}
                initialComponentHeight={75}
                emptyElement={
                  <Text style={styles.empty}>
                    You haven&rsquo;t taken any classes yet
                  </Text>
                }
                width={listWidth}
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

const compareJourneys = (a: MinimalCourseJourney, b: MinimalCourseJourney) =>
  a.associationUid === b.associationUid;

const HistoryItemComponent = ({
  gotoJourney: gotoJourneyOuter,
  item: itemVWC,
  setItem,
  replaceItem,
  imageHandler,
  ctx,
  screen,
  trace,
  list: listVWC,
  previous: previousVWC,
}: {
  gotoJourney: (journey: MinimalCourseJourney) => void;
  item: ValueWithCallbacks<MinimalCourseJourney>;
  setItem: (item: MinimalCourseJourney) => void;
  replaceItem: (
    isItem: (i: MinimalCourseJourney) => boolean,
    newItem: (oldItem: MinimalCourseJourney) => MinimalCourseJourney
  ) => void;
  imageHandler: OsehImageStateRequestHandler;
  ctx: ScreenContext;
  screen: PeekedScreen<string, OwnedMappedParams>;
  trace: (event: any) => void;
  list: ValueWithCallbacks<InfiniteListing<MinimalCourseJourney> | null>;
  previous: ValueWithCallbacks<MinimalCourseJourney | null>;
}): ReactElement => {
  const separatorVWC = useMappedValuesWithCallbacks(
    [itemVWC, previousVWC],
    () => {
      const previous = previousVWC.get();
      const item = itemVWC.get();

      return previous === null || previous.course.uid !== item.course.uid;
    }
  );

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
  const mapItems = useCallback(
    (fn: (item: MinimalCourseJourney) => MinimalCourseJourney) => {
      replaceItem(() => true, fn);
    },
    [replaceItem]
  );

  return (
    <CourseJourneyItem
      item={itemVWC}
      setItem={setItem}
      mapItems={mapItems}
      separator={separatorVWC}
      onClick={() => gotoJourneyOuter(itemVWC.get())}
      instructorImages={imageHandler}
      onDownload={() => {
        const item = itemVWC.get();
        trace({
          type: 'download',
          uid: item.journey.uid,
          title: item.journey.title,
          course_uid: item.course.uid,
          course_title: item.course.title,
        });
        trackClassTaken(ctx);
      }}
      padBottom={padBottomVWC}
      toggledFavorited={() => {
        trackFavoritesChanged(ctx, { skipOwnedList: true });

        const item = itemVWC.get();
        ctx.resources.journeyLikeStateHandler.evictOrReplace(
          { journey: { uid: item.journey.uid } },
          () => ({ type: 'make-request', data: undefined })
        );
      }}
    />
  );
};
