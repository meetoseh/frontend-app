import { View, Text } from 'react-native';
import { useMappedValuesWithCallbacks } from '../../../shared/hooks/useMappedValuesWithCallbacks';
import { useWindowSizeValueWithCallbacks } from '../../../shared/hooks/useWindowSize';
import { OsehImageFromStateValueWithCallbacks } from '../../../shared/images/OsehImageFromStateValueWithCallbacks';
import { OsehImageProps } from '../../../shared/images/OsehImageProps';
import { OsehImageStateRequestHandler } from '../../../shared/images/useOsehImageStateRequestHandler';
import { useOsehImageStateValueWithCallbacks } from '../../../shared/images/useOsehImageStateValueWithCallbacks';
import {
  Callbacks,
  useWritableValueWithCallbacks,
} from '../../../shared/lib/Callbacks';
import { formatDurationClock } from '../../../shared/lib/networkResponseUtils';
import { setVWC } from '../../../shared/lib/setVWC';
import { MinimalCourseJourney } from '../../favorites/lib/MinimalCourseJourney';
import { styles } from './CourseJourneyStyles';
import { useValuesWithCallbacksEffect } from '../../../shared/hooks/useValuesWithCallbacksEffect';
import Check from '../assets/Check';
import { useValueWithCallbacksEffect } from '../../../shared/hooks/useValueWithCallbacksEffect';
import { convertLogicalHeightToPhysicalHeight } from '../../../shared/images/DisplayRatioHelper';
import { useContentWidth } from '../../../shared/lib/useContentWidth';

const DESIRED_HEIGHT = 76;

export const CourseJourney = ({
  association,
  index,
  imageHandler,
}: {
  association: MinimalCourseJourney;
  index: number;
  imageHandler: OsehImageStateRequestHandler;
}) => {
  const contentWidth = useContentWidth();
  const realHeight = useWritableValueWithCallbacks<number>(
    () => DESIRED_HEIGHT
  );
  const foregroundLayoutSize = useWritableValueWithCallbacks<{
    width: number;
    height: number;
  } | null>(() => null);

  useValueWithCallbacksEffect(foregroundLayoutSize, (size) => {
    if (size === null) {
      setVWC(realHeight, DESIRED_HEIGHT);
    } else {
      setVWC(
        realHeight,
        Math.max(size.height, DESIRED_HEIGHT),
        (a, b) =>
          convertLogicalHeightToPhysicalHeight(a) ===
          convertLogicalHeightToPhysicalHeight(b)
      );
    }
    return undefined;
  });

  const backgroundProps = useMappedValuesWithCallbacks(
    [realHeight, foregroundLayoutSize],
    (): OsehImageProps => ({
      uid: association.journey.darkenedBackground.uid,
      jwt: association.journey.darkenedBackground.jwt,
      displayWidth: foregroundLayoutSize.get()?.width ?? contentWidth,
      displayHeight: realHeight.get(),
      alt: '',
      placeholderColor: '#333333',
    })
  );
  const backgroundImage = useOsehImageStateValueWithCallbacks(
    {
      type: 'callbacks',
      props: backgroundProps.get,
      callbacks: backgroundProps.callbacks,
    },
    imageHandler
  );

  return (
    <View style={styles.container}>
      <OsehImageFromStateValueWithCallbacks
        state={backgroundImage}
        style={styles.background}
      />
      <View
        style={styles.foreground}
        ref={() => {}}
        onLayout={(e) => {
          const width = e?.nativeEvent?.layout?.width;
          const height = e?.nativeEvent?.layout?.height;
          if (width === undefined || height === undefined) {
            setVWC(foregroundLayoutSize, null);
          } else {
            setVWC(foregroundLayoutSize, { width, height });
          }
        }}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {association.journey.lastTakenAt !== null && (
              <View style={styles.check}>
                <Check />
              </View>
            )}
            <Text style={styles.index}>{(index + 1).toLocaleString()}. </Text>
            <Text style={styles.title}>{association.journey.title}</Text>
          </View>
          <View style={styles.headerRight}>
            {association.journey.lastTakenAt !== null && (
              <Text style={styles.played}>Played</Text>
            )}
            <Text style={styles.duration}>
              {formatDurationClock(association.journey.durationSeconds, {
                minutes: true,
                seconds: true,
                milliseconds: false,
              })}
            </Text>
          </View>
        </View>
        <Text style={styles.description}>
          {association.journey.description}
        </Text>
      </View>
    </View>
  );
};
