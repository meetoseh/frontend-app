import { ReactElement } from 'react';
import { FeatureComponentProps } from '../../models/Feature';
import { GotoEmotionResources } from './GotoEmotionResources';
import { GotoEmotionState } from './GotoEmotionState';
import { Pressable, StyleProp, Text, TextStyle, View } from 'react-native';
import { styles } from './GotoEmotionStyles';
import { STANDARD_DARK_BLACK_GRAY_GRADIENT_SVG } from '../../../../styling/colors';
import { StatusBar } from 'expo-status-bar';
import { SvgLinearGradient } from '../../../../shared/anim/SvgLinearGradient';
import { useWindowSizeValueWithCallbacks } from '../../../../shared/hooks/useWindowSize';
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { setVWC } from '../../../../shared/lib/setVWC';
import { useValuesWithCallbacksEffect } from '../../../../shared/hooks/useValuesWithCallbacksEffect';
import Back from './assets/Back';
import { useTopBarHeight } from '../../../../shared/hooks/useTopBarHeight';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { ProfilePictures } from '../../../interactive_prompt/components/ProfilePictures';
import { FilledInvertedButton } from '../../../../shared/components/FilledInvertedButton';
import { useContentWidth } from '../../../../shared/lib/useContentWidth';
import { useBotBarHeight } from '../../../../shared/hooks/useBotBarHeight';
import { FilledPremiumButton } from '../../../../shared/components/FilledPremiumButton';

/**
 * Allows the user to start a class within a given emotion, or go back to
 * their home screen.
 */
export const GotoEmotion = ({
  state,
  resources,
}: FeatureComponentProps<
  GotoEmotionState,
  GotoEmotionResources
>): ReactElement => {
  const windowSizeVWC = useWindowSizeValueWithCallbacks();
  const containerRef = useWritableValueWithCallbacks<View | null>(() => null);
  const topBarHeight = useTopBarHeight();

  useValuesWithCallbacksEffect([windowSizeVWC, containerRef], () => {
    const ele = containerRef.get();
    const size = windowSizeVWC.get();
    if (ele !== null) {
      ele.setNativeProps({
        style: { width: size.width, height: size.height },
      });
    }
    return undefined;
  });

  const freeClassTextStyleVWC = useWritableValueWithCallbacks<
    StyleProp<TextStyle>
  >(() => undefined);
  const premiumClassTextStyleVWC = useWritableValueWithCallbacks<
    StyleProp<TextStyle>
  >(() => undefined);
  const contentWidth = useContentWidth();
  const bottomBarHeight = useBotBarHeight();

  return (
    <View
      style={Object.assign({}, styles.container, {
        height: windowSizeVWC.get().height,
        width: windowSizeVWC.get().width,
      })}
      ref={(r) => setVWC(containerRef, r)}
    >
      <SvgLinearGradient state={STANDARD_DARK_BLACK_GRAY_GRADIENT_SVG} />

      <View
        style={Object.assign({}, styles.backButtonContainer, {
          paddingTop: topBarHeight,
        })}
      >
        <Pressable
          style={styles.backButton}
          onPress={() => resources.get().onBack()}
        >
          <Back />
        </Pressable>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>You want to feel</Text>
        <RenderGuardedComponent
          props={useMappedValueWithCallbacks(
            state,
            (s) => s.show?.emotion?.word ?? ''
          )}
          component={(word) => <Text style={styles.emotion}>{word}</Text>}
        />
        <View style={styles.socialProof}>
          <RenderGuardedComponent
            props={useMappedValueWithCallbacks(
              resources,
              (r) => r.freeEmotionJourney.result?.numVotes ?? 0
            )}
            component={(votes) => (
              <Text style={styles.socialProofMessage}>
                {votes.toLocaleString()} others also chose this today
              </Text>
            )}
          />
          <View style={styles.socialProofPictures}>
            <ProfilePictures
              profilePictures={useMappedValueWithCallbacks(resources, (r) => ({
                pictures: r.socialProofPictures,
                additionalUsers: 0,
              }))}
              hereSettings={{ type: 'none' }}
              center
              size={24}
            />
          </View>
        </View>
      </View>
      <View style={styles.buttons}>
        <FilledInvertedButton
          onPress={() => resources.get().onTakeFreeJourney()}
          setTextStyle={(s) => setVWC(freeClassTextStyleVWC, s)}
          width={contentWidth}
        >
          <RenderGuardedComponent
            props={freeClassTextStyleVWC}
            component={(style) => (
              <Text style={style}>Take a 1-minute Class</Text>
            )}
          />
        </FilledInvertedButton>

        <RenderGuardedComponent
          props={useMappedValueWithCallbacks(
            resources,
            (r) =>
              r.havePro.type === 'loading' ||
              (r.havePro.type === 'success' && !r.havePro.result) ||
              (r.premiumEmotionJourney.type !== 'unavailable' &&
                r.premiumEmotionJourney.type !== 'load-prevented')
          )}
          component={(show) =>
            !show ? (
              <></>
            ) : (
              <FilledPremiumButton
                onPress={() => resources.get().onTakeFreeJourney()}
                setTextStyle={(s) => setVWC(premiumClassTextStyleVWC, s)}
                width={contentWidth}
              >
                <RenderGuardedComponent
                  props={premiumClassTextStyleVWC}
                  component={(style) => (
                    <Text style={style}>Take a Longer Class</Text>
                  )}
                />
              </FilledPremiumButton>
            )
          }
        />
      </View>
      <View style={{ width: 1, height: bottomBarHeight }} />
      <StatusBar style="light" />
    </View>
  );
};
