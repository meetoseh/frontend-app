import { ReactElement } from 'react';
import { ValueWithCallbacks } from '../../../shared/lib/Callbacks';
import { kFormatter } from '../../../shared/lib/kFormatter';
import { OsehImageState } from '../../../shared/images/OsehImageState';
import { ProfilePicturesState } from '../hooks/useProfilePictures';
import { styles } from './ProfilePicturesStyles';
import { useMappedValueWithCallbacks } from '../../../shared/hooks/useMappedValueWithCallbacks';
import { RenderGuardedComponent } from '../../../shared/components/RenderGuardedComponent';
import { useUnwrappedValueWithCallbacks } from '../../../shared/hooks/useUnwrappedValueWithCallbacks';
import { View, Text } from 'react-native';
import { OsehImageFromState } from '../../../shared/images/OsehImageFromState';
import { useIsEffectivelyTinyScreen } from '../../../shared/hooks/useIsEffectivelyTinyScreen';

export type HereSettings =
  | {
      type: 'filled';
      action: string;
    }
  | {
      type: 'floating';
      action: string;
    }
  | {
      type: 'none';
      action?: undefined;
    };

/**
 * Displays profile pictures from the given state ref.
 */
export const ProfilePictures = ({
  profilePictures,
  hereSettings,
  center,
  size: sizeRaw,
}: {
  profilePictures: ValueWithCallbacks<ProfilePicturesState>;
  center?: boolean;
  hereSettings?: HereSettings;
  size?: number;
}) => {
  const size = sizeRaw ?? 38;
  const trueHereSettings: HereSettings =
    hereSettings === undefined
      ? { type: 'filled', action: 'here' }
      : hereSettings;

  const numPictures = useUnwrappedValueWithCallbacks(
    useMappedValueWithCallbacks(profilePictures, (pp) => pp.pictures.length)
  );

  const additionalUsersVWC = useMappedValueWithCallbacks(
    profilePictures,
    (pp) => Math.ceil(pp.additionalUsers)
  );
  const isTinyScreen = useIsEffectivelyTinyScreen();

  return (
    <View
      style={Object.assign(
        {},
        styles.container,
        center ? styles.containerCenter : undefined,
        { minHeight: size }
      )}
    >
      {(() => {
        const result: ReactElement[] = [];
        for (let i = 0; i < numPictures; i++) {
          result.push(
            <RenderGuardedComponent
              key={i}
              props={profilePictures}
              component={(pics) => (
                <ProfilePictureSlot picture={pics.pictures[i]} size={size} />
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
          if (type === 'filled') {
            return (
              <View
                style={Object.assign(
                  {},
                  styles.hereSettingsFilledContainer,
                  isTinyScreen
                    ? styles.accessibleHereSettingsFilledContainer
                    : undefined,
                  { width: size, height: size }
                )}
              >
                <Text style={styles.hereSettingsFilledText}>{textContent}</Text>
              </View>
            );
          } else if (type === 'floating') {
            return (
              <Text style={styles.hereSettingsFloatingText}>{textContent}</Text>
            );
          } else if (type === 'none') {
            return <></>;
          }

          ((t: never) => {
            throw new Error(`Unknown hereSettings type ${t}`);
          })(type);
        }}
      />
    </View>
  );
};

const ProfilePictureSlot = ({
  picture,
  size,
}: {
  picture?: OsehImageState;
  size: number;
}) => {
  if (picture === undefined || picture.loading) {
    return <></>;
  }
  return (
    <View
      style={Object.assign({}, styles.pictureContainer, {
        width: size,
        height: size,
        borderRadius: Math.ceil(size / 2),
      })}
    >
      {picture !== undefined && (
        <OsehImageFromState state={picture} style={styles.picture} />
      )}
    </View>
  );
};
