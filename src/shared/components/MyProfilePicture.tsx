import { ReactElement, useContext } from 'react';
import { LoginContext } from '../contexts/LoginContext';
import { OsehImageStateRequestHandler } from '../images/useOsehImageStateRequestHandler';
import {
  useMyProfilePictureState,
  useMyProfilePictureStateValueWithCallbacks,
} from '../hooks/useMyProfilePicture';
import { OsehImageFromState } from '../images/OsehImageFromState';
import { ImageStyle, StyleProp } from 'react-native';
import { useMappedValueWithCallbacks } from '../hooks/useMappedValueWithCallbacks';
import { RenderGuardedComponent } from './RenderGuardedComponent';

type MyProfilePictureProps = {
  /**
   * Desired display width
   * @default 45
   */
  displayWidth?: number;

  /**
   * Desired display height
   * @default 45
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
 * Shows the users profile picture as a 45x45 image. Requires a login
 * context. Returns an empty fragment if the user doesn't have a profile
 * picture.
 */
export const MyProfilePicture = ({
  displayWidth = 45,
  displayHeight = 45,
  imageHandler,
  style,
}: MyProfilePictureProps): ReactElement => {
  const loginContextRaw = useContext(LoginContext);
  const profileImageProps = useMappedValueWithCallbacks(
    loginContextRaw.value,
    (loginRaw) => ({
      loginContext: loginRaw.state === 'logged-in' ? loginRaw : null,
      displayWidth,
      displayHeight,
      handler: imageHandler,
    })
  );
  const profileImageVWC = useMyProfilePictureStateValueWithCallbacks({
    type: 'callbacks',
    props: () => profileImageProps.get(),
    callbacks: profileImageProps.callbacks,
  });

  return (
    <RenderGuardedComponent
      props={profileImageVWC}
      component={(profileImage) => {
        if (profileImage.state !== 'available') {
          return <></>;
        }
        return <OsehImageFromState state={profileImage.image} style={style} />;
      }}
    />
  );
};
