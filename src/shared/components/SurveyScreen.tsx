import { PropsWithChildren, ReactElement, useMemo } from 'react';
import {
  VariableStrategyProps,
  useVariableStrategyPropsAsValueWithCallbacks,
} from '../anim/VariableStrategyProps';
import { styles } from './SurveyScreenStyles';
import { RenderGuardedComponent } from './RenderGuardedComponent';
import { useWindowSizeValueWithCallbacks } from '../hooks/useWindowSize';
import { useWritableValueWithCallbacks } from '../lib/Callbacks';
import { useTopBarHeight } from '../hooks/useTopBarHeight';
import { useBotBarHeight } from '../hooks/useBotBarHeight';
import { useMappedValuesWithCallbacks } from '../hooks/useMappedValuesWithCallbacks';
import { useMappedValueWithCallbacks } from '../hooks/useMappedValueWithCallbacks';
import { ScrollView, View, Text } from 'react-native';
import { useValuesWithCallbacksEffect } from '../hooks/useValuesWithCallbacksEffect';
import { setVWC } from '../lib/setVWC';
import { SvgLinearGradientBackground } from '../anim/SvgLinearGradientBackground';
import { DARK_BLACK_GRAY_GRADIENT_SVG } from '../../styling/colors';
import { BackContinue } from './BackContinue';
import { ModalContext, Modals, ModalsOutlet } from '../contexts/ModalContext';
import { StatusBar } from 'expo-status-bar';
import { useContentWidth } from '../lib/useContentWidth';

export type SurveyScreenProps = {
  /** The title, usually the question */
  title: VariableStrategyProps<ReactElement>;
  /** The subtitle, usually the purpose for the question */
  subtitle: VariableStrategyProps<ReactElement>;
  /** The handler for when the back button is pressed, or null for no back button */
  onBack: VariableStrategyProps<(() => void) | null>;
  /** The handler for when the continue button is pressed */
  onContinue: VariableStrategyProps<() => void>;
};

const MIN_ABOVE_CONTENT_PADDING = 16;
const MIN_BELOW_CONTENT_PADDING = 12;
const BELOW_BACK_CONTINUE_PADDING = 32;

/**
 * Presents a basic dark screen with a title, subtitle, children, and a back/continue footer.
 * Provides a modal context to the content.
 */
export const SurveyScreen = ({
  title: titleVSP,
  subtitle: subtitleVSP,
  onBack: onBackVSP,
  onContinue: onContinueVSP,
  children,
}: PropsWithChildren<SurveyScreenProps>) => {
  /*
   * Could use a VerticalLayout for this component, but I think because the
   * distribution of height is so simple, it's more clear and only slightly more
   * verbose not to include that abstraction
   */

  const titleVWC = useVariableStrategyPropsAsValueWithCallbacks(titleVSP);
  const subtitleVWC = useVariableStrategyPropsAsValueWithCallbacks(subtitleVSP);
  const onBackVWC = useVariableStrategyPropsAsValueWithCallbacks(onBackVSP);
  const onContinueVWC =
    useVariableStrategyPropsAsValueWithCallbacks(onContinueVSP);

  const modals = useWritableValueWithCallbacks((): Modals => []);
  const modalsValue = useMemo(() => ({ modals }), [modals]);

  const windowSizeVWC = useWindowSizeValueWithCallbacks();
  const contentHeightVWC = useWritableValueWithCallbacks<number | null>(
    () => null
  );
  const backContinueHeightVWC = useWritableValueWithCallbacks<number | null>(
    () => null
  );
  const estimatedBackContinueHeightVWC = useMappedValueWithCallbacks(
    backContinueHeightVWC,
    (height) => height ?? 56
  );
  const topBarHeight = useTopBarHeight();
  const bottomBarHeight = useBotBarHeight();
  const contentWidth = useContentWidth();

  const scrollingRequiredVWC = useMappedValuesWithCallbacks(
    [windowSizeVWC, contentHeightVWC, estimatedBackContinueHeightVWC],
    () => {
      const totalHeight = windowSizeVWC.get().height;
      const contentHeight = contentHeightVWC.get();
      const backContinueHeight = estimatedBackContinueHeightVWC.get();

      if (contentHeight === null) {
        return false;
      }

      const requiredHeight =
        topBarHeight +
        MIN_ABOVE_CONTENT_PADDING +
        contentHeight +
        MIN_BELOW_CONTENT_PADDING +
        backContinueHeight +
        BELOW_BACK_CONTINUE_PADDING +
        bottomBarHeight;

      return requiredHeight > totalHeight;
    }
  );

  const content: ReactElement = (
    <>
      <View style={{ height: topBarHeight }} />
      <View style={styles.contentGrowingPadding} />
      <View
        style={Object.assign({}, styles.contentWrapper, {
          width: contentWidth,
        })}
        onLayout={(e) => {
          const height = e.nativeEvent?.layout?.height;
          if (height !== undefined && height !== null && height > 0) {
            setVWC(contentHeightVWC, height);
          }
        }}
      >
        <ModalContext.Provider value={modalsValue}>
          <Text style={styles.title}>
            <RenderGuardedComponent
              props={titleVWC}
              component={(title) => title}
            />
          </Text>
          <Text style={styles.subtitle}>
            <RenderGuardedComponent
              props={subtitleVWC}
              component={(subtitle) => subtitle}
            />
          </Text>
          {children}
        </ModalContext.Provider>
      </View>
      <View style={styles.contentGrowingPadding} />
      <View
        style={styles.footer}
        onLayout={(e) => {
          const height = e.nativeEvent?.layout?.height;
          if (height !== undefined && height !== null && height > 0) {
            setVWC(backContinueHeightVWC, height);
          }
        }}
      >
        <RenderGuardedComponent
          props={onBackVWC}
          component={(onBack) => (
            <BackContinue
              onBack={onBack}
              onContinue={() => onContinueVWC.get()()}
            />
          )}
        />
        <View
          style={{ height: BELOW_BACK_CONTINUE_PADDING + bottomBarHeight }}
        />
      </View>
    </>
  );

  const backgroundContainerRef = useWritableValueWithCallbacks<View | null>(
    () => null
  );
  useValuesWithCallbacksEffect([backgroundContainerRef, windowSizeVWC], () => {
    const size = windowSizeVWC.get();
    const ele = backgroundContainerRef.get();
    if (ele !== null) {
      ele.setNativeProps({ style: { minHeight: size.height } });
    }
    return undefined;
  });

  return (
    <View>
      <SvgLinearGradientBackground
        containerStyle={Object.assign({}, styles.backgroundContainer, {
          minHeight: windowSizeVWC.get().height,
        })}
        state={{
          type: 'react-rerender',
          props: DARK_BLACK_GRAY_GRADIENT_SVG,
        }}
        refVWC={backgroundContainerRef}
      >
        <RenderGuardedComponent
          props={scrollingRequiredVWC}
          component={(scrollingRequired) =>
            scrollingRequired ? (
              <ScrollView
                style={styles.background}
                contentContainerStyle={styles.content}
              >
                {content}
              </ScrollView>
            ) : (
              <View style={styles.background}>
                <View style={styles.content}>{content}</View>
              </View>
            )
          }
        />
      </SvgLinearGradientBackground>
      <ModalsOutlet modals={modals} />
      <StatusBar style="light" />
    </View>
  );
};
