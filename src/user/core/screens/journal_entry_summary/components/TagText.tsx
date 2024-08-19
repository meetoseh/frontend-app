import { memo, ReactElement } from 'react';
import { HorizontalSpacer } from '../../../../../shared/components/HorizontalSpacer';
import { styles } from './TagTextStyles';
import { Text } from 'react-native';

/** Renders a tag from a journal entry summary */
export const TagText = memo(({ tag }: { tag: string }): ReactElement => {
  // if the first character is not ascii we give it a little extra
  // space and size under the assumption it's an emoji

  let isFirst = true;
  let emojiPart: string | null = null;
  let otherPart: string = '';
  for (const char of tag) {
    if (isFirst) {
      if (char.length > 1) {
        emojiPart = char;
      } else {
        otherPart += char;
      }
      isFirst = false;
    } else {
      otherPart += char;
    }
  }
  return (
    <>
      {emojiPart !== null ? (
        <>
          <Text style={styles.tagEmoji}>{emojiPart}</Text>
          <HorizontalSpacer width={6} />
        </>
      ) : undefined}
      {otherPart !== '' ? (
        <Text style={styles.tagText}>{otherPart}</Text>
      ) : undefined}
    </>
  );
});
