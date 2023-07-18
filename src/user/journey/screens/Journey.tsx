import {
  MutableRefObject,
  PropsWithChildren,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { styles } from "./JourneyStyles";
import { JourneyScreenProps } from "../models/JourneyScreenProps";
import {
  Callbacks,
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from "../../../shared/lib/Callbacks";
import { RenderGuardedComponent } from "../../../shared/components/RenderGuardedComponent";
import { useWindowSize } from "../../../shared/hooks/useWindowSize";
import { useMappedValueWithCallbacks } from "../../../shared/hooks/useMappedValueWithCallbacks";
import { inferAnimators } from "../../../shared/anim/AnimationLoop";
import { ease } from "../../../shared/lib/Bezier";
import { useAnimatedValueWithCallbacks } from "../../../shared/anim/useAnimatedValueWithCallbacks";
import { useValueWithCallbacksEffect } from "../../../shared/hooks/useValueWithCallbacksEffect";
import { setVWC } from "../../../shared/lib/setVWC";
import { WrappedAudioSound } from "../../../shared/content/OsehAudioContentState";
import { AVPlaybackStatus } from "expo-av";
import { Modals, ModalsOutlet } from "../../../shared/contexts/ModalContext";
import { StyleProp, View, ViewStyle, Text, Pressable } from "react-native";
import { OsehImageBackgroundFromStateValueWithCallbacks } from "../../../shared/images/OsehImageBackgroundFromStateValueWithCallbacks";
import { CloseButton } from "../../../shared/components/CloseButton";
import FullHeartIcon from "../icons/FullHeartIcon";
import EmptyHeartIcon from "../icons/EmptyHeartIcon";
import { StatusBar } from "expo-status-bar";
import { useToggleFavorited } from "../hooks/useToggleFavorited";

const HIDE_TIME = 10000;

/**
 * Takes the meta information about a journey returned from any of the endpoints
 * which start a session in the journey (e.g., start_random), then uses that to
 * connect to the "live" information (the true live events, the historical
 * events, profile pictures, and the stats endpoints) and playback the journey
 * to the user, while they are allowed to engage via the prompt and a "like"
 * button.
 */
export const Journey = ({
  journey,
  shared,
  setScreen,
  onCloseEarly,
}: JourneyScreenProps & {
  /**
   * If specified, instead of just using setScreen('feedback') for both the
   * audio ending normally and the user clicking the x to skip the remaining
   * audio, instead we use setScreen('feedback') if it ends normally and
   * onCloseEarly if the user clicks the x to skip the remaining audio.
   */
  onCloseEarly?: (currentTime: number, totalTime: number) => void;
}): ReactElement => {
  const controlsVisible = useWritableValueWithCallbacks<boolean>(() => true);
  const currentTimeVWC = useWritableValueWithCallbacks<number>(() => 0);
  const windowSize = useWindowSize();
  const onTapAnywhere = useRef<Callbacks<undefined>>() as MutableRefObject<
    Callbacks<undefined>
  >;
  if (onTapAnywhere.current === undefined) {
    onTapAnywhere.current = new Callbacks<undefined>();
  }

  useEffect(() => {
    const cleanup = new Callbacks<undefined>();
    shared.callbacks.add(handleAudioChanged);
    handleAudioChanged();
    return () => {
      shared.callbacks.remove(handleAudioChanged);
      cleanup.call(undefined);
      cleanup.clear();
    };

    function handleAudioTime(
      audio: WrappedAudioSound,
      statusUpdate: Callbacks<AVPlaybackStatus>
    ): () => void {
      const onTimeUpdate = (status: AVPlaybackStatus) => {
        if (!status.isLoaded) {
          return;
        }

        setVWC(currentTimeVWC, status.positionMillis / 1000.0);
      };

      statusUpdate.add(onTimeUpdate);
      return () => {
        statusUpdate.remove(onTimeUpdate);
      };
    }

    function handleAudioEnded(
      audio: WrappedAudioSound,
      statusUpdate: Callbacks<AVPlaybackStatus>
    ): () => void {
      if (audio.canceled) {
        setScreen("feedback", false);
        return () => {};
      }

      const handler = (status: AVPlaybackStatus) => {
        if (!status.isLoaded) {
          return;
        }

        if (status.didJustFinish) {
          setScreen("feedback", false);
        }
      };

      statusUpdate.add(handler);
      return () => {
        statusUpdate.remove(handler);
      };
    }

    function handleControls(
      audio: WrappedAudioSound,
      statusUpdate: Callbacks<AVPlaybackStatus>
    ): () => void {
      let timeout: NodeJS.Timeout | null = null;
      let paused = controlsVisible.get();
      const doHide = () => {
        setVWC(controlsVisible, false);
      };

      const onUserInput = () => {
        if (paused) {
          return;
        }

        if (timeout !== null) {
          clearTimeout(timeout);
        }
        setVWC(controlsVisible, true);
        timeout = setTimeout(doHide, HIDE_TIME);
      };

      const onStatusUpdate = (status: AVPlaybackStatus) => {
        if (!status.isLoaded || !status.isPlaying) {
          paused = true;
          if (timeout !== null) {
            clearTimeout(timeout);
            timeout = null;
          }
          setVWC(controlsVisible, true);
          return;
        }

        if (paused) {
          paused = false;
          onUserInput();
        }
      };

      statusUpdate.add(onStatusUpdate);
      onTapAnywhere.current.add(onUserInput);

      return () => {
        if (timeout !== null) {
          clearTimeout(timeout);
        }
        statusUpdate.remove(onStatusUpdate);
        onTapAnywhere.current.remove(onUserInput);
      };
    }

    function handleAudioChanged() {
      cleanup.call(undefined);
      cleanup.clear();

      const audio = shared.get().audio.audio;
      const statusUpdate = new Callbacks<AVPlaybackStatus>();
      if (audio !== null) {
        cleanup.add(handleAudioTime(audio, statusUpdate));
        cleanup.add(handleAudioEnded(audio, statusUpdate));
        cleanup.add(handleControls(audio, statusUpdate));

        if (audio.sound === null) {
          statusUpdate.call({ isLoaded: false });
        } else {
          let active = true;
          const sound = audio.sound;
          const handler = (status: AVPlaybackStatus) => {
            if (!active) {
              return;
            }

            statusUpdate.call(status);
          };
          cleanup.add(() => {
            active = false;
            sound.setOnPlaybackStatusUpdate(null);
          });
          sound.setOnPlaybackStatusUpdate(handler);
          sound.getStatusAsync().then(handler);
        }
      }
    }
  }, [shared, setScreen, controlsVisible, currentTimeVWC]);

  const modals = useWritableValueWithCallbacks<Modals>(() => []);

  const onClickedClose = useCallback(() => {
    shared.get().audio.stop?.();

    if (onCloseEarly !== undefined) {
      onCloseEarly(currentTimeVWC.get(), journey.durationSeconds);
    } else {
      setScreen("feedback", true);
    }
  }, [
    setScreen,
    shared,
    currentTimeVWC,
    journey.durationSeconds,
    onCloseEarly,
  ]);

  const audioProgressRef = useRef<View>(null);
  useValueWithCallbacksEffect(
    currentTimeVWC,
    useCallback(
      (currentTime) => {
        if (audioProgressRef.current === null) {
          return;
        }
        audioProgressRef.current.setNativeProps({
          style: {
            ...styles.audioProgress,
            width: `${(currentTime / journey.durationSeconds) * 100}%`,
          },
        });
        return undefined;
      },
      [journey.durationSeconds]
    )
  );

  const onToggleFavorited = useToggleFavorited({
    modals,
    journey,
    shared,
  });

  return (
    <View style={styles.container}>
      <OsehImageBackgroundFromStateValueWithCallbacks
        state={useMappedValueWithCallbacks(shared, (s) => s.darkenedImage)}
        style={{
          ...styles.innerContainer,
          width: windowSize.width,
          height: windowSize.height,
        }}
      >
        <Control
          visible={controlsVisible}
          style={{
            ...styles.controlButtonContainer,
            width: windowSize.width,
            height: windowSize.height,
          }}
        >
          <CloseButton onPress={onClickedClose} />
        </Control>
        <Control
          visible={controlsVisible}
          style={{
            ...styles.audioControlsContainer,
            width: windowSize.width - 48,
          }}
        >
          <View style={styles.audioControlsInnerContainer}>
            <View style={styles.audioProgressContainer}>
              <View
                style={{
                  ...styles.audioProgress,
                  width: `${
                    (currentTimeVWC.get() / journey.durationSeconds) * 100
                  }%`,
                }}
                ref={audioProgressRef}
              />
              <View style={styles.audioProgressCircle} />
            </View>
          </View>
        </Control>
        <Control
          visible={controlsVisible}
          style={{ ...styles.contentContainer, width: windowSize.width }}
        >
          <View style={{ ...styles.content, width: windowSize.width }}>
            <View style={styles.titleAndInstructor}>
              <Text style={styles.title}>{journey.title}</Text>
              <Text style={styles.instructor}>{journey.instructor.name}</Text>
            </View>
            <RenderGuardedComponent
              props={controlsVisible}
              component={(vis) => {
                const inner = (
                  <RenderGuardedComponent
                    props={shared}
                    component={(s) => {
                      return s.favorited ? (
                        <FullHeartIcon />
                      ) : (
                        <EmptyHeartIcon />
                      );
                    }}
                  />
                );

                if (!vis) {
                  return inner;
                }
                return (
                  <Pressable onPress={onToggleFavorited}>{inner}</Pressable>
                );
              }}
            />
          </View>
        </Control>
        <RenderGuardedComponent
          props={controlsVisible}
          component={(controlsVisible) => {
            if (controlsVisible) {
              return <></>;
            }
            return (
              <Pressable
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: windowSize.width,
                  height: windowSize.height,
                  zIndex: 200,
                }}
                onPress={() => {
                  onTapAnywhere.current.call(undefined);
                }}
              />
            );
          }}
        />
        <ModalsOutlet modals={modals} />
      </OsehImageBackgroundFromStateValueWithCallbacks>
      <StatusBar style="light" />
    </View>
  );
};

const Control = ({
  visible,
  style,
  children,
}: PropsWithChildren<{
  visible: ValueWithCallbacks<boolean>;
  style: StyleProp<ViewStyle>;
}>): ReactElement => {
  const animators = useMemo(
    () =>
      inferAnimators<{ opacity: number }, { opacity: number }>(
        { opacity: 0 },
        ease,
        350
      ),
    []
  );
  const containerRef = useRef<View>(null);
  const shouldRenderVWC = useWritableValueWithCallbacks<boolean>(() => true);
  const currentlyRenderedPropsRef = useRef<{
    style: StyleProp<ViewStyle>;
    renderToHardwareTextureAndroid?: boolean;
    shouldRasterizeIOS?: boolean;
  }>({ style: { opacity: 1 } });

  const target = useAnimatedValueWithCallbacks(
    { opacity: 1 },
    animators,
    (val) => {
      setVWC(shouldRenderVWC, val.opacity > 0);
      let animating = val.opacity !== 0 && val.opacity !== 1;
      currentlyRenderedPropsRef.current = {
        style: Object.assign({}, style, {
          opacity: val.opacity,
        }),
        renderToHardwareTextureAndroid: animating,
        shouldRasterizeIOS: animating,
      };

      if (containerRef.current === null) {
        return;
      }
      const ele = containerRef.current;
      ele.setNativeProps(currentlyRenderedPropsRef.current);
    }
  );

  useValueWithCallbacksEffect(
    visible,
    useCallback(
      (val) => {
        setVWC(
          target,
          { opacity: val ? 1 : 0 },
          (a, b) => a.opacity === b.opacity
        );
        return undefined;
      },
      [target]
    )
  );

  return (
    <RenderGuardedComponent
      props={shouldRenderVWC}
      component={(shouldRender) => {
        if (!shouldRender) {
          return <></>;
        }
        return (
          <View {...currentlyRenderedPropsRef.current} ref={containerRef}>
            {children}
          </View>
        );
      }}
    />
  );
};
