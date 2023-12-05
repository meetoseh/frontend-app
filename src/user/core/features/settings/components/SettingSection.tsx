import { PropsWithChildren, ReactElement } from "react";
import { styles } from "./SettingSectionStyles";
import { View, Text, StyleProp, ViewStyle } from "react-native";

export type SettingSectionProps = {
  /**
   * The title for the section. May be omitted for no title,
   * sometimes using only a subtitle instead for reduced emphasis
   */
  title?: string;

  /**
   * The subtitle for the section, or, if the title is omitted,
   * the title but with reduced emphasis
   */
  subtitle?: string;

  /**
   * If specified, the style for the container of the children
   */
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Renders a section, typically used within the main settings admin area,
 * with an optional title and optional subtitle. This component is tight,
 * i.e., there are no outer margins or padding. It fills the width of the
 * parent and flows vertically.
 */
export const SettingSection = ({
  title,
  subtitle,
  contentStyle,
  children,
}: PropsWithChildren<SettingSectionProps>): ReactElement => {
  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      <View style={contentStyle}>{children}</View>
    </View>
  );
};
