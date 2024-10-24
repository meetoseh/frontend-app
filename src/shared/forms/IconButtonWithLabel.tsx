import { ReactElement, useEffect } from 'react';
import { InlineOsehSpinner } from '../components/InlineOsehSpinner';
import { styles } from './IconButtonWithLabelStyles';
import { Pressable, View, Text, ViewStyle } from 'react-native';
import { useWindowSizeValueWithCallbacks } from '../hooks/useWindowSize';
import { useMappedValueWithCallbacks } from '../hooks/useMappedValueWithCallbacks';
import { RenderGuardedComponent } from '../components/RenderGuardedComponent';
import {
  ValueWithCallbacks,
  useWritableValueWithCallbacks,
} from '../lib/Callbacks';
import { setVWC } from '../lib/setVWC';
import { createValueWithCallbacksEffect } from '../hooks/createValueWithCallbacksEffect';
import { alphaBlend } from '../lib/colorUtils';
import { useStyleVWC } from '../hooks/useStyleVWC';
import { useValueWithCallbacksEffect } from '../hooks/useValueWithCallbacksEffect';
import { useMappedValuesWithCallbacks } from '../hooks/useMappedValuesWithCallbacks';

export type IconButtonWithLabelProps = {
  /**
   * Component to use as the icon
   */
  icon: (props: { size: number }) => ReactElement;

  /**
   * The label to display
   */
  label: string;

  /**
   * If the button is disabled
   */
  disabled?: boolean;

  /**
   * Called when the button is clicked.
   */
  onClick?: () => void;

  /**
   * If true, a spinner is displayed instead of the icon
   */
  spinner?: boolean;

  /**
   * If specified we can avoid using a blur/opacity (slow on android) and
   * instead use a fixed color based on the average background color.
   */
  averageBackgroundColor?: ValueWithCallbacks<[number, number, number] | null>;
};

/**
 * Renders an icon button with a label
 */
export const IconButtonWithLabel = ({
  icon,
  label,
  disabled,
  onClick,
  spinner,
  averageBackgroundColor,
}: IconButtonWithLabelProps): ReactElement => {
  const windowSizeVWC = useWindowSizeValueWithCallbacks();
  const fontScale = useMappedValueWithCallbacks(
    windowSizeVWC,
    (s) => s.fontScale
  );

  const iconContainerBackgroundStyleVWC =
    useWritableValueWithCallbacks<ViewStyle>(() => styles.iconContainer);
  useEffect(() => {
    if (averageBackgroundColor === undefined) {
      setVWC(iconContainerBackgroundStyleVWC, {});
      return;
    }

    return createValueWithCallbacksEffect(averageBackgroundColor, (avgBknd) => {
      if (avgBknd === null) {
        setVWC(iconContainerBackgroundStyleVWC, {});
        return;
      }

      const normalBackground = alphaBlend(avgBknd, [1, 1, 1, 0.15]);
      setVWC(iconContainerBackgroundStyleVWC, {
        backgroundColor: `rgb(${normalBackground[0] * 255}, ${
          normalBackground[1] * 255
        }, ${normalBackground[2] * 255})`,
      });
      return undefined;
    });
  }, [averageBackgroundColor, iconContainerBackgroundStyleVWC]);

  const iconContainerSizeStyleVWC = useWritableValueWithCallbacks<ViewStyle>(
    () => ({})
  );
  useValueWithCallbacksEffect(fontScale, (s) => {
    setVWC(iconContainerSizeStyleVWC, {
      width: styles.iconContainer.width * s,
      height: styles.iconContainer.height * s,
      marginBottom: styles.iconContainer.marginBottom * s,
    });
    return undefined;
  });

  const iconContainerStyleVWC = useMappedValuesWithCallbacks(
    [iconContainerBackgroundStyleVWC, iconContainerSizeStyleVWC],
    () =>
      Object.assign(
        {},
        styles.iconContainer,
        iconContainerBackgroundStyleVWC.get(),
        iconContainerSizeStyleVWC.get()
      )
  );

  const iconContainerRef = useWritableValueWithCallbacks<View | null>(
    () => null
  );
  useStyleVWC(iconContainerRef, iconContainerStyleVWC);

  return (
    <Pressable style={styles.button} onPress={onClick} disabled={disabled}>
      <View
        style={iconContainerStyleVWC.get()}
        ref={(r) => setVWC(iconContainerRef, r)}
      >
        <RenderGuardedComponent
          props={fontScale}
          component={(scale) =>
            spinner ? (
              <InlineOsehSpinner
                size={{
                  type: 'react-rerender',
                  props: {
                    width: 20 * scale,
                  },
                }}
              />
            ) : (
              icon({ size: 20 * scale })
            )
          }
        />
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
};
