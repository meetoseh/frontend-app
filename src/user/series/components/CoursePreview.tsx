import { useMappedValueWithCallbacks } from '../../../shared/hooks/useMappedValueWithCallbacks';
import { useWindowSizeValueWithCallbacks } from '../../../shared/hooks/useWindowSize';
import { OsehImageFromStateValueWithCallbacks } from '../../../shared/images/OsehImageFromStateValueWithCallbacks';
import { OsehImagePropsLoadable } from '../../../shared/images/OsehImageProps';
import { areOsehImageStatesEqual } from '../../../shared/images/OsehImageState';
import { OsehImageStateRequestHandler } from '../../../shared/images/useOsehImageStateRequestHandler';
import { useOsehImageStateValueWithCallbacks } from '../../../shared/images/useOsehImageStateValueWithCallbacks';
import { useStaleOsehImageOnSwap } from '../../../shared/images/useStaleOsehImageOnSwap';
import { adaptValueWithCallbacksAsVariableStrategyProps } from '../../../shared/lib/adaptValueWithCallbacksAsVariableStrategyProps';
import { ExternalCoursePreviewable } from '../lib/ExternalCourse';
import { styles } from './CoursePreviewStyles';
import { useMappedValuesWithCallbacks } from '../../../shared/hooks/useMappedValuesWithCallbacks';
import { useOsehContentTargetValueWithCallbacks } from '../../../shared/content/useOsehContentTargetValueWithCallbacks';
import { useReactManagedValueAsValueWithCallbacks } from '../../../shared/hooks/useReactManagedValueAsValueWithCallbacks';
import { RenderGuardedComponent } from '../../../shared/components/RenderGuardedComponent';
import { useCurrentTranscriptPhrases } from '../../../shared/transcripts/useCurrentTranscriptPhrases';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SvgLinearGradient } from '../../../shared/anim/SvgLinearGradient';
import { useMediaInfo } from '../../../shared/content/useMediaInfo';
import {
  PlayerCTA,
  PlayerForeground,
} from '../../../shared/content/player/PlayerForeground';
import { MediaInfoVideo } from '../../../shared/content/MediaInfoVideo';

export type CoursePreviewProps = {
  course: ExternalCoursePreviewable;
  onViewDetails: () => void;
  onBack: () => void;
  imageHandler: OsehImageStateRequestHandler;
};

/**
 * Displays the given course preview at full width/height, with a button
 * to view details or go back
 */
export const CoursePreview = ({
  course,
  onViewDetails,
  onBack,
  imageHandler,
}: CoursePreviewProps) => {
  const windowSizeVWC = useWindowSizeValueWithCallbacks();
  const coverImageProps = useMappedValueWithCallbacks(
    windowSizeVWC,
    (size): OsehImagePropsLoadable => ({
      uid: course.introVideoThumbnail.uid,
      jwt: course.introVideoThumbnail.jwt,
      displayWidth: size.width,
      displayHeight: size.height,
      alt: '',
    })
  );
  const coverImageState = useMappedValueWithCallbacks(
    useStaleOsehImageOnSwap(
      useOsehImageStateValueWithCallbacks(
        adaptValueWithCallbacksAsVariableStrategyProps(coverImageProps),
        imageHandler
      )
    ),
    (state) => {
      if (state.thumbhash === null && course.introVideoThumbhash !== null) {
        return { ...state, thumbhash: course.introVideoThumbhash };
      }
      return state;
    },
    {
      outputEqualityFn: areOsehImageStatesEqual,
    }
  );

  const videoTargetRefVWC = useReactManagedValueAsValueWithCallbacks(
    course.introVideo
  );
  const videoTargetVWC = useOsehContentTargetValueWithCallbacks({
    ref: videoTargetRefVWC,
    displaySize: windowSizeVWC,
    presign: false,
  });
  const videoStyleVWC = useMappedValuesWithCallbacks(
    [windowSizeVWC],
    () => {
      const screenSize = windowSizeVWC.get();

      return { width: screenSize.width, height: screenSize.height };
    },
    {
      outputEqualityFn: (a, b) => a.width === b.width && a.height === b.height,
    }
  );

  const transcript = useCurrentTranscriptPhrases({
    transcriptRef: useReactManagedValueAsValueWithCallbacks(
      course.introVideoTranscript
    ),
  });

  const videoInfo = useMediaInfo({
    currentTranscriptPhrasesVWC: transcript,
    durationSeconds: course.introVideoDuration,
  });

  const title = useReactManagedValueAsValueWithCallbacks(course.title);
  const subtitle = useReactManagedValueAsValueWithCallbacks(
    course.instructor.name
  );
  const tag = useReactManagedValueAsValueWithCallbacks(
    `${course.numJourneys.toLocaleString()} Classes`
  );
  const onClose = useReactManagedValueAsValueWithCallbacks(async () =>
    onBack()
  );
  const cta = useReactManagedValueAsValueWithCallbacks<PlayerCTA>({
    title: 'View Series',
    action: async () => onViewDetails(),
  });

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <MediaInfoVideo
          mediaInfo={videoInfo}
          video={videoTargetVWC}
          styleVWC={videoStyleVWC}
        />
      </View>
      <View style={styles.background}>
        <RenderGuardedComponent
          props={useMappedValuesWithCallbacks(
            [videoInfo.loaded, videoInfo.playing, videoInfo.currentTime],
            () =>
              !videoInfo.loaded.get() ||
              (!videoInfo.playing.get() && videoInfo.currentTime.get() === 0)
          )}
          component={(showCoverImage) =>
            showCoverImage ? (
              <OsehImageFromStateValueWithCallbacks state={coverImageState} />
            ) : (
              <></>
            )
          }
        />
      </View>
      <View style={styles.backgroundOverlay}>
        <SvgLinearGradient
          state={{
            stops: [
              {
                color: [0, 0, 0, 0.6],
                offset: 0,
              },
              {
                color: [0, 0, 0, 0],
                offset: 0.5,
              },
              {
                color: [0, 0, 0, 0],
                offset: 1,
              },
            ],
            x1: 0.5,
            y1: 1,
            x2: 0.5,
            y2: 0,
          }}
        />
      </View>
      <PlayerForeground
        size={windowSizeVWC}
        mediaInfo={videoInfo}
        transcript={transcript}
        title={title}
        subtitle={subtitle}
        tag={tag}
        onClose={onClose}
        cta={cta}
      />
      <StatusBar style="dark" />
    </View>
  );
};
