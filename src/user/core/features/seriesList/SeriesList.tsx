import { ReactElement } from 'react';
import { FeatureComponentProps } from '../../models/Feature';
import { SeriesListResources } from './SeriesListResources';
import { SeriesListState } from './SeriesListState';
import { useWindowSizeValueWithCallbacks } from '../../../../shared/hooks/useWindowSize';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { View } from 'react-native';
import { styles } from './SeriesListStyles';
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { setVWC } from '../../../../shared/lib/setVWC';
import { BottomNavBar } from '../../../bottomNav/BottomNavBar';
import { StatusBar } from 'expo-status-bar';
import { useBotBarHeight } from '../../../../shared/hooks/useBotBarHeight';
import { styles as bottomNavStyles } from '../../../bottomNav/BottomNavBarStyles';
import { STANDARD_DARK_BLACK_GRAY_GRADIENT_SVG } from '../../../../styling/colors';
import { CourseCoverItemsList } from '../../../series/components/CourseCoverItemsList';
import { getPreviewableCourse } from '../../../series/lib/ExternalCourse';
import { SvgLinearGradient } from '../../../../shared/anim/SvgLinearGradient';
import { useStyleVWC } from '../../../../shared/hooks/useStyleVWC';
import {
  playExitTransition,
  useEntranceTransition,
  useTransitionProp,
} from '../../../../shared/lib/TransitionProp';
import {
  StandardScreenTransition,
  useStandardTransitionsState,
} from '../../../../shared/hooks/useStandardTransitions';
import { useMappedValuesWithCallbacks } from '../../../../shared/hooks/useMappedValuesWithCallbacks';
import { WipeTransitionOverlay } from '../../../../shared/components/WipeTransitionOverlay';

/**
 * The top-level component to show the series list screen, which
 * lets users browse the title cards for series and click to go
 * to the series details screen for that series.
 */
export const SeriesList = ({
  state: stateVWC,
  resources: resourcesVWC,
}: FeatureComponentProps<
  SeriesListState,
  SeriesListResources
>): ReactElement => {
  const transition = useTransitionProp((): StandardScreenTransition => {
    const forced = stateVWC.get().forced;
    if (forced !== null && forced.enter === 'swipe-left') {
      return { type: 'swipe', direction: 'to-right', ms: 350 };
    }
    if (forced !== null && forced.enter === 'swipe-right') {
      return { type: 'swipe', direction: 'to-left', ms: 350 };
    }
    return { type: 'fade', ms: 350 };
  });
  useEntranceTransition(transition);

  const transitionState = useStandardTransitionsState(transition);

  const windowSizeVWC = useWindowSizeValueWithCallbacks();
  const botBarHeight = useBotBarHeight();
  const expectedBottomNavHeight = bottomNavStyles.container.minHeight;

  const listHeight = useMappedValueWithCallbacks(
    windowSizeVWC,
    (size) => size.height - botBarHeight - expectedBottomNavHeight
  );
  const foregroundRef = useWritableValueWithCallbacks<View | null>(() => null);
  const foregroundStyleVWC = useMappedValuesWithCallbacks(
    [windowSizeVWC, transitionState.left, transitionState.opacity],
    () => {
      const size = windowSizeVWC.get();
      const opacity = transitionState.opacity.get();
      const left = transitionState.left.get();
      return {
        left,
        opacity,
        minWidth: size.width,
        minHeight: size.height,
      };
    }
  );
  useStyleVWC(foregroundRef, foregroundStyleVWC);

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <SvgLinearGradient state={STANDARD_DARK_BLACK_GRAY_GRADIENT_SVG} />
      </View>
      <View style={styles.foreground} ref={(r) => setVWC(foregroundRef, r)}>
        <View style={styles.contentContainer}>
          <View style={styles.items}>
            <CourseCoverItemsList
              showCourse={async (course) => {
                if (course.hasEntitlement) {
                  setVWC(transition.animation, {
                    type: 'wipe',
                    direction: 'up',
                    ms: 350,
                  });
                  await playExitTransition(transition).promise;
                  resourcesVWC.get().gotoCourseDetails(course);
                  return;
                }

                const previewable = getPreviewableCourse(course);
                if (previewable !== null) {
                  setVWC(transition.animation, { type: 'fade', ms: 350 });
                  await playExitTransition(transition).promise;
                  resourcesVWC.get().gotoCoursePreview(previewable);
                }
              }}
              listHeight={listHeight}
              imageHandler={resourcesVWC.get().imageHandler}
            />
          </View>
        </View>
        <View style={styles.bottomNav}>
          <BottomNavBar
            active="series"
            clickHandlers={{
              home: () => stateVWC.get().setForced(null, true),
              account: () => resourcesVWC.get().gotoSettings(),
            }}
          />
        </View>
      </View>
      <WipeTransitionOverlay wipe={transitionState.wipe} />
      <StatusBar style="light" />
    </View>
  );
};
