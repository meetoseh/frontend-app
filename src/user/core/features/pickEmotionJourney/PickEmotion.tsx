import {
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useStateCompat as useState } from "../../../../shared/hooks/useStateCompat";
import {
  Pressable,
  StyleProp,
  Text,
  TextInput,
  TextStyle,
  View,
} from "react-native";
import { FeatureComponentProps } from "../../models/Feature";
import { PickEmotionJourneyResources } from "./PickEmotionJourneyResources";
import { PickEmotionJourneyState } from "./PickEmotionJourneyState";
import { styles } from "./PickEmotionStyles";
import { OsehImageFromState } from "../../../../shared/images/OsehImageFromState";
import { LoginContext } from "../../../../shared/contexts/LoginContext";
import EmptyHeart from "./icons/EmptyHeart";
import {
  ValueWithCallbacks,
  WritableValueWithCallbacks,
  useWritableValueWithCallbacks,
} from "../../../../shared/lib/Callbacks";
import {
  BezierAnimator,
  TrivialAnimator,
  inferAnimators,
} from "../../../../shared/anim/AnimationLoop";
import { ease } from "../../../../shared/lib/Bezier";
import { useAnimatedValueWithCallbacks } from "../../../../shared/anim/useAnimatedValueWithCallbacks";
import { useWindowSizeValueWithCallbacks } from "../../../../shared/hooks/useWindowSize";
import {
  LinearGradientBackground,
  LinearGradientState,
} from "../../../../shared/anim/LinearGradientBackground";
import { useMappedValueWithCallbacks } from "../../../../shared/hooks/useMappedValueWithCallbacks";
import { useMappedValuesWithCallbacks } from "../../../../shared/hooks/useMappedValuesWithCallbacks";
import { RenderGuardedComponent } from "../../../../shared/components/RenderGuardedComponent";
import { VariableStrategyProps } from "../../../../shared/anim/VariableStrategyProps";
import { ProfilePicturesState } from "../../../interactive_prompt/hooks/useProfilePictures";
import {
  HereSettings,
  ProfilePictures,
} from "../../../interactive_prompt/components/ProfilePictures";
import { FilledInvertedButton } from "../../../../shared/components/FilledInvertedButton";
import { OsehImageBackgroundFromStateValueWithCallbacks } from "../../../../shared/images/OsehImageBackgroundFromStateValueWithCallbacks";
import { useTopBarHeight } from "../../../../shared/hooks/useTopBarHeight";
import { StatusBar } from "expo-status-bar";

/**
 * The settings for the profile pictures
 */
const hereSettings: HereSettings = { type: "floating", action: "voted" };

/**
 * Allows the user to pick an emotion and then go to that class
 */
export const PickEmotion = ({
  resources,
  gotoJourney,
}: FeatureComponentProps<
  PickEmotionJourneyState,
  PickEmotionJourneyResources
> & {
  gotoJourney: () => void;
}): ReactElement => {
  const loginContext = useContext(LoginContext);
  const selectedInfoVWC = useMappedValueWithCallbacks(
    resources,
    (r) => {
      if (r.selected === null || r.options === null) {
        return null;
      }

      const sel = r.selected;

      return {
        word: sel.word.word,
        index: r.options.words.findIndex((opt) => opt.word === sel.word.word),
        numVotes: sel.numVotes,
      };
    },
    {
      outputEqualityFn: (a, b) => {
        if (a === null || b === null) {
          return a === b;
        }

        return (
          a.word === b.word && a.numVotes === b.numVotes && a.index === b.index
        );
      },
    }
  );
  const wordsVWC = useMappedValueWithCallbacks(
    resources,
    (r) => {
      const res = r.options?.words?.map((opt) => opt.word) ?? [];
      return res;
    },
    {
      outputEqualityFn: (a, b) => {
        return a.length === b.length && a.every((v, i) => v === b[i]);
      },
    }
  );
  const tentativelyPressedVWC = useWritableValueWithCallbacks<number | null>(
    () => null
  );
  const visuallyPressedVWC = useMappedValuesWithCallbacks(
    [selectedInfoVWC, tentativelyPressedVWC, wordsVWC],
    () => {
      const selected = selectedInfoVWC.get();
      const tentativelyPressed = tentativelyPressedVWC.get();
      const words = wordsVWC.get();

      if (selected !== null) {
        return {
          index: selected.index,
          votes: selected.numVotes,
        };
      }

      if (tentativelyPressed !== null && tentativelyPressed < words.length) {
        return {
          index: tentativelyPressed,
          votes: 0,
        };
      }

      return null;
    },
    {
      outputEqualityFn: (a, b) => {
        if (a === null || b === null) {
          return a === b;
        }

        return a.votes === b.votes && a.index === b.index;
      },
    }
  );

  const onWordClick = useCallback(
    (word: string, index: number) => {
      const res = resources.get();
      if (res.options !== null && index < res.options.words.length) {
        const emotion = res.options.words[index];
        tentativelyPressedVWC.set(index);
        tentativelyPressedVWC.callbacks.call(undefined);
        res.onSelect.call(undefined, emotion);
      }
    },
    [tentativelyPressedVWC, resources]
  );

  const onGotoFavoritesClick = useCallback(() => {
    resources.get().gotoFavorites();
  }, [resources]);

  const onGotoSettingsClick = useCallback(() => {
    resources.get().gotoSettings();
  }, [resources]);

  const onGotoClassClick = useCallback(() => {
    gotoJourney();
  }, []);

  const profilePicture = useMappedValueWithCallbacks(
    resources,
    (r) => r.profilePicture,
    { outputEqualityFn: Object.is }
  );
  const profilePicturesState = useMappedValueWithCallbacks(
    resources,
    (r): ProfilePicturesState => {
      if (r.selected === null) {
        return {
          pictures: [],
          additionalUsers: 0,
        };
      }

      return {
        pictures: r.selected.profilePictures,
        additionalUsers: r.selected.numTotalVotes - r.selected.numVotes,
      };
    },
    {
      outputEqualityFn: (a, b) =>
        Object.is(a.pictures, b.pictures) &&
        a.additionalUsers === b.additionalUsers,
    }
  );

  const layoutVWC = useMappedValueWithCallbacks(
    tentativelyPressedVWC,
    (tp): "horizontal" | "vertical" => {
      return tp === null ? "horizontal" : "vertical";
    }
  );

  const topBarHeight = useTopBarHeight();

  return (
    <View style={styles.container}>
      <RenderGuardedComponent
        props={useMappedValueWithCallbacks(resources, (r) => r.error, {
          outputEqualityFn: Object.is,
        })}
        component={(error) => error ?? <></>}
      />

      <OsehImageBackgroundFromStateValueWithCallbacks
        state={useMappedValueWithCallbacks(resources, (r) => r.background, {
          outputEqualityFn: (a, b) => a.localUrl === b.localUrl,
        })}
        style={Object.assign({ paddingTop: topBarHeight }, styles.content)}
      >
        <View style={styles.topNav}>
          <Pressable style={styles.settingsLink} onPress={onGotoSettingsClick}>
            <RenderGuardedComponent
              props={profilePicture}
              component={(pic) => (
                <>
                  {pic.state === "available" && (
                    <OsehImageFromState
                      state={pic.image}
                      style={styles.profilePic}
                    />
                  )}
                </>
              )}
            />
            <View style={styles.settingsMessages}>
              <Text style={styles.greeting}>
                Hi {loginContext.userAttributes?.givenName ?? "there"} 👋
              </Text>
              <Text style={styles.greetingAction}>Daily Check-in</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={onGotoFavoritesClick}
            style={styles.favoritesLink}
          >
            <EmptyHeart />
            <Text style={styles.favoritesLinkText}> Favorites</Text>
          </Pressable>
        </View>
        <Text style={styles.questionText}>How do you want to feel today?</Text>
        <Words
          optionsVWC={wordsVWC}
          onWordClick={onWordClick}
          pressedVWC={visuallyPressedVWC}
          layoutVWC={layoutVWC}
        />
        <RenderGuardedComponent
          props={layoutVWC}
          component={(layout) =>
            layout === "horizontal" ? (
              <></>
            ) : (
              <Bottom
                onGotoClassClick={onGotoClassClick}
                profilePicturesState={profilePicturesState}
              />
            )
          }
        />
      </OsehImageBackgroundFromStateValueWithCallbacks>
      <StatusBar style="light" />
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
  optionsVWC,
  onWordClick,
  pressedVWC,
  layoutVWC,
}: {
  optionsVWC: ValueWithCallbacks<string[]>;
  onWordClick: (word: string, idx: number) => void;
  pressedVWC: ValueWithCallbacks<{
    index: number;
    votes: number | null;
  } | null>;
  layoutVWC: ValueWithCallbacks<"horizontal" | "vertical">;
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

  const windowSizeVWC = useWindowSizeValueWithCallbacks();
  const wordSizesVWC = useWritableValueWithCallbacks<Size[]>(() =>
    optionsVWC.get().map(() => ({
      width: 0,
      height: 0,
    }))
  );

  useEffect(() => {
    let active = true;
    optionsVWC.callbacks.add(updateWordSizes);
    updateWordSizes();
    return () => {
      if (!active) {
        return;
      }
      active = false;
      optionsVWC.callbacks.remove(updateWordSizes);
    };

    function updateWordSizes() {
      if (!active) {
        return;
      }
      if (wordSizesVWC.get().length === optionsVWC.get().length) {
        return;
      }

      const oldWordSizes = wordSizesVWC.get();

      const wordSizes = optionsVWC.get().map((_, idx) => ({
        width: oldWordSizes.length > idx ? oldWordSizes[idx].width : 0,
        height: oldWordSizes.length > idx ? oldWordSizes[idx].height : 0,
      }));
      wordSizesVWC.set(wordSizes);
      wordSizesVWC.callbacks.call(undefined);
    }
  }, [optionsVWC, wordSizesVWC]);

  const wordPositionsVWC = useWritableValueWithCallbacks<Pos[]>(() =>
    optionsVWC.get().map(() => ({
      x: windowSizeVWC.get().width / 2,
      y: 0,
    }))
  );

  useEffect(() => {
    let active = true;
    optionsVWC.callbacks.add(updateWordPositions);
    updateWordPositions();
    return () => {
      if (!active) {
        return;
      }
      active = false;
      optionsVWC.callbacks.remove(updateWordPositions);
    };

    function updateWordPositions() {
      if (!active) {
        return;
      }
      const oldWordPositions = wordPositionsVWC.get();
      const options = optionsVWC.get();

      if (oldWordPositions.length === options.length) {
        return;
      }

      const wordPositions = options.map((_, idx) => ({
        x:
          oldWordPositions.length > idx
            ? oldWordPositions[idx].x
            : windowSizeVWC.get().width / 2,
        y: oldWordPositions.length > idx ? oldWordPositions[idx].y : 0,
      }));
      wordPositionsVWC.set(wordPositions);
      wordPositionsVWC.callbacks.call(undefined);
    }
  }, [optionsVWC, wordPositionsVWC, windowSizeVWC]);

  useEffect(() => {
    let active = true;
    wordSizesVWC.callbacks.add(reposition);
    layoutVWC.callbacks.add(reposition);
    windowSizeVWC.callbacks.add(reposition);
    reposition();
    return () => {
      if (!active) {
        return;
      }
      active = false;
      wordSizesVWC.callbacks.remove(reposition);
      layoutVWC.callbacks.remove(reposition);
      windowSizeVWC.callbacks.remove(reposition);
    };

    function reposition() {
      if (!active) {
        return;
      }
      const sizes = wordSizesVWC.get();
      const layout = layoutVWC.get();
      const windowSize = windowSizeVWC.get();
      const target =
        layout === "horizontal"
          ? computeHorizontalPositions(windowSize, sizes)
          : computeVerticalPositions(windowSize, sizes);

      wordPositionsVWC.set(target.positions);
      wordPositionsVWC.callbacks.call(undefined);

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
    layoutVWC,
    windowSizeVWC,
    wordSizesVWC,
    wordPositionsVWC,
    containerSizeTarget,
  ]);

  return (
    <View ref={containerRef}>
      <RenderGuardedComponent
        props={optionsVWC}
        component={(options) => {
          return (
            <>
              {options.map((word, i) => (
                <WordAdapter
                  word={word}
                  idx={i}
                  key={`${word}-${i}`}
                  onWordClick={onWordClick}
                  pressedVWC={pressedVWC}
                  variantVWC={layoutVWC}
                  wordSizesVWC={wordSizesVWC}
                  wordPositionsVWC={wordPositionsVWC}
                />
              ))}
            </>
          );
        }}
      />
      <Votes
        pressedVWC={pressedVWC}
        wordPositionsVWC={wordPositionsVWC}
        wordSizesVWC={wordSizesVWC}
      />
    </View>
  );
};

type WordSetting = {
  /**
   * we use progress to determine if we're animating or not, to switch to
   * hardware textures for the words (increased gpu mem usage, better performance).
   *
   * An exact integer value means not animating
   */
  progress: number;
  outerScale: number;
  left: number;
  top: number;
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
    progress: 0,
    outerScale: 1,
  },
  vertical: {
    progress: 1,
    outerScale: 0.875,
  },
};

const WordAdapter = ({
  word,
  idx,
  onWordClick,
  pressedVWC,
  variantVWC,
  wordSizesVWC,
  wordPositionsVWC,
}: {
  word: string;
  idx: number;
  onWordClick: (word: string, idx: number) => void;
  pressedVWC: ValueWithCallbacks<{
    index: number;
    votes: number | null;
  } | null>;
  variantVWC: ValueWithCallbacks<"horizontal" | "vertical">;
  wordSizesVWC: WritableValueWithCallbacks<Size[]>;
  wordPositionsVWC: ValueWithCallbacks<Pos[]>;
}): ReactElement => {
  const size = useWritableValueWithCallbacks<Size>(
    () => wordSizesVWC.get()[idx] ?? { width: 0, height: 0 }
  );
  const position = useWritableValueWithCallbacks<Pos>(
    () => wordPositionsVWC.get()[idx] ?? { x: 0, y: 0 }
  );

  useEffect(() => {
    let active = true;
    size.callbacks.add(updateParentSize);
    variantVWC.callbacks.add(updateParentSize);
    updateParentSize();
    return () => {
      if (!active) {
        return;
      }
      active = false;
      size.callbacks.remove(updateParentSize);
      variantVWC.callbacks.remove(updateParentSize);
    };

    function updateParentSize() {
      if (!active) {
        return;
      }
      const currentParent = wordSizesVWC.get();
      const variant = variantVWC.get();
      if (idx >= currentParent.length) {
        return;
      }

      const correctUnscaledSize = size.get();
      const correctSize = {
        width: correctUnscaledSize.width * WORD_SETTINGS[variant].outerScale,
        height: correctUnscaledSize.height * WORD_SETTINGS[variant].outerScale,
      };

      const currentSize = currentParent[idx];
      if (
        currentSize.width === correctSize.width &&
        currentSize.height === correctSize.height
      ) {
        return;
      }

      currentParent[idx] = {
        width: correctSize.width,
        height: correctSize.height,
      };
      wordSizesVWC.callbacks.call(undefined);
    }
  }, [idx, size, wordSizesVWC, variantVWC]);

  useEffect(() => {
    let active = true;
    wordPositionsVWC.callbacks.add(updateChildPosition);
    updateChildPosition();
    return () => {
      if (!active) {
        return;
      }
      active = false;
      wordPositionsVWC.callbacks.remove(updateChildPosition);
    };

    function updateChildPosition() {
      if (!active) {
        return;
      }
      const currentParent = wordPositionsVWC.get();
      if (idx >= currentParent.length) {
        return;
      }

      const correctPosition = currentParent[idx];
      const currentPosition = position.get();

      if (
        correctPosition.x === currentPosition.x &&
        correctPosition.y === currentPosition.y
      ) {
        return;
      }

      position.set({ x: correctPosition.x, y: correctPosition.y });
      position.callbacks.call(undefined);
    }
  });

  return (
    <Word
      word={word}
      idx={idx}
      onWordClick={onWordClick}
      pressedVWC={pressedVWC}
      variantVWC={variantVWC}
      sizeVWC={size}
      posVWC={position}
    />
  );
};

const Word = ({
  word,
  idx,
  onWordClick,
  pressedVWC,
  variantVWC,
  sizeVWC,
  posVWC,
}: {
  word: string;
  idx: number;
  onWordClick: (word: string, idx: number) => void;
  pressedVWC: ValueWithCallbacks<{
    index: number;
    votes: number | null;
  } | null>;
  variantVWC: ValueWithCallbacks<"horizontal" | "vertical">;
  sizeVWC: WritableValueWithCallbacks<Size>;
  posVWC: ValueWithCallbacks<Pos>;
}) => {
  const outerRef = useRef<View>(null);

  const handleClick = useCallback(() => {
    onWordClick(word, idx);
  }, [word, idx, onWordClick]);

  const gradientState = useWritableValueWithCallbacks<LinearGradientState>(
    () => ({
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
    })
  );
  const unscaledSizeRef = useRef<Size | undefined>();
  const pressableRef = useRef<View>(null);
  const target = useAnimatedValueWithCallbacks<WordSetting>(
    {
      left: posVWC.get().x,
      top: posVWC.get().y,
      backgroundGradient: {
        color1: [255, 255, 255, 0.2],
        color2: [255, 255, 255, 0.2],
      },
      ...WORD_SETTINGS[variantVWC.get()],
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
          progress: number;
        },
        WordSetting
      >(
        {
          progress: 0,
        },
        ease,
        700
      ),
      ...inferAnimators<
        {
          outerScale: number;
          backgroundGradient: { color1: number[]; color2: number[] };
        },
        WordSetting
      >(
        {
          outerScale: 0,
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
      if (outerRef.current === null || pressableRef.current === null) {
        return;
      }
      const outer = outerRef.current;
      const pressable = pressableRef.current;

      const sizeBeforeScaling = unscaledSizeRef.current ?? {
        width: 0,
        height: 0,
      };

      outer.setNativeProps({
        style: {
          transform: [
            {
              translateX:
                0.5 * (val.outerScale - 1) * sizeBeforeScaling.width + val.left,
            },
            {
              translateY:
                0.5 * (val.outerScale - 1) * sizeBeforeScaling.height + val.top,
            },
            { scale: val.outerScale },
          ],
        },
        renderToHardwareTextureAndroid:
          val.progress !== 0 && val.progress !== 1,
        shouldRasterizeIOS: val.progress !== 0 && val.progress !== 1,
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

      pressable.measure((x, y, realWidth, realHeight) => {
        const unscaledSize = {
          width: realWidth / val.outerScale,
          height: realHeight / val.outerScale,
        };
        unscaledSizeRef.current = unscaledSize;

        const reportedSize = sizeVWC.get();

        if (
          unscaledSize.width !== reportedSize.width ||
          unscaledSize.height !== reportedSize.height
        ) {
          sizeVWC.set(unscaledSize);
          sizeVWC.callbacks.call(undefined);
        }
      });
    }
  );

  useEffect(() => {
    let active = true;
    posVWC.callbacks.add(render);
    variantVWC.callbacks.add(render);
    pressedVWC.callbacks.add(render);
    let waitingForNonZeroSizeCanceler = waitForNonZeroSize();
    render();
    return () => {
      if (!active) {
        return;
      }
      active = false;
      waitingForNonZeroSizeCanceler();
      posVWC.callbacks.remove(render);
      variantVWC.callbacks.remove(render);
      pressedVWC.callbacks.remove(render);
    };

    function render() {
      if (!active) {
        return;
      }
      target.set({
        left: posVWC.get().x,
        top: posVWC.get().y,
        backgroundGradient:
          pressedVWC.get()?.index === idx
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
        ...WORD_SETTINGS[variantVWC.get()],
      });
      target.callbacks.call(undefined);
    }

    function waitForNonZeroSize(): () => void {
      if (pressableRef.current === null) {
        return () => {};
      }
      const ele = pressableRef.current;
      let running = true;
      const interval = setInterval(checkSize, 100);
      const unmount = () => {
        if (running) {
          running = false;
          clearInterval(interval);
        }
      };
      checkSize();
      return unmount;

      function checkSize() {
        if (!running) {
          return;
        }
        render();

        ele.measure((x, y, realWidth, realHeight) => {
          if (!running) {
            return;
          }

          if (realWidth !== 0 && realHeight !== 0) {
            unmount();

            const reported = sizeVWC.get();
            if (
              reported.width !== realWidth ||
              reported.height !== realHeight
            ) {
              sizeVWC.set({ width: realWidth, height: realHeight });
              sizeVWC.callbacks.call(undefined);
            }
          }
        });
      }
    }
  }, [posVWC, variantVWC, target, pressedVWC, idx, sizeVWC]);

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
    <View
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        borderRadius: 24,
        overflow: "hidden",
      }}
      ref={outerRef}
    >
      <LinearGradientBackground state={gradientStateVariableStrategyProps}>
        <Pressable
          ref={pressableRef}
          style={styles.wordPressable}
          onPress={handleClick}
        >
          <Text style={styles.wordText}>{word}</Text>
        </Pressable>
      </LinearGradientBackground>
    </View>
  );
};

type VotesSetting = {
  progress: number;
  left: number;
  top: number;
  opacity: number;
  textContent: string;
};

const Votes = ({
  pressedVWC,
  wordPositionsVWC,
  wordSizesVWC,
}: {
  pressedVWC: ValueWithCallbacks<{
    index: number;
    votes: number | null;
  } | null>;
  wordPositionsVWC: ValueWithCallbacks<Pos[]>;
  wordSizesVWC: ValueWithCallbacks<Size[]>;
}): ReactElement => {
  const containerRef = useRef<View>(null);
  const inputRef = useRef<TextInput>(null);
  const inputTextValue = useRef("");
  const target = useAnimatedValueWithCallbacks<VotesSetting>(
    { progress: 0, left: 0, top: 0, opacity: 0, textContent: "+0 votes" },
    () => [
      new TrivialAnimator("left"),
      new TrivialAnimator("top"),
      new BezierAnimator(
        ease,
        700,
        (s) => s.opacity,
        (s, v) => (s.opacity = v)
      ),
      new TrivialAnimator("textContent"),
    ],
    (val) => {
      if (containerRef.current === null || inputRef.current === null) {
        return;
      }
      const container = containerRef.current;
      const input = inputRef.current;
      container.setNativeProps({
        style: {
          ...styles.votesView,
          transform: [{ translateX: val.left }, { translateY: val.top }],
          opacity: val.opacity,
        },
        renderToHardwareTextureAndroid:
          val.progress !== 0 && val.progress !== 1,
        shouldRasterizeIOS: val.progress !== 0 && val.progress !== 1,
      });

      if (val.textContent !== inputTextValue.current) {
        inputTextValue.current = val.textContent;
        input.setNativeProps({
          text: val.textContent,
        });
      }
    }
  );

  useEffect(() => {
    let active = true;
    wordPositionsVWC.callbacks.add(render);
    wordSizesVWC.callbacks.add(render);
    pressedVWC.callbacks.add(render);
    render();
    return () => {
      if (!active) {
        return;
      }
      active = false;
      wordPositionsVWC.callbacks.remove(render);
      wordSizesVWC.callbacks.remove(render);
      pressedVWC.callbacks.remove(render);
    };

    function render() {
      if (!active) {
        return;
      }
      const wordPositions = wordPositionsVWC.get();
      const wordSizes = wordSizesVWC.get();
      const pressed = pressedVWC.get();

      if (
        pressed === null ||
        pressed.index >= wordPositions.length ||
        pressed.index >= wordSizes.length
      ) {
        target.set({
          left: 0,
          top: 0,
          opacity: 0,
          textContent: "+0 votes",
          progress: 0,
        });
        target.callbacks.call(undefined);
        return;
      }

      const pos = wordPositions[pressed.index];
      const size = wordSizes[pressed.index];

      target.set({
        left: pos.x + size.width + 6,
        top: pos.y + 11,
        opacity: 1,
        textContent:
          pressed.votes !== null
            ? `+${pressed.votes.toLocaleString()} votes`
            : "+0 votes",
        progress: 1,
      });
      target.callbacks.call(undefined);
    }
  }, [wordPositionsVWC, wordSizesVWC, pressedVWC, target]);

  return (
    <View style={styles.votesView} ref={containerRef} pointerEvents="none">
      <TextInput style={styles.votesText} ref={inputRef} defaultValue="" />
    </View>
  );
};

const Bottom = ({
  onGotoClassClick,
  profilePicturesState,
}: {
  onGotoClassClick: () => void;
  profilePicturesState: ValueWithCallbacks<ProfilePicturesState>;
}) => {
  const [btnTextStyle, setBtnTextStyle] = useState<StyleProp<TextStyle>>(
    () => ({})
  );

  return (
    <>
      <View style={styles.profilePicturesContainer}>
        <ProfilePictures
          profilePictures={profilePicturesState}
          hereSettings={hereSettings}
        />
      </View>
      <FilledInvertedButton
        onPress={onGotoClassClick}
        setTextStyle={setBtnTextStyle}
        fullWidth
      >
        <Text style={btnTextStyle}>Take Me To Class</Text>
      </FilledInvertedButton>
    </>
  );
};
