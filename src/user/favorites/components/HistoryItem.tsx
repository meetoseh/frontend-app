import { ReactElement, useCallback, useContext, useEffect } from 'react';
import { Pressable, Text, View, ViewStyle } from 'react-native';
import { MinimalJourney } from '../lib/MinimalJourney';
import { styles } from './HistoryItemStyles';
import { useFavoritedModal } from '../hooks/useFavoritedModal';
import { useUnfavoritedModal } from '../hooks/useUnfavoritedModal';
import { textOverflowEllipses } from '../../../shared/lib/calculateKerningLength';
import { OsehImageStateRequestHandler } from '../../../shared/images/useOsehImageStateRequestHandler';
import {
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../shared/lib/Callbacks';
import { adaptValueWithCallbacksAsVariableStrategyProps } from '../../../shared/lib/adaptValueWithCallbacksAsVariableStrategyProps';
import { RenderGuardedComponent } from '../../../shared/components/RenderGuardedComponent';
import { useOsehImageStateValueWithCallbacks } from '../../../shared/images/useOsehImageStateValueWithCallbacks';
import { OsehImageFromStateValueWithCallbacks } from '../../../shared/images/OsehImageFromStateValueWithCallbacks';
import { InlineOsehSpinner } from '../../../shared/components/InlineOsehSpinner';
import { useToggleFavorited } from '../../journey/hooks/useToggleFavorited';
import { useMappedValueWithCallbacks } from '../../../shared/hooks/useMappedValueWithCallbacks';
import { ModalContext } from '../../../shared/contexts/ModalContext';
import FullHeartIcon from '../../journey/icons/FullHeartIcon';
import EmptyHeartIcon from '../../journey/icons/EmptyHeartIcon';
import { useIsTablet } from '../../../shared/lib/useIsTablet';
import { useStyleVWC } from '../../../shared/hooks/useStyleVWC';
import { setVWC } from '../../../shared/lib/setVWC';
import { createValueWithCallbacksEffect } from '../../../shared/hooks/createValueWithCallbacksEffect';
import { VerticalSpacer } from '../../../shared/components/VerticalSpacer';
import { useReactManagedValueAsValueWithCallbacks } from '../../../shared/hooks/useReactManagedValueAsValueWithCallbacks';
import { useTopBarHeight } from '../../../shared/hooks/useTopBarHeight';
import {
  useValueWithCallbacksLikeVWC,
  ValueWithCallbacksLike,
} from '../../../shared/ValueWithCallbacksLike';

type HistoryItemProps = {
  /**
   * The item to render
   */
  item: ValueWithCallbacks<MinimalJourney>;

  /**
   * If the user modifies the item, i.e., by favoriting/unfavoriting it,
   * the callback to update the item. This is called after the change is
   * already stored serverside.
   *
   * @param item The new item
   */
  setItem: (item: MinimalJourney) => void;

  /**
   * If true, a separator indicating the date the item was taken is rendered
   * just before the item.
   */
  separator: ValueWithCallbacks<boolean>;

  /**
   * Called if the user clicks the item outside of the normally clickable
   * areas.
   */
  onClick?: () => void;

  /**
   * The request handler to use for instructor images
   */
  instructorImages: OsehImageStateRequestHandler;

  /** If specified, called if we change the favorited state of the item */
  toggledFavorited?: () => void;

  /** The amount to pad the bottom of this item with empty space, 0 not to. Intended for the last item in the list */
  padBottom?: ValueWithCallbacks<number>;

  /** The width to render at; usually ctx.contentWidth */
  width: ValueWithCallbacksLike<number>;
};

/**
 * Renders a minimal journey for the favorites or history tab.
 */
export const HistoryItem = ({
  item: itemVWC,
  setItem,
  separator: separatorVWC,
  onClick,
  instructorImages,
  toggledFavorited: onToggledFavoritedCallback,
  padBottom: padBottomVWC,
  width: widthRaw,
}: HistoryItemProps) => {
  const errorVWC = useWritableValueWithCallbacks<ReactElement | null>(
    () => null
  );
  const likingVWC = useWritableValueWithCallbacks<boolean>(() => false);
  const showLikedUntilVWC = useWritableValueWithCallbacks<number | undefined>(
    () => undefined
  );
  const showUnlikedUntilVWC = useWritableValueWithCallbacks<number | undefined>(
    () => undefined
  );
  const instructorImageVWC = useOsehImageStateValueWithCallbacks(
    adaptValueWithCallbacksAsVariableStrategyProps(
      useMappedValueWithCallbacks(
        itemVWC,
        (item) => ({
          ...item.instructor.image,
          displayWidth: 14,
          displayHeight: 14,
          alt: 'profile',
        }),
        {
          outputEqualityFn: (a, b) => a.uid === b.uid && a.jwt === b.jwt,
        }
      )
    ),
    instructorImages
  );
  const modalContext = useContext(ModalContext);
  const topBarHeightVWC = useReactManagedValueAsValueWithCallbacks(
    useTopBarHeight()
  );
  const toggleFavorited = useToggleFavorited({
    modals: modalContext.modals,
    journey: adaptValueWithCallbacksAsVariableStrategyProps(itemVWC),
    shared: useMappedValueWithCallbacks(itemVWC, (item) => ({
      favorited: item.likedAt !== null,
      setFavorited: (favorited: boolean) => {
        setItem({
          ...item,
          likedAt: favorited ? new Date() : null,
        });
      },
    })),
    knownUnfavoritable: adaptValueWithCallbacksAsVariableStrategyProps(
      useMappedValueWithCallbacks(itemVWC, (item) => item.lastTakenAt === null)
    ),
    working: likingVWC,
    topBarHeight: topBarHeightVWC,
  });
  const onToggleFavorited = useCallback(() => {
    toggleFavorited();
    onToggledFavoritedCallback?.();
  }, [toggleFavorited, onToggledFavoritedCallback]);

  useFavoritedModal(
    adaptValueWithCallbacksAsVariableStrategyProps(showLikedUntilVWC),
    modalContext.modals
  );
  useUnfavoritedModal(
    adaptValueWithCallbacksAsVariableStrategyProps(showUnlikedUntilVWC),
    modalContext.modals
  );

  const isTablet = useIsTablet();
  const ellipsedTitle = useMappedValueWithCallbacks(itemVWC, (item) =>
    isTablet ? item.title : textOverflowEllipses(item.title, 15)
  );
  const instructorName = useMappedValueWithCallbacks(
    itemVWC,
    (item) => item.instructor.name
  );
  const favorited = useMappedValueWithCallbacks(
    itemVWC,
    (item) => item.likedAt !== null
  );

  const padBottomAlwaysAvailableVWC = useWritableValueWithCallbacks<number>(
    () => 0
  );
  useEffect(() => {
    if (padBottomVWC === undefined) {
      setVWC(padBottomAlwaysAvailableVWC, 0);
      return undefined;
    }

    return createValueWithCallbacksEffect(padBottomVWC, (padBottom) => {
      setVWC(padBottomAlwaysAvailableVWC, padBottom);
      return undefined;
    });
  }, [padBottomVWC, padBottomAlwaysAvailableVWC]);

  const width = useValueWithCallbacksLikeVWC(widthRaw);
  const containerRef = useWritableValueWithCallbacks<View | null>(() => null);
  const containerStyleVWC = useMappedValueWithCallbacks(
    width,
    (w): ViewStyle => ({
      ...styles.container,
      width: w,
    })
  );
  useStyleVWC(containerRef, containerStyleVWC);

  return (
    <>
      <Pressable onPress={onClick}>
        <RenderGuardedComponent
          props={separatorVWC}
          component={(separator) => {
            if (!separator) {
              return <></>;
            }

            return (
              <RenderGuardedComponent
                props={itemVWC}
                component={(item) => {
                  if (item.lastTakenAt === null) {
                    return <></>;
                  }

                  return (
                    <Text style={styles.separator}>
                      {item.lastTakenAt.toLocaleDateString()}
                    </Text>
                  );
                }}
              />
            );
          }}
        />
        <View
          style={containerStyleVWC.get()}
          ref={(r) => setVWC(containerRef, r)}
        >
          <View style={styles.titleAndInstructor}>
            <RenderGuardedComponent
              props={ellipsedTitle}
              component={(t) => <Text style={styles.title}>{t}</Text>}
            />
            <View style={styles.instructor}>
              <View style={styles.instructorPictureContainer}>
                <OsehImageFromStateValueWithCallbacks
                  state={instructorImageVWC}
                />
              </View>
              <RenderGuardedComponent
                props={instructorName}
                component={(n) => (
                  <Text style={styles.instructorName}>{n}</Text>
                )}
              />
            </View>
          </View>
          <View style={styles.favoritedContainer}>
            <RenderGuardedComponent
              props={likingVWC}
              component={(liking) =>
                liking ? (
                  <View
                    style={Object.assign(
                      {},
                      styles.favoritedPressable,
                      isTablet ? styles.favoritedPressableTablet : undefined
                    )}
                  >
                    <InlineOsehSpinner
                      size={{ type: 'react-rerender', props: { height: 24 } }}
                      variant="white"
                    />
                  </View>
                ) : (
                  <RenderGuardedComponent
                    props={favorited}
                    component={(favorited) => (
                      <Pressable
                        onPress={onToggleFavorited}
                        style={Object.assign(
                          {},
                          styles.favoritedPressable,
                          isTablet ? styles.favoritedPressableTablet : undefined
                        )}
                      >
                        {favorited ? <FullHeartIcon /> : <EmptyHeartIcon />}
                      </Pressable>
                    )}
                  />
                )
              }
            />
          </View>
          <RenderGuardedComponent
            props={errorVWC}
            component={(error) => <>{error}</>}
          />
        </View>
      </Pressable>
      <RenderGuardedComponent
        props={padBottomAlwaysAvailableVWC}
        component={(height) => <VerticalSpacer height={height} />}
      />
    </>
  );
};
