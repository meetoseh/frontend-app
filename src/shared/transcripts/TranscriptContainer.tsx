import { ReactElement } from 'react';
import { ValueWithCallbacks } from '../lib/Callbacks';
import { OsehTranscriptPhrase } from './OsehTranscript';
import { RenderGuardedComponent } from '../components/RenderGuardedComponent';
import { styles } from './TranscriptContainerStyles';
import { TranscriptPhrase } from './TranscriptPhrase';
import { View } from 'react-native';

export type TranscriptContainerProps = {
  /** The current time in seconds from the start of the content */
  currentTime: ValueWithCallbacks<number>;
  /** The phrases which are currently visible */
  currentTranscriptPhrases: ValueWithCallbacks<
    { phrase: OsehTranscriptPhrase; id: number }[]
  >;
};

/**
 * Renders the transcript, consisting of multiple phrases
 */
export const TranscriptContainer = ({
  currentTime,
  currentTranscriptPhrases,
}: TranscriptContainerProps): ReactElement => (
  <View style={styles.container}>
    <RenderGuardedComponent
      props={currentTranscriptPhrases}
      component={(phrases) => (
        <>
          {phrases.map(({ phrase, id }) => (
            <TranscriptPhrase
              phrase={phrase}
              currentTime={currentTime}
              key={id}
            >
              {phrase.phrase}
            </TranscriptPhrase>
          ))}
        </>
      )}
    />
  </View>
);
