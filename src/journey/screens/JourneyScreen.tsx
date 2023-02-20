import { StatusBar } from 'expo-status-bar';
import { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, View, ViewStyle } from 'react-native';
import { OsehImageBackgroundFromState } from '../../shared/components/OsehImageBackgroundFromState';
import { Cancelers } from '../../shared/lib/cancelers';
import { SplashScreen } from '../../splash/SplashScreen';
import { JourneyScreenProps } from '../models/JourneyScreenProps';
import { styles as sharedStyles } from '../shared/styles';
import { Audio } from 'expo-av';
import { styles } from './JourneyScreenStyles';
import { useScreenSize } from '../../shared/hooks/useScreenSize';
import Svg, { G, Path, Circle } from 'react-native-svg';
import * as Colors from '../../styling/colors';
import * as Bezier from '../../shared/lib/Bezier';
import { CloseButton } from '../../shared/components/CloseButton';

type ControlsHiddenState = { state: 'hidden' };
type ControlsVisibleState = { state: 'visible'; cancel: () => void };
type ControlsHidingState = {
  state: 'hiding';
  duration: number;
  startTime: number;
  opacityPercent: number;
  cancel: () => void;
};
type ControlsState = ControlsHiddenState | ControlsVisibleState | ControlsHidingState;

type AudioStateUnhandled = { state: 'unhandled' };
type AudioStateHandled = {
  state: 'handled';
  progressPercent: number;
};
type AudioState = AudioStateUnhandled | AudioStateHandled;

export const JourneyScreen = ({
  journey,
  shared,
  error,
  setScreen,
}: JourneyScreenProps): ReactElement => {
  const [controlsState, setControlsState] = useState<ControlsState>({
    state: 'visible',
    cancel: () => {
      // no-op
    },
  });
  const [audioState, setAudioState] = useState<AudioState>({ state: 'unhandled' });
  const screenSize = useScreenSize();
  const finishedRef = useRef<() => void>(() => {
    return () => {
      setScreen('post');
    };
  });

  useEffect(() => {
    finishedRef.current = () => {
      setScreen('post');
    };
  }, [setScreen]);

  useEffect(() => {
    const cancelers = new Cancelers();
    let active = true;
    handleAudioWrapper();
    const unmount = () => {
      if (!active) {
        return;
      }

      active = false;
      cancelers.invokeAll({ copy: false }).finally(() => {
        cancelers.clear();
      });
    };
    return unmount;

    async function handleAudio(sound: Audio.Sound) {
      const state = await sound.getStatusAsync();
      if (!state.isLoaded) {
        return;
      }

      const durationMillis = state.durationMillis || journey.durationSeconds * 1000;

      setAudioState({
        state: 'handled',
        progressPercent: state.isPlaying ? (state.positionMillis / durationMillis) * 100 : 0,
      });

      cancelers.add(() => sound.setOnPlaybackStatusUpdate(null));
      sound.setOnPlaybackStatusUpdate((playbackStatus) => {
        if (!active) {
          return;
        }
        if (!playbackStatus.isLoaded) {
          unmount();
          return;
        }

        if (playbackStatus.didJustFinish) {
          finishedRef.current.apply(undefined, []);
          unmount();
          return;
        }

        setAudioState({
          state: 'handled',
          progressPercent: (playbackStatus.positionMillis / durationMillis) * 100,
        });
      });

      if (!state.isPlaying) {
        await sound.replayAsync();
      }
    }

    async function handleAudioWrapper() {
      const sound = shared?.audio?.sound;
      if (shared.audioLoading || sound === null || sound === undefined) {
        return;
      }

      try {
        await handleAudio(sound);
      } catch (e) {
        console.error('error handling audio: ', e);
        if (active) {
          setAudioState({ state: 'unhandled' });
          unmount();
        }
      }
    }
  }, [shared.audioLoading, shared?.audio?.sound, journey.durationSeconds]);

  const controlsStyle = useMemo<ViewStyle>(() => {
    const baseStyling = {
      width: screenSize.width,
      top: screenSize.height - 192,
    };

    if (controlsState.state === 'hidden') {
      return { display: 'none' };
    }

    if (controlsState.state === 'visible') {
      return Object.assign({}, baseStyling, styles.controls);
    }

    return Object.assign({}, styles.controls, baseStyling, {
      opacity: controlsState.opacityPercent / 100,
    });
  }, [controlsState, screenSize]);

  const controlsOpacityOnlyStyle = useMemo<ViewStyle>(() => {
    if (controlsState.state === 'hiding') {
      return { opacity: controlsState.opacityPercent / 100 };
    }

    return {};
  }, [controlsState]);

  const makeControlsVisible = useCallback(() => {
    const cancelers = new Cancelers();
    let active = true;
    const unmount = () => {
      if (!active) {
        return;
      }
      active = false;
      cancelers.invokeAll({ copy: false }).finally(() => {
        cancelers.clear();
      });
    };

    setControlsState((prev) => {
      if (prev.state === 'hiding' || prev.state === 'visible') {
        prev.cancel();
      }

      return { state: 'visible', cancel: unmount };
    });

    const timeout = setTimeout(hide, 10000);
    const clearTimeoutId = cancelers.add(() => clearTimeout(timeout));

    async function hide() {
      if (!active) {
        return;
      }
      cancelers.remove(clearTimeoutId);

      let startTime: DOMHighResTimeStamp | null = null;
      const duration = 350;
      const ease = Bezier.easeIn;
      const update = (newTime: DOMHighResTimeStamp) => {
        if (!active) {
          return;
        }
        if (startTime === null) {
          startTime = newTime;
          requestAnimationFrame(update);
          return;
        }

        const elapsed = newTime - startTime;
        const progress = 1 - elapsed / duration;
        if (progress <= 0) {
          setControlsState({ state: 'hidden' });
          unmount();
          return;
        }

        setControlsState({
          state: 'hiding',
          duration,
          startTime,
          opacityPercent: ease.y_x(progress) * 100,
          cancel: unmount,
        });
        requestAnimationFrame(update);
      };

      requestAnimationFrame(update);
    }
  }, []);

  useEffect(() => {
    makeControlsVisible();
  }, [makeControlsVisible]);

  const onClose = useCallback(() => {
    setScreen('post');
  }, [setScreen]);

  if (shared.image === null || shared.audioLoading || audioState.state === 'unhandled') {
    return <SplashScreen />;
  }

  const progressEX = (screenSize.width - 48) * (audioState.progressPercent / 100);

  return (
    <View
      style={sharedStyles.container}
      onTouchStart={makeControlsVisible}
      onTouchEnd={makeControlsVisible}>
      {error}

      <OsehImageBackgroundFromState state={shared.image} style={sharedStyles.background}>
        <View style={styles.content}>
          {controlsState.state !== 'hidden' ? (
            <CloseButton onPress={onClose} bonusStyle={controlsOpacityOnlyStyle} />
          ) : null}
          {controlsState.state !== 'hidden' ? (
            <View style={controlsStyle}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>{journey.title}</Text>
              </View>
              <View style={styles.instructorContainer}>
                <Text style={styles.instructor}>{journey.instructor.name}</Text>
              </View>
              <View style={styles.progressContainer}>
                <Svg
                  width={screenSize.width - 48}
                  height={10}
                  viewBox={`0 0 ${screenSize.width - 48} 10`}
                  fill="none">
                  <G>
                    <Path
                      stroke={Colors.PRIMARY_DEFAULT_BACKGROUND}
                      strokeWidth={4}
                      d={`M0 5L${screenSize.width - 48} 5`}
                    />
                    <Path
                      stroke={Colors.PRIMARY_DEFAULT}
                      strokeWidth={4}
                      d={`M0 5L${progressEX} 5`}
                    />
                    <Circle cx={progressEX} cy={5} r={4} fill={Colors.PRIMARY_DEFAULT} />
                  </G>
                </Svg>
              </View>
            </View>
          ) : null}
        </View>
      </OsehImageBackgroundFromState>
      <StatusBar style="auto" />
    </View>
  );
};
