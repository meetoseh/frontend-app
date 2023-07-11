import {
  PropsWithChildren,
  ReactElement,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { useStateCompat as useState } from "../hooks/useStateCompat";
import {
  Pressable,
  StatusBar,
  StyleProp,
  Text,
  TextProps,
  ViewStyle,
} from "react-native";
import { styles } from "./ErrorBannerStyles";

/**
 * A basic error banner that displays a red background. Typically used with ErrorBannerText
 * @returns
 */
export const ErrorBanner = ({
  children,
}: {
  children?: ReactNode | undefined;
}): ReactElement => {
  const [dismissed, setDismissed] = useState(false);
  const containerStyle: StyleProp<ViewStyle> = useMemo(() => {
    if (dismissed) {
      return { display: "none" };
    }
    const top = StatusBar.currentHeight ?? 0;
    return Object.assign({}, styles.container, { top });
  }, [dismissed]);

  const dismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  return (
    <Pressable style={containerStyle} onPress={dismiss}>
      {children}
    </Pressable>
  );
};

/**
 *
 * @param props
 * @returns
 */
export const ErrorBannerText = (
  props: Omit<PropsWithChildren<TextProps>, "style">
): ReactElement => {
  const propsWithoutChildren = Object.assign({}, props);
  delete propsWithoutChildren.children;

  return (
    <Text style={styles.text} {...propsWithoutChildren}>
      {props.children}
    </Text>
  );
};
