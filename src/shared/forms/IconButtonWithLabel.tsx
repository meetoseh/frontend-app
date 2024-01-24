import { ReactElement } from 'react';
import { InlineOsehSpinner } from '../components/InlineOsehSpinner';
import { styles } from './IconButtonWithLabelStyles';
import { Pressable, View, Text } from 'react-native';
import { useWindowSizeValueWithCallbacks } from '../hooks/useWindowSize';
import { useMappedValueWithCallbacks } from '../hooks/useMappedValueWithCallbacks';
import { RenderGuardedComponent } from '../components/RenderGuardedComponent';

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
}: IconButtonWithLabelProps): ReactElement => {
  const windowSizeVWC = useWindowSizeValueWithCallbacks();
  const fontScale = useMappedValueWithCallbacks(
    windowSizeVWC,
    (s) => s.fontScale
  );

  return (
    <RenderGuardedComponent
      props={fontScale}
      component={(scale) => (
        <Pressable style={styles.button} onPress={onClick} disabled={disabled}>
          <View
            style={Object.assign({}, styles.iconContainer, {
              width: styles.iconContainer.width * scale,
              height: styles.iconContainer.height * scale,
              marginBottom: styles.iconContainer.marginBottom * scale,
            })}
          >
            {spinner ? (
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
            )}
          </View>
          <Text style={styles.label}>{label}</Text>
        </Pressable>
      )}
    />
  );
};
