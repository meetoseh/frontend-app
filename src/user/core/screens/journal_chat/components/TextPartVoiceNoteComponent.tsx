import { memo, useEffect } from 'react';
import { useWritableValueWithCallbacks } from '../../../../../shared/lib/Callbacks';
import { ScreenContext } from '../../../hooks/useScreenContext';
import {
  VoiceNoteStateLocalReady,
  VoiceNoteStateMachine,
  VoiceNoteStateRemoteReady,
  VoiceNoteStateRemoteSelectingExport,
  VoiceNoteStateTranscribing,
} from '../lib/createVoiceNoteStateMachine';
import {
  JournalChatState,
  JournalEntryItemTextualPartVoiceNote,
} from '../lib/JournalChatState';
import { constructCancelablePromise } from '../../../../../shared/lib/CancelablePromiseConstructor';
import { setVWC } from '../../../../../shared/lib/setVWC';
import { createValueWithCallbacksEffect } from '../../../../../shared/hooks/createValueWithCallbacksEffect';
import { RenderGuardedComponent } from '../../../../../shared/components/RenderGuardedComponent';
import { InlineOsehSpinner } from '../../../../../shared/components/InlineOsehSpinner';
import { OsehStyles } from '../../../../../shared/OsehStyles';
import { AudioPlayPauseIcon } from '../../../../../shared/components/voiceOrTextInput/AudioPlayPauseButton';
import { HorizontalSpacer } from '../../../../../shared/components/HorizontalSpacer';
import { AutoWidthRecordedBars } from '../../../../../shared/components/voiceOrTextInput/AutoWidthRecordedBars';
import { VerticalSpacer } from '../../../../../shared/components/VerticalSpacer';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { makeTextError } from '../../../../../shared/lib/describeError';

/**
 * Renders a voice note that came from within a journal entry item. This will
 * render assuming a dark background, but will not actually include a
 * background.
 *
 * This will use a minimum of 200px width, but works best if within a flex
 * column aligning stretch to set the width larger.
 */
export const TextPartVoiceNoteComponent = memo(
  ({
    ctx,
    refreshChat,
    part,
    voiceNote,
    fixedHeight,
  }: {
    ctx: ScreenContext;
    fixedHeight?: boolean;
  } & (
    | {
        refreshChat: () => Promise<JournalChatState | null | undefined>;
        part: JournalEntryItemTextualPartVoiceNote;
        voiceNote?: undefined;
      }
    | {
        refreshChat?: undefined;
        part?: undefined;
        voiceNote: VoiceNoteStateMachine;
      }
  )) => {
    const voiceNoteVWC = useWritableValueWithCallbacks<
      | VoiceNoteStateRemoteSelectingExport
      | VoiceNoteStateTranscribing
      | VoiceNoteStateLocalReady
      | VoiceNoteStateRemoteReady
      | null
    >(() => null);

    const heightForFixedHeight = (() => {
      const scaledSize = Dimensions.get('screen');
      return 80 * Math.max(scaledSize.fontScale, 1);
    })();

    useEffect(() => {
      if (part === undefined) {
        return createValueWithCallbacksEffect(voiceNote.state, (s) => {
          if (
            s.type === 'remote-selecting-export' ||
            s.type === 'transcribing' ||
            s.type === 'local-ready' ||
            s.type === 'remote-ready'
          ) {
            setVWC(voiceNoteVWC, s);
            return () => {
              setVWC(voiceNoteVWC, null);
            };
          }
          setVWC(voiceNoteVWC, null);
          return undefined;
        });
      }

      const requestResult = ctx.resources.voiceNoteHandler.request({
        ref: {
          voiceNoteUID: part.voice_note_uid,
          voiceNoteJWT: part.voice_note_jwt,
        },
        refreshRef: () =>
          constructCancelablePromise({
            body: async (state, resolve, reject) => {
              const newChat = await refreshChat();
              if (newChat === null || newChat === undefined) {
                state.finishing = true;
                state.done = true;
                resolve({
                  type: 'error',
                  data: undefined,
                  error: makeTextError('failed to refresh chat'),
                  retryAt: undefined,
                });
                return;
              }

              for (const data of newChat.data) {
                if (data.data.type === 'textual') {
                  for (const subpart of data.data.parts) {
                    if (
                      subpart.type === 'voice_note' &&
                      subpart.voice_note_uid === part.voice_note_uid
                    ) {
                      state.finishing = true;
                      state.done = true;
                      resolve({
                        type: 'success',
                        data: {
                          voiceNoteUID: part.voice_note_uid,
                          voiceNoteJWT: part.voice_note_jwt,
                        },
                        error: undefined,
                        retryAt: undefined,
                      });
                      return;
                    }
                  }
                }
              }

              state.finishing = true;
              state.done = true;
              resolve({
                type: 'error',
                data: undefined,
                error: makeTextError('voice note no longer in this chat'),
                retryAt: undefined,
              });
            },
          }),
      });

      const cleanupAttacher = createValueWithCallbacksEffect(
        requestResult.data,
        (d) => {
          if (d.type !== 'success') {
            setVWC(voiceNoteVWC, null);
            return;
          }

          return createValueWithCallbacksEffect(d.data.state, (s) => {
            if (
              s.type === 'transcribing' ||
              s.type === 'local-ready' ||
              s.type === 'remote-ready'
            ) {
              setVWC(voiceNoteVWC, s, Object.is);
              return () => {
                setVWC(voiceNoteVWC, null);
              };
            }
            setVWC(voiceNoteVWC, null);
            return undefined;
          });
        }
      );

      return () => {
        cleanupAttacher();
        requestResult.release();
      };
    }, [ctx, part, voiceNote, voiceNoteVWC, refreshChat]);

    return (
      <RenderGuardedComponent
        props={voiceNoteVWC}
        component={(voiceNote) =>
          voiceNote === null ? (
            <View style={OsehStyles.layout.column}>
              <View
                style={[
                  OsehStyles.layout.row,
                  fixedHeight
                    ? { height: heightForFixedHeight, overflow: 'hidden' }
                    : { minHeight: 44 },
                ]}
              >
                <InlineOsehSpinner
                  size={{
                    type: 'react-rerender',
                    props: {
                      width: 20,
                    },
                  }}
                  variant="white"
                />
              </View>
            </View>
          ) : (
            <View
              style={[
                OsehStyles.layout.column,
                fixedHeight
                  ? { height: heightForFixedHeight, overflow: 'hidden' }
                  : {},
              ]}
            >
              <View style={OsehStyles.layout.row}>
                <Pressable
                  style={OsehStyles.unstyling.buttonAsColumn}
                  onPress={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (voiceNote.audio.playable === undefined) {
                      return;
                    }

                    const current = voiceNote.audio.playable.state.get();
                    if (current.type !== 'loaded') {
                      return;
                    }

                    const state = await current.audio.getStatusAsync();
                    if (!state.isLoaded) {
                      await current.stop();
                      return;
                    }

                    if (state.isPlaying) {
                      await current.stop();
                    } else {
                      if (state.positionMillis !== 0) {
                        await current.audio.setPositionAsync(0);
                      }
                      await current.play();
                    }
                  }}
                >
                  {voiceNote.audio.playable !== undefined ? (
                    <RenderGuardedComponent
                      props={voiceNote.audio.playable.state}
                      component={(state) => (
                        <AudioPlayPauseIcon audio={state} />
                      )}
                    />
                  ) : (
                    <InlineOsehSpinner
                      size={{ type: 'react-rerender', props: { width: 32 } }}
                    />
                  )}
                </Pressable>
                <HorizontalSpacer width={8} />
                <AutoWidthRecordedBars
                  audio={voiceNote.audio.playable}
                  audioDurationSeconds={voiceNote.audio.durationSeconds}
                  intensity={voiceNote.audio.timeVsAverageSignalIntensity}
                  height={44}
                />
              </View>
              {voiceNote.type !== 'transcribing' && (
                <>
                  <VerticalSpacer height={4} />
                  <Text
                    style={[
                      OsehStyles.typography.detail2,
                      OsehStyles.colors.v4.primary.grey,
                    ]}
                    {...(fixedHeight
                      ? {
                          numberOfLines: 2,
                          ellipsizeMode: 'tail',
                        }
                      : {})}
                  >
                    {voiceNote.transcript.usable.phrases
                      .map((p) => p.phrase)
                      .join(' ')}
                  </Text>
                </>
              )}
            </View>
          )
        }
      />
    );
  }
);
