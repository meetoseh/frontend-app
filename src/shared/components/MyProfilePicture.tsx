import { ReactElement, useContext } from "react";
import { LoginContext } from "../contexts/LoginContext";
import { OsehImageStateRequestHandler } from "../images/useOsehImageStateRequestHandler";
import { useMyProfilePictureState } from "../hooks/useMyProfilePicture";
import { OsehImageFromState } from "../images/OsehImageFromState";
import { ImageStyle, StyleProp } from "react-native";

type MyProfilePictureProps = {
  /**
   * Desired display width
   * @default 60
   */
  displayWidth?: number;

  /**
   * Desired display height
   * @default 60
   */
  displayHeight?: number;

  /**
   * The handler to use for loading images
   */
  imageHandler: OsehImageStateRequestHandler;

  /**
   * Additional styles to apply to the image. Should not include a width
   * or height, as these are set by the image state.
   */
  style?: StyleProp<ImageStyle>;
};

/**
 * Shows the users profile picture as a 60x60 image. Requires a login
 * context. Returns an empty fragment if the user doesn't have a profile
 * picture.
 */
export const MyProfilePicture = ({
  displayWidth = 60,
  displayHeight = 60,
  imageHandler,
  style,
}: MyProfilePictureProps): ReactElement => {
  const loginContext = useContext(LoginContext);
  const profileImage = useMyProfilePictureState({
    loginContext,
    displayWidth,
    displayHeight,
    handler: imageHandler,
  });

  return (
    <>
      {profileImage.state === "available" && (
        <OsehImageFromState state={profileImage.image} style={style} />
      )}
    </>
  );
};
