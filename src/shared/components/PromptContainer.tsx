import { ReactElement, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { styles } from './PromptContainerStyles';

type PromptContainerProps = {
  /**
   * The title for the prompt. A string is supported and will be wrapped
   * in a Text with the appropriate styling, otherwise the recommended text
   * style is PromptContainerStyles.title
   */
  title: ReactElement | string;
  /**
   * The body for the prompt, if any. A string is supported and will be wrapped
   * in a Text with the appropriate styling, otherwise the recommended text
   * style is PromptContainerStyles.body
   */
  body: ReactElement | string | null;
  /**
   * The cta's in the order they will be displayed, where the first cta is
   * the primary cta.
   */
  ctas: {
    /**
     * The text for the CTA.
     */
    text: string;
    /**
     * The callback for when the CTA is pressed.
     */
    onPress: () => void;
  }[];
};

/**
 * A simple prompt container, which is usually displayed as a modal. Includes a
 * background, title, ctas, and optionally a body. The cta styling is not
 * configurable for simplicity.
 */
export const PromptContainer = ({ title, body, ctas }: PromptContainerProps): ReactElement => {
  const [pressing, setPressing] = useState<boolean[]>(() => ctas.map(() => false));

  useEffect(() => {
    setPressing((oldPressing) => {
      if (oldPressing.length === ctas.length) {
        return oldPressing;
      }

      const newPressing = [];
      for (let i = 0; i < ctas.length; i++) {
        newPressing.push(false);
      }
      return newPressing;
    });
  }, [ctas.length]);

  const primaryCtaContainerStyle = useMemo(() => {
    if (!pressing[0]) {
      return styles.primaryCtaContainer;
    }

    return Object.assign({}, styles.primaryCtaContainer, styles.primaryCtaContainerPressed);
  }, [pressing]);

  const secondaryCtaContainerStyles = useMemo(() => {
    return ctas.slice(1).map((_, index) => {
      if (!pressing[index + 1]) {
        return styles.secondaryCtaContainer;
      }

      return Object.assign({}, styles.secondaryCtaContainer, styles.secondaryCtaContainerPressed);
    });
  }, [ctas, pressing]);

  const boundOnPressIn = useMemo<(() => void)[]>(() => {
    return ctas.map((_, index) => () => {
      setPressing((oldPressing) => {
        const newPressing = [...oldPressing];
        newPressing[index] = true;
        return newPressing;
      });
    });
  }, [ctas]);

  const boundOnPressOut = useMemo<(() => void)[]>(() => {
    return ctas.map((_, index) => () => {
      setPressing((oldPressing) => {
        const newPressing = [...oldPressing];
        newPressing[index] = false;
        return newPressing;
      });
    });
  }, [ctas]);

  return (
    <View style={styles.container}>
      {typeof title === 'string' ? <Text style={styles.title}>{title}</Text> : title}
      {body && (typeof body === 'string' ? <Text style={styles.body}>{body}</Text> : body)}
      {ctas[0] && (
        <Pressable
          style={primaryCtaContainerStyle}
          onPress={ctas[0].onPress}
          onPressIn={boundOnPressIn[0]}
          onPressOut={boundOnPressOut[0]}>
          <Text style={styles.primaryCta}>{ctas[0].text}</Text>
        </Pressable>
      )}
      {ctas.slice(1).map((cta, index) => (
        <Pressable
          key={index}
          style={secondaryCtaContainerStyles[index]}
          onPress={cta.onPress}
          onPressIn={boundOnPressIn[index + 1]}
          onPressOut={boundOnPressOut[index + 1]}>
          <Text style={styles.secondaryCta}>{cta.text}</Text>
        </Pressable>
      ))}
    </View>
  );
};
