/* eslint-disable react-native/no-raw-text */
import { FeatureComponentProps } from "../../models/Feature";
import { SignupRewardResources } from "./SignupRewardResources";
import { styles } from "./SignupRewardStyles";
import {
  PropsWithChildren,
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { View, Text, StyleProp, TextStyle } from "react-native";
import { SignupRewardState } from "./SignupRewardState";
import { useStartSession } from "../../../../shared/hooks/useInappNotificationSession";
import {
  InterestsContext,
  InterestsContextValue,
} from "../../../../shared/contexts/InterestsContext";
import { StatusBar } from "expo-status-bar";
import { FullscreenView } from "../../../../shared/components/FullscreenView";
import Svg, { Line } from "react-native-svg";
import * as Colors from "../../../../styling/colors";
import Check from "./icons/Check";
import { OsehImageFromStateValueWithCallbacks } from "../../../../shared/images/OsehImageFromStateValueWithCallbacks";
import { useMappedValueWithCallbacks } from "../../../../shared/hooks/useMappedValueWithCallbacks";
import { useWritableValueWithCallbacks } from "../../../../shared/lib/Callbacks";
import { setVWC } from "../../../../shared/lib/setVWC";
import { RenderGuardedComponent } from "../../../../shared/components/RenderGuardedComponent";
import { FilledInvertedButton } from "../../../../shared/components/FilledInvertedButton";
import { useTimedValueWithCallbacks } from "../../../../shared/hooks/useTimedValue";
import { SvgLinearGradientBackground } from "../../../../shared/anim/SvgLinearGradientBackground";
import { useContentWidth } from "../../../../shared/lib/useContentWidth";

/**
 * Rewards the user for completing signup.
 */
export const SignupReward = ({
  state,
  resources,
}: FeatureComponentProps<SignupRewardState, SignupRewardResources>) => {
  const interests = useContext(InterestsContext);
  const clickBleedthroughProtection = useTimedValueWithCallbacks(
    true,
    false,
    1000
  );
  useStartSession({
    type: "callbacks",
    props: () => resources.get().session,
    callbacks: resources.callbacks,
  });

  const sentCustomizationEventRef = useRef<boolean>(false);
  useEffect(() => {
    if (sentCustomizationEventRef.current || interests.state !== "loaded") {
      return;
    }
    sentCustomizationEventRef.current = true;
    resources.get().session?.storeAction("customized", {
      interest: interests.primaryInterest,
    });
  }, [interests, resources]);

  const onFinish = useCallback(() => {
    if (clickBleedthroughProtection.get()) {
      return;
    }

    resources.get().session?.storeAction?.call(undefined, "next", null);
    resources.get().session?.reset?.call(undefined);
    state.get().ian?.onShown?.call(undefined);
  }, [state, resources, clickBleedthroughProtection]);

  const checklistItems = useMemo(
    (): ReactElement[] => getChecklistItems(interests),
    [interests]
  );
  const title = useMemo((): ReactElement => getTitle(interests), [interests]);

  const submitTextStyleWVWC = useWritableValueWithCallbacks<
    StyleProp<TextStyle>
  >(() => undefined);
  const updateSubmitTextStyle = useCallback(
    (style: StyleProp<TextStyle>) => {
      setVWC(submitTextStyleWVWC, style);
    },
    [submitTextStyleWVWC]
  );

  const contentWidth = useContentWidth();

  return (
    <View style={styles.container}>
      <SvgLinearGradientBackground
        state={{
          type: "react-rerender",
          props: Colors.STANDARD_BLACK_GRAY_GRADIENT_SVG,
        }}
      >
        <FullscreenView style={styles.background}>
          <View style={{ ...styles.content, width: contentWidth }}>
            {title}
            <Svg
              width={contentWidth}
              height={1}
              viewBox={`0 0 ${contentWidth} 1`}
            >
              <Line
                x1={0.5}
                y1={0.5}
                x2={contentWidth - 0.5}
                y2={0.5}
                stroke={Colors.WHITE}
                strokeWidth={1}
                strokeLinecap="round"
              />
            </Svg>
            <View style={styles.checklist}>
              {checklistItems.map((item, idx) => (
                <View style={styles.checklistItemContainer} key={idx}>
                  <Check />
                  {item}
                </View>
              ))}
            </View>
            <View style={styles.bannerContainer}>
              <OsehImageFromStateValueWithCallbacks
                state={useMappedValueWithCallbacks(resources, (r) => r.image)}
              />
            </View>
            <View
              style={{
                ...styles.submitContainer,
                width: contentWidth,
              }}
            >
              <FilledInvertedButton
                setTextStyle={updateSubmitTextStyle}
                onPress={onFinish}
              >
                <RenderGuardedComponent
                  props={submitTextStyleWVWC}
                  component={(submitTextStyle) => (
                    <Text style={submitTextStyle}>Next</Text>
                  )}
                />
              </FilledInvertedButton>
            </View>
          </View>
        </FullscreenView>
      </SvgLinearGradientBackground>
      <StatusBar style="light" />
    </View>
  );
};

const TitleContainer = ({
  children,
}: PropsWithChildren<object>): ReactElement => {
  return <Text style={styles.titleContainer}>{children}</Text>;
};
const Title = ({ children }: { children: string }): ReactElement => (
  <Text style={styles.title}>{children}</Text>
);
const TitleEM = ({ children }: { children: string }): ReactElement => (
  <Text style={styles.titleEM}>{children}</Text>
);

const ChecklistItem = ({ children }: { children: string }): ReactElement => (
  <Text style={styles.checklistItem}>{children}</Text>
);

const getTitle = (interests: InterestsContextValue): ReactElement => {
  const defaultCopy = (
    <TitleContainer>
      <Title>We are here to help you feel your best&#8212;</Title>
      <TitleEM>everyday</TitleEM>
    </TitleContainer>
  );

  if (interests.state !== "loaded") {
    return defaultCopy;
  } else if (interests.primaryInterest === "sleep") {
    return (
      <TitleContainer>
        <Title>We are here to help you sleep&#8212;</Title>
        <TitleEM>everyday</TitleEM>
      </TitleContainer>
    );
  } else {
    return defaultCopy;
  }
};

const getChecklistItems = (
  interests: InterestsContextValue
): ReactElement[] => {
  const result = [
    <ChecklistItem key="1">Classes for every mood</ChecklistItem>,
    <ChecklistItem key="2">Daily check-ins</ChecklistItem>,
    <ChecklistItem key="3">Bite-sized to fit your schedule</ChecklistItem>,
  ];

  if (interests.state !== "loaded") {
    return result;
  }

  if (interests.primaryInterest === "anxiety") {
    result[0] = <ChecklistItem key="1">Variety of unique themes</ChecklistItem>;
  } else if (interests.primaryInterest === "sleep") {
    result[0] = (
      <ChecklistItem key="1">Classes to induce any dream</ChecklistItem>
    );
  } else if (interests.primaryInterest === "isaiah-course") {
    result[0] = (
      <ChecklistItem key="1">Access to Isaiah&rsquo;s Course</ChecklistItem>
    );
    result[1] = (
      <ChecklistItem key="2">100s of other classes for any mood</ChecklistItem>
    );
    result[2] = (
      <ChecklistItem key="3">Reminders to keep you motivated</ChecklistItem>
    );
  }
  return result;
};
