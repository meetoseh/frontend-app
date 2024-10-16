import { useEffect, useRef } from 'react';
import { VoiceNoteStateMachine } from '../../../user/core/screens/journal_chat/lib/createVoiceNoteStateMachine';
import {
  useWritableValueWithCallbacks,
  ValueWithCallbacks,
} from '../../lib/Callbacks';
import { useValueWithCallbacksEffect } from '../../hooks/useValueWithCallbacksEffect';
import { OsehStyles } from '../../OsehStyles';
import { RenderGuardedComponent } from '../RenderGuardedComponent';
import { useMappedValueWithCallbacks } from '../../hooks/useMappedValueWithCallbacks';
import { VerticalSpacer } from '../VerticalSpacer';
import { Cancel } from '../icons/Cancel';
import { OsehColors } from '../../OsehColors';
import { styles } from './VoiceOrTextInputVoiceStyles';
import { setVWC } from '../../lib/setVWC';
import { HorizontalSpacer } from '../HorizontalSpacer';
import { RecordingBars } from './RecordingBars';
import { formatDurationClock } from '../../lib/networkResponseUtils';
import { Stop } from '../icons/Stop';
import { Send } from '../icons/Send';
import { RESIZING_TEXT_AREA_ICON_SETTINGS } from '../ResizingTextArea';
import { AudioPlayPauseIcon } from './AudioPlayPauseButton';
import { AutoWidthRecordedBars } from './AutoWidthRecordedBars';
import { Text, Pressable, View, StyleProp, TextStyle } from 'react-native';
import { BoxError, DisplayableError } from '../../lib/errors';

export type VoiceOrTextInputVoiceProps = {
  /** The user no longer wants to send audio */
  onCancel: () => void;
  /**
   * The user finished their voice note and wants to send it. The voice note
   * at least made it to recording, and they could have been so fast that it's
   * still in the recording step. In that case, though, we will have already
   * sent the stop-recording message.
   *
   * If they waited long enough after recording this may have already made it
   * to the local-ready step.
   */
  onSend: (voiceNote: VoiceNoteStateMachine) => void;

  voiceNote: VoiceNoteStateMachine;
};

/**
 * Immediately upon being shown tries to start recording with the given voice note
 *
 * Generally not used directly, but instead as a subcomponent of VoiceOrTextInput
 */
export const VoiceOrTextInputVoice = (props: VoiceOrTextInputVoiceProps) => {
  const voiceNote = props.voiceNote;
  const startedRecordingRef = useRef(false);
  useValueWithCallbacksEffect(voiceNote.state, (state) => {
    if (startedRecordingRef.current) {
      if (state.type === 'recording') {
        startedRecordingRef.current = false;
      }
      return;
    }
    if (state.type !== 'initialized-for-recording') {
      return undefined;
    }
    startedRecordingRef.current = true;
    voiceNote.sendMessage({ type: 'record' });
    return undefined;
  });

  const barsContainerWidthVWC = useWritableValueWithCallbacks<number>(() => 0);

  return (
    <View style={OsehStyles.layout.row}>
      <RenderGuardedComponent
        props={useMappedValueWithCallbacks(
          voiceNote.state,
          (s) =>
            s.type !== 'initializing-for-recording' &&
            s.type !== 'initialized-for-recording' &&
            s.type !== 'recording'
        )}
        component={(shouldShow) =>
          !shouldShow ? (
            <></>
          ) : (
            <Pressable
              style={OsehStyles.unstyling.buttonAsColumn}
              onPress={() => {
                const current = voiceNote.state.get();
                current?.audio?.playable?.state?.get?.()?.stop?.();
                if (current.type !== 'released') {
                  voiceNote.sendMessage({ type: 'release' });
                }
                props.onCancel();
              }}
            >
              <VerticalSpacer height={0} flexGrow={1} />
              <Cancel
                color={OsehColors.v4.primary.darkGrey}
                color2={OsehColors.v4.primary.light}
                icon={{ width: 30 }}
                container={{ width: 42, height: 48 }}
                startPadding={{ x: { fraction: 0 }, y: { fraction: 0.5 } }}
              />
              <VerticalSpacer height={0} flexGrow={1} />
              <Text style={OsehStyles.assistive.srOnly}>Cancel</Text>
            </Pressable>
          )
        }
      />
      <RenderGuardedComponent
        props={useMappedValueWithCallbacks(voiceNote.state, (s) =>
          s.type === 'error'
            ? s.error
            : s.type === 'released'
            ? new DisplayableError('canceled', 'show voice note', 'released')
            : null
        )}
        component={(err) =>
          err === null ? (
            <></>
          ) : (
            <View style={[OsehStyles.layout.column, { flexGrow: 1 }]}>
              <VerticalSpacer height={0} flexGrow={1} />
              <BoxError error={err} />
              <VerticalSpacer height={0} flexGrow={1} />
            </View>
          )
        }
      />
      <View style={styles.container}>
        <RenderGuardedComponent
          props={useMappedValueWithCallbacks(
            voiceNote.state,
            (s) => s?.audio?.playable?.state
          )}
          component={(audioState) =>
            audioState === undefined ? (
              <HorizontalSpacer width={12} />
            ) : (
              <RenderGuardedComponent
                props={audioState}
                component={(audio) => (
                  <>
                    <HorizontalSpacer width={12} />
                    <Pressable
                      style={OsehStyles.unstyling.buttonAsColumn}
                      onPress={async () => {
                        if (audio.type !== 'loaded') {
                          return;
                        }
                        const status = await audio.audio.getStatusAsync();
                        if (status.isLoaded && !status.isPlaying) {
                          if (status.positionMillis !== 0) {
                            await audio.audio.setPositionAsync(0);
                          }
                          await audio.play();
                        } else {
                          await audio.stop();
                        }
                      }}
                    >
                      <VerticalSpacer height={0} flexGrow={1} />
                      <AudioPlayPauseIcon audio={audio} />
                      <VerticalSpacer height={0} flexGrow={1} />
                    </Pressable>
                    <HorizontalSpacer width={12} />
                  </>
                )}
              />
            )
          }
        />
        <RenderGuardedComponent
          props={useMappedValueWithCallbacks(voiceNote.state, (s) =>
            s.type === 'recording' ? s : null
          )}
          component={(state) =>
            state === null ? (
              <></>
            ) : (
              <>
                <View
                  style={[OsehStyles.layout.column, { flexGrow: 1 }]}
                  onLayout={(e) => {
                    const width = e?.nativeEvent?.layout?.width;
                    if (
                      width !== undefined &&
                      !isNaN(width) &&
                      isFinite(width) &&
                      width >= 0
                    ) {
                      setVWC(barsContainerWidthVWC, width);
                    }
                  }}
                >
                  <RenderGuardedComponent
                    props={barsContainerWidthVWC}
                    component={(width) => (
                      <RecordingBars
                        intensity={
                          state.audio.analysis.timeVsAverageSignalIntensity
                        }
                        offset={
                          state.audio.analysis
                            .timeVsAverageSignalIntensityOffset
                        }
                        settings={{
                          width,
                          barWidth: 3,
                          barSpacing: 1,
                          height: 50,
                          color: OsehColors.v4.primary.light,
                          align: 'right',
                        }}
                      />
                    )}
                  />
                </View>
                <HorizontalSpacer width={18} />
                <DurationSince
                  since={state.recordingStartedAt.asDateNow}
                  style={[
                    OsehStyles.typography.body,
                    OsehStyles.colors.v4.primary.grey,
                  ]}
                />
                <HorizontalSpacer width={18} />
                <Pressable
                  style={OsehStyles.unstyling.buttonAsColumn}
                  onPress={() => {
                    voiceNote.sendMessage({ type: 'stop-recording' });
                  }}
                >
                  <VerticalSpacer height={0} flexGrow={1} />
                  <Stop
                    icon={{ width: 30 }}
                    container={{ width: 30, height: 30 }}
                    startPadding={{
                      x: { fraction: 0.5 },
                      y: { fraction: 0.5 },
                    }}
                    color={OsehColors.v4.primary.light}
                    color2={OsehColors.v4.primary.dark}
                  />
                  <VerticalSpacer height={0} flexGrow={1} />
                  <Text style={OsehStyles.assistive.srOnly}>
                    Stop recording
                  </Text>
                </Pressable>
                <HorizontalSpacer width={12} />
              </>
            )
          }
        />
        <RenderGuardedComponent
          props={useMappedValueWithCallbacks(voiceNote.state, (s) =>
            s.type === 'uploading' ||
            s.type === 'transcribing' ||
            s.type === 'local-ready'
              ? s
              : null
          )}
          component={(state) =>
            state === null ? (
              <></>
            ) : (
              <>
                <AutoWidthRecordedBars
                  audio={state.audio.playable}
                  audioDurationSeconds={state.audio.durationSeconds}
                  intensity={state.audio.timeVsAverageSignalIntensity}
                  height={44}
                />
                <HorizontalSpacer width={12} />
                <Text
                  style={[
                    OsehStyles.typography.body,
                    OsehStyles.colors.v4.primary.grey,
                  ]}
                >
                  {formatDurationClock(state.audio.durationSeconds, {
                    minutes: true,
                    seconds: true,
                    milliseconds: false,
                  })}
                </Text>
                <Pressable
                  style={OsehStyles.unstyling.buttonAsColumn}
                  onPress={async () => {
                    const current = state.audio.playable.state.get();
                    if (current.type !== 'loaded') {
                      return;
                    }

                    const status = await current.audio.getStatusAsync();
                    if (!status.isLoaded) {
                      return;
                    }

                    if (status.isPlaying) {
                      await current.stop();
                    }
                    if (status.positionMillis !== 0) {
                      await current.audio.setPositionAsync(0);
                    }
                    props.onSend(voiceNote);
                  }}
                >
                  <VerticalSpacer height={0} flexGrow={1} />
                  <Send
                    color={OsehColors.v4.primary.light}
                    color2={OsehColors.v4.primary.dark}
                    {...RESIZING_TEXT_AREA_ICON_SETTINGS}
                  />
                  <VerticalSpacer height={0} flexGrow={1} />
                  <Text style={OsehStyles.assistive.srOnly}>Send</Text>
                </Pressable>
              </>
            )
          }
        />
      </View>
    </View>
  );
};

const DurationSince = (props: {
  since: ValueWithCallbacks<number>;
  style: StyleProp<TextStyle>;
}) => {
  const durationSecondsVWC = useWritableValueWithCallbacks<number>(() =>
    Math.floor((Date.now() - props.since.get()) / 1000)
  );
  useValueWithCallbacksEffect(props.since, (since) => {
    let active = true;
    let timeout: NodeJS.Timeout | null = setTimeout(updateTime, 0);
    return () => {
      active = false;
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }
    };

    function updateTime() {
      timeout = null;
      if (!active) {
        return;
      }
      const now = Date.now();
      const timeSinceMS = now - since;
      const timeSinceSeconds = Math.floor(timeSinceMS / 1000);
      const timeUntilNextSecond = 1000 - (timeSinceMS % 1000);
      setVWC(durationSecondsVWC, timeSinceSeconds);
      timeout = setTimeout(updateTime, timeUntilNextSecond);
    }
  });
  return (
    <RenderGuardedComponent
      props={durationSecondsVWC}
      component={(seconds) => (
        <Text style={props.style}>
          {formatDurationClock(seconds, {
            minutes: true,
            seconds: true,
            milliseconds: false,
          })}
        </Text>
      )}
    />
  );
};
