import { JournalChatState } from '../lib/JournalChatState';
import { VerticalSpacer } from '../../../../../shared/components/VerticalSpacer';
import { ThinkingDots } from '../../../../../shared/components/ThinkingDots';
import { ScreenContext } from '../../../hooks/useScreenContext';

export type JournalChatSpinnersProps = {
  ctx: ScreenContext;
  chat: JournalChatState;
};

/**
 * Renders the spinner for a journal chat state, if one is needed based on the
 * current transient value
 */
export const JournalChatSpinners = ({
  ctx,
  chat,
}: JournalChatSpinnersProps) => {
  return (
    <>
      {chat.transient?.type?.startsWith('thinking') ? (
        <>
          <VerticalSpacer height={24} />
          <ThinkingDots />
          <VerticalSpacer height={24} />
        </>
      ) : undefined}
    </>
  );
};
