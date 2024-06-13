import { CSSProperties, ReactElement, useCallback, useMemo } from 'react';
import { PeekedScreen, ScreenComponentProps } from '../../models/Screen';
import { SeriesListMappedParams } from './SeriesListParams';
import { SeriesListResources } from './SeriesListResources';
import {
  playExitTransition,
  useEntranceTransition,
  useTransitionProp,
} from '../../../../shared/lib/TransitionProp';
import {
  StandardScreenTransition,
  useStandardTransitionsState,
} from '../../../../shared/hooks/useStandardTransitions';
import {
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../../shared/lib/Callbacks';
import { GridFullscreenContainer } from '../../../../shared/components/GridFullscreenContainer';
import { GridDarkGrayBackground } from '../../../../shared/components/GridDarkGrayBackground';
import { GridContentContainer } from '../../../../shared/components/GridContentContainer';
import { ExternalCourse } from '../../../series/lib/ExternalCourse';
import { OsehImageStateRequestHandler } from '../../../../shared/images/useOsehImageStateRequestHandler';
import { useRefreshedExternalCourse } from '../../../series/hooks/useRefreshedExternalCourse';
import { CourseCoverItem } from '../../../series/components/CourseCoverItem';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { InfiniteList } from '../../../../shared/components/InfiniteList';
import { styles } from './SeriesListStyles';
import {
  InfiniteListing,
  NetworkedInfiniteListing,
  PrefixedNetworkedInfiniteListing,
} from '../../../../shared/lib/InfiniteListing';
import { ScreenContext } from '../../hooks/useScreenContext';
import { useStyleVWC } from '../../../../shared/hooks/useStyleVWC';
import { setVWC } from '../../../../shared/lib/setVWC';
import { largestPhysicalPerLogical } from '../../../../shared/images/DisplayRatioHelper';
import { VerticalSpacer } from '../../../../shared/components/VerticalSpacer';
import {
  GRID_SIMPLE_NAVIGATION_FOREGROUND_BOTTOM_HEIGHT,
  GridSimpleNavigationForeground,
} from '../../../../shared/components/GridSimpleNavigationForeground';
import { screenOut } from '../../lib/screenOut';
import { View, ViewStyle, Text } from 'react-native';
import { FilledInvertedButton } from '../../../../shared/components/FilledInvertedButton';
import { TextStyleForwarder } from '../../../../shared/components/TextStyleForwarder';

type TooltipPlaceholder = { readonly uid: 'tooltip' };

/**
 * Displays the series listing page with an optional tooltip and
 * call to action.
 */
export const SeriesList = ({
  ctx,
  screen,
  resources,
  trace,
  startPop,
}: ScreenComponentProps<
  'series_list',
  SeriesListResources,
  SeriesListMappedParams
>): ReactElement => {
  const transition = useTransitionProp(
    (): StandardScreenTransition => screen.parameters.entrance
  );
  useEntranceTransition(transition);

  const transitionState = useStandardTransitionsState(transition);

  const workingVWC = useWritableValueWithCallbacks(() => false);

  const showCourse = useCallback(
    async (course: ExternalCourse) => {
      screenOut(
        workingVWC,
        startPop,
        transition,
        screen.parameters.exit,
        screen.parameters.seriesTrigger,
        {
          endpoint: '/api/1/users/me/screens/pop_to_series',
          parameters: {
            series: { uid: course.uid, jwt: course.jwt },
          },
          beforeDone: async () => {
            trace({
              type: 'click',
              target: 'course',
              course: { uid: course.uid, title: course.title },
            });
          },
        }
      );
    },
    [workingVWC, screen, transition, startPop, trace]
  );

  const size = useMappedValuesWithCallbacks(
    [ctx.contentWidth, resources.imageHeight],
    () => ({
      width: ctx.contentWidth.get(),
      height: resources.imageHeight.get(),
    })
  );

  const boundComponent = useMemo<
    (
      item: ValueWithCallbacks<ExternalCourse | TooltipPlaceholder>,
      setItem: (newItem: ExternalCourse | TooltipPlaceholder) => void,
      previous: ValueWithCallbacks<ExternalCourse | TooltipPlaceholder | null>,
      next: ValueWithCallbacks<ExternalCourse | TooltipPlaceholder | null>
    ) => ReactElement
  >(() => {
    return (item, setItem, _previous, next) => (
      <CourseCoverItemComponent
        gotoCourse={showCourse}
        item={item}
        setItem={setItem}
        replaceItem={(isItem, newItem) => {
          resources.list.get()?.replaceItem(isItem, newItem);
        }}
        imageHandler={resources.imageHandler}
        ctx={ctx}
        screen={screen}
        size={size}
        next={next}
      />
    );
  }, [showCourse, resources.imageHandler, resources.list, ctx, screen]);

  const listHeight = useMappedValuesWithCallbacks(
    [ctx.windowSizeImmediate, ctx.topBarHeight, ctx.botBarHeight],
    () =>
      ctx.windowSizeImmediate.get().height -
      ctx.topBarHeight.get() -
      16 -
      (screen.parameters.bottom
        ? GRID_SIMPLE_NAVIGATION_FOREGROUND_BOTTOM_HEIGHT
        : 0)
    // we purposely let the list go down to the bottom, so don't subtract ctx.botBarHeight
  );

  const mappedListVWC = useMappedValueWithCallbacks(
    resources.list,
    (list): InfiniteListing<ExternalCourse | TooltipPlaceholder> | null => {
      if (list === null) {
        return null;
      }

      if (screen.parameters.tooltip === null) {
        return list as NetworkedInfiniteListing<
          ExternalCourse | TooltipPlaceholder
        >;
      }

      return new PrefixedNetworkedInfiniteListing<
        ExternalCourse,
        TooltipPlaceholder
      >(list, [{ uid: 'tooltip' }]) as any as NetworkedInfiniteListing<
        ExternalCourse | TooltipPlaceholder
      >;
    },
    {
      inputEqualityFn: () => false,
    }
  );

  const ctaStyleVWC = useMappedValuesWithCallbacks(
    [transitionState.left, transitionState.opacity],
    (): ViewStyle => ({
      ...styles.cta,
      left: transitionState.left.get(),
      opacity: transitionState.opacity.get(),
    })
  );
  const ctaRef = useWritableValueWithCallbacks<View | null>(() => null);
  useStyleVWC(ctaRef, ctaStyleVWC);

  const ctaInnerStyleVWC = useMappedValueWithCallbacks(
    ctx.contentWidth,
    (size): ViewStyle => ({
      ...styles.ctaInner,
      width: size,
    }),
    {
      inputEqualityFn: () => false,
    }
  );
  const ctaInnerRef = useWritableValueWithCallbacks<View | null>(() => null);
  useStyleVWC(ctaInnerRef, ctaInnerStyleVWC);

  return (
    <GridFullscreenContainer
      windowSizeImmediate={ctx.windowSizeImmediate}
      modals={false}
      statusBar
    >
      <GridDarkGrayBackground />
      <GridContentContainer
        contentWidthVWC={useMappedValueWithCallbacks(
          ctx.windowSizeImmediate,
          (s) => s.width
        )}
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
        <VerticalSpacer height={16} />
        <RenderGuardedComponent
          props={useMappedValuesWithCallbacks(
            [
              mappedListVWC,
              listHeight,
              resources.imageHeight,
              ctx.contentWidth,
            ],
            () => ({
              list: mappedListVWC.get(),
              listHeight: listHeight.get(),
              initialComponentHeight: resources.imageHeight.get(),
              width: ctx.contentWidth.get(),
            }),
            {
              outputEqualityFn: (a, b) =>
                Object.is(a.list, b.list) &&
                a.listHeight === b.listHeight &&
                a.initialComponentHeight === b.initialComponentHeight &&
                a.width === b.width,
            }
          )}
          component={({ list, listHeight, initialComponentHeight, width }) =>
            list === null ? (
              <></>
            ) : (
              <InfiniteList
                listing={list}
                component={boundComponent}
                itemComparer={compareCourses}
                height={listHeight}
                gap={10}
                initialComponentHeight={initialComponentHeight}
                emptyElement={
                  <Text style={styles.empty}>
                    There are no series available right now.
                  </Text>
                }
                width={width}
                noScrollBar
              />
            )
          }
        />
        {screen.parameters.bottom && (
          <VerticalSpacer
            height={GRID_SIMPLE_NAVIGATION_FOREGROUND_BOTTOM_HEIGHT}
          />
        )}
      </GridContentContainer>
      {screen.parameters.bottom && (
        <GridSimpleNavigationForeground
          workingVWC={workingVWC}
          startPop={startPop}
          gridSize={ctx.windowSizeImmediate}
          transitionState={transitionState}
          transition={transition}
          trace={trace}
          home={screen.parameters.bottom.home}
          series={null}
          account={screen.parameters.bottom.account}
          topBarHeight={ctx.topBarHeight}
          botBarHeight={ctx.botBarHeight}
          noTop
        />
      )}
      {screen.parameters.cta !== null && (
        <View
          style={ctaStyleVWC.get()}
          ref={(r) => setVWC(ctaRef, r)}
          pointerEvents="box-none"
        >
          <VerticalSpacer height={0} flexGrow={1} />
          <View
            style={ctaInnerStyleVWC.get()}
            ref={(r) => setVWC(ctaInnerRef, r)}
            pointerEvents="box-none"
          >
            <TextStyleForwarder
              component={(styleVWC) => (
                <FilledInvertedButton
                  onPress={() => {
                    screenOut(
                      workingVWC,
                      startPop,
                      transition,
                      screen.parameters.exit,
                      screen.parameters.cta?.trigger ?? null,
                      {
                        beforeDone: async () => {
                          trace({ type: 'click', target: 'cta' });
                        },
                      }
                    );
                  }}
                  setTextStyle={(s) => setVWC(styleVWC, s)}
                >
                  <RenderGuardedComponent
                    props={styleVWC}
                    component={(s) => (
                      <Text style={s}>{screen.parameters.cta?.text}</Text>
                    )}
                  />
                </FilledInvertedButton>
              )}
            />
            <VerticalSpacer height={32} />
            {screen.parameters.bottom && (
              <VerticalSpacer
                height={GRID_SIMPLE_NAVIGATION_FOREGROUND_BOTTOM_HEIGHT}
              />
            )}
            <RenderGuardedComponent
              props={ctx.botBarHeight}
              component={(h) => <VerticalSpacer height={h} />}
            />
          </View>
        </View>
      )}
    </GridFullscreenContainer>
  );
};

const compareCourses = (
  a: ExternalCourse | TooltipPlaceholder,
  b: ExternalCourse | TooltipPlaceholder
): boolean => a.uid === b.uid;

const CourseCoverItemComponent = ({
  gotoCourse: gotoCourseOuter,
  item: itemVWC,
  setItem,
  replaceItem,
  imageHandler,
  ctx,
  screen,
  size,
  next,
}: {
  gotoCourse: (course: ExternalCourse) => void;
  item: ValueWithCallbacks<ExternalCourse | TooltipPlaceholder>;
  setItem: (item: ExternalCourse) => void;
  replaceItem: (
    isItem: (i: ExternalCourse) => boolean,
    newItem: (oldItem: ExternalCourse) => ExternalCourse
  ) => void;
  imageHandler: OsehImageStateRequestHandler;
  ctx: ScreenContext;
  screen: PeekedScreen<string, SeriesListMappedParams>;
  size: ValueWithCallbacks<{ width: number; height: number }>;
  next: ValueWithCallbacks<ExternalCourse | TooltipPlaceholder | null>;
}): ReactElement => {
  const isTooltipVWC = useMappedValueWithCallbacks(
    itemVWC,
    (item) => item.uid === 'tooltip'
  );
  const padBottomVWC = useMappedValueWithCallbacks(next, (v) =>
    v === null
      ? ctx.botBarHeight.get() + 10 + (screen.parameters.cta !== null ? 106 : 0)
      : 0
  );
  return (
    <RenderGuardedComponent
      props={isTooltipVWC}
      component={(isTooltip) =>
        isTooltip ? (
          <Tooltip ctx={ctx} screen={screen} />
        ) : (
          <CourseCoverItemComponentInner
            item={itemVWC as ValueWithCallbacks<ExternalCourse>}
            setItem={setItem}
            replaceItem={replaceItem}
            gotoCourse={gotoCourseOuter}
            imageHandler={imageHandler}
            size={size}
            padBottom={padBottomVWC}
          />
        )
      }
    />
  );
};

const Tooltip = ({
  ctx,
  screen,
}: {
  ctx: ScreenContext;
  screen: PeekedScreen<string, SeriesListMappedParams>;
}): ReactElement => {
  const tooltipRefVWC = useWritableValueWithCallbacks<View | null>(() => null);
  const tooltipStyleVWC = useMappedValueWithCallbacks(
    ctx.contentWidth,
    (width): ViewStyle => ({
      ...styles.tooltip,
      width,
    })
  );
  useStyleVWC(tooltipRefVWC, tooltipStyleVWC);
  return (
    <View style={styles.tooltipContainer}>
      <View style={tooltipStyleVWC.get()} ref={(r) => setVWC(tooltipRefVWC, r)}>
        <Text style={styles.tooltipHeader}>
          {screen.parameters.tooltip?.header ?? 'Tooltip Header'}
        </Text>
        <VerticalSpacer height={8} />
        <Text style={styles.tooltipBody}>
          {screen.parameters.tooltip?.body ?? 'Tooltip Body'}
        </Text>
      </View>
    </View>
  );
};

const CourseCoverItemComponentInner = ({
  gotoCourse: gotoCourseOuter,
  item: itemVWC,
  setItem,
  replaceItem,
  imageHandler,
  size,
  padBottom,
}: {
  gotoCourse: (course: ExternalCourse) => void;
  item: ValueWithCallbacks<ExternalCourse>;
  setItem: (item: ExternalCourse) => void;
  replaceItem: (
    isItem: (i: ExternalCourse) => boolean,
    newItem: (oldItem: ExternalCourse) => ExternalCourse
  ) => void;
  imageHandler: OsehImageStateRequestHandler;
  size: ValueWithCallbacks<{ width: number; height: number }>;
  padBottom: ValueWithCallbacks<number>;
}): ReactElement => {
  useRefreshedExternalCourse(itemVWC, setItem, 'list');

  const gotoCourse = useCallback(() => {
    gotoCourseOuter(itemVWC.get());
  }, [gotoCourseOuter, itemVWC]);

  const mapItems = useCallback(
    (fn: (item: ExternalCourse) => ExternalCourse) => {
      replaceItem(() => true, fn);
    },
    [replaceItem]
  );

  return (
    <>
      <CourseCoverItem
        item={itemVWC}
        setItem={setItem}
        mapItems={mapItems}
        onClick={gotoCourse}
        imageHandler={imageHandler}
        size={size}
      />
      <RenderGuardedComponent
        props={padBottom}
        component={(h) => <VerticalSpacer height={h} />}
      />
    </>
  );
};
