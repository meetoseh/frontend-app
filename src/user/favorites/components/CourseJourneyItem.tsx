import { useContext } from "react";
import { styles } from "./CourseJourneyItemStyles";
import { LoginContext } from "../../../shared/contexts/LoginContext";
import { textOverflowEllipses } from "../../../shared/lib/calculateKerningLength";
import { OsehImageStateRequestHandler } from "../../../shared/images/useOsehImageStateRequestHandler";
import { MinimalCourseJourney } from "../lib/MinimalCourseJourney";
import { useOsehImageStateValueWithCallbacks } from "../../../shared/images/useOsehImageStateValueWithCallbacks";
import { useToggleFavorited } from "../../journey/hooks/useToggleFavorited";
import { useMappedValueWithCallbacks } from "../../../shared/hooks/useMappedValueWithCallbacks";
import {
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from "../../../shared/lib/Callbacks";
import { OsehImageFromStateValueWithCallbacks } from "../../../shared/images/OsehImageFromStateValueWithCallbacks";
import { RenderGuardedComponent } from "../../../shared/components/RenderGuardedComponent";
import { ModalContext } from "../../../shared/contexts/ModalContext";
import { adaptValueWithCallbacksAsVariableStrategyProps } from "../../../shared/lib/adaptValueWithCallbacksAsVariableStrategyProps";
import { Pressable, View, Text } from "react-native";
import CourseJourneyItemCheck from "../icons/CourseJourneyItemCheck";
import { InlineOsehSpinner } from "../../../shared/components/InlineOsehSpinner";
import FullHeartIcon from "../../journey/icons/FullHeartIcon";
import EmptyHeartIcon from "../../journey/icons/EmptyHeartIcon";

type HistoryItemProps = {
  /**
   * The item to render
   */
  item: ValueWithCallbacks<MinimalCourseJourney>;

  /**
   * If the user modifies the item, i.e., by favoriting/unfavoriting it,
   * the callback to update the item. This is called after the change is
   * already stored serverside.
   *
   * @param item The new item
   */
  setItem: (item: MinimalCourseJourney) => void;

  /**
   * A function which can be used to map all items to a new item. Used for
   * when the user performs an action that will impact items besides this
   * one, e.g., downloading this item will cause its isNext to be false,
   * and the next journey's isNext to be true.
   *
   * @param fn The function to apply to each item
   */
  mapItems: (fn: (item: MinimalCourseJourney) => MinimalCourseJourney) => void;

  /**
   * If true, a separator indicating the name of the course will be shown
   * above the block.
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
 * Renders a purchased journey for the courses / "Owned" tab, which they
 * may not have taken before.
 */
export const CourseJourneyItem = ({
  item: itemVWC,
  setItem,
  mapItems,
  separator: separatorVWC,
  onClick,
  instructorImages,
}: HistoryItemProps) => {
  const loginContext = useContext(LoginContext);
  const modalContext = useContext(ModalContext);
  const instructorImageVWC = useOsehImageStateValueWithCallbacks(
    adaptValueWithCallbacksAsVariableStrategyProps(
      useMappedValueWithCallbacks(
        itemVWC,
        (item) => ({
          ...item.journey.instructor.image,
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

  const likingVWC = useWritableValueWithCallbacks<boolean>(() => false);
  const onToggleFavorited = useToggleFavorited({
    modals: modalContext.modals,
    journey: adaptValueWithCallbacksAsVariableStrategyProps(
      useMappedValueWithCallbacks(itemVWC, (item) => item.journey)
    ),
    shared: useMappedValueWithCallbacks(itemVWC, (item) => ({
      favorited: item.journey.likedAt !== null,
      setFavorited: (favorited: boolean) => {
        setItem({
          ...item,
          journey: {
            ...item.journey,
            likedAt: favorited ? new Date() : null,
          },
        });
      },
    })),
    knownUnfavoritable: adaptValueWithCallbacksAsVariableStrategyProps(
      useMappedValueWithCallbacks(
        itemVWC,
        (item) => item.journey.lastTakenAt === null
      )
    ),
    working: likingVWC,
  });

  const ellipsedTitle = useMappedValueWithCallbacks(itemVWC, (item) =>
    textOverflowEllipses(item.journey.title, 15)
  );
  const takenVWC = useMappedValueWithCallbacks(
    itemVWC,
    (item) => item.journey.lastTakenAt !== null
  );
  const instructorName = useMappedValueWithCallbacks(
    itemVWC,
    (item) => item.journey.instructor.name
  );
  const favorited = useMappedValueWithCallbacks(
    itemVWC,
    (item) => item.journey.likedAt !== null
  );

  return (
    <Pressable onPress={onClick} style={styles.outerContainer}>
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
                return (
                  <Text style={styles.separator}>{item.course.title}</Text>
                );
              }}
            />
          );
        }}
      />
      <View style={styles.container}>
        <RenderGuardedComponent
          props={takenVWC}
          component={(taken) =>
            taken ? (
              <View style={styles.checkContainer}>
                <CourseJourneyItemCheck />
              </View>
            ) : (
              <></>
            )
          }
        />
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
        <View style={styles.favoriteAndDownloadContainer}>
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
        </View>
      </View>
    </Pressable>
  );
};
