import { Fragment, ReactElement } from 'react';
import { ScreenTextContentMapped } from '../models/ScreenTextContentMapped';
import { styles } from './ScreenTextContentStyles';
import { VerticalSpacer } from '../../../shared/components/VerticalSpacer';
import { HorizontalSpacer } from '../../../shared/components/HorizontalSpacer';
import { View, Text } from 'react-native';
import { Check } from '../../../shared/components/icons/Check';
import { OsehColors } from '../../../shared/OsehColors';

/**
 * Renders the given screen text content. Assumes this is being rendered
 * into a flexbox container, column direction, align-items: stretch
 */
export const ScreenTextContent = ({
  content,
}: {
  content: ScreenTextContentMapped;
}): ReactElement => {
  return (
    <>
      {content.parts.map((part, i) => {
        switch (part.type) {
          case 'header':
            return (
              <Text key={i} style={styles.header}>
                {part.value}
              </Text>
            );
          case 'body':
            return (
              <Text key={i} style={styles.body}>
                {part.value}
              </Text>
            );
          case 'check':
            return (
              <View key={i} style={styles.check}>
                <Check
                  icon={{
                    width: 20,
                  }}
                  container={{
                    width: 20,
                    height: 20,
                  }}
                  startPadding={{
                    x: {
                      fraction: 0.5,
                    },
                    y: {
                      fraction: 0.5,
                    },
                  }}
                  color={OsehColors.v4.primary.light}
                />
                <HorizontalSpacer width={16} />
                <Text style={styles.body}>{part.message}</Text>
              </View>
            );
          case 'spacer':
            return <VerticalSpacer key={i} height={part.pixels} />;
        }
        return <Fragment key={i} />;
      })}
    </>
  );
};
