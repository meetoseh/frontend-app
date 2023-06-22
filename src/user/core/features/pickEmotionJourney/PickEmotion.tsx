import { ReactElement, useContext } from "react";
import { Text, View } from "react-native";
import { FeatureComponentProps } from "../../models/Feature";
import { PickEmotionJourneyResources } from "./PickEmotionJourneyResources";
import { PickEmotionJourneyState } from "./PickEmotionJourneyState";
import { styles } from "./PickEmotionStyles";
import { OsehImageBackgroundFromState } from "../../../../shared/images/OsehImageBackgroundFromState";
import { OsehImageFromState } from "../../../../shared/images/OsehImageFromState";
import { LoginContext } from "../../../../shared/contexts/LoginContext";
import EmptyHeart from "./icons/EmptyHeart";

/**
 * Allows the user to pick an emotion and then go to that class
 */
export const PickEmotion = ({
  resources,
}: FeatureComponentProps<
  PickEmotionJourneyState,
  PickEmotionJourneyResources
> & {
  gotoJourney: () => void;
}): ReactElement => {
  const loginContext = useContext(LoginContext);
  return (
    <View style={styles.container}>
      {resources.error}
      <OsehImageBackgroundFromState
        state={resources.background}
        style={styles.content}
      >
        <View style={styles.topNav}>
          <View style={styles.settingsLink}>
            {resources.profilePicture.state === "available" && (
              <OsehImageFromState
                state={resources.profilePicture.image}
                style={styles.profilePic}
              />
            )}
            <View style={styles.settingsMessages}>
              <Text style={styles.greeting}>
                Hi {loginContext.userAttributes?.givenName ?? "there"} 👋
              </Text>
              <Text style={styles.greetingAction}>Daily Check-in</Text>
            </View>
          </View>
          <View style={styles.favoritesLink}>
            <EmptyHeart />
            <Text style={styles.favoritesLinkText}> Favorites</Text>
          </View>
        </View>
      </OsehImageBackgroundFromState>
    </View>
  );
};
