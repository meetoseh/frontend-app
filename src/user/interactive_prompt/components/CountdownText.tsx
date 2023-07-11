import { ReactElement, useEffect } from "react";
import { useStateCompat as useState } from "../../../shared/hooks/useStateCompat";
import { Text } from "react-native";
import { PromptTime } from "../hooks/usePromptTime";
import { InteractivePrompt } from "../models/InteractivePrompt";
import { styles } from "./CountdownTextStyles";
import { ValueWithCallbacks } from "../../../shared/lib/Callbacks";

export type CountdownTextConfig = {
  /**
   * The title text to display above the countdown
   */
  titleText: string;
};

type CountdownTextProps = CountdownTextConfig & {
  /**
   * The prompt time to show a countdown for
   */
  promptTime: ValueWithCallbacks<PromptTime>;

  /**
   * The prompt to show a countdown for
   */
  prompt: InteractivePrompt;
};

/**
 * Returns an element containing the countdown text for the given prompt time.
 * This does not trigger state updates in order to update the countdown text.
 */
export const CountdownText = ({
  promptTime,
  prompt,
  titleText,
}: CountdownTextProps): ReactElement => {
  const durationMs = prompt.durationSeconds * 1000;
  const [text, setText] = useState(() =>
    formatProgressAsCountdown(durationMs, promptTime.get().time)
  );

  useEffect(() => {
    let active = true;
    let currentText = "";
    promptTime.callbacks.add(callback);
    callback();

    return () => {
      if (!active) {
        return;
      }
      active = false;
      promptTime.callbacks.remove(callback);
    };

    function callback() {
      if (!active) {
        return;
      }
      const newText = formatProgressAsCountdown(
        durationMs,
        promptTime.get().time
      );
      if (newText !== currentText) {
        setText(newText);
        currentText = newText;
      }
    }
  }, [durationMs, promptTime]);

  return (
    <>
      <Text style={styles.title}>{titleText}</Text>
      <Text style={styles.countdown}>{text}</Text>
    </>
  );
};

const formatProgressAsCountdown = (
  totalMs: number,
  progressMs: number
): string => {
  if (progressMs <= 0) {
    return formatMs(totalMs);
  }

  if (progressMs >= totalMs) {
    return "0";
  }

  return formatMs(totalMs - progressMs);
};

const formatMs = (ms: number): string => {
  return Math.ceil(ms / 1000).toString();
};
