import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View, ViewStyle } from 'react-native';
import { useScreenSize } from '../../shared/hooks/useScreenSize';
import { useTopBarHeight } from '../../shared/hooks/useTopBarHeight';
import Checked from '../../shared/icons/Checked';
import Unchecked from '../../shared/icons/Unchecked';
import { apiFetch } from '../../shared/lib/apiFetch';
import { easeInOut } from '../../shared/lib/Bezier';
import { JourneyPromptProps } from '../models/JourneyPromptProps';
import { JourneyPromptText } from './JourneyPromptText';
import { styles } from './JourneyWordPromptStyles';

type PromptWord = {
  index: number;
  text: string;
};

const rowHeight = styles.wordRow.height;
const promptRowsGap = 32;

/**
 * Shows a prompt text with several answer options, and allows the user to
 * select one of them. Each option is filled horizontally based on the
 * percentage of users who selected that option.
 */
export const JourneyWordPrompt = ({
  prompt,
  setHeight: setOuterHeight,
  stats,
  journeyTime,
  loginContext,
  journeyLobbyDurationSeconds,
  journeyUid,
  journeyJwt,
  sessionUid,
}: JourneyPromptProps) => {
  if (prompt.style !== 'word') {
    throw new Error('Invalid prompt style: ' + prompt.style);
  }

  const [titleHeight, setTitleHeight] = useState(0);
  const screenSize = useScreenSize();
  const topBarHeight = useTopBarHeight();
  const [promptResponse, setPromptResponse] = useState<number | null>(null);

  // we want pressing the button to immediately react, but stats won't come in
  // for a second or so, so we alter the stats temporarily
  const [fakingMove, setFakingMove] = useState<FakedMove | null>(null);

  const wordRows = useMemo<PromptWord[][]>(() => {
    const wordsPerRow = Math.ceil(prompt.options.length / 3);
    const rows: PromptWord[][] = [];
    for (let i = 0; i < prompt.options.length; i += wordsPerRow) {
      const row: PromptWord[] = [];
      for (let j = 0; j < wordsPerRow && i + j < prompt.options.length; j++) {
        row.push({
          index: i + j,
          text: prompt.options[i + j],
        });
      }
      rows.push(row);
    }
    return rows;
  }, [prompt.options]);

  const rowGap = useMemo<number>(() => {
    if (wordRows.length < 3 || screenSize.height - topBarHeight > 633) {
      return 32;
    }
    return 18;
  }, [wordRows.length, screenSize.height, topBarHeight]);

  const wordRowHeight: number = useMemo(() => {
    return wordRows.length * rowHeight + (wordRows.length - 1) * rowGap;
  }, [wordRows, rowGap]);

  const height = useMemo(() => {
    if (titleHeight <= 0) {
      return 0;
    }
    return titleHeight + promptRowsGap + wordRowHeight;
  }, [titleHeight, wordRowHeight]);

  useEffect(() => {
    if (setOuterHeight) {
      setOuterHeight(height);
    }
  }, [height, setOuterHeight]);

  const containerStyle = useMemo<ViewStyle>(() => {
    if (height <= 0) {
      return styles.container;
    }

    // the 1e-4 is necessary on android, not sure why
    return Object.assign({}, styles.container, {
      height: height + 1e-4,
      maxHeight: height + 1e-4,
    });
  }, [height]);

  const wordRowsStyle = useMemo<ViewStyle>(() => {
    return Object.assign({}, styles.wordRows, {
      height: promptRowsGap + wordRowHeight,
      maxHeight: promptRowsGap + wordRowHeight,
      paddingTop: promptRowsGap,
    });
  }, [wordRowHeight]);

  const onChooseWord = useCallback(
    async (word: string) => {
      const index = prompt.options.indexOf(word);
      if (index < 0) {
        return;
      }
      if (promptResponse === index) {
        return;
      }

      setFakingMove({
        fromIndex: promptResponse,
        toIndex: index,
        fakeEndsAt: journeyTime.time.current + 1500,
        cancelFakeToMin: stats.wordActive === null ? 1 : stats.wordActive[index] + 1,
      });
      setPromptResponse(index);

      if (loginContext.state !== 'logged-in') {
        console.log('not sending word prompt response because not logged in');
        return;
      }

      const now = journeyTime.time.current;
      if (now <= 250 || now >= journeyLobbyDurationSeconds * 1000 - 250) {
        console.log('not sending word prompt response; too close to start or end of journey');
        return;
      }

      try {
        const response = await apiFetch(
          '/api/1/journeys/events/respond_word_prompt',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({
              journey_uid: journeyUid,
              journey_jwt: journeyJwt,
              session_uid: sessionUid,
              journey_time: now / 1000,
              data: {
                index: index,
              },
            }),
          },
          loginContext
        );

        if (!response.ok) {
          throw response;
        }
      } catch (e) {
        if (e instanceof TypeError) {
          console.error('failed to send word prompt; could not connect to server:', e);
        } else if (e instanceof Response) {
          const data = await e.json();
          console.error('failed to send word prompt; server rejected request:', data);
        } else {
          console.error('failed to send word prompt; unknown error:', e);
        }
      }
    },
    [
      loginContext,
      journeyUid,
      journeyJwt,
      sessionUid,
      prompt.options,
      journeyTime.time,
      journeyLobbyDurationSeconds,
      promptResponse,
      stats.wordActive,
    ]
  );

  // don't want to unmount faking move every time stats updates
  const wordActiveRef = useRef<number[] | null>(stats.wordActive);
  wordActiveRef.current = stats.wordActive;
  useEffect(() => {
    if (fakingMove === null) {
      return;
    }

    if (
      wordActiveRef.current !== null &&
      wordActiveRef.current[fakingMove.toIndex] >= fakingMove.cancelFakeToMin
    ) {
      setFakingMove(null);
      return;
    }

    if (journeyTime.time.current >= fakingMove.fakeEndsAt) {
      setFakingMove(null);
      return;
    }

    let active = true;
    const onTimeChange = (oldTime: DOMHighResTimeStamp, newTime: DOMHighResTimeStamp) => {
      if (!active) {
        return;
      }

      if (
        newTime < fakingMove.fakeEndsAt &&
        (wordActiveRef.current === null ||
          wordActiveRef.current[fakingMove.toIndex] < fakingMove.cancelFakeToMin)
      ) {
        return;
      }

      setFakingMove(null);
      unmount();
    };

    const predictedIndex = journeyTime.onTimeChanged.current.length;
    journeyTime.onTimeChanged.current.push(onTimeChange);

    const unmount = () => {
      if (!active) {
        return;
      }

      active = false;
      for (
        let i = Math.min(predictedIndex, journeyTime.onTimeChanged.current.length);
        i >= 0;
        i--
      ) {
        if (journeyTime.onTimeChanged.current[i] === onTimeChange) {
          journeyTime.onTimeChanged.current.splice(i, 1);
          break;
        }
      }
    };
    return unmount;
  }, [journeyTime.onTimeChanged, journeyTime.time, fakingMove]);

  const boundOnPress = useMemo(() => {
    const bound: ((() => void) | null)[] = [];
    for (let i = 0; i < wordRows.length; i++) {
      for (let j = 0; j < wordRows[i].length; j++) {
        bound[wordRows[i][j].index] = onChooseWord.bind(null, wordRows[i][j].text);
      }
    }
    return bound;
  }, [wordRows, onChooseWord]);

  const wordBackgroundWidths = useMemo<number[]>(() => {
    const wordActive =
      stats.wordActive === null
        ? Array.from({ length: prompt.options.length }, () => 0)
        : fakingMove === null
        ? stats.wordActive
        : stats.wordActive.map((active, i) => {
            if (i === fakingMove.toIndex) {
              return active + 1;
            }
            if (i === fakingMove.fromIndex) {
              return Math.max(active - 1, 0);
            }
            return active;
          });

    const totalResponses = wordActive.reduce((a, b) => a + b, 0);

    if (totalResponses === 0) {
      return wordActive;
    }

    const columnGap = styles.wordNotFirst.marginLeft;
    const rowWidth = screenSize.width - styles.wordRows.paddingLeft - styles.wordRows.paddingRight;
    const wordsPerRow = wordRows[0].length;
    const wordWidth = (rowWidth - (wordsPerRow - 1) * columnGap) / wordsPerRow;
    return wordActive.map((active) => {
      const fraction = active / totalResponses;
      return wordWidth * fraction;
    });
  }, [wordRows, stats.wordActive, fakingMove, screenSize.width, prompt.options.length]);

  const wordBackgroundRefs = useRef<(View | null)[]>([]);
  useEffect(() => {
    const oldArr = wordBackgroundRefs.current;
    const newArr: (View | null)[] = Array.from({ length: prompt.options.length }, () => null);
    for (let i = 0; i < oldArr.length && i < newArr.length; i++) {
      newArr[i] = oldArr[i];
    }
    wordBackgroundRefs.current = newArr;
  }, [prompt.options.length]);

  const boundSetRef = useMemo<((ref: View | null) => void)[]>(() => {
    const bound: ((ref: View | null) => void)[] = [];
    for (let i = 0; i < wordRows.length; i++) {
      for (let j = 0; j < wordRows[i].length; j++) {
        bound[wordRows[i][j].index] = (ref) => {
          wordBackgroundRefs.current[wordRows[i][j].index] = ref;
        };
      }
    }
    return bound;
  }, [wordRows]);

  const wordBackgroundWidthsRef = useRef<number[]>([]);
  wordBackgroundWidthsRef.current = wordBackgroundWidths;
  const awakenWordBackgroundAnimationsRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (awakenWordBackgroundAnimationsRef.current === null) {
      return;
    }
    awakenWordBackgroundAnimationsRef.current();
  }, [wordBackgroundWidths]);

  const currentWordWidths = useRef<number[] | null>(null);
  useEffect(() => {
    const animDuration = 350;
    const currentWidths: number[] = Array.from({ length: prompt.options.length }, () => 0);
    const animations: ({ startedAt: number; from: number; to: number } | null)[] = Array.from(
      { length: prompt.options.length },
      () => null
    );

    currentWordWidths.current = currentWidths;

    let awake = true;
    let active = true;
    awakenWordBackgroundAnimationsRef.current = () => {
      if (!active || awake) {
        return;
      }
      awake = true;
      requestAnimationFrame(updateWidths);
    };

    requestAnimationFrame(updateWidths);
    return () => {
      awake = false;
      active = false;
      currentWordWidths.current = null;
      awakenWordBackgroundAnimationsRef.current = null;
    };

    function updateWidths(now: DOMHighResTimeStamp) {
      if (!awake || !active) {
        return;
      }
      awake = false;

      const correctWidths = wordBackgroundWidthsRef.current;
      if (correctWidths.length !== currentWidths.length) {
        // we should get unmounted
        for (let i = 0; i < currentWidths.length; i++) {
          currentWidths[i] = -1;
        }
        return;
      }

      let anyAnimating = false;
      for (let i = 0; i < correctWidths.length; i++) {
        const currentAnim = animations[i];
        if (currentWidths[i] === correctWidths[i]) {
          animations[i] = null;
        } else if (currentAnim !== null && currentAnim.to === correctWidths[i]) {
          if (currentAnim.startedAt + animDuration <= now) {
            animations[i] = null;
          } else {
            anyAnimating = true;
          }
        } else {
          animations[i] = {
            startedAt: now,
            from: currentWidths[i],
            to: correctWidths[i],
          };
          anyAnimating = true;
        }
      }

      for (let i = 0; i < correctWidths.length; i++) {
        const anim = animations[i];
        const view = wordBackgroundRefs.current[i];
        if (view === null) {
          currentWidths[i] = -1;
          continue;
        }

        if (anim !== null) {
          const progress = (now - anim.startedAt) / animDuration;
          const easedProgress = easeInOut.y_x(progress);
          const newWidth = Math.max(anim.from + (anim.to - anim.from) * easedProgress, 0);
          currentWidths[i] = newWidth;
          view.setNativeProps({
            style: Object.assign({}, styles.wordBackground, { width: newWidth }),
          });
        } else if (correctWidths[i] !== currentWidths[i]) {
          currentWidths[i] = correctWidths[i];
          view.setNativeProps({
            style: Object.assign({}, styles.wordBackground, { width: correctWidths[i] }),
          });
        }
      }

      if (anyAnimating) {
        awake = true;
        requestAnimationFrame(updateWidths);
      }
    }
  }, [prompt.options.length]);

  return (
    <View style={containerStyle}>
      <JourneyPromptText text={prompt.text} setHeight={setTitleHeight} />
      <View style={wordRowsStyle}>
        {wordRows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.wordRow}>
            {row.map((word, wordIndexInRow) => (
              <Pressable
                key={`${word.text}-${word.index}`}
                style={wordIndexInRow === 0 ? styles.word : styles.wordNotFirst}
                onPress={boundOnPress[word.index]}>
                <View
                  style={
                    currentWordWidths.current === null
                      ? styles.wordBackgroundEmpty
                      : Object.assign({}, styles.wordBackground, {
                          width: currentWordWidths.current[word.index],
                        })
                  }
                  ref={boundSetRef[word.index]}
                />
                {promptResponse === word.index ? (
                  <Checked width={20} height={20} />
                ) : (
                  <Unchecked width={20} height={20} />
                )}
                <Text style={styles.wordText}>{word.text}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

type FakedMove = {
  fromIndex: number | null;
  toIndex: number;

  fakeEndsAt: DOMHighResTimeStamp;
  cancelFakeToMin: number;
};
