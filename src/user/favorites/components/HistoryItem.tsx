import { ReactElement, useContext } from "react";
import { Pressable, Text, View } from "react-native";
import { MinimalJourney } from "../lib/MinimalJourney";
import { styles } from "./HistoryItemStyles";
import { useFavoritedModal } from "../hooks/useFavoritedModal";
import { useUnfavoritedModal } from "../hooks/useUnfavoritedModal";
import { textOverflowEllipses } from "../../../shared/lib/calculateKerningLength";
import { OsehImageStateRequestHandler } from "../../../shared/images/useOsehImageStateRequestHandler";
import {
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from "../../../shared/lib/Callbacks";
import { adaptValueWithCallbacksAsVariableStrategyProps } from "../../../shared/lib/adaptValueWithCallbacksAsVariableStrategyProps";
import { RenderGuardedComponent } from "../../../shared/components/RenderGuardedComponent";
import { useOsehImageStateValueWithCallbacks } from "../../../shared/images/useOsehImageStateValueWithCallbacks";
import { OsehImageFromStateValueWithCallbacks } from "../../../shared/images/OsehImageFromStateValueWithCallbacks";
import { InlineOsehSpinner } from "../../../shared/components/InlineOsehSpinner";
import { useToggleFavorited } from "../../journey/hooks/useToggleFavorited";
import { useMappedValueWithCallbacks } from "../../../shared/hooks/useMappedValueWithCallbacks";
import { ModalContext } from "../../../shared/contexts/ModalContext";
import FullHeartIcon from "../../journey/icons/FullHeartIcon";
import EmptyHeartIcon from "../../journey/icons/EmptyHeartIcon";
import { useWindowSize } from "../../../shared/hooks/useWindowSize";

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
          alt: "profile",
        }),
        {
          outputEqualityFn: (a, b) => a.uid === b.uid && a.jwt === b.jwt,
        }
      )
    ),
    instructorImages
  );
  const modalContext = useContext(ModalContext);
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
  });
  const onToggleFavorited = toggleFavorited;

  useFavoritedModal(
    adaptValueWithCallbacksAsVariableStrategyProps(showLikedUntilVWC),
    modalContext.modals
  );
  useUnfavoritedModal(
    adaptValueWithCallbacksAsVariableStrategyProps(showUnlikedUntilVWC),
    modalContext.modals
  );

  const ellipsedTitle = useMappedValueWithCallbacks(itemVWC, (item) =>
    textOverflowEllipses(item.title, 15)
  );
  const instructorName = useMappedValueWithCallbacks(
    itemVWC,
    (item) => item.instructor.name
  );
  const favorited = useMappedValueWithCallbacks(
    itemVWC,
    (item) => item.likedAt !== null
  );

  const windowSize = useWindowSize();

  return (
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
      <View style={{ ...styles.container, width: windowSize.width - 64 }}>
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
              component={(n) => <Text style={styles.instructorName}>{n}</Text>}
            />
          </View>
        </View>
        <View style={styles.favoritedContainer}>
          <RenderGuardedComponent
            props={likingVWC}
            component={(liking) =>
              liking ? (
                <InlineOsehSpinner
                  size={{ type: "react-rerender", props: { height: 24 } }}
                  variant="white"
                />
              ) : (
                <RenderGuardedComponent
                  props={favorited}
                  component={(favorited) => (
                    <Pressable onPress={onToggleFavorited}>
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
  );
};
