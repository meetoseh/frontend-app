import { ReactElement, useCallback, useContext, useMemo } from "react";
import { FeatureComponentProps } from "../../models/Feature";
import { GoalDaysPerWeekState } from "./GoalDaysPerWeekState";
import { GoalDaysPerWeekResources } from "./GoalDaysPerWeekResources";
import {
  styles,
  buttonStyles,
  activeButtonStyles,
} from "./GoalDaysPerWeekStyles";
import { useStartSession } from "../../../../shared/hooks/useInappNotificationSession";
import { LoginContext } from "../../../../shared/contexts/LoginContext";
import {
  InterestsContext,
  InterestsContextValue,
} from "../../../../shared/contexts/InterestsContext";
import {
  ValueWithCallbacks,
  WritableValueWithCallbacks,
  createWritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from "../../../../shared/lib/Callbacks";
import { setVWC } from "../../../../shared/lib/setVWC";
import { OsehImageFromStateValueWithCallbacks } from "../../../../shared/images/OsehImageFromStateValueWithCallbacks";
import { useMappedValueWithCallbacks } from "../../../../shared/hooks/useMappedValueWithCallbacks";
import { RenderGuardedComponent } from "../../../../shared/components/RenderGuardedComponent";
import { useErrorModal } from "../../../../shared/hooks/useErrorModal";
import { ModalContext, Modals } from "../../../../shared/contexts/ModalContext";
import { apiFetch } from "../../../../shared/lib/apiFetch";
import { describeError } from "../../../../shared/lib/describeError";
import { View, Text, TextStyle, StyleProp } from "react-native";
import { OsehImageBackgroundFromStateValueWithCallbacks } from "../../../../shared/images/OsehImageBackgroundFromStateValueWithCallbacks";
import { StatusBar } from "expo-status-bar";
import { FilledInvertedButton } from "../../../../shared/components/FilledInvertedButton";
import { FilledButton } from "../../../../shared/components/FilledButton";

export const GoalDaysPerWeek = ({
  state,
  resources,
}: FeatureComponentProps<
  GoalDaysPerWeekState,
  GoalDaysPerWeekResources
>): ReactElement => {
  useStartSession({
    type: "callbacks",
    props: () => resources.get().session,
    callbacks: resources.callbacks,
  });
  const loginContext = useContext(LoginContext);
  const interests = useContext(InterestsContext);
  const goal = useWritableValueWithCallbacks<number>(() => 3);
  const error = useWritableValueWithCallbacks<ReactElement | null>(() => null);

  const boundSetGoals = useMemo<(() => void)[]>(() => {
    return [1, 2, 3, 4, 5, 6, 7].map((i) => () => setVWC(goal, i));
  }, [goal]);

  const goalIsActive = useMemo<ValueWithCallbacks<boolean>[]>(() => {
    return [1, 2, 3, 4, 5, 6, 7].map((i) => {
      const result = createWritableValueWithCallbacks(goal.get() === i);
      goal.callbacks.add(() => setVWC(result, goal.get() === i));
      return result;
    });
  }, [goal]);

  const goalTextStyles = useMemo<
    WritableValueWithCallbacks<StyleProp<TextStyle>>[]
  >(
    () =>
      [1, 2, 3, 4, 5, 6, 7].map(() =>
        createWritableValueWithCallbacks<StyleProp<TextStyle>>(
          buttonStyles.text
        )
      ),
    []
  );

  const submitTextStyle = useWritableValueWithCallbacks<StyleProp<TextStyle>>(
    () => undefined
  );
  const updateSubmitTextStyle = useCallback(
    (style: StyleProp<TextStyle>) => {
      setVWC(submitTextStyle, style);
    },
    [submitTextStyle]
  );

  const onFinish = useCallback(async () => {
    const selected = goal.get();
    resources.get().session?.storeAction?.call(undefined, "set_goal", {
      days_per_week: selected,
    });
    state.get().ian?.onShown?.call(undefined, true);
    try {
      const response = await apiFetch(
        "/api/1/users/me/goal",
        {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            days_per_week: selected,
          }),
        },
        loginContext
      );

      if (!response.ok) {
        throw response;
      }

      resources.get().session?.reset?.call(undefined);
      state.get().ian?.onShown?.call(undefined);
    } catch (e) {
      const err = await describeError(e);
      setVWC(error, err);
    }
  }, [state, resources, error, goal, loginContext]);

  const title = useMemo(() => getTitle(interests), [interests]);
  const modals = useWritableValueWithCallbacks<Modals>(() => []);
  useErrorModal(modals, error, "Set Goal");

  return (
    <View style={styles.container}>
      <OsehImageBackgroundFromStateValueWithCallbacks
        state={useMappedValueWithCallbacks(resources, (r) => r.background)}
        style={styles.content}
      >
        <View style={styles.content}>
          {title}
          <View style={styles.days}>
            {boundSetGoals.map((setGoal, i) => (
              <RenderGuardedComponent
                key={i}
                props={goalIsActive[i]}
                component={(isActive) => (
                  <FilledButton
                    styles={isActive ? activeButtonStyles : buttonStyles}
                    spinnerVariant="white"
                    setTextStyle={(s) => setVWC(goalTextStyles[i], s)}
                    onPress={setGoal}
                  >
                    <RenderGuardedComponent
                      props={goalTextStyles[i]}
                      component={(style) => <Text style={style}>{i + 1}</Text>}
                    />
                  </FilledButton>
                )}
              />
            ))}
          </View>
          <View style={styles.submitContainer}>
            <FilledInvertedButton
              setTextStyle={updateSubmitTextStyle}
              fullWidth
              onPress={onFinish}
            >
              <RenderGuardedComponent
                props={submitTextStyle}
                component={(style) => <Text style={style}>Set Goal</Text>}
              />
            </FilledInvertedButton>
          </View>
        </View>
      </OsehImageBackgroundFromStateValueWithCallbacks>
      <StatusBar style="light" />
    </View>
  );
};

const Title = ({ children }: { children: string }): ReactElement => {
  return <Text style={styles.title}>{children}</Text>;
};

const getTitle = (interests: InterestsContextValue): ReactElement => {
  const defaultCopy = (
    <Title>
      Let&rsquo;s set a goal, how many days a week do you want to check-in?
    </Title>
  );

  if (interests.state !== "loaded") {
    return defaultCopy;
  } else if (interests.primaryInterest === "sleep") {
    return (
      <Title>
        Regular sleep starts with a regular schedule: how many days a week do
        you want to check-in?
      </Title>
    );
  } else {
    return defaultCopy;
  }
};
