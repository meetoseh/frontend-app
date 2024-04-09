import { ReactElement } from 'react';
import { styles } from './BackContinueStyles';
import { FilledInvertedButton } from './FilledInvertedButton';
import { useContentWidth } from '../lib/useContentWidth';
import { useWritableValueWithCallbacks } from '../lib/Callbacks';
import { Text, StyleProp, TextStyle, View } from 'react-native';
import { setVWC } from '../lib/setVWC';
import { RenderGuardedComponent } from './RenderGuardedComponent';
import { OutlineWhiteButton } from './OutlineWhiteButton';
import { useFontScale } from '../hooks/useFontScale';

export type BackContinueProps = {
  /** Handler for when the back button is pressed, or null for no back button */
  onBack: (() => void) | null;
  /** Handler for when the continue button is pressed */
  onContinue: () => void;
};

/**
 * Intended as a full-width component for the bottom of the screen, shows either
 * a continue button or a back button and continue button. Useful for sequential
 * screens, especially in onboarding (e.g., goal categories, age range, etc)
 */
export const BackContinue = ({
  onBack,
  onContinue,
}: BackContinueProps): ReactElement => {
  const contentWidth = useContentWidth();
  const continueTextStyleVWC = useWritableValueWithCallbacks<
    StyleProp<TextStyle>
  >(() => undefined);
  const backTextStyleVWC = useWritableValueWithCallbacks<StyleProp<TextStyle>>(
    () => undefined
  );
  const textScale = useFontScale();
  const buttonWidth = contentWidth / 2 - 8;

  if (onBack === null) {
    return (
      <FilledInvertedButton
        onPress={onContinue}
        width={contentWidth}
        setTextStyle={(s) => setVWC(continueTextStyleVWC, s)}
      >
        <RenderGuardedComponent
          props={continueTextStyleVWC}
          component={(s) => <Text style={s}>Continue</Text>}
        />
      </FilledInvertedButton>
    );
  }

  return (
    <View style={Object.assign({}, styles.container, { width: contentWidth })}>
      <OutlineWhiteButton
        onPress={onBack}
        width={buttonWidth}
        setTextStyle={(s) => setVWC(backTextStyleVWC, s)}
      >
        <RenderGuardedComponent
          props={backTextStyleVWC}
          component={(s) => <Text style={s}>Back</Text>}
        />
      </OutlineWhiteButton>
      <FilledInvertedButton
        onPress={onContinue}
        width={buttonWidth}
        setTextStyle={(s) => setVWC(continueTextStyleVWC, s)}
      >
        <RenderGuardedComponent
          props={continueTextStyleVWC}
          component={(s) => (
            <Text style={s}>
              {contentWidth < 375 * textScale ? 'Next' : 'Continue'}
            </Text>
          )}
        />
      </FilledInvertedButton>
    </View>
  );
};
