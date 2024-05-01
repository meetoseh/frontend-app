import { ReactElement } from 'react';
import { OsehImageStateRequestHandler } from '../../../shared/images/useOsehImageStateRequestHandler';
import {
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../../../shared/lib/Callbacks';
import { ExternalCourse } from '../lib/ExternalCourse';
import { styles } from './CourseCoverItemStyles';
import {
  OsehImageProps,
  OsehImagePropsLoadable,
} from '../../../shared/images/OsehImageProps';
import { useWindowSizeValueWithCallbacks } from '../../../shared/hooks/useWindowSize';
import { useMappedValuesWithCallbacks } from '../../../shared/hooks/useMappedValuesWithCallbacks';
import { useOsehImageStateValueWithCallbacks } from '../../../shared/images/useOsehImageStateValueWithCallbacks';
import { OsehImageFromStateValueWithCallbacks } from '../../../shared/images/OsehImageFromStateValueWithCallbacks';
import { RenderGuardedComponent } from '../../../shared/components/RenderGuardedComponent';
import { areOsehImageStatesEqual } from '../../../shared/images/OsehImageState';
import { OsehImageFromState } from '../../../shared/images/OsehImageFromState';
import { useMappedValueWithCallbacks } from '../../../shared/hooks/useMappedValueWithCallbacks';
import { largestPhysicalPerLogical } from '../../../shared/images/DisplayRatioHelper';
import { Pressable, View, Text } from 'react-native';
import { useContentWidth } from '../../../shared/lib/useContentWidth';
import { useValuesWithCallbacksEffect } from '../../../shared/hooks/useValuesWithCallbacksEffect';
import { setVWC } from '../../../shared/lib/setVWC';
import { AspectRatioComparer } from '../../../shared/images/LogicalSize';

export type CourseCoverItemProps = {
  /**
   * The item to render
   */
  item: ValueWithCallbacks<ExternalCourse>;

  /**
   * If the user modifies the item, i.e., by favoriting/unfavoriting it,
   * the callback to update the item. This is called after the change is
   * already stored serverside.
   *
   * @param item The new item
   */
  setItem: (item: ExternalCourse) => void;

  /**
   * A function which can be used to map all items to a new item. Used for
   * when the user performs an action that will impact items besides this
   * one
   *
   * @param fn The function to apply to each item
   */
  mapItems: (fn: (item: ExternalCourse) => ExternalCourse) => void;

  /**
   * The handler for images; allows reusing the same image state across
   * multiple components.
   */
  imageHandler: OsehImageStateRequestHandler;

  /**
   * Called if the user clicks the item outside of the normally clickable
   * areas.
   */
  onClick?: () => void;
};

const compareAspectRatio: AspectRatioComparer = (a, b) =>
  a.height / a.width - b.height / b.width;

/**
 * Renders the given external course in the cover card representation, which
 * is the logo and instructor overlayed on the background at a fixed size.
 */
export const CourseCoverItem = ({
  item,
  setItem,
  mapItems,
  imageHandler,
  onClick,
}: CourseCoverItemProps): ReactElement => {
  const windowSizeVWC = useWindowSizeValueWithCallbacks();
  const contentWidth = useContentWidth();
  const backgroundProps = useMappedValuesWithCallbacks(
    [item],
    (): OsehImagePropsLoadable => {
      const itm = item.get();

      const height =
        Math.floor(contentWidth * (427 / 342) * largestPhysicalPerLogical) /
        largestPhysicalPerLogical;

      return {
        uid: itm.backgroundImage.uid,
        jwt: itm.backgroundImage.jwt,
        displayWidth: contentWidth,
        displayHeight: height,
        alt: '',
      };
    }
  );
  const backgroundState = useOsehImageStateValueWithCallbacks(
    {
      type: 'callbacks',
      props: backgroundProps.get,
      callbacks: backgroundProps.callbacks,
    },
    imageHandler
  );

  const logoProps = useMappedValuesWithCallbacks(
    [backgroundProps, item],
    (): OsehImageProps => {
      const itm = item.get();
      const bknd = backgroundProps.get();

      if (bknd.displayWidth === null || itm.logo === null) {
        return {
          uid: null,
          jwt: null,
          displayWidth: 10,
          displayHeight: 10,
          alt: '',
        };
      }

      const width = bknd.displayWidth - 32;
      return {
        uid: itm.logo.uid,
        jwt: itm.logo.jwt,
        displayWidth: width,
        displayHeight: null,
        compareAspectRatio,
        alt: itm.title,
      };
    }
  );
  const logoState = useOsehImageStateValueWithCallbacks(
    { type: 'callbacks', props: logoProps.get, callbacks: logoProps.callbacks },
    imageHandler
  );

  const contentRef = useWritableValueWithCallbacks<View | null>(() => null);
  useValuesWithCallbacksEffect([contentRef, backgroundState], () => {
    const ref = contentRef.get();
    if (ref === null) {
      return undefined;
    }

    ref.setNativeProps({
      style: {
        width: backgroundState.get().displayWidth,
        height: backgroundState.get().displayHeight,
      },
    });
    return undefined;
  });

  const outerContainerRef = useWritableValueWithCallbacks<View | null>(
    () => null
  );

  useValuesWithCallbacksEffect([outerContainerRef, windowSizeVWC], () => {
    const ref = outerContainerRef.get();
    if (ref === null) {
      return undefined;
    }

    ref.setNativeProps({
      style: {
        width: windowSizeVWC.get().width,
      },
    });
    return undefined;
  });

  return (
    <View
      style={Object.assign({}, styles.outerContainer, {
        width: windowSizeVWC.get().width,
      })}
      ref={(r) => setVWC(outerContainerRef, r)}
    >
      <Pressable
        style={styles.container}
        onPress={() => {
          onClick?.();
        }}
      >
        <OsehImageFromStateValueWithCallbacks
          state={backgroundState}
          style={styles.background}
        />
        <View
          style={Object.assign({}, styles.content, {
            width: backgroundState.get().displayWidth,
            height: backgroundState.get().displayHeight,
          })}
          ref={(r) => setVWC(contentRef, r)}
        >
          <RenderGuardedComponent
            props={useMappedValuesWithCallbacks(
              [logoState, item],
              () => ({ state: logoState.get(), title: item.get().title }),
              {
                outputEqualityFn: (a, b) =>
                  areOsehImageStatesEqual(a.state, b.state) &&
                  a.title === b.title,
              }
            )}
            component={({ state, title }) =>
              state.loading ? (
                <Text style={styles.logoFallback}>{title}</Text>
              ) : (
                <OsehImageFromState state={state} style={styles.logo} />
              )
            }
          />
          <RenderGuardedComponent
            props={useMappedValueWithCallbacks(item, (v) => v.instructor.name)}
            component={(name) => <Text style={styles.instructor}>{name}</Text>}
          />
        </View>
      </Pressable>
    </View>
  );
};
