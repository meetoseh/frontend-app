import { ReactElement } from "react";
import { ValueWithCallbacks } from "../../../shared/lib/Callbacks";
import { kFormatter } from "../../../shared/lib/kFormatter";
import { OsehImageState } from "../../../shared/images/OsehImageState";
import { ProfilePicturesState } from "../hooks/useProfilePictures";
import { styles } from "./ProfilePicturesStyles";
import { useMappedValueWithCallbacks } from "../../../shared/hooks/useMappedValueWithCallbacks";
import { RenderGuardedComponent } from "../../../shared/components/RenderGuardedComponent";
import { useUnwrappedValueWithCallbacks } from "../../../shared/hooks/useUnwrappedValueWithCallbacks";
import { View, Text } from "react-native";
import { OsehImageFromState } from "../../../shared/images/OsehImageFromState";

export type HereSettings =
  | {
      type: "filled";
      action: string;
    }
  | {
      type: "floating";
      action: string;
    };

/**
 * Displays profile pictures from the given state ref.
 */
export const ProfilePictures = ({
  profilePictures,
  hereSettings,
}: {
  profilePictures: ValueWithCallbacks<ProfilePicturesState>;
  hereSettings?: HereSettings;
}) => {
  const trueHereSettings: HereSettings =
    hereSettings === undefined
      ? { type: "filled", action: "here" }
      : hereSettings;

  const numPictures = useUnwrappedValueWithCallbacks(
    useMappedValueWithCallbacks(profilePictures, (pp) => pp.pictures.length)
  );

  const additionalUsersVWC = useMappedValueWithCallbacks(
    profilePictures,
    (pp) => Math.ceil(pp.additionalUsers)
  );

  return (
    <View style={styles.container}>
      {(() => {
        const result: ReactElement[] = [];
        for (let i = 0; i < numPictures; i++) {
          result.push(
            <RenderGuardedComponent
              key={i}
              props={profilePictures}
              component={(pics) => (
                <ProfilePictureSlot picture={pics.pictures[i]} />
              )}
            />
          );
        }
        return result;
      })()}
      <RenderGuardedComponent
        props={additionalUsersVWC}
        component={(approxAmount) => {
          const textContent = `+${kFormatter(approxAmount)} ${
            trueHereSettings.action
          }`;

          const type = trueHereSettings.type;
          if (type === "filled") {
            return (
              <View style={styles.hereSettingsFilledContainer}>
                <Text style={styles.hereSettingsFilledText}>{textContent}</Text>
              </View>
            );
          } else if (type === "floating") {
            return (
              <Text style={styles.hereSettingsFloatingText}>{textContent}</Text>
            );
          }

          ((t: never) => {
            throw new Error(`Unknown hereSettings type ${t}`);
          })(type);
        }}
      />
    </View>
  );
};

const ProfilePictureSlot = ({ picture }: { picture?: OsehImageState }) => {
  if (picture === undefined || picture.loading) {
    return <></>;
  }
  return (
    <View style={styles.pictureContainer}>
      {picture !== undefined && (
        <OsehImageFromState state={picture} style={styles.picture} />
      )}
    </View>
  );
};
