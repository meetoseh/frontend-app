import { ResizeMode, Video } from 'expo-av';
import {
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../lib/Callbacks';
import {
  ContentFileNativeExport,
  OsehContentTarget,
} from './OsehContentTarget';
import { MediaInfo } from './useMediaInfo';
import { StyleProp, ViewStyle } from 'react-native';
import { setVWC } from '../lib/setVWC';
import { RenderGuardedComponent } from '../components/RenderGuardedComponent';
import { ReactElement, useEffect } from 'react';
import { useValuesWithCallbacksEffect } from '../hooks/useValuesWithCallbacksEffect';
import { useMappedValuesWithCallbacks } from '../hooks/useMappedValuesWithCallbacks';
import { useValueWithCallbacksEffect } from '../hooks/useValueWithCallbacksEffect';

export type MediaInfoVideoProps = {
  /** The media info to connect */
  mediaInfo: MediaInfo;
  /** The video being connected */
  video: ValueWithCallbacks<ContentFileNativeExport>;
  /** The style for the video element */
  style?: StyleProp<ViewStyle>;
  /** If specified, included in addition to the style */
  styleVWC?: ValueWithCallbacks<StyleProp<ViewStyle>>;
};

/**
 * Renders a Video which reports to the given media info, using the given style
 * information (which should at minimum include a fixed width and height).
 */
export const MediaInfoVideo = ({
  mediaInfo,
  video,
  style,
  styleVWC: styleVWCRaw,
}: MediaInfoVideoProps): ReactElement => {
  const videoRefVWC = useWritableValueWithCallbacks<Video | null>(() => null);
  const styleVWC = useWritableValueWithCallbacks<StyleProp<ViewStyle>>(() =>
    Object.assign({}, style, styleVWCRaw?.get())
  );

  useEffect(() => {
    if (styleVWCRaw === undefined) {
      setVWC(styleVWC, style);
      return undefined;
    }

    const vwc = styleVWCRaw;
    vwc.callbacks.add(updateStyles);
    updateStyles();
    return () => {
      vwc.callbacks.remove(updateStyles);
    };

    function updateStyles() {
      setVWC(styleVWC, Object.assign({}, style, vwc.get()));
    }
  }, [style, styleVWCRaw]);

  useValuesWithCallbacksEffect(
    [mediaInfo.shouldPlay, mediaInfo.playing, videoRefVWC],
    () => {
      const ele = videoRefVWC.get();
      if (ele === null) {
        return undefined;
      }

      const shouldPlay = mediaInfo.shouldPlay.get();
      const isPlaying = mediaInfo.playing.get();

      if (shouldPlay === isPlaying) {
        return undefined;
      }

      if (shouldPlay) {
        ele
          .playAsync()
          .then((status) => setVWC(mediaInfo.playbackStatus, status));
      } else {
        ele
          .pauseAsync()
          .then((status) => setVWC(mediaInfo.playbackStatus, status));
      }
    }
  );

  useValuesWithCallbacksEffect(
    [mediaInfo.shouldBeMuted, mediaInfo.muted, videoRefVWC],
    () => {
      const ele = videoRefVWC.get();
      if (ele === null) {
        return undefined;
      }

      const isMuted = mediaInfo.muted.get();
      const shouldBeMuted = mediaInfo.shouldBeMuted.get();

      if (isMuted === shouldBeMuted) {
        return;
      }

      ele
        .setIsMutedAsync(shouldBeMuted)
        .then((status) => setVWC(mediaInfo.playbackStatus, status));
    }
  );

  useValueWithCallbacksEffect(videoRefVWC, (ele) => {
    if (ele === null) {
      return undefined;
    }

    setVWC(mediaInfo.seekTo, (seconds) => ele.setPositionAsync(seconds * 1000));
    return () => {
      setVWC(mediaInfo.seekTo, null);
    };
  });

  return (
    <RenderGuardedComponent
      props={useMappedValuesWithCallbacks([video, styleVWC], () => ({
        target: video.get(),
        style: styleVWC.get(),
      }))}
      component={({ target, style }) => (
        <Video
          source={{
            uri: target.url,
            headers: { Authorization: `bearer ${target.jwt}` },
          }}
          ref={(r) => setVWC(videoRefVWC, r)}
          resizeMode={ResizeMode.COVER}
          shouldPlay={mediaInfo.shouldPlay.get()}
          isLooping={false}
          onLoadStart={() => setVWC(mediaInfo.readyForDisplay, false)}
          onReadyForDisplay={() => setVWC(mediaInfo.readyForDisplay, true)}
          onLoad={(status) => setVWC(mediaInfo.playbackStatus, status)}
          onPlaybackStatusUpdate={(status) =>
            setVWC(mediaInfo.playbackStatus, status)
          }
          isMuted={mediaInfo.shouldBeMuted.get()}
          style={style}
        />
      )}
    />
  );
};
