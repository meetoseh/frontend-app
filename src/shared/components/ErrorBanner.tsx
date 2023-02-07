import { PropsWithChildren, ReactElement, useMemo } from 'react';
import { StatusBar, Text, TextProps, View } from 'react-native';
import { styles } from './ErrorBannerStyles';

/**
 * A basic error banner that displays a red background. Typically used with ErrorBannerText
 * @returns
 */
export const ErrorBanner = ({ children }: PropsWithChildren<{}>): ReactElement => {
  const containerStyle = useMemo(() => {
    const top = StatusBar.currentHeight ?? 0;
    return Object.assign({}, styles.container, { top });
  }, []);

  return <View style={containerStyle}>{children}</View>;
};

/**
 *
 * @param props
 * @returns
 */
export const ErrorBannerText = (
  props: Omit<PropsWithChildren<TextProps>, 'style'>
): ReactElement => {
  const propsWithoutChildren = Object.assign({}, props);
  delete propsWithoutChildren.children;

  return (
    <Text style={styles.text} {...propsWithoutChildren}>
      {props.children}
    </Text>
  );
};
