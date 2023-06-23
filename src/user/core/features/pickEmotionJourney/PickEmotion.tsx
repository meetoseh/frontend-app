import {
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable, Text, View } from "react-native";
import { FeatureComponentProps } from "../../models/Feature";
import { PickEmotionJourneyResources } from "./PickEmotionJourneyResources";
import { PickEmotionJourneyState } from "./PickEmotionJourneyState";
import { styles } from "./PickEmotionStyles";
import { OsehImageBackgroundFromState } from "../../../../shared/images/OsehImageBackgroundFromState";
import { OsehImageFromState } from "../../../../shared/images/OsehImageFromState";
import { LoginContext } from "../../../../shared/contexts/LoginContext";
import EmptyHeart from "./icons/EmptyHeart";
import {
  Callbacks,
  ValueWithCallbacks,
  WritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from "../../../../shared/lib/Callbacks";
import {
  TrivialAnimator,
  VariableStrategyProps,
  inferAnimators,
} from "../../../../shared/anim/AnimationLoop";
import { ease } from "../../../../shared/lib/Bezier";
import { useAnimatedValueWithCallbacks } from "../../../../shared/anim/useAnimatedValueWithCallbacks";
import { useWindowSize } from "../../../../shared/hooks/useWindowSize";
import {
  LinearGradientBackground,
  LinearGradientState,
} from "../../../../shared/anim/LinearGradientBackground";

/**
 * Allows the user to pick an emotion and then go to that class
 */
export const PickEmotion = ({
  resources,
}: FeatureComponentProps<
  PickEmotionJourneyState,
  PickEmotionJourneyResources
> & {
  gotoJourney: () => void;
}): ReactElement => {
  const loginContext = useContext(LoginContext);
  const words = useMemo(
    () => resources.options?.words?.map((opt) => opt.word) ?? [],
    [resources.options]
  );
  const [tentativelyPressedIndex, setTentativelyPressedIndex] = useState<
    number | null
  >(null);
  const pressed = useMemo<{
    index: number;
    votes: number | null;
  } | null>(() => {
    if (resources.options === null) {
      return null;
    }

    if (resources.selected !== null) {
      const sel = resources.selected;

      const idx = resources.options.words.findIndex(
        (opt) => opt.word === sel.word.word
      );
      if (idx < 0) {
        return null;
      }

      return {
        index: idx,
        votes: resources.selected.numVotes,
      };
    }

    if (tentativelyPressedIndex !== null) {
      return {
        index: tentativelyPressedIndex,
        votes: null,
      };
    }

    return null;
  }, [resources.selected, resources.options, tentativelyPressedIndex]);

  const windowSize = useWindowSize();

  const onWordClick = useCallback(
    (word: string, index: number) => {
      setTentativelyPressedIndex(index);
      resources.onSelect.call(undefined, resources.options!.words[index]);
    },
    [resources.onSelect, resources.options]
  );

  return (
    <View style={styles.container}>
      {resources.error}
      <OsehImageBackgroundFromState
        state={resources.background}
        style={styles.content}
      >
        <View style={styles.topNav}>
          <View style={styles.settingsLink}>
            {resources.profilePicture.state === "available" && (
              <OsehImageFromState
                state={resources.profilePicture.image}
                style={styles.profilePic}
              />
            )}
            <View style={styles.settingsMessages}>
              <Text style={styles.greeting}>
                Hi {loginContext.userAttributes?.givenName ?? "there"} 👋
              </Text>
              <Text style={styles.greetingAction}>Daily Check-in</Text>
            </View>
          </View>
          <View style={styles.favoritesLink}>
            <EmptyHeart />
            <Text style={styles.favoritesLinkText}> Favorites</Text>
          </View>
        </View>
        <Words
          options={words}
          onWordClick={onWordClick}
          pressed={pressed}
          layout={resources.selected === null ? "horizontal" : "vertical"}
        />
      </OsehImageBackgroundFromState>
    </View>
  );
};

type Pos = { x: number; y: number };
type Size = { width: number; height: number };

const computeHorizontalPositions = (
  windowSize: Size,
  words: Size[]
): { positions: Pos[]; size: Size } => {
  // This is essentially a flex row with line break, aligned center,
  // with a 10px horizontal gap and 24px vertical gap, and a 24px
  // left/right margin.
  const xGap = 10;
  const yGap = 24;

  const centerX = windowSize.width / 2;
  const maxRowWidth = Math.min(390 - 48, windowSize.width - 48);

  let y = 0;
  let currentRow: Size[] = [];
  let currentRowWidth = 0;
  let widestRow = 0;
  const positions: Pos[] = [];

  function breakRow() {
    if (currentRow.length === 0) {
      throw new Error("Can't break row with no words");
    }

    if (y > 0) {
      y += yGap;
    }

    let rowHeight = currentRow[0].height;
    for (let i = 1; i < currentRow.length; i++) {
      if (currentRow[i].height > rowHeight) {
        rowHeight = currentRow[i].height;
      }
    }

    let x = centerX - currentRowWidth / 2;
    for (let i = 0; i < currentRow.length; i++) {
      positions.push({ x, y });
      x += currentRow[i].width + xGap;
    }
    y += rowHeight;
    if (x > widestRow) {
      widestRow = x;
    }
  }

  for (let i = 0; i < words.length; i++) {
    const widthRowWithWord =
      currentRow.length === 0
        ? words[i].width
        : currentRowWidth + 10 + words[i].width;
    if (widthRowWithWord < maxRowWidth) {
      if (i === words.length - 2 && currentRow.length >= 2) {
        // avoid widowing
        const widthRowWithLastWord = widthRowWithWord + 10 + words[i + 1].width;
        if (widthRowWithLastWord >= maxRowWidth) {
          breakRow();
          currentRow = [words[i]];
          currentRowWidth = words[i].width;
          continue;
        }
      }
      currentRow.push(words[i]);
      currentRowWidth = widthRowWithWord;
      continue;
    }

    breakRow();
    currentRow = [words[i]];
    currentRowWidth = words[i].width;
  }

  if (currentRow.length > 0) {
    breakRow();
  }

  return {
    positions,
    size: { width: windowSize.width, height: y },
  };
};

const computeVerticalPositions = (
  windowSize: Size,
  words: Size[]
): { positions: Pos[]; size: Size } => {
  // two-column layout, left-aligned, with an 8px vertical gap
  // and a 80px horizontal gap. We'll reduce the horizontal gap
  // if there isn't enough space. We layout as if the second column
  // is a bit wider, which essentially shifts the whole layout left
  // by half that amount. I don't know why, but it looks more centered that
  // way
  const bonusWidthForSecondColumn = 24;
  let xGap = 80;
  const yGap = 8;

  const column1Words: Size[] = [];
  const column2Words: Size[] = [];

  for (let i = 0; i < words.length; i++) {
    if (i % 2 === 0) {
      column1Words.push(words[i]);
    } else {
      column2Words.push(words[i]);
    }
  }

  const column1Positions: Pos[] = [];
  const column2Positions: Pos[] = [];

  const column1Width = column1Words.reduce(
    (acc, cur) => Math.max(acc, cur.width),
    0
  );
  const column2Width =
    column2Words.reduce((acc, cur) => Math.max(acc, cur.width), 0) +
    bonusWidthForSecondColumn;
  let totalWidth = column1Width + xGap + column2Width;
  if (totalWidth > windowSize.width - 40) {
    xGap = windowSize.width - 40 - column1Width - column2Width;
    totalWidth = windowSize.width - 40;
  }

  let x = (windowSize.width - totalWidth) / 2;
  let y = 0;
  for (let i = 0; i < column1Words.length; i++) {
    if (i > 0) {
      y += yGap;
    }
    column1Positions.push({ x, y });
    y += column1Words[i].height;
  }
  const column1Height = y;

  x += column1Width + xGap;
  y = 0;
  for (let i = 0; i < column2Words.length; i++) {
    if (i > 0) {
      y += yGap;
    }
    column2Positions.push({ x, y });
    y += column2Words[i].height;
  }
  const column2Height = y;

  const height = Math.max(column1Height, column2Height);
  const positions: Pos[] = [];
  for (let i = 0; i < words.length; i++) {
    if (i % 2 === 0) {
      positions.push(column1Positions[i / 2]);
    } else {
      positions.push(column2Positions[(i - 1) / 2]);
    }
  }

  return {
    positions,
    size: { width: windowSize.width, height },
  };
};

const Words = ({
  options,
  onWordClick,
  pressed,
  layout,
}: {
  options: string[];
  onWordClick: (word: string, idx: number) => void;
  pressed: { index: number; votes: number | null } | null;
  layout: "horizontal" | "vertical";
}): ReactElement => {
  const containerRef = useRef<View>(null);
  const containerSizeTarget = useAnimatedValueWithCallbacks<Size>(
    { width: 0, height: 0 },
    () => inferAnimators({ width: 0, height: 0 }, ease, 700),
    (size) => {
      if (containerRef.current === null) {
        return;
      }
      const container = containerRef.current;
      container.setNativeProps({
        style: {
          ...styles.words,
          width: size.width,
          height: size.height,
        },
      });
    }
  );

  const windowSize = useWindowSize();
  const numOptions = options.length;
  const wordSizes: WritableValueWithCallbacks<Size>[] = useMemo(() => {
    const result = [];
    for (let i = 0; i < numOptions; i++) {
      result.push(
        (() => {
          let size: Size = { width: 0, height: 0 };
          const callbacks = new Callbacks<undefined>();
          return {
            get: () => size,
            set: (s: Size) => {
              size = s;
            },
            callbacks,
          };
        })()
      );
    }
    return result;
  }, [numOptions]);
  const wordPositions: WritableValueWithCallbacks<Pos>[] = useMemo(() => {
    const result = [];
    for (let i = 0; i < numOptions; i++) {
      result.push(
        (() => {
          let pos: Pos = { x: windowSize.width / 2, y: 0 };
          const callbacks = new Callbacks<undefined>();
          return {
            get: () => pos,
            set: (p: Pos) => {
              pos = p;
            },
            callbacks,
          };
        })()
      );
    }
    return result;
  }, [numOptions, windowSize]);

  useEffect(() => {
    for (let i = 0; i < wordSizes.length; i++) {
      wordSizes[i].callbacks.add(handleSizesChanged);
    }
    handleSizesChanged();
    return () => {
      for (let i = 0; i < wordSizes.length; i++) {
        wordSizes[i].callbacks.remove(handleSizesChanged);
      }
    };

    function handleSizesChanged() {
      const sizes = wordSizes.map((s) => s.get());
      const target =
        layout === "horizontal"
          ? computeHorizontalPositions(windowSize, sizes)
          : computeVerticalPositions(windowSize, sizes);
      for (let i = 0; i < wordPositions.length; i++) {
        wordPositions[i].set(target.positions[i]);
        wordPositions[i].callbacks.call(undefined);
      }
      const currentContainerSize = containerSizeTarget.get();
      if (
        currentContainerSize.width !== target.size.width ||
        currentContainerSize.height !== target.size.height
      ) {
        currentContainerSize.width = target.size.width;
        currentContainerSize.height = target.size.height;
        containerSizeTarget.callbacks.call(undefined);
      }
    }
  }, [
    windowSize,
    layout,
    wordSizes,
    wordPositions,
    containerSizeTarget,
    pressed,
  ]);

  return (
    <View ref={containerRef}>
      {options.map((word, i) => (
        <Word
          word={word}
          idx={i}
          key={word}
          onWordClick={onWordClick}
          pressed={pressed}
          variant={layout}
          size={wordSizes[i]}
          pos={wordPositions[i]}
        />
      ))}
    </View>
  );
};

type WordSetting = {
  left: number;
  top: number;
  fontSize: number;
  letterSpacing: number;
  padding: [number, number, number, number];
  borderRadius: number;
  /**
   * We implement a solid color as a gradient to the same colors;
   * this allows easing the gradient in relatively easily.
   */
  backgroundGradient: {
    color1: [number, number, number, number];
    color2: [number, number, number, number];
  };
};

const WORD_SETTINGS = {
  horizontal: {
    fontSize: 16,
    letterSpacing: 0.25,
    padding: [12, 14, 12, 14] as [number, number, number, number],
    borderRadius: 24,
  },
  vertical: {
    fontSize: 14,
    letterSpacing: 0.25,
    padding: [10, 12, 10, 12] as [number, number, number, number],
    borderRadius: 24,
  },
};

const Word = ({
  word,
  idx,
  onWordClick,
  pressed,
  variant,
  size,
  pos,
}: {
  word: string;
  idx: number;
  onWordClick: (word: string, idx: number) => void;
  pressed: { index: number; votes: number | null } | null;
  variant: "horizontal" | "vertical";
  size: WritableValueWithCallbacks<Size>;
  pos: ValueWithCallbacks<Pos>;
}) => {
  const outerRef = useRef<View>(null);
  const pressableRef = useRef<View>(null);
  const gradientState = useWritableValueWithCallbacks<LinearGradientState>({
    stops: [
      {
        color: [255, 255, 255, 0.2],
        offset: 0,
      },
      {
        color: [255, 255, 255, 0.2],
        offset: 1,
      },
    ],
    angleDegreesClockwiseFromTop: 95.08,
  });
  const textRef = useRef<Text>(null);
  const target = useAnimatedValueWithCallbacks<WordSetting>(
    {
      left: pos.get().x,
      top: pos.get().y,
      backgroundGradient: {
        color1: [255, 255, 255, 0.2],
        color2: [255, 255, 255, 0.2],
      },
      ...WORD_SETTINGS[variant],
    },
    () => [
      ...inferAnimators<{ top: number; left: number }, WordSetting>(
        { top: 0, left: 0 },
        ease,
        700,
        { onTargetChange: "replace" }
      ),
      ...inferAnimators<
        {
          fontSize: number;
          letterSpacing: number;
          padding: number[];
          borderRadius: number;
        },
        WordSetting
      >(
        {
          fontSize: 0,
          letterSpacing: 0,
          padding: [0, 0, 0, 0],
          borderRadius: 0,
        },
        ease,
        700
      ),
      ...inferAnimators<
        { backgroundGradient: { color1: number[]; color2: number[] } },
        WordSetting
      >(
        {
          backgroundGradient: {
            color1: [0, 0, 0, 0],
            color2: [0, 0, 0, 0],
          },
        },
        ease,
        350
      ),
    ],
    (val) => {
      if (
        outerRef.current === null ||
        pressableRef.current === null ||
        textRef.current === null
      ) {
        return;
      }
      const outer = outerRef.current;
      const pressable = pressableRef.current;
      const text = textRef.current;
      outer.setNativeProps({
        style: {
          position: "absolute",
          left: val.left,
          top: val.top,
          borderRadius: val.borderRadius,
          overflow: "hidden",
        },
      });
      pressable.setNativeProps({
        style: {
          paddingTop: val.padding[0],
          paddingRight: val.padding[1],
          paddingBottom: val.padding[2],
          paddingLeft: val.padding[3],
        },
      });
      gradientState.set({
        stops: [
          {
            color: [...val.backgroundGradient.color1],
            offset: 0.0249,
          },
          {
            color: [...val.backgroundGradient.color2],
            offset: 0.9719,
          },
        ],
        angleDegreesClockwiseFromTop: 95.08,
      });
      gradientState.callbacks.call(undefined);
      text.setNativeProps({
        style: {
          ...styles.wordText,
          fontSize: val.fontSize,
          lineHeight: val.fontSize,
          letterSpacing: val.letterSpacing,
        },
      });

      pressable.measure((x, y, realWidth, realHeight) => {
        const reportedSize = size.get();
        if (
          realWidth !== reportedSize.width ||
          realHeight !== reportedSize.height
        ) {
          size.set({ width: realWidth, height: realHeight });
          size.callbacks.call(undefined);
        }
      });
    }
  );

  useEffect(() => {
    pos.callbacks.add(handlePositionChanged);
    handlePositionChanged();
    return () => {
      pos.callbacks.remove(handlePositionChanged);
    };

    function handlePositionChanged() {
      target.set({
        left: pos.get().x,
        top: pos.get().y,
        backgroundGradient:
          pressed?.index === idx
            ? {
                //'linear-gradient(95.08deg, #57b8a2 2.49%, #009999 97.19%)'
                color1: [87, 184, 162, 1],
                color2: [0, 153, 153, 1],
              }
            : {
                //'rgba(255, 255, 255, 0.2)',
                color1: [255, 255, 255, 0.2],
                color2: [255, 255, 255, 0.2],
              },
        ...WORD_SETTINGS[variant],
      });
      target.callbacks.call(undefined);
    }
  }, [pos, variant, target, pressed, idx]);

  const handleClick = useCallback(() => {
    console.log("click", word);
    onWordClick(word, idx);
  }, [word, idx, onWordClick]);

  const gradientStateVariableStrategyProps = useMemo<
    VariableStrategyProps<LinearGradientState>
  >(
    () => ({
      type: "callbacks",
      props: () => gradientState.get(),
      callbacks: gradientState.callbacks,
    }),
    [gradientState]
  );

  return (
    <View ref={outerRef}>
      <LinearGradientBackground state={gradientStateVariableStrategyProps}>
        <Pressable ref={pressableRef} onPress={handleClick}>
          <Text ref={textRef}>{word}</Text>
        </Pressable>
      </LinearGradientBackground>
    </View>
  );
};
