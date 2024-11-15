import { createWritableValueWithCallbacks } from '../../../../shared/lib/Callbacks';
import { OsehScreen } from '../../models/Screen';
import { convertScreenConfigurableTriggerWithOldVersion } from '../../models/ScreenConfigurableTrigger';
import { ChatMessageExamples } from './ChatMessageExamples';
import {
  ChatMessageExamplesAPIParams,
  ChatMessageExamplesMappedParams,
} from './ChatMessageExamplesParams';
import { ChatMessageExamplesResources } from './ChatMessageExamplesResources';

/**
 * An interstitial screen designed to highlight how to use the journal chat screen
 */
export const ChatMessageExamplesScreen: OsehScreen<
  'chat_message_examples',
  ChatMessageExamplesResources,
  ChatMessageExamplesAPIParams,
  ChatMessageExamplesMappedParams
> = {
  slug: 'chat_message_examples',
  paramMapper: (params) => ({
    ...params,
    trigger: convertScreenConfigurableTriggerWithOldVersion(
      params.trigger,
      params.triggerv75
    ),
    __mapped: true,
  }),
  initInstanceResources: () => {
    return {
      ready: createWritableValueWithCallbacks(true),
      dispose: () => {},
    };
  },
  component: (props) => <ChatMessageExamples {...props} />,
};
