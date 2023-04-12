import { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, Text, View, ViewStyle } from 'react-native';
import { styles } from './JourneyPromptTextStyles';

type JourneyPromptTextProps = {
  text: string;
  setHeight?: (height: number) => void;
};

/**
 * Displays the class poll title and the poll text in a
 * compact container.
 */
export const JourneyPromptText = ({ text, setHeight }: JourneyPromptTextProps): ReactElement => {
  const [textHeight, setTextHeight] = useState(32);
  const [height, setOurHeight] = useState(60);

  useEffect(() => {
    const height = 28 + textHeight;
    setOurHeight(height);
    if (setHeight) {
      setHeight(height);
    }
  }, [textHeight, setHeight]);

  const containerStyle = useMemo<ViewStyle>(() => {
    return Object.assign({}, styles.container, {
      height: height,
      maxHeight: height,
    });
  }, [height]);

  const onTextLayout = useCallback((event: LayoutChangeEvent) => {
    if (!event.nativeEvent) {
      return;
    }
    setTextHeight(event.nativeEvent.layout.height);
  }, []);

  return (
    <View style={containerStyle}>
      <Text style={styles.title}>Class Poll</Text>
      <Text style={styles.text} onLayout={onTextLayout}>
        {text}
      </Text>
    </View>
  );
};
