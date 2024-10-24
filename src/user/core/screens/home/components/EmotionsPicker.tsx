import { Fragment, PropsWithChildren, ReactElement, useEffect } from 'react';
import {
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../../../shared/lib/Callbacks';
import { Emotion } from '../../../../../shared/models/Emotion';
import { useValuesWithCallbacksEffect } from '../../../../../shared/hooks/useValuesWithCallbacksEffect';
import { setVWC } from '../../../../../shared/lib/setVWC';
import { styles } from './EmotionsPickerStyles';
import { useMappedValueWithCallbacks } from '../../../../../shared/hooks/useMappedValueWithCallbacks';
import { useMappedValuesWithCallbacks } from '../../../../../shared/hooks/useMappedValuesWithCallbacks';
import { RenderGuardedComponent } from '../../../../../shared/components/RenderGuardedComponent';
import { View, Text, ViewStyle, ScrollView, Pressable } from 'react-native';
import { VerticalSpacer } from '../../../../../shared/components/VerticalSpacer';
import { HorizontalSpacer } from '../../../../../shared/components/HorizontalSpacer';

/**
 * Allows the user to pick from the given emotions via a series of
 * horizontally scrollable rows. The number of rows is chosen to
 * approximately fill the available space.
 *
 * In order to decide the number of rows, the amount of height needs
 * to be known in javascript. This will use a combination of the hint
 * provided and the actual space.
 *
 * This MUST be rendered within a flex container (i.e., display: flex)
 * in the column direction. The returned element will always have some
 * combination of flex-grow, flex-shrink, and flex-basis set that it
 * will automatically size to the smaller of the tallest height it wants
 * and the height of the container. `expectedHeight` SHOULD be the
 * height that this container would get if it was configured to
 * consume as much space as possible without scrolling (i.e., flex-grow \
 * set to an infinite value).
 *
 * This component can handle if the expected height is off, but in
 * react native it may cause a 1-frame flicker
 */
export const EmotionsPicker = ({
  emotions: emotionsVWC,
  onTapEmotion,
  expectedHeight: expectedHeightVWC,
  contentWidth: contentWidthVWC,
  question,
}: {
  emotions: ValueWithCallbacks<Emotion[] | null>;
  onTapEmotion: (emotion: Emotion) => void;
  expectedHeight: ValueWithCallbacks<number>;
  contentWidth: ValueWithCallbacks<number>;
  question: string | null;
}): ReactElement => {
  const heightVWC = useWritableValueWithCallbacks(() =>
    expectedHeightVWC.get()
  );

  const questionHeightVWC = useWritableValueWithCallbacks<number>(() =>
    question === null ? 0 : 48
  );
  useEffect(() => {
    if (question === null) {
      setVWC(questionHeightVWC, 0);
    }
  }, [question, questionHeightVWC]);

  const rowHeight = 60;
  const rowGap = 12;

  const numRowsVWC = useMappedValuesWithCallbacks(
    [heightVWC, questionHeightVWC],
    () => {
      const questionLineHeight = questionHeightVWC.get();
      const questionSpacer = question === null ? 0 : 16;
      const h = heightVWC.get();
      return Math.max(
        Math.min(
          Math.floor(
            (h - questionLineHeight - questionSpacer) / (rowHeight + rowGap)
          ),
          4
        ),
        1
      );
    }
  );
  const rowsVWC = useMappedValuesWithCallbacks(
    [emotionsVWC, numRowsVWC],
    (): Emotion[][] => {
      const emotions = emotionsVWC.get();
      const rows = numRowsVWC.get();

      if (emotions === null) {
        return [];
      }

      const numPerRow = Math.ceil(emotions.length / rows);
      if (numPerRow === 0) {
        return [];
      }

      const result: Emotion[][] = [];
      for (let i = 0; i < rows; i++) {
        result.push(emotions.slice(i * numPerRow, (i + 1) * numPerRow));
      }

      // iteratively fix jumps of 2 or more by moving emotions from earlier rows
      // to later rows; this has to end at some point because each step moves an
      // emotion from row i to i+1, and there are finitely many emotions. in
      // practice, it usually does at most 2 iterations
      while (true) {
        let foundImprovement = false;
        for (let i = 0; i < rows - 1; i++) {
          if (result[i].length - result[i + 1].length > 1) {
            const toMove = result[i].pop()!;
            result[i + 1].unshift(toMove);
            foundImprovement = true;
          }
        }
        if (!foundImprovement) {
          break;
        }
      }

      return result;
    }
  );

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        setVWC(
          heightVWC,
          e?.nativeEvent?.layout?.height ?? expectedHeightVWC.get()
        );
      }}
    >
      <VerticalSpacer height={0} flexGrow={1} />
      {question !== null && (
        <>
          <Text
            style={styles.question}
            onLayout={(e) => {
              setVWC(questionHeightVWC, e?.nativeEvent?.layout?.height ?? 48);
            }}
          >
            {question}
          </Text>
          <VerticalSpacer height={16} />
        </>
      )}
      <RenderGuardedComponent
        props={rowsVWC}
        component={(rows) => (
          <>
            {rows.map((row, i) => (
              <Fragment key={i}>
                {i !== 0 && <VerticalSpacer height={rowGap} />}
                <EmotionRow
                  emotions={row}
                  onTapEmotion={onTapEmotion}
                  contentWidth={contentWidthVWC}
                />
              </Fragment>
            ))}
          </>
        )}
      />
      <VerticalSpacer height={0} flexGrow={1} />
    </View>
  );
};

const EmotionRow = ({
  emotions,
  onTapEmotion,
  contentWidth: contentWidthVWC,
}: {
  emotions: Emotion[];
  onTapEmotion: (emotion: Emotion) => void;
  contentWidth: ValueWithCallbacks<number>;
}): ReactElement => {
  const rowRef = useWritableValueWithCallbacks<ScrollView | null>(() => null);
  const rowStyleVWC = useMappedValueWithCallbacks(
    contentWidthVWC,
    (w): ViewStyle =>
      Object.assign({}, styles.row, {
        width: w,
        maxWidth: w,
      })
  );
  useValuesWithCallbacksEffect([rowRef, rowStyleVWC], () => {
    const ele = rowRef.get();
    const s = rowStyleVWC.get();
    if (ele !== null) {
      ele.setNativeProps({ style: s });
    }
    return undefined;
  });

  return (
    <ScrollView
      ref={(r) => setVWC(rowRef, r)}
      style={rowStyleVWC.get()}
      contentContainerStyle={styles.rowContent}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      <CenteringView
        style={styles.rowContentInner}
        parentWidthVWC={contentWidthVWC}
        scrollViewRef={rowRef}
      >
        {emotions.map((emotion, i) => (
          <Fragment key={i}>
            {i !== 0 && <HorizontalSpacer width={16} />}
            <EmotionButton emotion={emotion} onTapEmotion={onTapEmotion} />
          </Fragment>
        ))}
      </CenteringView>
    </ScrollView>
  );
};

const CenteringView = ({
  parentWidthVWC,
  scrollViewRef,
  style,
  children,
}: PropsWithChildren<{
  parentWidthVWC: ValueWithCallbacks<number>;
  scrollViewRef: ValueWithCallbacks<ScrollView | null>;
  style?: ViewStyle;
}>): ReactElement => {
  const viewRef = useWritableValueWithCallbacks<View | null>(() => null);
  const viewStyleVWC = useMappedValueWithCallbacks(
    parentWidthVWC,
    (w): ViewStyle =>
      Object.assign({}, style, {
        minWidth: w,
      })
  );
  const viewWidthVWC = useWritableValueWithCallbacks<number>(() =>
    parentWidthVWC.get()
  );

  useValuesWithCallbacksEffect(
    [scrollViewRef, parentWidthVWC, viewWidthVWC],
    () => {
      const scrollView = scrollViewRef.get();
      if (scrollView === null) {
        return;
      }
      const parentWidth = parentWidthVWC.get();
      const width = viewWidthVWC.get();
      if (parentWidth >= width) {
        scrollView.scrollTo({ x: 0, animated: false });
      } else {
        scrollView.scrollTo({ x: (width - parentWidth) / 2, animated: false });
      }
      return undefined;
    }
  );

  return (
    <View
      style={viewStyleVWC.get()}
      ref={(r) => setVWC(viewRef, r)}
      onLayout={(e) => {
        const realWidth = e?.nativeEvent?.layout?.width ?? parentWidthVWC.get();
        setVWC(viewWidthVWC, realWidth);
      }}
    >
      {children}
    </View>
  );
};

const EmotionButton = ({
  emotion,
  onTapEmotion,
}: {
  emotion: Emotion;
  onTapEmotion: (emotion: Emotion) => void;
}): ReactElement => {
  return (
    <Pressable
      style={styles.button}
      onPress={() => {
        onTapEmotion(emotion);
      }}
    >
      <Text style={styles.buttonText}>{emotion.word}</Text>
    </Pressable>
  );
};
