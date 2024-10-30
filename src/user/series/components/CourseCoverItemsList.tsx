import { ReactElement, useCallback, useContext, useMemo } from 'react';
import { LoginContext } from '../../../shared/contexts/LoginContext';
import { OsehImageStateRequestHandler } from '../../../shared/images/useOsehImageStateRequestHandler';
import { InfiniteList } from '../../../shared/components/InfiniteList';
import { RenderGuardedComponent } from '../../../shared/components/RenderGuardedComponent';
import { ValueWithCallbacks } from '../../../shared/lib/Callbacks';
import { useMappedValuesWithCallbacks } from '../../../shared/hooks/useMappedValuesWithCallbacks';
import { ExternalCourse } from '../lib/ExternalCourse';
import { adaptValueWithCallbacksAsVariableStrategyProps } from '../../../shared/lib/adaptValueWithCallbacksAsVariableStrategyProps';
import { CourseCoverItem } from './CourseCoverItem';
import { useWindowSizeValueWithCallbacks } from '../../../shared/hooks/useWindowSize';
import { useMappedValueWithCallbacks } from '../../../shared/hooks/useMappedValueWithCallbacks';
import { useSeriesTabList } from '../hooks/useSeriesTabList';
import { useContentWidth } from '../../../shared/lib/useContentWidth';
import { Text } from 'react-native';
import { styles } from './sharedStyles';
import { useRefreshedExternalCourse } from '../hooks/useRefreshedExternalCourse';
import { largestPhysicalPerLogical } from '../../../shared/images/DisplayRatioHelper';
import { useTopBarHeight } from '../../../shared/hooks/useTopBarHeight';
import {
  useValueWithCallbacksLikeVWC,
  ValueWithCallbacksLike,
} from '../../../shared/ValueWithCallbacksLike';

export type CourseCoverItemsListProps = {
  /**
   * A function which can be called to take the user to the given course
   * then return when they are done.
   *
   * @param course The course to show.
   */
  showCourse: (course: ExternalCourse) => void;

  /**
   * The height of the list in logical pixels
   */
  listHeight: ValueWithCallbacks<number>;

  /**
   * The handler to use to fetch images.
   */
  imageHandler: OsehImageStateRequestHandler;
};

/**
 * Displays an infinite list of the given height, where the contents are courses
 * on the series tab.
 */
export const CourseCoverItemsList = ({
  showCourse,
  listHeight,
  imageHandler,
}: CourseCoverItemsListProps): ReactElement => {
  const windowSizeVWC = useWindowSizeValueWithCallbacks();
  const loginContextRaw = useContext(LoginContext);
  const infiniteListing = useSeriesTabList(
    loginContextRaw,
    adaptValueWithCallbacksAsVariableStrategyProps(listHeight)
  );
  const contentWidth = useContentWidth();
  const topBarHeight = useTopBarHeight();

  const initialComponentHeightVWC = useMappedValueWithCallbacks(
    windowSizeVWC,
    () => {
      return (
        Math.floor(contentWidth * (427 / 342) * largestPhysicalPerLogical) /
        largestPhysicalPerLogical
      );
    }
  );

  const boundComponent = useMemo<
    (
      item: ValueWithCallbacks<ExternalCourse>,
      setItem: (newItem: ExternalCourse) => void
    ) => ReactElement
  >(() => {
    return (item, setItem) => (
      <CourseCoverItemComponent
        gotoCourse={showCourse}
        item={item}
        setItem={setItem}
        replaceItem={infiniteListing.replaceItem.bind(infiniteListing)}
        imageHandler={imageHandler}
        width={{ value: contentWidth }}
        height={initialComponentHeightVWC}
      />
    );
  }, [
    showCourse,
    imageHandler,
    infiniteListing,
    contentWidth,
    initialComponentHeightVWC,
  ]);

  return (
    <RenderGuardedComponent
      props={useMappedValuesWithCallbacks(
        [listHeight, initialComponentHeightVWC],
        () => ({
          listHeight: listHeight.get(),
          initialComponentHeight: initialComponentHeightVWC.get(),
        }),
        {
          outputEqualityFn: (a, b) =>
            a.listHeight === b.listHeight &&
            a.initialComponentHeight === b.initialComponentHeight,
        }
      )}
      component={({ listHeight, initialComponentHeight }) => (
        <InfiniteList
          listing={infiniteListing}
          component={boundComponent}
          itemComparer={compareCourses}
          height={listHeight}
          gap={10}
          firstTopPadding={topBarHeight + 8}
          lastBottomPadding={32}
          initialComponentHeight={initialComponentHeight}
          emptyElement={
            <Text style={styles.empty}>
              There are no series available right now.
            </Text>
          }
          width={contentWidth}
        />
      )}
    />
  );
};

const compareCourses = (a: ExternalCourse, b: ExternalCourse): boolean =>
  a.uid === b.uid;

const CourseCoverItemComponent = ({
  gotoCourse: gotoCourseOuter,
  item: itemVWC,
  setItem,
  replaceItem,
  imageHandler,
  width,
  height,
}: {
  gotoCourse: (course: ExternalCourse) => void;
  item: ValueWithCallbacks<ExternalCourse>;
  setItem: (item: ExternalCourse) => void;
  replaceItem: (
    isItem: (i: ExternalCourse) => boolean,
    newItem: (oldItem: ExternalCourse) => ExternalCourse
  ) => void;
  imageHandler: OsehImageStateRequestHandler;
  width: ValueWithCallbacksLike<number>;
  height: ValueWithCallbacksLike<number>;
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

  const widthVWC = useValueWithCallbacksLikeVWC(width);
  const heightVWC = useValueWithCallbacksLikeVWC(height);
  const sizeVWC = useMappedValuesWithCallbacks([widthVWC, heightVWC], () => ({
    width: widthVWC.get(),
    height: heightVWC.get(),
  }));

  return (
    <CourseCoverItem
      item={itemVWC}
      setItem={setItem}
      mapItems={mapItems}
      onClick={gotoCourse}
      imageHandler={imageHandler}
      size={sizeVWC}
    />
  );
};
