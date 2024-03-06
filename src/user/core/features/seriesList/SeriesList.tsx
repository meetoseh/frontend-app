import { ReactElement } from 'react';
import { FeatureComponentProps } from '../../models/Feature';
import { SeriesListResources } from './SeriesListResources';
import { SeriesListState } from './SeriesListState';
import { useWindowSizeValueWithCallbacks } from '../../../../shared/hooks/useWindowSize';
import { useMappedValueWithCallbacks } from '../../../../shared/hooks/useMappedValueWithCallbacks';
import { View } from 'react-native';
import { styles } from './SeriesListStyles';
import { useWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { useValuesWithCallbacksEffect } from '../../../../shared/hooks/useValuesWithCallbacksEffect';
import { setVWC } from '../../../../shared/lib/setVWC';
import { BottomNavBar } from '../../../bottomNav/BottomNavBar';
import { useTopBarHeight } from '../../../../shared/hooks/useTopBarHeight';
import { StatusBar } from 'expo-status-bar';
import { useBotBarHeight } from '../../../../shared/hooks/useBotBarHeight';
import { styles as bottomNavStyles } from '../../../bottomNav/BottomNavBarStyles';
import { debugView } from '../../../../shared/lib/debugView';
import { RenderGuardedComponent } from '../../../../shared/components/RenderGuardedComponent';
import { SvgLinearGradientBackground } from '../../../../shared/anim/SvgLinearGradientBackground';
import { STANDARD_BLACK_GRAY_GRADIENT_SVG } from '../../../../styling/colors';
import { CourseCoverItemsList } from '../../../series/components/CourseCoverItemsList';
import { getPreviewableCourse } from '../../../series/lib/ExternalCourse';

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
  const windowSizeVWC = useWindowSizeValueWithCallbacks();
  const botBarHeight = useBotBarHeight();
  const expectedBottomNavHeight = bottomNavStyles.container.minHeight;
  const topBarHeight = useTopBarHeight();

  const listHeight = useMappedValueWithCallbacks(
    windowSizeVWC,
    (size) => size.height - botBarHeight - expectedBottomNavHeight
  );
  const containerRef = useWritableValueWithCallbacks<View | null>(() => null);

  useValuesWithCallbacksEffect([windowSizeVWC, containerRef], () => {
    const size = windowSizeVWC.get();
    const container = containerRef.get();
    if (container === null) {
      return undefined;
    }
    container.setNativeProps({
      style: {
        minWidth: size.width,
        minHeight: size.height,
      },
    });
    return undefined;
  });

  return (
    <View>
      <SvgLinearGradientBackground
        state={{
          type: 'react-rerender',
          props: STANDARD_BLACK_GRAY_GRADIENT_SVG,
        }}
      >
        <View style={styles.container} ref={(r) => setVWC(containerRef, r)}>
          <View style={styles.contentContainer}>
            <View style={styles.items}>
              <CourseCoverItemsList
                showCourse={(course) => {
                  const previewable = getPreviewableCourse(course);
                  if (previewable !== null) {
                    resourcesVWC.get().gotoCoursePreview(previewable);
                  } else {
                    console.log('not previewable');
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
                home: () => stateVWC.get().setShow(false, true),
                account: () => resourcesVWC.get().gotoSettings(),
              }}
            />
          </View>
        </View>
      </SvgLinearGradientBackground>
      <StatusBar style="light" />
    </View>
  );
};
