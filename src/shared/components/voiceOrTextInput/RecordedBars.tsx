import { useEffect } from 'react';
import {
  createWritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../lib/Callbacks';
import { setVWC } from '../../lib/setVWC';
import { waitForValueWithCallbacksConditionCancelable } from '../../lib/waitForValueWithCallbacksCondition';
import { waitForAnimationFrameCancelable } from '../../lib/waitForAnimationFrameCancelable';
import { createCancelablePromiseFromCallbacks } from '../../lib/createCancelablePromiseFromCallbacks';
import { RecordingBars, RecordingBarSettings } from './RecordingBars';
import { useReactManagedValueAsValueWithCallbacks } from '../../hooks/useReactManagedValueAsValueWithCallbacks';
import { OsehColors } from '../../OsehColors';
import { RenderGuardedComponent } from '../RenderGuardedComponent';
import { xAxisPhysicalPerLogical } from '../../images/DisplayRatioHelper';
import { AudioFileData } from '../../content/createAudioDataHandler';
import { createValueWithCallbacksEffect } from '../../hooks/createValueWithCallbacksEffect';
import { AVPlaybackStatus } from 'expo-av';
import { createMappedValueWithCallbacks } from '../../hooks/useMappedValueWithCallbacks';
import { View } from 'react-native';

export type RecordedBarsProps = {
  /** The playable audio to show bars for, undefined to drop seeking behavior */
  audio: AudioFileData | undefined;
  /** The estimated duration of the audio in seconds */
  audioDurationSeconds: number;
  /**
   * The available binned time vs intensity graphs in descending order
   * of number of bins
   */
  intensity: Float32Array[];
  /** The width in logical pixels to use */
  width: number;
  /** The height in logical pixels to use */
  height: number;
};

/**
 * Renders the RecordingBars for an audio file that you have in a playable
 * state. This will left-align the content within the container if there is
 * too much space available.
 *
 * This wraps recording bars with the following functionality:
 * - The current time of the audio is visually indicated by a lighter/brighter color
 *   for the portion of the bars representing time before the current time
 * - This will try to display _all_ the bars, rather than just the last N bars
 *   that fit. This is accomplished by choosing the intensity array that will
 *   actually fit then resizing it up where possible to do a better job filling the
 *   container.
 *
 * Other notable characterstics:
 * - This will always return an element that takes up the given DOM width and height,
 *   but visually it may take up less. In that case, the actual content will be left
 *   aligned within this container. Thus it can make sense to have slightly less padding
 *   right of this than usual.
 */
export const RecordedBars = (props: RecordedBarsProps) => {
  const zeroVWC = useWritableValueWithCallbacks(() => 0);
  const progressVWC = useWritableValueWithCallbacks(() => 0);

  useEffect(() => {
    if (props.audio === undefined) {
      setVWC(progressVWC, 0);
      return undefined;
    }
    return createValueWithCallbacksEffect(props.audio.state, (stateRaw) => {
      if (stateRaw.type !== 'loaded') {
        setVWC(progressVWC, 0);
        return undefined;
      }
      const active = createWritableValueWithCallbacks(true);
      const lastStatus =
        createWritableValueWithCallbacks<AVPlaybackStatus | null>(null);
      const [paused, cleanupPaused] = createMappedValueWithCallbacks(
        lastStatus,
        (s) => (s === null || !s.isLoaded ? true : !s.isPlaying)
      );
      const [ended, cleanupEnded] = createMappedValueWithCallbacks(
        lastStatus,
        (s) => s !== null && s.isLoaded && s.didJustFinish
      );
      const state = stateRaw;
      state.onStatusUpdate.add(onStatusUpdate);
      state.audio.getStatusAsync();
      handleProgressUpdateLoop();
      return () => {
        cleanupPaused();
        cleanupEnded();

        setVWC(active, false);
        setVWC(lastStatus, null);
        state.onStatusUpdate.remove(onStatusUpdate);
      };

      function onStatusUpdate(status: AVPlaybackStatus) {
        setVWC(lastStatus, status);
      }

      function updateProgress() {
        const status = lastStatus.get();
        if (status === null) {
          return;
        }

        if (!status.isLoaded) {
          setVWC(progressVWC, 0);
          return;
        }

        if (status.didJustFinish) {
          setVWC(progressVWC, 1);
          return;
        }

        const durationMillis =
          status.durationMillis === undefined ||
          isNaN(status.durationMillis) ||
          !isFinite(status.durationMillis) ||
          status.durationMillis <= 0
            ? props.audioDurationSeconds
            : status.durationMillis;
        const currentTimeMillis = status.positionMillis;
        setVWC(progressVWC, currentTimeMillis / durationMillis);
      }

      async function handleProgressUpdateLoop() {
        const canceled = waitForValueWithCallbacksConditionCancelable(
          active,
          (v) => !v
        );
        canceled.promise.catch(() => {});
        while (true) {
          if (!active.get()) {
            canceled.cancel();
            return;
          }

          updateProgress();

          if (!paused.get()) {
            state.audio.getStatusAsync();
            const nextFrame = waitForAnimationFrameCancelable();
            nextFrame.promise.catch(() => {});
            await Promise.race([nextFrame.promise, canceled.promise]);
            nextFrame.cancel();
          } else {
            const unpaused = waitForValueWithCallbacksConditionCancelable(
              paused,
              (v) => !v
            );
            unpaused.promise.catch(() => {});
            const endedChanged = createCancelablePromiseFromCallbacks(
              ended.callbacks
            );
            endedChanged.promise.catch(() => {});
            await Promise.race([
              unpaused.promise,
              canceled.promise,
              endedChanged.promise,
            ]);
            unpaused.cancel();
            endedChanged.cancel();
          }
        }
      }
    });
  }, [props.audio, progressVWC, props.audioDurationSeconds]);

  const recordingBarsSettings: Omit<RecordingBarSettings, 'color'> = {
    width: props.width,
    height: props.height,
    barWidth: 2,
    barSpacing: 1,
    align: 'left',
  };
  const maxBarsThatCanFit = Math.floor(
    recordingBarsSettings.width /
      (recordingBarsSettings.barWidth + recordingBarsSettings.barSpacing)
  );
  const intensity = (() => {
    for (let i = 0; i < props.intensity.length; i++) {
      if (props.intensity[i].length <= maxBarsThatCanFit) {
        return props.intensity[i];
      }
    }
    return props.intensity[props.intensity.length - 1];
  })();

  const intensityVWC = useReactManagedValueAsValueWithCallbacks(
    intensity,
    Object.is
  );

  const barWidthPercAsSpacing = 0.33333334;
  const rescaledAssignedBarWidth =
    props.width / (intensity.length - barWidthPercAsSpacing);
  recordingBarsSettings.barWidth =
    Math.floor(
      rescaledAssignedBarWidth *
        (1 - barWidthPercAsSpacing) *
        xAxisPhysicalPerLogical
    ) / xAxisPhysicalPerLogical;
  recordingBarsSettings.barSpacing =
    Math.floor(
      rescaledAssignedBarWidth * barWidthPercAsSpacing * xAxisPhysicalPerLogical
    ) / xAxisPhysicalPerLogical;

  while (
    recordingBarsSettings.barWidth +
      recordingBarsSettings.barSpacing +
      xAxisPhysicalPerLogical <=
    rescaledAssignedBarWidth
  ) {
    recordingBarsSettings.barWidth += xAxisPhysicalPerLogical;
  }

  const realWidth =
    intensity.length *
    (recordingBarsSettings.barWidth + recordingBarsSettings.barSpacing);

  return (
    <View
      style={{
        position: 'absolute',
        width: props.width,
        height: props.height,
        left: 0,
        top: 0,
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: props.width,
          height: props.height,
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        <RecordingBars
          intensity={intensityVWC}
          offset={zeroVWC}
          settings={{
            ...recordingBarsSettings,
            color: OsehColors.v4.primary.grey,
          }}
        />
      </View>
      <RenderGuardedComponent
        props={progressVWC}
        component={(progress) => (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: progress >= 0.99 ? props.width : realWidth * progress,
              height: props.height,
              zIndex: 0,
              overflow: 'hidden',
            }}
          >
            <RecordingBars
              intensity={intensityVWC}
              offset={zeroVWC}
              settings={{
                ...recordingBarsSettings,
                color: OsehColors.v4.primary.light,
              }}
            />
          </View>
        )}
      />
    </View>
  );
};
