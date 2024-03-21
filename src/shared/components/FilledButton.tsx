import {
  PropsWithChildren,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { useStateCompat as useState } from '../hooks/useStateCompat';
import {
  Pressable,
  StyleProp,
  TextStyle,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { CustomButtonProps } from '../models/CustomButtonProps';
import { InlineOsehSpinner } from './InlineOsehSpinner';
import {
  LinearGradientBackground,
  LinearGradientState,
} from '../anim/LinearGradientBackground';
import { RenderGuardedComponent } from './RenderGuardedComponent';
import { useWritableValueWithCallbacks } from '../lib/Callbacks';
import { setVWC } from '../lib/setVWC';
import { useValueWithCallbacksEffect } from '../hooks/useValueWithCallbacksEffect';

type GradientStyleProps = {
  gradient?: LinearGradientState;
};

const TRANSPARENT_GRADIENT: LinearGradientState = {
  stops: [
    {
      color: [0, 0, 0, 0],
      offset: 0,
    },
    {
      color: [0, 0, 0, 0],
      offset: 1,
    },
  ],
  angleDegreesClockwiseFromTop: 0,
};

const liftedToOuterStyles: (keyof ViewStyle)[] = [
  'margin',
  'marginBottom',
  'marginTop',
  'marginLeft',
  'marginRight',
  'marginStart',
  'marginEnd',
  'marginVertical',
  'marginHorizontal',
];

/**
 * A basic filled button using the given styles.
 */
export const FilledButton = ({
  onPress,
  disabled,
  spinner,
  setTextStyle,
  setForegroundColor,
  styles,
  spinnerVariant,
  width,
  marginTop,
  refVWC: rawRefVWC,
  onLayout,
  children,
}: PropsWithChildren<
  CustomButtonProps & {
    styles: {
      container: ViewStyle & { flex: undefined } & GradientStyleProps;
      pressed: ViewStyle & GradientStyleProps;
      disabled: ViewStyle & GradientStyleProps;
      text: TextStyle & { color: string };
      pressedText: TextStyle & { color: string };
      disabledText: TextStyle & { color: string };
      containerWithSpinner: ViewStyle;
      spinnerContainer: ViewStyle;
    };
    spinnerVariant: 'white' | 'black' | 'primary';
  }
>): ReactElement => {
  const handlePress = useCallback(() => {
    if (!disabled) {
      onPress?.();
    }
  }, [onPress, disabled]);

  const [pressed, setPressed] = useState(false);

  const handlePressIn = useCallback(() => {
    setPressed(true);
  }, []);

  const handlePressOut = useCallback(() => {
    setPressed(false);
  }, []);

  const containerStyles = useMemo(() => {
    return Object.assign(
      {},
      styles.container,
      ...(width === undefined
        ? []
        : [
            {
              width,
            },
          ]),
      ...(marginTop ? [{ marginTop }] : []),
      ...(pressed ? [styles.pressed] : []),
      ...(disabled ? [styles.disabled] : []),
      ...(spinner ? [styles.containerWithSpinner] : [])
    );
  }, [pressed, disabled, styles, width, marginTop, spinner]);

  const childrenContainerStyles = useMemo(() => {
    const cp = Object.assign({}, containerStyles);
    if ('gradient' in containerStyles) {
      delete cp.gradient;
    }

    for (const key of liftedToOuterStyles) {
      if (key in containerStyles) {
        delete cp[key];
      }
    }

    return cp;
  }, [containerStyles]);

  const pressableStyles = useMemo(() => {
    const result: ViewStyle = {};

    for (const key of liftedToOuterStyles) {
      if (key in containerStyles) {
        result[key] = containerStyles[key];
      }
    }

    return result;
  }, [containerStyles]);

  const myTextStyle = useWritableValueWithCallbacks<StyleProp<TextStyle>>(
    () => undefined
  );

  useEffect(() => {
    const newStyle = Object.assign(
      {},
      styles.text,
      ...(pressed ? [styles.pressedText] : []),
      ...(disabled ? [styles.disabledText] : [])
    );
    setVWC(myTextStyle, newStyle);
    if (setTextStyle) {
      setTextStyle(newStyle);
    }
  }, [pressed, disabled, setTextStyle, styles, myTextStyle]);

  useEffect(() => {
    if (!setForegroundColor) {
      return;
    }

    if (disabled) {
      setForegroundColor(styles.disabledText.color);
      return;
    }

    if (pressed) {
      setForegroundColor(styles.pressedText.color);
      return;
    }

    setForegroundColor(styles.text.color);
  }, [pressed, disabled, setForegroundColor, styles]);

  const alwaysAvailableRefVWC = useWritableValueWithCallbacks<View | null>(
    () => null
  );
  useValueWithCallbacksEffect(
    alwaysAvailableRefVWC,
    useCallback(
      (ref) => {
        if (rawRefVWC !== undefined) {
          setVWC(rawRefVWC, ref);
        }
        return undefined;
      },
      [rawRefVWC]
    )
  );

  // we need to always support the gradient to avoid
  // losing press events when switching :/

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={pressableStyles}
      ref={(r) => setVWC(alwaysAvailableRefVWC, r)}
      onLayout={onLayout}
    >
      <LinearGradientBackground
        state={{
          type: 'react-rerender',
          props: containerStyles.gradient ?? TRANSPARENT_GRADIENT,
        }}
      >
        <View style={childrenContainerStyles}>
          {spinner && (
            <View style={styles.spinnerContainer}>
              <InlineOsehSpinner
                size={{ type: 'react-rerender', props: { height: 24 } }}
                variant={spinnerVariant}
              />
            </View>
          )}
          {typeof children === 'string' ? (
            <RenderGuardedComponent
              props={myTextStyle}
              component={(s) => <Text style={s}>{children}</Text>}
            />
          ) : (
            children
          )}
        </View>
      </LinearGradientBackground>
    </Pressable>
  );
};
