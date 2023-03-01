import { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, InteractionManager, PanResponder, Text, View, ViewStyle } from 'react-native';
import { LoginContextValue } from '../../shared/contexts/LoginContext';
import { useScreenSize } from '../../shared/hooks/useScreenSize';
import { apiFetch } from '../../shared/lib/apiFetch';
import { Bezier, easeIn, easeInOut } from '../../shared/lib/Bezier';
import { JourneyTime } from '../hooks/useJourneyTime';
import { JourneyPromptProps } from '../models/JourneyPromptProps';
import { styles } from './JourneyNumericPromptStyles';
import { JourneyPromptText } from './JourneyPromptText';

/**
 * Shows a numeric journey prompt, which includes a prompt text and the ability
 * for the user to select a number, typically from 1-10
 */
export const JourneyNumericPrompt = ({
  prompt,
  setHeight: setOuterHeight,
  stats,
  journeyTime,
  loginContext,
  journeyLobbyDurationSeconds,
  journeyUid,
  journeyJwt,
  sessionUid,
}: JourneyPromptProps): ReactElement => {
  if (prompt.style !== 'numeric') {
    throw new Error('Invalid prompt style');
  }

  const [fakingMove, setFakingMove] = useState<FakedMove | null>(null);
  const screenSize = useScreenSize();
  const [titleHeight, setTitleHeight] = useState(0);
  const [height, setHeight] = useState(0);

  const titleCarouselGap = styles.optionsContainer.marginTop;

  useEffect(() => {
    if (titleHeight !== 0) {
      setHeight(
        titleHeight +
          titleCarouselGap +
          styles.optionsContainer.height +
          styles.averageMood.marginTop +
          styles.averageMood.lineHeight
      );
    } else {
      setHeight(0);
    }
  }, [titleHeight, titleCarouselGap]);

  useEffect(() => {
    if (setOuterHeight) {
      setOuterHeight(height);
    }
  }, [height, setOuterHeight]);

  const promptOptions = useMemo(() => {
    const result: number[] = [];
    for (let i = prompt.min; i <= prompt.max; i += prompt.step) {
      result.push(i);
    }
    return result;
  }, [prompt.min, prompt.max, prompt.step]);

  const activeAfterFakingMove = useMemo(() => {
    if (fakingMove === null) {
      return stats.numericActive ?? new Map<number, number>();
    }

    const active = new Map<number, number>(stats.numericActive);

    if (stats.numericActive === null) {
      for (const opt of promptOptions) {
        active.set(opt, 0);
      }
      return active;
    }

    active.set(
      promptOptions[fakingMove.fromIndex],
      Math.min(fakingMove.maxFromActive, active.get(promptOptions[fakingMove.fromIndex]) ?? 0)
    );
    active.set(
      promptOptions[fakingMove.toIndex],
      Math.max(fakingMove.minToActive, active.get(promptOptions[fakingMove.toIndex]) ?? 0)
    );
    return active;
  }, [promptOptions, stats.numericActive, fakingMove]);

  const [promptSelection, setPromptSelection] = useState(
    promptOptions[Math.floor(promptOptions.length / 2)]
  );
  const promptSelectionIndex = useMemo(() => {
    return promptOptions.indexOf(promptSelection);
  }, [promptSelection, promptOptions]);
  const setPromptSelectionIndexWithoutMovingCarousel = useCallback(
    (idx: number) => {
      if (promptSelection !== promptOptions[idx]) {
        setFakingMove({
          fromIndex: promptSelectionIndex,
          maxFromActive: Math.max((activeAfterFakingMove?.get(promptSelection) ?? 0) - 1, 0),
          toIndex: idx,
          minToActive: (activeAfterFakingMove?.get(promptOptions[idx]) ?? 0) + 1,
          endsAt: journeyTime.time.current + 2500,
        });
        setPromptSelection(promptOptions[idx]);
      }
    },
    [promptOptions, promptSelection, journeyTime.time, activeAfterFakingMove, promptSelectionIndex]
  );
  useEffect(() => {
    if (fakingMove === null) {
      return;
    }

    if (fakingMove.endsAt <= journeyTime.time.current) {
      setFakingMove(null);
      return;
    }

    let active = true;
    const onTimeChanged = (lastTime: DOMHighResTimeStamp, newTime: DOMHighResTimeStamp) => {
      if (!active) {
        return;
      }
      if (newTime >= fakingMove.endsAt) {
        setFakingMove(null);
        unmount();
        return;
      }
    };

    const expectedIndex = journeyTime.onTimeChanged.current.length;
    journeyTime.onTimeChanged.current.push(onTimeChanged);

    const unmount = () => {
      if (!active) {
        return;
      }
      active = false;
      for (
        let i = Math.min(expectedIndex, journeyTime.onTimeChanged.current.length - 1);
        i >= 0;
        i--
      ) {
        if (journeyTime.onTimeChanged.current[i] === onTimeChanged) {
          journeyTime.onTimeChanged.current.splice(i, 1);
          break;
        }
      }
    };

    return unmount;
  }, [fakingMove, journeyTime.onTimeChanged, journeyTime.time]);
  usePromptSelectionEvents(
    journeyUid,
    journeyJwt,
    sessionUid,
    promptSelection,
    journeyLobbyDurationSeconds,
    journeyTime,
    loginContext
  );
  const averageMood = useMemo(() => {
    if (activeAfterFakingMove === null) {
      return promptOptions[Math.floor(promptOptions.length / 2)];
    }

    let totalResponses = 0;
    let sumResponses = 0;
    const iter = activeAfterFakingMove.entries();
    let next = iter.next();
    while (!next.done) {
      const [option, count] = next.value;
      totalResponses += count;
      sumResponses += option * count;
      next = iter.next();
    }

    if (totalResponses === 0) {
      return promptOptions[Math.floor(promptOptions.length / 2)];
    }

    return sumResponses / totalResponses;
  }, [activeAfterFakingMove, promptOptions]);

  const percentagesByOption = useMemo(() => {
    const percentagesByOption = new Map<number, number>();
    if (activeAfterFakingMove === null) {
      for (const opt of promptOptions) {
        percentagesByOption.set(opt, 0);
      }
      percentagesByOption.set(promptOptions[Math.floor(promptOptions.length / 2)], 100);
      return percentagesByOption;
    }

    const responsesByOption: number[][] = [];
    for (const opt of promptOptions) {
      responsesByOption.push([opt, activeAfterFakingMove.get(opt) ?? 0]);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const totalResponses = responsesByOption.reduce((acc, [_, count]) => acc + count, 0);

    for (const [opt, count] of responsesByOption) {
      percentagesByOption.set(opt, totalResponses === 0 ? 0 : (count / totalResponses) * 100);
    }
    if (totalResponses === 0) {
      percentagesByOption.set(promptOptions[Math.floor(promptOptions.length / 2)], 100);
    }
    return percentagesByOption;
  }, [promptOptions, activeAfterFakingMove]);

  const optionRefs = useRef<(View | null)[]>([]);
  // the currently rendered carousel transformX. This is usually applied via setNativeProps
  const currentCarouselTransformX = useRef(0);
  // The carousel transformX we are trying to achieve. This is usually set by the gesture
  // handler or a press event
  const targetCarouselTransformX = useRef(0);
  const currentOpacities = useRef<number[]>([]);
  // must be called to awaken the effect that will animate the carousel to the target,
  // whenever the target changes. If the animator is already awake, does nothing.
  // if passed momentum, interpreted as velocity in the x direction and the animation
  // will be adjusted so that it starts at the given velocity
  const awakenCarousel = useRef<((momentum?: number) => void) | null>(null);

  const promptSelectionIndexRef = useRef(promptSelectionIndex);
  promptSelectionIndexRef.current = promptSelectionIndex;

  useEffect(() => {
    const oldArr = optionRefs.current;
    const newArr = Array.from<View | null>({ length: promptOptions.length }).fill(null);
    for (let i = 0; i < oldArr.length && i < newArr.length; i++) {
      newArr[i] = oldArr[i];
    }
    optionRefs.current = newArr;
  }, [promptOptions.length]);

  const boundSetOptionRefs = useMemo<((ref: View | null) => void)[]>(() => {
    const res: ((ref: View | null) => void)[] = [];
    for (let i = 0; i < promptOptions.length; i++) {
      res.push(
        ((i) => {
          return (ref: View | null) => {
            ref?.setNativeProps({
              style: createOptionStyle(
                i,
                currentCarouselTransformX.current,
                currentOpacities.current[i] ?? 0.4
              ),
            });
            optionRefs.current[i] = ref;
          };
        })(i)
      );
    }
    return res;
  }, [promptOptions.length]);

  const calculateTransformXToTarget = useCallback(
    (targetIndex: number) => {
      const itemWidth = styles.option.width as number;
      const itemGap = styles.optionNotFirst.marginLeft as number;
      const visibleWidth = screenSize.width;

      const itemOffsetInCarousel = (itemWidth + itemGap) * targetIndex;
      const desiredOffset = (visibleWidth - itemWidth) / 2;

      return desiredOffset - itemOffsetInCarousel;
    },
    [screenSize.width]
  );

  // initializes the carousel transformX to the current prompt selection
  useEffect(() => {
    const target = calculateTransformXToTarget(promptSelectionIndexRef.current);

    if (
      currentCarouselTransformX.current !== target ||
      targetCarouselTransformX.current !== target
    ) {
      currentCarouselTransformX.current = target;
      targetCarouselTransformX.current = target;

      for (let i = 0; i < optionRefs.current.length; i++) {
        optionRefs.current[i]?.setNativeProps({
          style: createOptionStyle(i, target, currentOpacities.current[i] ?? 0.4),
        });
      }
    }
  }, [calculateTransformXToTarget]);

  // animates the carousel towards the target transformX
  useEffect(() => {
    let mounted = true;
    let awake = true;
    const animationDuration = 500;
    const overshootBonusDuration = 0;
    let interactionHandle: number | null = null;
    let moveAnimation: Animation | null = null;
    let opacityAnimations: (Animation | null)[] = Array.from(
      { length: optionRefs.current.length },
      () => null
    );
    currentOpacities.current = Array.from({ length: optionRefs.current.length }, () => 0.4);

    awakenCarousel.current = awaken;
    requestAnimationFrame(handleAnimations);
    return () => {
      if (!mounted) {
        return;
      }

      if (interactionHandle !== null) {
        InteractionManager.clearInteractionHandle(interactionHandle);
        interactionHandle = null;
      }

      mounted = false;
      awake = false;
      awakenCarousel.current = null;
    };

    function awaken(momentum?: number) {
      if (awake || !mounted) {
        return;
      }

      awake = true;
      interactionHandle = InteractionManager.createInteractionHandle();

      if (
        momentum !== undefined &&
        momentum !== 0 &&
        currentCarouselTransformX.current !== targetCarouselTransformX.current
      ) {
        const maximumMomentum = 3;
        const momentumForAnimation = Math.min(Math.abs(momentum), maximumMomentum);
        const overshootIntensity = momentumForAnimation / maximumMomentum;
        const dur = animationDuration + overshootBonusDuration * overshootIntensity;
        const from = currentCarouselTransformX.current;
        const to = targetCarouselTransformX.current;

        moveAnimation = {
          from,
          to,
          startedAt: null,
          ease: overshootForDesiredInitialDerivative((dur * momentum) / (to - from)),
          duration: dur,
        };
      }
      requestAnimationFrame(handleAnimations);
    }

    function onGoingToSleep() {
      if (interactionHandle !== null) {
        InteractionManager.clearInteractionHandle(interactionHandle);
        interactionHandle = null;
      }
      awake = false;
    }

    function getTransformX(now: DOMHighResTimeStamp): [number, boolean] {
      if (
        moveAnimation === null &&
        currentCarouselTransformX.current === targetCarouselTransformX.current
      ) {
        return [currentCarouselTransformX.current, false];
      }

      if (
        moveAnimation !== null &&
        moveAnimation.to === targetCarouselTransformX.current &&
        (moveAnimation.startedAt ?? now) + moveAnimation.duration <= now
      ) {
        moveAnimation = null;
        return [targetCarouselTransformX.current, false];
      }

      if (moveAnimation === null || moveAnimation.to !== targetCarouselTransformX.current) {
        moveAnimation = {
          from: currentCarouselTransformX.current,
          to: targetCarouselTransformX.current,
          duration: animationDuration,
          startedAt: now,
          ease: easeInOut,
        };
      }

      if (moveAnimation.startedAt === null) {
        moveAnimation.startedAt = now;
      }

      const progress = (now - moveAnimation.startedAt) / moveAnimation.duration;
      const easedProgress = moveAnimation.ease.b_t(progress)[1];
      const transformX =
        moveAnimation.from + (moveAnimation.to - moveAnimation.from) * easedProgress;
      return [transformX, true];
    }

    function getOpacities(now: DOMHighResTimeStamp): [number[], boolean] {
      if (opacityAnimations.length !== optionRefs.current.length) {
        opacityAnimations = Array.from({ length: optionRefs.current.length }, () => null);
      }

      const opacities = Array.from({ length: optionRefs.current.length }, () => 0);
      let opacitiesAreAnimating = false;
      for (let idx = 0; idx < optionRefs.current.length; idx++) {
        const current = currentOpacities.current[idx];
        const target = idx === promptSelectionIndexRef.current ? 1 : 0.4;

        let anim = opacityAnimations[idx];

        if (anim === null && current === target) {
          opacities[idx] = target;
          continue;
        }

        if (anim !== null && anim.to === target && (anim.startedAt ?? now) + anim.duration <= now) {
          opacityAnimations[idx] = null;
          opacities[idx] = target;
          continue;
        }

        if (anim === null || anim.to !== target) {
          anim = {
            from: current,
            to: target,
            duration: animationDuration,
            startedAt: now,
            ease: easeInOut,
          };
          opacityAnimations[idx] = anim;
        }

        if (anim.startedAt === null) {
          anim.startedAt = now;
        }

        const progress = (now - anim.startedAt) / anim.duration;
        const easedProgress = anim.ease.b_t(progress)[1];
        const opacity = anim.from + (anim.to - anim.from) * easedProgress;
        opacities[idx] = opacity;
        opacitiesAreAnimating = true;
      }

      return [opacities, opacitiesAreAnimating];
    }

    function handleAnimations(now: DOMHighResTimeStamp) {
      if (!mounted) {
        return;
      }

      const [transformX, transformXIsAnimating] = getTransformX(now);
      const [opacities, opacitiesAreAnimating] = getOpacities(now);

      setCurrentTransform(transformX, opacities);
      if (transformXIsAnimating || opacitiesAreAnimating) {
        requestAnimationFrame(handleAnimations);
      } else {
        onGoingToSleep();
      }
    }

    function setCurrentTransform(transformX: number, opacities: number[]) {
      currentCarouselTransformX.current = transformX;
      currentOpacities.current = opacities;
      for (let i = 0; i < optionRefs.current.length; i++) {
        optionRefs.current[i]?.setNativeProps({
          style: createOptionStyle(i, transformX, opacities[i]),
        });
      }
    }
  }, []);

  const onOptionPress = useCallback(
    (index: number, momentum?: number) => {
      setPromptSelectionIndexWithoutMovingCarousel(index);
      const transformX = calculateTransformXToTarget(index);
      targetCarouselTransformX.current = transformX;
      awakenCarousel.current?.(momentum);
    },
    [calculateTransformXToTarget, setPromptSelectionIndexWithoutMovingCarousel]
  );

  const onOptionPressRef = useRef(onOptionPress);
  onOptionPressRef.current = onOptionPress;

  const containerStyle = useMemo(() => {
    if (height === 0) {
      return styles.container;
    }

    return Object.assign({}, styles.container, {
      height: height,
      maxHeight: height,
      minHeight: height,
      flexBasis: height,
    });
  }, [height]);

  const currentPanStartedAtTransformX = useRef(0);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderStart: () => {
        currentPanStartedAtTransformX.current = currentCarouselTransformX.current;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dx === 0) {
          return;
        }

        const transformX = currentPanStartedAtTransformX.current + gestureState.dx;
        targetCarouselTransformX.current = transformX;
        currentCarouselTransformX.current = transformX;

        for (let i = 0; i < optionRefs.current.length; i++) {
          optionRefs.current[i]?.setNativeProps({
            style: createOptionStyle(i, transformX, currentOpacities.current[i] ?? 0.4),
          });
        }
      },
      onPanResponderEnd: (evt, gestureState) => {
        if (gestureState.dx * gestureState.dx + gestureState.dy * gestureState.dy < 400) {
          const tapPageX = evt.nativeEvent.pageX;
          const tapPageY = evt.nativeEvent.pageY;
          // interpret as a press, let's see if we hit an option
          for (let i = 0; i < optionRefs.current.length; i++) {
            const ref = optionRefs.current[i];
            if (ref === null) {
              continue;
            }

            ref.measure((x, y, width, height, pageX, pageY) => {
              if (
                pageX <= tapPageX &&
                tapPageX <= pageX + width &&
                pageY <= tapPageY &&
                tapPageY <= pageY + height
              ) {
                onOptionPressRef.current(i);
              }
            });
          }
          return;
        }

        // complete the swipe

        const momentum = gestureState.vx;
        const screenSize = Dimensions.get('screen');
        const screenCenter = screenSize.width / 2;
        const itemWidth = styles.option.width as number;
        const itemGap = styles.optionNotFirst.marginLeft as number;
        const firstItemX = currentCarouselTransformX.current;

        const spaceUntilCenter = screenCenter - firstItemX;
        if (spaceUntilCenter < 0) {
          onOptionPressRef.current(0, momentum);
          return;
        }

        const itemsUntilCenter = Math.floor(spaceUntilCenter / (itemWidth + itemGap));
        if (itemsUntilCenter >= optionRefs.current.length) {
          onOptionPressRef.current(optionRefs.current.length - 1, momentum);
        } else {
          onOptionPressRef.current(itemsUntilCenter, momentum);
        }
      },
    })
  );

  const optionBackgroundRefs = useRef<(View | null)[]>([]);
  const boundSetOptionBackgroundRefs = useMemo(() => {
    const res = [];
    for (let i = 0; i < promptOptions.length; i++) {
      res.push(
        ((index) => (ref: View | null) => {
          ref?.setNativeProps({
            style: currentOptionBackgroundStylesRef.current[index],
          });
          optionBackgroundRefs.current[index] = ref;
        })(i)
      );
    }
    return res;
  }, [promptOptions.length]);
  const currentOptionBackgroundStylesRef = useRef<ViewStyle[]>([]);
  const targetOptionBackgroundHeights = useMemo(() => {
    return promptOptions.map((option) => {
      return ((percentagesByOption.get(option) ?? 0) * (styles.option.height as number)) / 100;
    });
  }, [percentagesByOption, promptOptions]);

  useEffect(() => {
    const oldArr = optionBackgroundRefs.current;
    const newArr = Array.from<View | null>({ length: promptOptions.length }).fill(null);
    for (let i = 0; i < oldArr.length && i < newArr.length; i++) {
      newArr[i] = oldArr[i];
    }
    optionBackgroundRefs.current = newArr;
  }, [promptOptions.length]);

  const targetOptionBackgroundHeightsRef = useRef(targetOptionBackgroundHeights);
  targetOptionBackgroundHeightsRef.current = targetOptionBackgroundHeights;

  useEffect(() => {
    const currentHeights: number[] = Array.from({ length: promptOptions.length }, () => 0);
    const animations: (Animation | null)[] = Array.from(
      { length: promptOptions.length },
      () => null
    );

    let mounted = true;
    requestAnimationFrame(updateHeights);
    return () => {
      mounted = false;
    };

    function updateHeights(now: DOMHighResTimeStamp) {
      if (!mounted) {
        return;
      }

      for (let i = 0; i < currentHeights.length; i++) {
        const current = currentHeights[i];
        const target = targetOptionBackgroundHeightsRef.current[i] ?? 0;
        let anim = animations[i];

        if (anim === null && current === target) {
          continue;
        }

        if (anim !== null && (anim.startedAt ?? 0) + anim.duration < now) {
          setHeightOfBackground(i, target);
          animations[i] = null;
          continue;
        }

        if (anim === null || anim.to !== target) {
          anim = {
            startedAt: now,
            duration: 350,
            from: current,
            to: target,
            ease: easeInOut,
          };
          animations[i] = anim;
        }

        if (anim.startedAt === null) {
          anim.startedAt = now;
        }

        const progress = (now - anim.startedAt) / anim.duration;
        const easedProgress = anim.ease.b_t(progress)[1];
        const newHeight = anim.from + (anim.to - anim.from) * easedProgress;
        setHeightOfBackground(i, newHeight);
      }

      requestAnimationFrame(updateHeights);
    }

    function setHeightOfBackground(idx: number, target: number) {
      currentHeights[idx] = target;
      const newStyle = Object.assign({}, styles.optionBackground, { height: target });
      currentOptionBackgroundStylesRef.current[idx] = newStyle;
      optionBackgroundRefs.current[idx]?.setNativeProps({
        style: newStyle,
      });
    }
  }, [promptOptions.length]);

  return (
    <View style={containerStyle} {...panResponder.current.panHandlers}>
      <JourneyPromptText text={prompt.text} setHeight={setTitleHeight} />
      <View style={styles.optionsContainer}>
        {promptOptions.map((option, index) => {
          return (
            <View
              ref={boundSetOptionRefs[index]}
              style={index === 0 ? styles.option : styles.optionNotFirst}
              key={index}>
              <View ref={boundSetOptionBackgroundRefs[index]} />
              <Text style={styles.optionText}>{option}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.averageMood}>Room Mood: {averageMood.toPrecision(2)}</Text>
    </View>
  );
};

const createOptionStyle = (index: number, transformX: number, opacity: number): ViewStyle => {
  return Object.assign({}, index === 0 ? styles.option : styles.optionNotFirst, {
    transform: [{ translateX: transformX }],
    opacity,
  });
};

/**
 * Pushes an event to the server corresponding to the users current prompt
 * selection once initially and then whenever the selection changes. This
 * will not push events until the journey has started (i.e., journeyTime >= 0),
 * and will stop pushing events once the journey has ended (i.e., journeyTime
 * >= journeyDuration).
 *
 * @param journeyUid The UID of the journey to push events to
 * @param journeyJwt The JWT for adding events to the journey
 * @param sessionUid The session to add events to
 * @param promptSelection The current prompt selection
 * @param journeyLobbyDurationSeconds The length of the journey lobby in seconds
 * @param journeyTime The mutable object that keeps track of the current journey time
 * @param loginContext The current login context to use
 */
const usePromptSelectionEvents = (
  journeyUid: string,
  journeyJwt: string,
  sessionUid: string,
  promptSelection: number,
  journeyLobbyDurationSeconds: number,
  journeyTime: JourneyTime,
  loginContext: LoginContextValue
): void => {
  const lastPromptSelection = useRef<number | null>(null);
  const lastPromptValueSentAt = useRef<DOMHighResTimeStamp | null>(null);

  // we buffer this a bit to give the join/leave events a moment to be sent
  const minEventTimeExcl = 250;
  const maxEventTimeExcl = journeyLobbyDurationSeconds * 1000 - 250;
  const minSpacing = 1000;

  const sendEvent = useCallback(
    async (
      journeyTimeMs: DOMHighResTimeStamp,
      selection: number,
      failures?: number | undefined
    ): Promise<void> => {
      if (failures === undefined) {
        failures = 0;
      }

      if (loginContext.state !== 'logged-in') {
        return;
      }

      try {
        const response = await apiFetch(
          '/api/1/journeys/events/respond_numeric_prompt',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({
              journey_uid: journeyUid,
              journey_jwt: journeyJwt,
              session_uid: sessionUid,
              journey_time: journeyTimeMs / 1000,
              data: {
                rating: selection,
              },
            }),
          },
          loginContext
        );

        if (!response.ok) {
          if (response.status === 409 && failures < 5) {
            const body = await response.json();
            if (body.type === 'session_not_started') {
              await new Promise((resolve) => setTimeout(resolve, 250));
              return sendEvent(journeyTimeMs, selection, failures + 1);
            }
            throw body;
          }
          throw response;
        }
      } catch (e) {
        if (e instanceof TypeError) {
          console.error('Failed to send prompt selection event - could not connect to server:', e);
        } else if (e instanceof Response) {
          const data = await e.json();
          console.error(
            'Failed to send prompt selection event - server responded with error:',
            data
          );
        } else {
          console.error('Failed to send prompt selection event - unknown error:', e);
        }
      }
    },
    [journeyUid, journeyJwt, sessionUid, loginContext]
  );

  // first event
  useEffect(() => {
    if (lastPromptSelection.current !== null) {
      return;
    }

    let active = true;

    const onTimeChanged = (oldTime: DOMHighResTimeStamp, newTime: DOMHighResTimeStamp) => {
      if (lastPromptSelection.current !== null) {
        unmount();
        return;
      }

      if (newTime >= maxEventTimeExcl) {
        unmount();
        return;
      }

      if (newTime > minEventTimeExcl) {
        const time = Math.max(oldTime, 0);
        sendEvent(time, promptSelection);
        lastPromptSelection.current = promptSelection;
        lastPromptValueSentAt.current = time;
        unmount();
      }
    };

    const predictedIndex = journeyTime.onTimeChanged.current.length;
    journeyTime.onTimeChanged.current.push(onTimeChanged);

    const unmount = () => {
      if (!active) {
        return;
      }

      active = false;
      for (let i = predictedIndex; i >= 0; i--) {
        if (journeyTime.onTimeChanged.current[i] === onTimeChanged) {
          journeyTime.onTimeChanged.current.splice(i, 1);
          break;
        }
      }
    };

    return unmount;
  }, [
    journeyTime.onTimeChanged,
    promptSelection,
    journeyLobbyDurationSeconds,
    sendEvent,
    maxEventTimeExcl,
  ]);

  // additional events
  useEffect(() => {
    if (lastPromptSelection.current === null || lastPromptValueSentAt.current === null) {
      return;
    }

    if (promptSelection === lastPromptSelection.current) {
      return;
    }

    const timeMs = journeyTime.time.current;
    if (timeMs <= minEventTimeExcl || timeMs >= maxEventTimeExcl) {
      return;
    }

    const minSendTime = lastPromptValueSentAt.current + minSpacing;
    if (timeMs < minSendTime) {
      // do it later
      let active = true;

      const onTimeChanged = (oldTime: DOMHighResTimeStamp, newTime: DOMHighResTimeStamp) => {
        if (!active) {
          return;
        }

        if (newTime <= minEventTimeExcl || newTime >= maxEventTimeExcl) {
          unmount();
          return;
        }

        if (newTime >= minSendTime) {
          sendEvent(newTime, promptSelection);
          lastPromptSelection.current = promptSelection;
          lastPromptValueSentAt.current = newTime;
          unmount();
        }
      };

      const predictedIndex = journeyTime.onTimeChanged.current.length;
      journeyTime.onTimeChanged.current.push(onTimeChanged);

      const unmount = () => {
        if (!active) {
          return;
        }

        active = false;
        for (let i = predictedIndex; i >= 0; i--) {
          if (journeyTime.onTimeChanged.current[i] === onTimeChanged) {
            journeyTime.onTimeChanged.current.splice(i, 1);
            break;
          }
        }
      };
      return unmount;
    }

    sendEvent(timeMs, promptSelection);
    lastPromptSelection.current = promptSelection;
    lastPromptValueSentAt.current = timeMs;
  }, [
    journeyTime.time,
    journeyTime.onTimeChanged,
    promptSelection,
    journeyLobbyDurationSeconds,
    sendEvent,
    maxEventTimeExcl,
  ]);
};

type FakedMove = {
  /**
   * The index of the prompt option we are lowering the selection of by
   * 1
   */
  fromIndex: number;

  /**
   * The maximum value we should assume for the fromIndex; if the actual
   * value from the stats endpoint dips below this value, ignore this part
   * of the faked move
   */
  maxFromActive: number;

  /**
   * The index of the prompt option we are increasing the selection of by
   * 1
   */
  toIndex: number;

  /**
   * The minimum value we shoul assume for the toIndex; if the actual
   * value from the stats endpoint goes above this value, drop the faked
   * move early
   */
  minToActive: number;

  /**
   * The journey time at which we should stop faking the move
   */
  endsAt: number;
};

/**
 * Finds an overshoot easing function that will give the desired derivative
 * at the start of the curve, i.e, dy/dt(0) = dydt_0. This is accomplished
 * by using either the overshoot start or overshoot end family of easings,
 * for negative or positive dydt_0 respectively. The parameter to the family
 * is intensity, so we can create a blackbox function f(intensity) -> dy/dt(0),
 * which this then solves for using newton's method
 *
 * If the dydt is 0 this is unsolvable and instead just returns a standard
 * easeIn, which starts slow and ends fast
 */
const overshootForDesiredInitialDerivative = (dydt_0: number): Bezier => {
  if (dydt_0 === 0) {
    return easeIn;
  }

  const getCurve = (intensity: number): Bezier => {
    return dydt_0 < 0
      ? overshootStartEaseWithIntensity(intensity)
      : overshootEndEaseWithIntensity(intensity);
  };

  const f = (intensity: number): number => {
    return getCurve(intensity).differential_t(0)[1] - dydt_0;
  };

  const df = (intensity: number): number => {
    return (f(intensity + 0.01) - f(intensity)) / 0.01;
  };

  const maxError = 0.1;
  let x = Math.abs(dydt_0) * 4;
  for (let i = 0; i < 10; i++) {
    const error = f(x);
    if (Math.abs(error) < maxError) {
      break;
    }

    let deriv = df(x);
    if (isNaN(deriv) || deriv === 0) {
      break;
    }

    if (Math.abs(deriv) > 100) {
      deriv = Math.sign(deriv) * 100;
    }

    x -= error / df(x);
  }
  return getCurve(x);
};

const overshootStartEaseWithIntensity = (intensity: number): Bezier => {
  return new Bezier([
    [0, 0],
    [0.25, -intensity],
    [1, 1],
  ]);
};

const overshootEndEaseWithIntensity = (intensity: number): Bezier => {
  return new Bezier([
    [0, 0],
    [0.25, intensity],
    [1, 1],
  ]);
};

type Animation = {
  from: number;
  to: number;
  startedAt: DOMHighResTimeStamp | null;
  ease: Bezier;
  duration: number;
};
