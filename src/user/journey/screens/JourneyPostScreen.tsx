import { ReactElement, useCallback, useContext, useEffect } from "react";
import { View, Text, StyleProp, TextStyle } from "react-native";
import { styles } from "./JourneyPostScreenStyles";
import { LoginContext } from "../../../shared/contexts/LoginContext";
import { JourneyScreenProps } from "../models/JourneyScreenProps";
import { RenderGuardedComponent } from "../../../shared/components/RenderGuardedComponent";
import { useMappedValueWithCallbacks } from "../../../shared/hooks/useMappedValueWithCallbacks";
import { useWritableValueWithCallbacks } from "../../../shared/lib/Callbacks";
import { setVWC } from "../../../shared/lib/setVWC";
import { useToggleFavorited } from "../hooks/useToggleFavorited";
import { InlineOsehSpinner } from "../../../shared/components/InlineOsehSpinner";
import { useErrorModal } from "../../../shared/hooks/useErrorModal";
import {
  ModalContext,
  Modals,
  ModalsOutlet,
} from "../../../shared/contexts/ModalContext";
import { useWindowSize } from "../../../shared/hooks/useWindowSize";
import { useTopBarHeight } from "../../../shared/hooks/useTopBarHeight";
import { apiFetch } from "../../../shared/lib/apiFetch";
import { OsehImageBackgroundFromStateValueWithCallbacks } from "../../../shared/images/OsehImageBackgroundFromStateValueWithCallbacks";
import { CloseButton } from "../../../shared/components/CloseButton";
import { StatusBar } from "expo-status-bar";
import { describeError } from "../../../shared/lib/describeError";
import CheckedFilledCircle from "../icons/CheckedFilledCircle";
import FilledCircle from "../icons/FilledCircle";
import { FilledInvertedButton } from "../../../shared/components/FilledInvertedButton";
import { useStateCompat } from "../../../shared/hooks/useStateCompat";
import FullHeartIcon from "../icons/FullHeartIcon";
import EmptyHeartIcon from "../icons/EmptyHeartIcon";
import { LinkButton } from "../../../shared/components/LinkButton";

type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";
const DAYS_OF_WEEK: DayOfWeek[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

type StreakInfo = {
  /**
   * The number of consecutive days the user has taken a class
   */
  streak: number;
  /**
   * The days of the week the user has taken a class
   */
  daysOfWeek: DayOfWeek[];
  /**
   * The number of days per week the user has taken a class
   */
  goalDaysPerWeek: number | null;
};

export const JourneyPostScreen = ({
  journey,
  shared,
  setScreen,
  onJourneyFinished,
  isOnboarding,
  classesTakenToday,
  overrideOnContinue,
}: JourneyScreenProps & {
  /**
   * The number of classes the user has taken this session, used to
   * personalize the goal message in some cases
   */
  classesTakenToday?: number;

  /**
   * Normally the cta button will call onJourneyFinished, which is the
   * same function that's called if the user clicks the X or uses any
   * other method to close the screen. If this prop is specified, instead
   * the cta button will call this function.
   */
  overrideOnContinue?: () => void;
}): ReactElement => {
  const loginContext = useContext(LoginContext);
  const errorVWC = useWritableValueWithCallbacks<ReactElement | null>(
    () => null
  );
  const streakVWC = useWritableValueWithCallbacks<StreakInfo | null>(
    () => null
  );

  useEffect(() => {
    if (loginContext.state !== "logged-in") {
      return;
    }

    let active = true;
    fetchStreak();
    return () => {
      active = false;
    };

    async function fetchStreak() {
      setVWC(errorVWC, null);
      try {
        const response = await apiFetch(
          "/api/1/users/me/streak",
          {
            method: "GET",
          },
          loginContext
        );
        if (!active) {
          return;
        }
        if (!response.ok) {
          throw response;
        }
        const data: {
          streak: number;
          days_of_week: DayOfWeek[];
          goal_days_per_week: number | null;
        } = await response.json();
        if (!active) {
          return;
        }
        setVWC(streakVWC, {
          streak: data.streak,
          daysOfWeek: data.days_of_week,
          goalDaysPerWeek: data.goal_days_per_week,
        });
      } catch (e) {
        if (!active) {
          return;
        }
        const err = await describeError(e);
        if (!active) {
          return;
        }
        setVWC(errorVWC, err);
      }
    }
  }, [loginContext, errorVWC, streakVWC]);

  const onContinue = useCallback(() => {
    if (overrideOnContinue) {
      overrideOnContinue();
    } else {
      onJourneyFinished(true);
    }
  }, [onJourneyFinished, overrideOnContinue]);

  const onCloseClick = useCallback(() => {
    onJourneyFinished(true);
  }, [onJourneyFinished]);

  const modals = useWritableValueWithCallbacks<Modals>(() => []);
  const onToggleFavorited = useToggleFavorited({
    modals,
    journey: { type: "react-rerender", props: journey },
    shared,
  });

  const blurredImage = useMappedValueWithCallbacks(
    shared,
    (s) => s.blurredImage
  );

  const userIdentifier = (() => {
    if (
      loginContext.userAttributes === null ||
      loginContext.userAttributes.givenName === "Anonymous"
    ) {
      return null;
    }

    return loginContext.userAttributes.givenName;
  })();

  const titleVWC = useMappedValueWithCallbacks(
    streakVWC,
    useCallback(
      (streak): ReactElement => {
        if (streak === null) {
          return (
            <InlineOsehSpinner
              size={{ type: "react-rerender", props: { height: 24 } }}
            />
          );
        }

        if (isOnboarding) {
          return (
            <Text style={styles.titleText}>
              {userIdentifier ? `${userIdentifier}, h` : "H"}igh-five on your
              first class!
            </Text>
          );
        }

        if (streak.streak === 1) {
          if (classesTakenToday === 3) {
            return (
              <Text style={styles.titleText}>
                Fantastic work{userIdentifier ? `, ${userIdentifier}` : ""}
                &#8212;but you don&rsquo;t need to do it all today!
              </Text>
            );
          }
          return (
            <Text style={styles.titleText}>
              {userIdentifier ? `${userIdentifier}, h` : "H"}igh-five on your
              new streak!
            </Text>
          );
        }

        if (streak.streak === 2) {
          return (
            <Text style={styles.titleText}>
              Lift-off{userIdentifier ? `, ${userIdentifier}` : ""} 🚀 Keep it
              up!
            </Text>
          );
        }

        if (streak.streak === 3) {
          return (
            <Text style={styles.titleText}>
              Congratulations on making it to day {streak.streak}
              {userIdentifier ? `, ${userIdentifier}` : ""}!
            </Text>
          );
        }

        if (
          streak.streak === 5 &&
          streak.daysOfWeek.includes("Monday") &&
          streak.daysOfWeek.includes("Friday")
        ) {
          return (
            <Text style={styles.titleText}>
              A clean streak this week
              {userIdentifier ? `, ${userIdentifier}` : ""}! 🎉
            </Text>
          );
        }

        if (streak.streak < 7) {
          return (
            <Text style={styles.titleText}>
              {userIdentifier}, you&rsquo;re on a roll!
            </Text>
          );
        }

        if (streak.streak === 7) {
          return (
            <Text style={styles.titleText}>
              A full week&#8212;exceptional work
              {userIdentifier ? `, ${userIdentifier}!` : "!"} 😎
            </Text>
          );
        }

        if ([30, 50, 100, 200, 365, 500, 1000].includes(streak.streak)) {
          return (
            <Text style={styles.titleText}>
              You&rsquo;re on fire{userIdentifier ? `, ${userIdentifier}` : ""}{" "}
              🔥
            </Text>
          );
        }

        return (
          <Text style={styles.titleText}>
            {userIdentifier ? `${userIdentifier}, h` : "H"}igh-five on your new
            streak!
          </Text>
        );
      },
      [isOnboarding, userIdentifier, classesTakenToday]
    )
  );

  const goalTextVWC = useMappedValueWithCallbacks(
    streakVWC,
    useCallback((streak): ReactElement | null => {
      if (streak === null) {
        return (
          <InlineOsehSpinner
            size={{ type: "react-rerender", props: { height: 14 } }}
          />
        );
      }

      if (streak.goalDaysPerWeek === null) {
        return null;
      }

      const goal = streak.goalDaysPerWeek;
      const daysSoFar = streak.daysOfWeek.length;
      const curDayOfWeek = new Date().toLocaleDateString("en-US", {
        weekday: "long",
      }) as DayOfWeek;
      const curDayOfWeekIdx = DAYS_OF_WEEK.indexOf(curDayOfWeek);
      const remainingNumDays = 6 - curDayOfWeekIdx;

      const numToName = [
        "zero",
        "one",
        "two",
        "three",
        "four",
        "five",
        "six",
        "seven",
      ];

      if (daysSoFar < goal && daysSoFar + remainingNumDays >= goal) {
        return (
          <Text style={styles.goalTextText}>
            You&rsquo;ve practiced {numToName[daysSoFar]} day
            {daysSoFar === 1 ? "" : "s"} so far this week&#8212;you can still
            make your goal of {goal}&nbsp;day{goal === 1 ? "" : "s"}&nbsp;👏
          </Text>
        );
      }

      if (daysSoFar === goal) {
        return (
          <Text style={styles.goalTextText}>
            You&rsquo;ve reached your goal of {goal}&nbsp;day
            {goal === 1 ? "" : "s"}
            this&nbsp;week!&nbsp;🎉
          </Text>
        );
      }

      if (daysSoFar > goal) {
        return (
          <Text style={styles.goalTextText}>
            You&rsquo;ve exceeded your goal of {goal}&nbsp;day
            {goal === 1 ? "" : "s"}
            !&nbsp;🏅
          </Text>
        );
      }

      return null;
    }, [])
  );

  const completedDaysSetVWC = useMappedValueWithCallbacks(
    streakVWC,
    (streak) => {
      return new Set(streak?.daysOfWeek ?? []);
    }
  );

  useErrorModal(modals, errorVWC, "JourneyPostScreen streak");

  const screenSize = useWindowSize();
  const topBarHeight = useTopBarHeight();
  const innerWidth = Math.min(screenSize.width, styles.content.maxWidth) - 64;

  return (
    <View style={styles.container}>
      <OsehImageBackgroundFromStateValueWithCallbacks
        state={useMappedValueWithCallbacks(shared, (s) => s.blurredImage)}
        style={{ ...styles.innerContainer, height: screenSize.height }}
      >
        <CloseButton onPress={onCloseClick} />
        <View
          style={{
            ...styles.content,
            paddingTop: styles.content.paddingTop + topBarHeight,
            width: screenSize.width,
          }}
        >
          <View style={styles.topSpacer} />
          <RenderGuardedComponent
            props={titleVWC}
            component={(title) => <View style={styles.title}>{title}</View>}
          />
          <RenderGuardedComponent
            props={streakVWC}
            component={(streak) => {
              if (streak === null) {
                return (
                  <InlineOsehSpinner
                    size={{ type: "react-rerender", props: { height: 100 } }}
                  />
                );
              }
              return (
                <Text style={styles.streakNumber}>
                  {streak.streak.toLocaleString(undefined, {
                    useGrouping: true,
                  })}
                </Text>
              );
            }}
          />
          <Text style={styles.streakUnit}>day streak</Text>
          <View style={styles.weekdays}>
            {DAYS_OF_WEEK.map((day, i) => {
              return (
                <RenderGuardedComponent
                  key={day}
                  props={completedDaysSetVWC}
                  component={(completedDaysSet) => (
                    <View
                      style={{
                        ...styles.weekday,
                        ...(i < DAYS_OF_WEEK.length - 1
                          ? styles.weekdayNotLastChild
                          : {}),
                      }}
                    >
                      {completedDaysSet.has(day) ? (
                        <CheckedFilledCircle />
                      ) : (
                        <FilledCircle />
                      )}
                      <Text style={styles.weekdayLabel}>
                        {day.substring(0, 3)}
                      </Text>
                    </View>
                  )}
                />
              );
            })}
          </View>
          <RenderGuardedComponent
            props={goalTextVWC}
            component={(goalText) => (
              <>
                {goalText && (
                  <View style={{ ...styles.goal, width: innerWidth }}>
                    {goalText}
                  </View>
                )}
              </>
            )}
          />
          <ContinueButton onPress={onContinue} />
          <RenderGuardedComponent
            props={shared}
            component={(s) => (
              <ToggleFavoriteButton
                favorited={s.favorited}
                onPress={onToggleFavorited}
              />
            )}
          />
        </View>
        <ModalsOutlet modals={modals} />
      </OsehImageBackgroundFromStateValueWithCallbacks>
      <StatusBar style="light" />
    </View>
  );
};

const ContinueButton = ({ onPress }: { onPress: () => void }) => {
  const [textStyle, setTextStyle] =
    useStateCompat<StyleProp<TextStyle>>(undefined);

  return (
    <FilledInvertedButton
      onPress={onPress}
      setTextStyle={setTextStyle}
      fullWidth
      marginTop={36}
    >
      <Text style={textStyle}>Continue</Text>
    </FilledInvertedButton>
  );
};

const ToggleFavoriteButton = ({
  favorited,
  onPress,
}: {
  favorited: boolean | null;
  onPress: () => void;
}) => {
  const [textStyle, setTextStyle] =
    useStateCompat<StyleProp<TextStyle>>(undefined);
  const icon =
    favorited === null ? (
      <InlineOsehSpinner
        size={{ type: "react-rerender", props: { height: 24 } }}
      />
    ) : favorited ? (
      <FullHeartIcon />
    ) : (
      <EmptyHeartIcon />
    );

  return (
    <LinkButton
      onPress={onPress}
      setTextStyle={setTextStyle}
      fullWidth
      marginTop={24}
    >
      <View style={styles.favoriteButtonIcon}>{icon}</View>
      <Text style={textStyle}>
        {favorited ? "Remove from favorites" : "Add to favorites"}
      </Text>
    </LinkButton>
  );
};
