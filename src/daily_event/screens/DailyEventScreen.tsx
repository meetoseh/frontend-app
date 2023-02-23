import { StatusBar } from 'expo-status-bar';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, LayoutChangeEvent, PanResponder, View, ViewStyle } from 'react-native';
import { DailyEventJourneyCard } from '../components/DailyEventJourneyCard';
import { JourneyRef } from '../../journey/models/JourneyRef';
import { GestureHandler } from '../../shared/lib/GestureHandler';
import { shuffle } from '../../shared/lib/shuffle';
import {
  DailyEventJourneyState,
  useDailyEventJourneyStates,
} from '../hooks/useDailyEventJourneyState';
import { DailyEvent } from '../models/DailyEvent';
import { DailyEventJourney } from '../models/DailyEventJourney';
import { styles } from './DailyEventScreenStyles';
import { useMyProfilePictureState } from '../../shared/hooks/useMyProfilePicture';
import { LoginContext } from '../../shared/contexts/LoginContext';
import { Cancelers } from '../../shared/lib/cancelers';
import { easeIn, easeOut } from '../../shared/lib/Bezier';

type DailyEventScreenProps = {
  /**
   * The event to show
   */
  event: DailyEvent;

  /**
   * The function to call if the user wants to go to their settings
   */
  onGotoSettings: () => void;

  /**
   * The function to call to display a journey that we've already
   * loaded.
   * @param journey The journey to go to
   */
  onGotoJourney: (journey: JourneyRef) => void;
};

export const DailyEventScreen = ({ event, onGotoSettings }: DailyEventScreenProps) => {
  const loginContext = useContext(LoginContext);
  const loadedJourneys = useDailyEventJourneyStates(event.journeys);
  const profilePicture = useMyProfilePictureState({
    loginContext,
    displayWidth: 48,
    displayHeight: 48,
  });
  const [layoutSize, setLayoutSize] = useState<{ width: number; height: number }>(
    Dimensions.get('screen')
  );

  const carouselShuffle = useMemo<number[]>(() => {
    const result = [];
    for (let i = 0; i < event.journeys.length; i++) {
      result.push(i);
    }
    shuffle(result);
    return result;
  }, [event.journeys.length]);

  const reorderedJourneys = useMemo(() => {
    const result: { journey: DailyEventJourney; state: DailyEventJourneyState }[] = [];
    for (const idx of carouselShuffle) {
      result.push({
        journey: event.journeys[idx],
        state: loadedJourneys[idx],
      });
    }
    return result;
  }, [event.journeys, carouselShuffle, loadedJourneys]);

  const [cardInFrontIndex, setCardInFrontIndex] = useState<number>(0);
  const [cardBehindIndex, setCardBehindIndex] = useState<number | null>(null);
  const [cardInFrontDynamicStyle, setCardInFrontDynamicStyle] = useState<{
    translate?: number;
    rotate?: number;
    scale?: number; // 0-1
  }>({});

  const renderedCardInFrontIndex = useRef(cardInFrontIndex);
  const renderedCardInFrontDynamicStyle = useRef(cardInFrontDynamicStyle);
  const renderedCardBehindIndex = useRef(cardBehindIndex);
  const rerenderCallbacks = useRef<(() => void)[]>([]);
  const transitionLock = useRef(false);
  const desiredPan = useRef<number | null>(null);
  const panStarter = useRef<(() => void) | null>(null);
  const panCanceler = useRef<((after: 'swipe' | 'resetSmooth' | 'resetHard') => void) | null>(null);

  /**
   * Waits until the predicate is true, checking once per render
   */
  const waitUntil = useCallback((pred: () => boolean): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      let active = true;
      const timeout = setTimeout(() => {
        if (!active) {
          return;
        }

        active = false;
        console.log('bad waitUntil predicate:', pred);
        reject('Timed out waiting for predicate to be true');
      }, 1000);
      const onRerender = () => {
        if (!active) {
          return;
        }

        if (pred()) {
          clearTimeout(timeout);
          active = false;
          requestAnimationFrame(() => resolve());
          return;
        }

        rerenderCallbacks.current.push(onRerender);
      };

      rerenderCallbacks.current.push(onRerender);
    });
  }, []);

  const handleTransition = useCallback(
    async (newIndex: number) => {
      if (transitionLock.current) {
        return;
      }

      transitionLock.current = true;
      try {
        await new Promise<void>((resolve) => doTransition(resolve));
      } finally {
        transitionLock.current = false;
      }

      function doTransition(resolve: () => void) {
        const screenSize = Dimensions.get('screen');
        const initial = renderedCardInFrontDynamicStyle.current;
        const direction = (initial.translate ?? 0) >= 0 ? 1 : -1;
        const initialFilledIn = {
          translate: initial.translate ?? 0,
          rotate: initial.rotate ?? 0,
          scale: initial.scale ?? 1,
        };
        const final = {
          translate: screenSize.width * direction,
          rotate: 45 * direction,
          scale: 1 / 3,
        };

        const durationMs = 500;
        let expectedStyle = initial;
        const matchesExpected = () => {
          return renderedCardInFrontDynamicStyle.current === expectedStyle;
        };

        let startTime: DOMHighResTimeStamp | null = null;
        const onFrame = (time: DOMHighResTimeStamp) => {
          if (startTime === null) {
            startTime = time;
            if (!matchesExpected()) {
              console.log(
                'transitionResetPan: did not match expected on first frame: ',
                expectedStyle,
                renderedCardInFrontDynamicStyle.current
              );
              setCardInFrontDynamicStyle(expectedStyle);
            }
            requestAnimationFrame(onFrame);
            return;
          }

          const elapsed = time - startTime;
          if (elapsed >= durationMs) {
            setCardInFrontIndex(newIndex);
            if (renderedCardInFrontIndex.current === newIndex) {
              setCardInFrontDynamicStyle({});
              setCardBehindIndex(null);
              resolve();
              return;
            }

            waitUntil(function frontCardMatches() {
              return renderedCardInFrontIndex.current === newIndex;
            }).finally(() => {
              setCardInFrontDynamicStyle({});
              setCardBehindIndex(null);
              resolve();
            });
            return;
          }

          if (!matchesExpected()) {
            waitUntil(matchesExpected)
              .then(() => requestAnimationFrame(onFrame))
              .catch((e) => {
                console.log('transitionResetPan: error waiting for expected style:', e);
                setCardInFrontDynamicStyle(expectedStyle);
                requestAnimationFrame(onFrame);
              });
            return;
          }

          const progress = elapsed / durationMs;
          const easedProgress = easeIn.y_x(progress);
          expectedStyle = {
            translate:
              initialFilledIn.translate +
              (final.translate - initialFilledIn.translate) * easedProgress,
            rotate:
              initialFilledIn.rotate + (final.rotate - initialFilledIn.rotate) * easedProgress,
            scale: initialFilledIn.scale + (final.scale - initialFilledIn.scale) * easedProgress,
          };
          setCardInFrontDynamicStyle(expectedStyle);
          requestAnimationFrame(onFrame);
        };

        requestAnimationFrame(onFrame);
      }
    },
    [waitUntil]
  );

  /**
   * Transitions the front card back to its original position, for use
   * after a pan that did not become a swipe
   */
  const transitionResetPan = useCallback(async () => {
    if (transitionLock.current || renderedCardBehindIndex.current === null) {
      setCardInFrontDynamicStyle({});
      setCardBehindIndex(null);
      return;
    }

    transitionLock.current = true;
    try {
      await new Promise<void>((resolve) => doTransition(resolve));
    } finally {
      transitionLock.current = false;
    }

    function doTransition(resolve: () => void) {
      const initial = renderedCardInFrontDynamicStyle.current;
      const final = {
        translate: initial.translate === undefined ? undefined : 0,
        rotate: initial.rotate === undefined ? undefined : 0,
        scale: initial.scale === undefined ? undefined : 1,
      };

      if (final.translate === undefined && final.rotate === undefined) {
        setCardInFrontDynamicStyle({});
        setCardBehindIndex(null);
        return;
      }

      const durationMs = 350;
      let expectedStyle = initial;
      const matchesExpected = () => {
        return renderedCardInFrontDynamicStyle.current === expectedStyle;
      };

      let startTime: DOMHighResTimeStamp | null = null;
      const onFrame = (time: DOMHighResTimeStamp) => {
        if (startTime === null) {
          startTime = time;
          if (!matchesExpected()) {
            console.log(
              'transitionResetPan: did not match expected on first frame: ',
              expectedStyle,
              renderedCardInFrontDynamicStyle.current
            );
            setCardInFrontDynamicStyle(expectedStyle);
          }
          requestAnimationFrame(onFrame);
          return;
        }

        const elapsed = time - startTime;
        if (elapsed >= durationMs) {
          setCardInFrontDynamicStyle({});
          setCardBehindIndex(null);
          resolve();
          return;
        }

        if (!matchesExpected()) {
          waitUntil(matchesExpected)
            .then(() => requestAnimationFrame(onFrame))
            .catch((e) => {
              console.log('transitionResetPan: error waiting for expected style:', e);
              setCardInFrontDynamicStyle(expectedStyle);
              requestAnimationFrame(onFrame);
            });
          return;
        }

        const progress = elapsed / durationMs;
        const easedProgress = easeOut.y_x(progress);
        expectedStyle = {
          translate:
            initial.translate === undefined ? undefined : initial.translate * (1 - easedProgress),
          rotate: initial.rotate === undefined ? undefined : initial.rotate * (1 - easedProgress),
          scale: initial.scale === undefined ? undefined : initial.scale * (1 - easedProgress),
        };
        setCardInFrontDynamicStyle(expectedStyle);
        requestAnimationFrame(onFrame);
      };

      requestAnimationFrame(onFrame);
    }
  }, [waitUntil]);

  // pan handling
  useEffect(() => {
    let active = true;
    const cancelers = new Cancelers();
    handlePanning();
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

    async function handlePanning() {
      panCanceler.current?.('resetHard');

      let panning = false;
      let panCounter = 0;
      let expectedTranslateX: number | null = null;
      let expectedCardBehindIndex: number | null = null;

      const panCancelerWhenPanning = (after: 'swipe' | 'resetSmooth' | 'resetHard') => {
        if (panning) {
          panning = false;
          panCanceler.current = null;
          ++panCounter;
          expectedTranslateX = null;
          expectedCardBehindIndex = null;
          if (after === 'resetHard') {
            setCardInFrontDynamicStyle({});
            setCardBehindIndex(null);
          } else if (after === 'resetSmooth') {
            transitionResetPan();
          } else if (after === 'swipe') {
            if (renderedCardBehindIndex.current === null) {
              setCardInFrontDynamicStyle({});
              setCardBehindIndex(null);
            } else {
              handleTransition(renderedCardBehindIndex.current);
            }
          }
        }
      };
      cancelers.add(() => {
        panStarter.current = null;
        panCanceler.current = null;
        if (panning) {
          panCancelerWhenPanning('resetHard');
        }
      });

      panStarter.current = () => {
        if (!panning) {
          panning = true;
          panCanceler.current = panCancelerWhenPanning;
          ((panId) => requestAnimationFrame(() => handlePan(panId)))(panCounter);
        }
      };
      panCanceler.current = null;

      function getCorrectBehindCardForDeltaX(dx: number): number {
        if (dx < 0) {
          return renderedCardInFrontIndex.current === 0
            ? event.journeys.length - 1
            : renderedCardInFrontIndex.current - 1;
        } else {
          return renderedCardInFrontIndex.current === event.journeys.length - 1
            ? 0
            : renderedCardInFrontIndex.current + 1;
        }
      }

      function currentTransformIsExpected() {
        const currTransform = renderedCardInFrontDynamicStyle.current;
        if (expectedTranslateX === null) {
          return (
            currTransform.translate === undefined &&
            currTransform.rotate === undefined &&
            currTransform.scale === undefined
          );
        }

        return (
          currTransform.translate === expectedTranslateX &&
          currTransform.rotate === undefined &&
          currTransform.scale === undefined
        );
      }

      function currentBehindCardIsExpected() {
        return renderedCardBehindIndex.current === expectedCardBehindIndex;
      }

      function renderedMatchesExpected(panId: number) {
        if (panId !== panCounter) {
          return true;
        }

        return currentTransformIsExpected() && currentBehindCardIsExpected();
      }

      function handlePanOnceUpdated(panId: number) {
        if (renderedMatchesExpected(panId)) {
          requestAnimationFrame(() => handlePan(panId));
          return;
        }

        waitUntil(() => renderedMatchesExpected(panId))
          .then(() => {
            requestAnimationFrame(() => handlePan(panId));
          })
          .catch(() => {
            if (panning && panCounter === panId) {
              console.log(
                'panning failed to wait for rendered to be expected; canceling pan:',
                expectedCardBehindIndex,
                expectedTranslateX,
                renderedCardBehindIndex.current,
                renderedCardInFrontDynamicStyle.current,
                renderedMatchesExpected(panId)
              );
              panCancelerWhenPanning('resetHard');
            }
          });
      }

      function handlePan(panId: number) {
        if (!panning || panCounter !== panId) {
          return;
        }

        if (!renderedMatchesExpected(panId)) {
          handlePanOnceUpdated(panId);
          return;
        }

        if (
          desiredPan.current === null &&
          expectedTranslateX === null &&
          expectedCardBehindIndex === null
        ) {
          requestAnimationFrame(() => handlePan(panId));
          return;
        }

        if (
          desiredPan.current !== null &&
          expectedTranslateX !== null &&
          desiredPan.current === expectedTranslateX &&
          expectedCardBehindIndex === getCorrectBehindCardForDeltaX(expectedTranslateX)
        ) {
          requestAnimationFrame(() => handlePan(panId));
          return;
        }

        expectedTranslateX = desiredPan.current;
        if (expectedTranslateX === null) {
          expectedCardBehindIndex = null;
          setCardInFrontDynamicStyle({});
          setCardBehindIndex(null);
        } else {
          expectedCardBehindIndex = getCorrectBehindCardForDeltaX(expectedTranslateX);
          setCardInFrontDynamicStyle({ translate: expectedTranslateX });
          setCardBehindIndex(expectedCardBehindIndex);
        }
        handlePanOnceUpdated(panId);
      }
    }
  }, [event.journeys.length, waitUntil, handleTransition, transitionResetPan]);

  const onStart = useCallback((journey: DailyEventJourney) => {
    // todo
    console.log('start', journey.uid);
  }, []);

  const boundOnStart = useMemo(() => {
    const result: (() => void)[] = [];
    reorderedJourneys.forEach((j) => {
      result.push(onStart.bind(undefined, j.journey));
    });
    return result;
  }, [reorderedJourneys, onStart]);

  const onStartRandom = useCallback(() => {
    // todo
  }, []);

  const gesture = useRef(new GestureHandler(layoutSize));
  useEffect(() => {
    gesture.current = new GestureHandler(layoutSize);
  }, [layoutSize]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderMove: (evt, gestureState) => {
        const gest = gesture.current;
        if (gest.gestureDetected || transitionLock.current) {
          return;
        }

        const detected = gest.onTouchMove(gestureState.moveX, gestureState.moveY);
        const dx = gest.deltaX;
        if (dx === null) {
          return;
        }

        if (detected === 'pre-horizontal') {
          desiredPan.current = dx;
          if (panCanceler.current === null) {
            panStarter.current?.();
          }
        } else if (detected === 'horizontal') {
          panCanceler.current?.('swipe');
        }
      },
      onPanResponderEnd: () => {
        gesture.current.onTouchEnd();

        if (!transitionLock.current) {
          panCanceler.current?.('resetSmooth');
        }
      },
    })
  );

  const cardBehindStyle = useMemo<ViewStyle>(() => {
    return Object.assign(
      {},
      {
        width: layoutSize.width,
        height: layoutSize.height,
      },
      styles.cardBehind
    );
  }, [layoutSize.width, layoutSize.height]);

  const cardInFrontStyle = useMemo<ViewStyle>(() => {
    return Object.assign({}, styles.cardInFront, {
      transform: [
        ...(cardInFrontDynamicStyle.rotate === undefined
          ? []
          : [{ rotate: cardInFrontDynamicStyle.rotate + 'deg' }]),
        ...(cardInFrontDynamicStyle.translate === undefined
          ? []
          : [{ translateX: cardInFrontDynamicStyle.translate }]),
        ...(cardInFrontDynamicStyle.scale === undefined
          ? []
          : [{ scale: cardInFrontDynamicStyle.scale }]),
      ],
    });
  }, [cardInFrontDynamicStyle]);

  renderedCardInFrontDynamicStyle.current = cardInFrontDynamicStyle;
  renderedCardInFrontIndex.current = cardInFrontIndex;
  renderedCardBehindIndex.current = cardBehindIndex;
  const cpRerenderCallbacks = rerenderCallbacks.current;
  rerenderCallbacks.current = [];
  cpRerenderCallbacks.forEach((cb) => cb());

  const onCardInFrontLayout = useCallback((ev: LayoutChangeEvent) => {
    setLayoutSize((oldSize) => {
      if (
        oldSize.width === ev.nativeEvent.layout.width &&
        oldSize.height === ev.nativeEvent.layout.height
      ) {
        return oldSize;
      }
      return {
        width: ev.nativeEvent.layout.width,
        height: ev.nativeEvent.layout.height,
      };
    });
  }, []);

  return (
    <View style={styles.container} {...panResponder.current.panHandlers}>
      {cardBehindIndex !== null && (
        <View style={cardBehindStyle}>
          <DailyEventJourneyCard
            profilePicture={profilePicture}
            journey={reorderedJourneys[cardBehindIndex].journey}
            state={reorderedJourneys[cardBehindIndex].state}
            event={event}
            onGotoSettings={onGotoSettings}
            onStart={boundOnStart[cardBehindIndex]}
            onStartRandom={onStartRandom}
            journeyIndex={cardBehindIndex}
          />
        </View>
      )}
      <View style={cardInFrontStyle} onLayout={onCardInFrontLayout}>
        <DailyEventJourneyCard
          profilePicture={profilePicture}
          journey={reorderedJourneys[cardInFrontIndex].journey}
          state={reorderedJourneys[cardInFrontIndex].state}
          event={event}
          onGotoSettings={onGotoSettings}
          onStart={boundOnStart[cardInFrontIndex]}
          onStartRandom={onStartRandom}
          journeyIndex={cardInFrontIndex}
        />
      </View>
      <StatusBar style="light" />
    </View>
  );
};
