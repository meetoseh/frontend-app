import { ReactElement, useCallback } from "react";
import { Text, View } from "react-native";
import { FeatureComponentProps } from "../../models/Feature";
import { PickEmotionJourneyResources } from "./PickEmotionJourneyResources";
import { PickEmotionJourneyState } from "./PickEmotionJourneyState";
import { OsehImageBackgroundFromState } from "../../../../shared/images/OsehImageBackgroundFromState";
import { PickEmotion } from "./PickEmotion";

/**
 * The core screen where the user selects an emotion and the backend
 * uses that to select a journey
 */
export const PickEmotionJourney = ({
  state,
  resources,
  doAnticipateState,
}: FeatureComponentProps<
  PickEmotionJourneyState,
  PickEmotionJourneyResources
>): ReactElement => {
  const gotoJourney = useCallback(() => {}, []);

  return (
    <PickEmotion
      state={state}
      resources={resources}
      doAnticipateState={doAnticipateState}
      gotoJourney={gotoJourney}
    />
  );
};
