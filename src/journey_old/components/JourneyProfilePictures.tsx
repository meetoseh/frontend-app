import { ReactElement, useMemo } from 'react';
import { Text, View } from 'react-native';
import { OsehImageFromState } from '../../shared/components/OsehImageFromState';
import { useOsehImageStates } from '../../shared/hooks/useOsehImage';
import { ProfilePictures } from '../hooks/useProfilePictures';
import { styles } from './JourneyProfilePicturesStyles';

type JourneyProfilePicturesProps = {
  /**
   * The pictures to show
   */
  profilePictures: ProfilePictures;

  /**
   * The total number of users in the journey
   */
  users: number;
};

/**
 * Displays the given profile pictures as well as how many people are in the
 * class but don't have a profile picture displayed (either because they
 * don't have one, they took the class multiple times, or there isn't space)
 */
export const JourneyProfilePictures = ({
  profilePictures,
  users,
}: JourneyProfilePicturesProps): ReactElement => {
  const imageProps = useMemo(() => {
    const seen = new Set<string>();
    return profilePictures.pictures
      .filter((pic) => {
        if (seen.has(pic.uid)) {
          return false;
        }
        seen.add(pic.uid);
        return true;
      })
      .map((pic) => ({
        uid: pic.uid,
        jwt: pic.jwt,
        displayWidth: 38,
        displayHeight: 38,
        alt: '',
      }));
  }, [profilePictures.pictures]);
  const images = useOsehImageStates(imageProps);
  const loadedImages = useMemo(() => images.filter((img) => !img.loading), [images]);
  const numBonusUsers = users - loadedImages.length;

  return (
    <View style={styles.container}>
      {loadedImages.map((img, i) => (
        <View
          style={i === 0 ? styles.pictureContainer : styles.pictureContainerNotFirst}
          key={img.localUrl}>
          <OsehImageFromState state={img} />
        </View>
      ))}
      {numBonusUsers > 0 && (
        <View
          style={
            loadedImages.length === 0 ? styles.pictureContainer : styles.pictureContainerNotFirst
          }>
          <Text style={styles.bonusUsersText}>+{numBonusUsers}</Text>
        </View>
      )}
    </View>
  );
};
